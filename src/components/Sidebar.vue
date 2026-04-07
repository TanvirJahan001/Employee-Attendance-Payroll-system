<script setup>
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const props = defineProps({
    mobileActive: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['close-sidebar']);

const router = useRouter();
const route = useRoute();

const items = ref([
    { label: 'Dashboard', icon: 'pi pi-home', to: '/dashboard' },
    { label: 'Employees', icon: 'pi pi-users', to: '/employees' },
    { label: 'Attendance', icon: 'pi pi-calendar', to: '/attendance' },
    { label: 'Payroll', icon: 'pi pi-wallet', to: '/payroll' }
]);

const isCollapsed = ref(false);

const onMenuItemClick = () => {
    // Close sidebar on mobile when item clicked
    if (window.innerWidth <= 991) {
        emit('close-sidebar');
    }
};
</script>

<template>
    <div class="sidebar-container h-screen p-3 flex flex-column transition-all transition-duration-300" 
         :class="[
            { 'w-6rem': isCollapsed && !mobileActive, 'w-18rem': !isCollapsed },
            mobileActive ? 'translate-x-0' : '-translate-x-100 lg:translate-x-0'
         ]">
        <div class="glass h-full flex flex-column border-round-2xl shadow-4 overflow-hidden relative">
            <!-- Header -->
            <div class="flex align-items-center justify-content-between" :class="isCollapsed ? 'p-2 justify-content-center' : 'p-4'">
                <div v-if="!isCollapsed" class="flex align-items-center gap-2 fadein animation-duration-300">
                    <div class="w-2rem h-2rem border-circle bg-primary-500 flex align-items-center justify-content-center shadow-2">
                        <i class="pi pi-bolt text-white text-sm"></i>
                    </div>
                    <span class="font-bold text-xl text-800">EAP System </span>
                </div>
                <!-- Desktop Collapse Toggle -->
                <i class="pi text-600 cursor-pointer hover:text-primary transition-colors hidden lg:block" 
                   :class="isCollapsed ? 'pi-angle-double-right text-xl' : 'pi-angle-double-left'"
                   @click="isCollapsed = !isCollapsed"></i>
                
                <!-- Mobile Close Button -->
                 <i class="pi pi-times text-600 cursor-pointer hover:text-primary transition-colors lg:hidden" 
                   @click="$emit('close-sidebar')"></i>
            </div>

            <!-- Navigation -->
            <ul class="list-none m-0 flex-grow-1 overflow-y-auto" :class="isCollapsed ? 'p-2' : 'p-3'">
                <li v-for="item in items" :key="item.label" class="mb-2">
                    <router-link :to="item.to" 
                        @click="onMenuItemClick"
                        class="flex align-items-center border-round-xl cursor-pointer transition-all transition-duration-200 no-underline text-700 hover:bg-white-alpha-30 hover:text-900 hover:shadow-1"
                        :class="isCollapsed ? 'p-2 justify-content-center' : 'p-3'"
                        active-class="bg-primary-500 text-white shadow-3 hover:bg-primary-600 hover:text-white">
                        <i :class="[item.icon, 'text-xl', { 'mr-3': !isCollapsed }]"></i>
                        <span v-if="!isCollapsed" class="font-medium fadein animation-duration-300">{{ item.label }}</span>
                    </router-link>
                </li>
            </ul>

            <!-- Footer -->
            <div class="mt-auto" :class="isCollapsed ? 'p-2' : 'p-3'">
                <div class="glass-dark border-round-xl flex align-items-center gap-3 cursor-pointer hover:bg-black-alpha-80 transition-colors" 
                     :class="isCollapsed ? 'p-2 justify-content-center' : 'p-3'"
                     @click="router.push('/profile')">
                    <div class="w-2rem h-2rem border-circle bg-white-alpha-20 flex align-items-center justify-content-center">
                        <i class="pi pi-user text-white"></i>
                    </div>
                    <div v-if="!isCollapsed" class="flex flex-column fadein animation-duration-300">
                        <span class="text-white text-sm font-bold">Admin User</span>
                        <span class="text-white-alpha-60 text-xs">View Profile</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.sidebar-container {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 1000;
}

/* Custom Scrollbar */
ul::-webkit-scrollbar {
    width: 6px;
}
ul::-webkit-scrollbar-track {
    background: transparent;
}
ul::-webkit-scrollbar-thumb {
    background: rgba(0,0,0,0.1);
    border-radius: 3px;
}
</style>
