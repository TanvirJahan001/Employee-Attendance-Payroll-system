<script setup>
import { useRouter } from 'vue-router';
import { getAuth, signOut } from "firebase/auth";
import { useDemoEmployeeStore, useEmployeeStore } from '../stores/employeeStore';
import { useAuthStore } from '../stores/authStore';
import { useLeaveStore } from '../stores/leaveStore';
import Button from 'primevue/button';
import Avatar from 'primevue/avatar';
import Menu from 'primevue/menu';
import InputText from 'primevue/inputtext';
import { ref } from 'vue';
import { endDemoSession } from '../demo/session';
import { demoAccount } from '../demo/data';

const props = defineProps({ demo: Boolean });
const router = useRouter();
const employeeStore = props.demo ? useDemoEmployeeStore() : useEmployeeStore();
const authStore = useAuthStore();
const leaveStore = props.demo ? null : useLeaveStore();
const menu = ref();
const profilePath = props.demo ? '/demo/profile' : '/profile';
const settingsPath = props.demo ? '/demo/settings' : '/settings';

const logout = async () => {
    if (props.demo) {
        endDemoSession();
        employeeStore.$reset();
        return router.replace({ name: 'login' });
    }

    await signOut(getAuth());
    employeeStore.$reset();
    leaveStore.$reset();
    authStore.clearAuth();
    return router.push({ name: 'login' });
};

const items = [
    {
        label: 'Profile',
        icon: 'pi pi-user',
        command: () => router.push(profilePath)
    },
    {
        label: 'Settings',
        icon: 'pi pi-cog',
        command: () => router.push(settingsPath)
    },
    { separator: true },
    {
        label: props.demo ? 'Exit Demo' : 'Logout',
        icon: 'pi pi-sign-out',
        command: logout
    }
];

const toggleMenu = (event) => {
    menu.value.toggle(event);
};
</script>

<template>
    <div class="topbar-container px-3 md:px-4 pt-3 pb-0">
        <div class="glass w-full p-3 border-round-2xl shadow-2 flex justify-content-between align-items-center">
            <!-- Search -->
            <div class="topbar-search flex align-items-center flex-1 md:flex-none md:w-4 gap-2">
                <Button icon="pi pi-bars" text rounded class="lg:hidden text-600 flex-shrink-0" aria-label="Toggle navigation" @click="$emit('menu-toggle')" />
                <span class="p-input-icon-left w-full relative">
                    <i class="pi pi-search text-500 absolute" style="top: 50%; transform: translateY(-50%); left: 0.75rem; z-index: 1;"></i>
                    <InputText v-model="employeeStore.searchQuery" type="search" aria-label="Search employees" placeholder="Search employees..." class="w-full border-none bg-transparent shadow-none pl-5" />
                </span>
            </div>

            <!-- Actions -->
            <div class="flex align-items-center gap-1 md:gap-3">
                <Button v-if="!demo" icon="pi pi-bell" text rounded severity="secondary" v-badge.danger="2" class="text-600 hover:text-900 hover:bg-white-alpha-50" />
                <Button icon="pi pi-cog" text rounded severity="secondary" aria-label="Settings" class="text-600 hover:text-900 hover:bg-white-alpha-50" @click="router.push(settingsPath)" />

                <div class="hidden md:block h-2rem w-1px bg-gray-300 mx-1"></div>

                <button type="button" class="flex align-items-center cursor-pointer p-1 border-none bg-transparent text-left border-round-lg hover:bg-white-alpha-50 transition-colors" @click="toggleMenu" aria-label="Open account menu" aria-haspopup="menu" aria-controls="overlay_menu">
                    <!-- Initials avatar — no external image service -->
                    <Avatar
                        :label="demo ? demoAccount.initials : authStore.userInitials"
                        shape="circle"
                        class="md:mr-2 shadow-1"
                        style="background-color: var(--primary-500); color: #fff; font-weight: 700;"
                    />
                    <div class="hidden md:flex flex-column">
                        <span class="text-sm font-bold text-800">{{ demo ? demoAccount.name : authStore.userDisplayName }}</span>
                        <span class="text-xs text-500">{{ demo ? 'Viewer' : authStore.isAdmin ? 'Admin' : 'Employee' }}</span>
                    </div>
                </button>
                <Menu ref="menu" id="overlay_menu" :model="items" :popup="true" class="glass-menu" />
            </div>
        </div>
    </div>
</template>

<style scoped>
.topbar-container {
    position: sticky;
    top: 0;
    z-index: 999;
}

.topbar-search, .topbar-search > span {
    min-width: 0;
}

:deep(.glass-menu) {
    background: rgba(255, 255, 255, 0.9) !important;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
}
</style>
