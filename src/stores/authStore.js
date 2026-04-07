import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export const useAuthStore = defineStore('auth', () => {
    const user = ref(null);
    const role = ref(null); // 'admin' | 'employee'
    const loading = ref(true);

    const isAdmin = computed(() => role.value === 'admin');
    const isAuthenticated = computed(() => !!user.value);
    const userInitials = computed(() => {
        const name = user.value?.displayName || user.value?.email || '';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
    });
    const userDisplayName = computed(() => user.value?.displayName || user.value?.email || 'User');
    const userEmail = computed(() => user.value?.email || '');

    const loadUserRole = async (uid) => {
        try {
            const userDoc = await getDoc(doc(db, 'users', uid));
            if (userDoc.exists()) {
                role.value = userDoc.data().role || 'employee';
            } else {
                // First-time user: default to 'employee', admins must be set in Firestore
                role.value = 'employee';
                await setDoc(doc(db, 'users', uid), {
                    role: 'employee',
                    createdAt: serverTimestamp(),
                });
            }
        } catch {
            role.value = 'employee';
        }
    };

    // Record a login event to Firestore for audit trail
    const recordLoginEvent = async (uid, success) => {
        try {
            const historyRef = doc(db, 'users', uid, 'loginHistory', Date.now().toString());
            await setDoc(historyRef, {
                timestamp: serverTimestamp(),
                success,
                userAgent: navigator.userAgent.substring(0, 200),
            });
        } catch {
            // Non-critical; ignore errors
        }
    };

    const init = () => {
        const auth = getAuth();
        onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                user.value = firebaseUser;
                await loadUserRole(firebaseUser.uid);
            } else {
                user.value = null;
                role.value = null;
            }
            loading.value = false;
        });
    };

    const clearAuth = () => {
        user.value = null;
        role.value = null;
    };

    return {
        user,
        role,
        loading,
        isAdmin,
        isAuthenticated,
        userInitials,
        userDisplayName,
        userEmail,
        loadUserRole,
        recordLoginEvent,
        init,
        clearAuth,
    };
});
