import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            component: () => import('../layout/AppLayout.vue'),
            meta: { requiresAuth: true },
            children: [
                {
                    path: '',
                    redirect: '/dashboard'
                },
                {
                    path: 'dashboard',
                    name: 'dashboard',
                    component: () => import('../views/Dashboard.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: 'employees',
                    name: 'employees',
                    component: () => import('../views/EmployeeList.vue'),
                    meta: { requiresAuth: true, requiresAdmin: true }
                },
                {
                    path: 'profile',
                    name: 'profile',
                    component: () => import('../views/Profile.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: 'settings',
                    name: 'settings',
                    component: () => import('../views/Settings.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: 'attendance',
                    name: 'attendance',
                    component: () => import('../views/Attendance.vue'),
                    meta: { requiresAuth: true, requiresAdmin: true }
                },
                {
                    path: 'payroll',
                    name: 'payroll',
                    component: () => import('../views/Payroll.vue'),
                    meta: { requiresAuth: true, requiresAdmin: true }
                },
                {
                    path: 'checkin',
                    name: 'checkin',
                    component: () => import('../views/CheckIn.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: 'leave',
                    name: 'leave',
                    component: () => import('../views/LeaveRequests.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: 'holidays',
                    name: 'holidays',
                    component: () => import('../views/Holidays.vue'),
                    meta: { requiresAuth: true, requiresAdmin: true }
                },
                {
                    path: 'audit',
                    name: 'audit',
                    component: () => import('../views/AuditLog.vue'),
                    meta: { requiresAuth: true, requiresAdmin: true }
                }
            ]
        },
        {
            path: '/login',
            name: 'login',
            component: () => import('../views/Login.vue')
        },
        {
            path: '/unauthorized',
            name: 'unauthorized',
            component: () => import('../views/Unauthorized.vue')
        }
    ]
});

// ── Navigation guard ─────────────────────────────────────────────────────────
// Uses authStore (initialised in main.js) so we never spin up a second
// onAuthStateChanged listener. Waits for the initial auth check to complete.

router.beforeEach(async (to, from, next) => {
    const requiresAuth  = to.matched.some(r => r.meta.requiresAuth);
    const requiresAdmin = to.matched.some(r => r.meta.requiresAdmin);

    // Routes that need no authentication pass straight through
    if (!requiresAuth) return next();

    // Lazily import to avoid circular dependency (router is imported in main before stores)
    const { useAuthStore } = await import('../stores/authStore');
    const { getActivePinia } = await import('pinia');
    const pinia = getActivePinia();
    if (!pinia) return next('/login');

    const authStore = useAuthStore(pinia);

    // Wait for Firebase auth state to be determined on first load
    if (authStore.loading) {
        await new Promise((resolve) => {
            const timer = setInterval(() => {
                if (!authStore.loading) {
                    clearInterval(timer);
                    resolve();
                }
            }, 30);
        });
    }

    // Not authenticated → send to login
    if (!authStore.isAuthenticated) return next('/login');

    // Admin-only page → check role
    if (requiresAdmin && !authStore.isAdmin) return next('/unauthorized');

    next();
});

export default router;
