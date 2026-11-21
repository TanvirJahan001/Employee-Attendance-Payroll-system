<script setup>
import { useRouter } from 'vue-router';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import { endDemoSession } from '../demo/session';
import { useDemoEmployeeStore } from '../stores/employeeStore';

const router = useRouter();
const store = useDemoEmployeeStore();
const pages = [
    { name: 'demo-dashboard', label: 'Dashboard' },
    { name: 'demo-employees', label: 'Employees' },
    { name: 'demo-attendance', label: 'Attendance' },
    { name: 'demo-payroll', label: 'Payroll' },
];

const exitDemo = () => {
    endDemoSession();
    store.$reset();
    return router.replace({ name: 'login' });
};
</script>

<template>
    <div class="demo-layout mx-auto p-3 md:p-4">
        <header class="glass border-round-2xl p-3 md:p-4 mb-3">
            <div class="flex flex-wrap justify-content-between align-items-center gap-3">
                <div>
                    <h1 class="text-xl text-900 mt-0 mb-1">Employee Attendance &amp; Payroll Demo</h1>
                    <p class="text-700 m-0">Read-only preview with sample data.</p>
                </div>
                <Button label="Exit Demo" severity="secondary" outlined @click="exitDemo" />
            </div>
            <div class="flex flex-wrap justify-content-between align-items-center gap-3 mt-3">
                <nav class="flex flex-wrap gap-1" aria-label="Demo navigation">
                    <RouterLink v-for="page in pages" :key="page.name" :to="{ name: page.name }"
                        class="demo-link border-round-lg px-3 py-2 font-medium no-underline">
                        {{ page.label }}
                    </RouterLink>
                </nav>
                <InputText v-if="$route.name !== 'demo-dashboard'" v-model="store.searchQuery" type="search"
                    placeholder="Search employees" aria-label="Search employees" class="w-full sm:w-14rem" />
            </div>
        </header>

        <main class="glass border-round-2xl p-3 md:p-4">
            <RouterView />
        </main>
    </div>
</template>

<style scoped>
.demo-layout {
    max-width: 80rem;
}

.demo-link {
    color: var(--p-primary-color);
}

.demo-link:hover,
.demo-link.router-link-exact-active {
    background: var(--p-primary-color);
    color: var(--p-primary-contrast-color);
}
</style>
