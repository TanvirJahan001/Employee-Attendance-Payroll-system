<script setup>
import { useRouter } from 'vue-router';
import { getAuth, signOut } from "firebase/auth";
import { useEmployeeStore } from '../stores/employeeStore'; // Import store
import Button from 'primevue/button';
import Avatar from 'primevue/avatar';
import Menu from 'primevue/menu';
import InputText from 'primevue/inputtext';
import Badge from 'primevue/badge';
import { ref } from 'vue';

const router = useRouter();
const auth = getAuth();
const store = useEmployeeStore(); // Use store
const menu = ref();

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
                    <InputText v-model="store.searchQuery" placeholder="Search employees..." class="w-full border-none bg-transparent shadow-none pl-5" />
                </span>
            </div>

            <!-- Actions -->
            <div class="flex align-items-center gap-3">
                <Button icon="pi pi-bell" text rounded severity="secondary" v-badge.danger="2" class="text-600 hover:text-900 hover:bg-white-alpha-50" />
                <Button icon="pi pi-cog" text rounded severity="secondary" class="text-600 hover:text-900 hover:bg-white-alpha-50" @click="router.push('/settings')" />
                
                <div class="h-2rem w-1px bg-gray-300 mx-1"></div>

                <div class="flex align-items-center cursor-pointer p-1 border-round-lg hover:bg-white-alpha-50 transition-colors" @click="toggleMenu" aria-haspopup="true" aria-controls="overlay_menu">
                    <Avatar image="https://i.pravatar.cc/150?img=68" shape="circle" class="mr-2 shadow-1" />
                    <div class="flex flex-column hidden md:flex">
                        <span class="text-sm font-bold text-800">Admin User</span>
                        <span class="text-xs text-500">Super Admin</span>
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
