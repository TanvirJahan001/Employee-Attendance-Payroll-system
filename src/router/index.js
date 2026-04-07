import { createRouter, createWebHistory } from 'vue-router';
import { getAuth, onAuthStateChanged } from "firebase/auth";

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

const getCurrentUser = () => {
    return new Promise((resolve, reject) => {
        const removeListener = onAuthStateChanged(
            getAuth(),
            (user) => {
                removeListener();
                resolve(user);
            },
            reject
        );
    });
};

router.beforeEach(async (to, from, next) => {
    const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
    const requiresAdmin = to.matched.some((record) => record.meta.requiresAdmin);

    if (!requiresAuth) {
        return next();
    }

    const user = await getCurrentUser();
    if (!user) {
        return next('/login');
    }

    if (requiresAdmin) {
        // Lazy import to avoid circular dependency
        const { useAuthStore } = await import('../stores/authStore');
        const { getActivePinia } = await import('pinia');
        const pinia = getActivePinia();
        if (!pinia) return next('/login');
        const authStore = useAuthStore(pinia);

        // Wait for role to be loaded if still initializing
        if (authStore.loading) {
            await new Promise((resolve) => {
                const unwatch = setInterval(() => {
                    if (!authStore.loading) {
                        clearInterval(unwatch);
                        resolve();
                    }
                }, 50);
            });
        }

        if (!authStore.isAdmin) {
            return next('/unauthorized');
        }
    }

    next();
});

export default router;
