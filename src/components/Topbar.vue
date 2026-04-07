<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { getAuth, signOut } from "firebase/auth";
import { useEmployeeStore } from '../stores/employeeStore';
import { useAuthStore } from '../stores/authStore';
import Button from 'primevue/button';
import Avatar from 'primevue/avatar';
import Menu from 'primevue/menu';
import OverlayPanel from 'primevue/overlaypanel';
import InputText from 'primevue/inputtext';

const router = useRouter();
const auth = getAuth();
const employeeStore = useEmployeeStore();
const authStore = useAuthStore();
const menu = ref();
const notificationPanel = ref();

// Sample notifications — in a real app, load from Firestore
const notifications = ref([
    { id: 1, icon: 'pi-calendar-plus', color: 'text-orange-500', message: 'Leave request pending approval', time: 'Just now' },
    { id: 2, icon: 'pi-user-plus', color: 'text-blue-500', message: 'New employee added to the system', time: '1 hour ago' },
]);

const toggleNotifications = (event) => {
    notificationPanel.value.toggle(event);
};

const items = ref([
    {
        label: 'Profile',
        icon: 'pi pi-user',
        command: () => router.push('/profile')
    },
    {
        label: 'Settings',
        icon: 'pi pi-cog',
        command: () => router.push('/settings')
    },
    { separator: true },
    {
        label: 'Logout',
        icon: 'pi pi-sign-out',
        command: async () => {
            // Clear all client-side data before signing out
            employeeStore.$reset();
            authStore.clearAuth();
            await signOut(auth);
            router.push('/login');
        }
    }
]);

const toggleMenu = (event) => {
    menu.value.toggle(event);
};
</script>

<template>
    <div class="topbar-container px-4 pt-3 pb-0">
        <div class="glass w-full p-3 border-round-2xl shadow-2 flex justify-content-between align-items-center">
            <!-- Search -->
            <div class="flex align-items-center flex-1 md:flex-none md:w-4 gap-2">
                <Button icon="pi pi-bars" text rounded class="lg:hidden text-600" @click="$emit('menu-toggle')" />
                <span class="p-input-icon-left w-full relative">
                    <i class="pi pi-search text-500 absolute" style="top: 50%; transform: translateY(-50%); left: 0.75rem; z-index: 1;"></i>
                    <InputText v-model="employeeStore.searchQuery" placeholder="Search employees..." class="w-full border-none bg-transparent shadow-none pl-5" />
                </span>
            </div>

            <!-- Actions -->
            <div class="flex align-items-center gap-3">
                <!-- Bell button now opens a notification overlay -->
                <Button
                    icon="pi pi-bell"
                    text
                    rounded
                    severity="secondary"
                    v-badge.danger="notifications.length"
                    class="text-600 hover:text-900 hover:bg-white-alpha-50"
                    @click="toggleNotifications"
                    aria-label="Notifications"
                />
                <OverlayPanel ref="notificationPanel" class="w-20rem">
                    <div class="font-bold text-900 mb-3 pb-2 border-bottom-1 surface-border">Notifications</div>
                    <ul class="list-none m-0 p-0">
                        <li
                            v-for="n in notifications"
                            :key="n.id"
                            class="flex align-items-start gap-3 py-2 border-bottom-1 surface-border last:border-none"
                        >
                            <i :class="['pi', n.icon, n.color, 'mt-1 text-lg']"></i>
                            <div class="flex-1">
                                <div class="text-800 text-sm">{{ n.message }}</div>
                                <div class="text-400 text-xs mt-1">{{ n.time }}</div>
                            </div>
                        </li>
                        <li v-if="notifications.length === 0" class="text-500 text-sm text-center py-3">
                            No new notifications
                        </li>
                    </ul>
                </OverlayPanel>

                <Button icon="pi pi-cog" text rounded severity="secondary" class="text-600 hover:text-900 hover:bg-white-alpha-50" @click="router.push('/settings')" />

                <div class="h-2rem w-1px bg-gray-300 mx-1"></div>

                <div class="flex align-items-center cursor-pointer p-1 border-round-lg hover:bg-white-alpha-50 transition-colors" @click="toggleMenu" aria-haspopup="true" aria-controls="overlay_menu">
                    <!-- Initials avatar — no external image service -->
                    <Avatar
                        :label="authStore.userInitials"
                        shape="circle"
                        class="mr-2 shadow-1"
                        style="background-color: var(--primary-500); color: #fff; font-weight: 700;"
                    />
                    <div class="flex flex-column hidden md:flex">
                        <span class="text-sm font-bold text-800">{{ authStore.userDisplayName }}</span>
                        <span class="text-xs text-500">{{ authStore.isAdmin ? 'Admin' : 'Employee' }}</span>
                    </div>
                </div>
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

:deep(.glass-menu) {
    background: rgba(255, 255, 255, 0.9) !important;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
}
</style>
