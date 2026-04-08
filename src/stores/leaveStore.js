import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import {
    collection, doc, addDoc, updateDoc, getDocs,
    query, where, orderBy, serverTimestamp
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../firebaseConfig';

export const LEAVE_TYPES = [
    { label: 'Annual Leave',  value: 'annual'  },
    { label: 'Sick Leave',    value: 'sick'     },
    { label: 'Casual Leave',  value: 'casual'   },
    { label: 'Unpaid Leave',  value: 'unpaid'   },
    { label: 'Maternity / Paternity', value: 'parental' },
];

export const LEAVE_STATUS = {
    PENDING:  'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
};

export const useLeaveStore = defineStore('leave', () => {

    const requests = ref([]);   // all leave requests
    const loading  = ref(false);

    // ── computed ──────────────────────────────────────────────────────────────

    const pendingRequests = computed(() =>
        requests.value.filter(r => r.status === LEAVE_STATUS.PENDING)
    );

    const pendingCount = computed(() => pendingRequests.value.length);

    // ── Load ─────────────────────────────────────────────────────────────────

    const loadRequests = async (filterEmployeeId = null) => {
        loading.value = true;
        try {
            let q;
            if (filterEmployeeId != null) {
                q = query(
                    collection(db, 'leaveRequests'),
                    where('employeeId', '==', filterEmployeeId),
                    orderBy('submittedAt', 'desc')
                );
            } else {
                q = query(
                    collection(db, 'leaveRequests'),
                    orderBy('submittedAt', 'desc')
                );
            }
            const snap = await getDocs(q);
            requests.value = snap.docs.map(d => ({
                firestoreId: d.id,
                ...d.data(),
                // Convert Firestore timestamps to JS dates for display
                submittedAt: d.data().submittedAt?.toDate?.() || null,
                reviewedAt:  d.data().reviewedAt?.toDate?.()  || null,
            }));
        } catch (err) {
            console.error('[leaveStore] loadRequests error', err);
        } finally {
            loading.value = false;
        }
    };

    // ── Submit a leave request (employee action) ──────────────────────────────

    const submitRequest = async ({ employeeId, employeeName, startDate, endDate, type, reason }) => {
        const auth = getAuth();
        if (!auth.currentUser) return { success: false, error: 'Not authenticated' };

        try {
            const docRef = await addDoc(collection(db, 'leaveRequests'), {
                employeeId,
                employeeName,
                startDate,
                endDate,
                type,
                reason: reason?.trim() || '',
                status: LEAVE_STATUS.PENDING,
                submittedBy: auth.currentUser.uid,
                submittedAt: serverTimestamp(),
                reviewedBy: null,
                reviewedAt: null,
                reviewNote: '',
            });

            requests.value.unshift({
                firestoreId: docRef.id,
                employeeId,
                employeeName,
                startDate,
                endDate,
                type,
                reason: reason?.trim() || '',
                status: LEAVE_STATUS.PENDING,
                submittedBy: auth.currentUser.uid,
                submittedAt: new Date(),
                reviewedBy: null,
                reviewedAt: null,
                reviewNote: '',
            });

            return { success: true, id: docRef.id };
        } catch (err) {
            console.error('[leaveStore] submitRequest error', err);
            return { success: false, error: err.message };
        }
    };

    // ── Approve / Reject (admin action) ──────────────────────────────────────

    const reviewRequest = async (firestoreId, status, reviewNote = '') => {
        const auth = getAuth();
        if (!auth.currentUser) return { success: false, error: 'Not authenticated' };
        if (![LEAVE_STATUS.APPROVED, LEAVE_STATUS.REJECTED].includes(status)) {
            return { success: false, error: 'Invalid status' };
        }

        try {
            await updateDoc(doc(db, 'leaveRequests', firestoreId), {
                status,
                reviewNote: reviewNote.trim(),
                reviewedBy: auth.currentUser.uid,
                reviewedAt: serverTimestamp(),
            });

            // Update local state
            const idx = requests.value.findIndex(r => r.firestoreId === firestoreId);
            if (idx !== -1) {
                requests.value[idx] = {
                    ...requests.value[idx],
                    status,
                    reviewNote: reviewNote.trim(),
                    reviewedBy: auth.currentUser.uid,
                    reviewedAt: new Date(),
                };
            }

            // If approved, write attendance records for each day in the range
            if (status === LEAVE_STATUS.APPROVED) {
                const req = requests.value.find(r => r.firestoreId === firestoreId);
                if (req) {
                    const { useEmployeeStore } = await import('./employeeStore');
                    const { getActivePinia } = await import('pinia');
                    const pinia = getActivePinia();
                    if (pinia) {
                        const empStore = useEmployeeStore(pinia);
                        const start = new Date(req.startDate);
                        const end   = new Date(req.endDate);
                        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                            const dateKey = empStore.toDateKey(d);
                            await empStore.markLeave(req.employeeId, dateKey);
                        }
                    }
                }
            }

            // Write audit log
            await writeAudit({
                action: status === LEAVE_STATUS.APPROVED ? 'Leave Approved' : 'Leave Rejected',
                details: `${status === LEAVE_STATUS.APPROVED ? 'Approved' : 'Rejected'} leave request for employee ID ${requests.value.find(r => r.firestoreId === firestoreId)?.employeeName || firestoreId}. Note: ${reviewNote || 'none'}`,
                module: 'leave',
            });

            return { success: true };
        } catch (err) {
            console.error('[leaveStore] reviewRequest error', err);
            return { success: false, error: err.message };
        }
    };

    // ── Audit log helper ──────────────────────────────────────────────────────

    const writeAudit = async ({ action, details, module }) => {
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

    // ── Helpers ───────────────────────────────────────────────────────────────

    const getTypeLabel = (value) =>
        LEAVE_TYPES.find(t => t.value === value)?.label || value;

    const $reset = () => {
        requests.value = [];
        loading.value = false;
    };

    return {
        requests,
        loading,
        pendingRequests,
        pendingCount,
        loadRequests,
        submitRequest,
        reviewRequest,
        getTypeLabel,
        writeAudit,
        $reset,
    };
});
