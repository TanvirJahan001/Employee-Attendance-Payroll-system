import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import {
    collection, doc, setDoc, getDoc, getDocs, addDoc,
    updateDoc, deleteDoc, query, where, serverTimestamp, orderBy
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../firebaseConfig';
import { employeesData } from '../data/employees';
import { ATTENDANCE_STATUS } from '../constants';

// ── Internal audit log writer (avoids circular import with leaveStore) ─────────
const _writeAudit = async ({ action, details, module }) => {
    try {
        const auth = getAuth();
        if (!auth.currentUser) return;
        await addDoc(collection(db, 'auditLog'), {
            action,
            details,
            module: module || 'system',
            performedBy: auth.currentUser.uid,
            performedByName: auth.currentUser.displayName || auth.currentUser.email,
            timestamp: serverTimestamp(),
        });
    } catch { /* non-critical */ }
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Format a Date as YYYY-MM-DD */
const toDateKey = (date = new Date()) => {
    const d = new Date(date);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

/** Attendance document id: "<employeeId>_<YYYY-MM-DD>" */
const attendanceDocId = (employeeId, dateKey) => `${employeeId}_${dateKey}`;

// ─── Store ───────────────────────────────────────────────────────────────────

export const useEmployeeStore = defineStore('employee', () => {
    const employees = ref([]);        // Array<{id,name,role,baseSalary,email,phone,department,...}>
    const attendance = ref({});       // { "<empId>_<dateKey>": {status,inTime,outTime} }
    const loading = ref(false);
    const searchQuery = ref('');

    // ── computed ──────────────────────────────────────────────────────────────

    const filteredEmployees = computed(() => {
        if (!searchQuery.value) return employees.value;
        const q = searchQuery.value.toLowerCase();
        return employees.value.filter(e =>
            e.name.toLowerCase().includes(q) ||
            e.role.toLowerCase().includes(q) ||
            (e.department || '').toLowerCase().includes(q)
        );
    });

    // ── Firestore: load employees ─────────────────────────────────────────────

    const loadEmployees = async () => {
        if (employees.value.length > 0) return;   // already loaded this session
        loading.value = true;
        try {
            const snap = await getDocs(collection(db, 'employees'));

            if (snap.empty) {
                // First run – seed Firestore from the local data file
                await seedEmployees();
            } else {
                employees.value = snap.docs.map(d => ({ firestoreId: d.id, ...d.data() }));
                employees.value.sort((a, b) => a.id - b.id);
            }
        } catch (err) {
            console.error('[employeeStore] loadEmployees error', err);
        } finally {
            loading.value = false;
        }
    };

    /** Seed 100 employees to Firestore on the very first run */
    const seedEmployees = async () => {
        const batch = [];
        for (const emp of employeesData) {
            const docRef = doc(db, 'employees', String(emp.id));
            batch.push(setDoc(docRef, {
                id: emp.id,
                name: emp.name,
                role: emp.role,
                baseSalary: emp.baseSalary,
                department: emp.role,   // use role as department initially
                email: '',
                phone: '',
                startDate: '',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            }));
        }
        await Promise.all(batch);
        // Reload after seeding
        const snap = await getDocs(collection(db, 'employees'));
        employees.value = snap.docs.map(d => ({ firestoreId: d.id, ...d.data() }));
        employees.value.sort((a, b) => a.id - b.id);
    };

    // ── kept for backward compatibility (called by Dashboard / Attendance / Payroll) ──
    const generateEmployees = loadEmployees;

    // ── Firestore: load attendance for a specific date ────────────────────────

    const loadAttendanceForDate = async (dateKey) => {
        try {
            const q = query(
                collection(db, 'attendance'),
                where('date', '==', dateKey)
            );
            const snap = await getDocs(q);
            snap.forEach(d => {
                const data = d.data();
                const key = attendanceDocId(data.employeeId, dateKey);
                attendance.value[key] = {
                    status: data.status,
                    inTime: data.inTime || null,
                    outTime: data.outTime || null,
                };
            });
        } catch (err) {
            console.error('[employeeStore] loadAttendanceForDate error', err);
        }
    };

    /** Get attendance record for an employee on a given date.
     *  Falls back to 'Absent' so the UI always has something to show. */
    const getAttendance = (employeeId, dateKey) => {
        const key = attendanceDocId(employeeId, dateKey);
        return attendance.value[key] || { status: ATTENDANCE_STATUS.ABSENT, inTime: null, outTime: null };
    };

    // ── Firestore: check-in / check-out ───────────────────────────────────────

    const checkIn = async (employeeId, dateKey = toDateKey()) => {
        const auth = getAuth();
        if (!auth.currentUser) return { success: false, error: 'Not authenticated' };

        const now = new Date();
        const hh = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        const timeStr = `${hh}:${mm}`;

        const docId = attendanceDocId(employeeId, dateKey);
        const existing = attendance.value[docId];
        if (existing?.inTime) return { success: false, error: 'Already checked in' };

        try {
            await setDoc(doc(db, 'attendance', docId), {
                employeeId,
                date: dateKey,
                status: ATTENDANCE_STATUS.PRESENT,
                inTime: timeStr,
                outTime: null,
                recordedBy: auth.currentUser.uid,
                updatedAt: serverTimestamp(),
            }, { merge: true });

            attendance.value[docId] = { status: ATTENDANCE_STATUS.PRESENT, inTime: timeStr, outTime: null };
            return { success: true };
        } catch (err) {
            console.error('[employeeStore] checkIn error', err);
            return { success: false, error: err.message };
        }
    };

    const checkOut = async (employeeId, dateKey = toDateKey()) => {
        const auth = getAuth();
        if (!auth.currentUser) return { success: false, error: 'Not authenticated' };

        const docId = attendanceDocId(employeeId, dateKey);
        const existing = attendance.value[docId];
        if (!existing?.inTime) return { success: false, error: 'Not checked in yet' };
        if (existing?.outTime) return { success: false, error: 'Already checked out' };

        const now = new Date();
        const hh = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        const timeStr = `${hh}:${mm}`;

        try {
            await updateDoc(doc(db, 'attendance', docId), {
                outTime: timeStr,
                updatedAt: serverTimestamp(),
            });

            attendance.value[docId] = { ...existing, outTime: timeStr };
            return { success: true };
        } catch (err) {
            console.error('[employeeStore] checkOut error', err);
            return { success: false, error: err.message };
        }
    };

    // ── Firestore: mark leave ─────────────────────────────────────────────────

    const markLeave = async (employeeId, dateOrDay) => {
        const { useAuthStore } = await import('./authStore');
        const { getActivePinia } = await import('pinia');
        const pinia = getActivePinia();
        if (!pinia) return;
        const authStore = useAuthStore(pinia);

        const currentUser = getAuth().currentUser;
        if (!currentUser) { console.warn('[Security] markLeave blocked: no authenticated user.'); return; }
        if (!authStore.isAdmin) { console.warn('[Security] markLeave blocked: insufficient privileges.'); return; }

        // Accept either a full date string or a day number (legacy)
        let dateKey;
        if (typeof dateOrDay === 'number') {
            const now = new Date();
            const y = now.getFullYear();
            const m = String(now.getMonth() + 1).padStart(2, '0');
            dateKey = `${y}-${m}-${String(dateOrDay).padStart(2, '0')}`;
        } else {
            dateKey = dateOrDay;
        }

        const docId = attendanceDocId(employeeId, dateKey);
        try {
            await setDoc(doc(db, 'attendance', docId), {
                employeeId,
                date: dateKey,
                status: ATTENDANCE_STATUS.LEAVE,
                inTime: null,
                outTime: null,
                recordedBy: currentUser.uid,
                updatedAt: serverTimestamp(),
            }, { merge: true });

            attendance.value[docId] = { status: ATTENDANCE_STATUS.LEAVE, inTime: null, outTime: null };
            await _writeAudit({ action: 'Leave Marked', details: `Marked employee ID ${employeeId} as on leave for ${dateKey}`, module: 'attendance' });
        } catch (err) {
            console.error('[employeeStore] markLeave error', err);
        }
    };

    // ── CRUD: Add Employee ────────────────────────────────────────────────────

    const addEmployee = async (empData) => {
        const auth = getAuth();
        if (!auth.currentUser) return { success: false, error: 'Not authenticated' };

        try {
            // Generate a new numeric ID (max existing + 1)
            const maxId = employees.value.reduce((m, e) => Math.max(m, e.id || 0), 0);
            const newId = maxId + 1;
            const docRef = doc(db, 'employees', String(newId));

            const newEmp = {
                id: newId,
                name: empData.name.trim(),
                role: empData.role.trim(),
                department: empData.department?.trim() || empData.role.trim(),
                baseSalary: Number(empData.baseSalary),
                email: empData.email?.trim() || '',
                phone: empData.phone?.trim() || '',
                startDate: empData.startDate || '',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            await setDoc(docRef, newEmp);
            employees.value.push({ firestoreId: String(newId), ...newEmp });
            await _writeAudit({ action: 'Employee Added', details: `Added employee: ${newEmp.name} (ID ${newId}), Role: ${newEmp.role}`, module: 'employees' });
            return { success: true, id: newId };
        } catch (err) {
            console.error('[employeeStore] addEmployee error', err);
            return { success: false, error: err.message };
        }
    };

    // ── CRUD: Update Employee ─────────────────────────────────────────────────

    const updateEmployee = async (employeeId, updates) => {
        const auth = getAuth();
        if (!auth.currentUser) return { success: false, error: 'Not authenticated' };

        try {
            const docRef = doc(db, 'employees', String(employeeId));
            const sanitized = {
                name: updates.name?.trim(),
                role: updates.role?.trim(),
                department: updates.department?.trim() || updates.role?.trim(),
                baseSalary: Number(updates.baseSalary),
                email: updates.email?.trim() || '',
                phone: updates.phone?.trim() || '',
                startDate: updates.startDate || '',
                updatedAt: serverTimestamp(),
            };
            await updateDoc(docRef, sanitized);

            const idx = employees.value.findIndex(e => e.id === employeeId);
            if (idx !== -1) {
                employees.value[idx] = { ...employees.value[idx], ...sanitized };
            }
            await _writeAudit({ action: 'Employee Updated', details: `Updated employee ID ${employeeId}: ${sanitized.name}`, module: 'employees' });
            return { success: true };
        } catch (err) {
            console.error('[employeeStore] updateEmployee error', err);
            return { success: false, error: err.message };
        }
    };

    // ── CRUD: Delete Employee ─────────────────────────────────────────────────

    const deleteEmployee = async (employeeId) => {
        const auth = getAuth();
        if (!auth.currentUser) return { success: false, error: 'Not authenticated' };

        try {
            const empName = employees.value.find(e => e.id === employeeId)?.name || `ID ${employeeId}`;
            await deleteDoc(doc(db, 'employees', String(employeeId)));
            employees.value = employees.value.filter(e => e.id !== employeeId);
            await _writeAudit({ action: 'Employee Deleted', details: `Deleted employee: ${empName} (ID ${employeeId})`, module: 'employees' });
            return { success: true };
        } catch (err) {
            console.error('[employeeStore] deleteEmployee error', err);
            return { success: false, error: err.message };
        }
    };

    // ── Salary calculation (works with real Firestore attendance) ─────────────

    const calculateSalaryForMonth = (employee, year, month) => {
        // month is 1-based
        const daysInMonth = new Date(year, month, 0).getDate();
        let absentDays = 0;

        for (let d = 1; d <= daysInMonth; d++) {
            const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const rec = attendance.value[attendanceDocId(employee.id, dateKey)];
            if (!rec || rec.status === ATTENDANCE_STATUS.ABSENT) {
                absentDays++;
            }
        }

        const deduction = absentDays > 3
            ? (employee.baseSalary / daysInMonth)
            : 0;

        return {
            base: employee.baseSalary,
            deduction,
            final: employee.baseSalary - deduction,
            absentDays,
        };
    };

    /** Legacy helper used by Payroll.vue and EmployeeList.vue */
    const calculateSalary = (employee) => {
        const now = new Date();
        return calculateSalaryForMonth(employee, now.getFullYear(), now.getMonth() + 1);
    };

    // ── Utility exports ───────────────────────────────────────────────────────

    const $reset = () => {
        employees.value = [];
        attendance.value = {};
        loading.value = false;
        searchQuery.value = '';
    };

    return {
        // state
        employees,
        attendance,
        loading,
        searchQuery,
        // computed
        filteredEmployees,
        // load
        loadEmployees,
        generateEmployees,
        loadAttendanceForDate,
        // attendance
        getAttendance,
        checkIn,
        checkOut,
        markLeave,
        // CRUD
        addEmployee,
        updateEmployee,
        deleteEmployee,
        // payroll
        calculateSalary,
        calculateSalaryForMonth,
        // helpers
        toDateKey,
        $reset,
    };
});
