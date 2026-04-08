import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import {
    collection, doc, addDoc, deleteDoc, getDocs,
    orderBy, query, serverTimestamp
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../firebaseConfig';

export const useHolidayStore = defineStore('holiday', () => {

    const holidays = ref([]);   // { firestoreId, name, date, type, recurring }
    const loading  = ref(false);

    // ── Load ─────────────────────────────────────────────────────────────────

    const loadHolidays = async () => {
        if (holidays.value.length > 0) return;
        loading.value = true;
        try {
            const q = query(collection(db, 'holidays'), orderBy('date', 'asc'));
            const snap = await getDocs(q);
            holidays.value = snap.docs.map(d => ({ firestoreId: d.id, ...d.data() }));

            // Seed default holidays if empty
            if (holidays.value.length === 0) {
                await seedDefaults();
            }
        } catch (err) {
            console.error('[holidayStore] loadHolidays error', err);
        } finally {
            loading.value = false;
        }
    };

    const seedDefaults = async () => {
        const year = new Date().getFullYear();
        const defaults = [
            { name: "New Year's Day",       date: `${year}-01-01`, type: 'national', recurring: true },
            { name: 'Labor Day',             date: `${year}-05-01`, type: 'national', recurring: true },
            { name: 'Independence Day',      date: `${year}-07-04`, type: 'national', recurring: true },
            { name: 'Thanksgiving',          date: `${year}-11-27`, type: 'national', recurring: true },
            { name: 'Christmas Day',         date: `${year}-12-25`, type: 'national', recurring: true },
        ];
        const auth = getAuth();
        for (const h of defaults) {
            const ref = await addDoc(collection(db, 'holidays'), {
                ...h,
                createdBy: auth.currentUser?.uid || 'system',
                createdAt: serverTimestamp(),
            });
            holidays.value.push({ firestoreId: ref.id, ...h });
        }
    };

    // ── Add ───────────────────────────────────────────────────────────────────

    const addHoliday = async ({ name, date, type, recurring }) => {
        const auth = getAuth();
        if (!auth.currentUser) return { success: false, error: 'Not authenticated' };

        try {
            const docRef = await addDoc(collection(db, 'holidays'), {
                name: name.trim(),
                date,
                type: type || 'company',
                recurring: !!recurring,
                createdBy: auth.currentUser.uid,
                createdAt: serverTimestamp(),
            });
            holidays.value.push({
                firestoreId: docRef.id,
                name: name.trim(),
                date,
                type: type || 'company',
                recurring: !!recurring,
            });
            // Keep sorted by date
            holidays.value.sort((a, b) => a.date.localeCompare(b.date));
            return { success: true };
        } catch (err) {
            console.error('[holidayStore] addHoliday error', err);
            return { success: false, error: err.message };
        }
    };

    // ── Delete ────────────────────────────────────────────────────────────────

    const deleteHoliday = async (firestoreId) => {
        const auth = getAuth();
        if (!auth.currentUser) return { success: false, error: 'Not authenticated' };

        try {
            await deleteDoc(doc(db, 'holidays', firestoreId));
            holidays.value = holidays.value.filter(h => h.firestoreId !== firestoreId);
            return { success: true };
        } catch (err) {
            console.error('[holidayStore] deleteHoliday error', err);
            return { success: false, error: err.message };
        }
    };

    // ── Helpers ───────────────────────────────────────────────────────────────

    /** Returns a Set of YYYY-MM-DD strings that are holidays */
    const holidayDateSet = computed(() => new Set(holidays.value.map(h => h.date)));

    const isHoliday = (dateKey) => holidayDateSet.value.has(dateKey);

    const $reset = () => {
        holidays.value = [];
        loading.value = false;
    };

    return {
        holidays,
        loading,
        holidayDateSet,
        isHoliday,
        loadHolidays,
        addHoliday,
        deleteHoliday,
        $reset,
    };
});
