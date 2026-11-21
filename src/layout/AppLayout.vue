<script setup>
import { ref } from 'vue';
import Sidebar from '../components/Sidebar.vue';
import Topbar from '../components/Topbar.vue';
import { RouterView } from 'vue-router';
import Tag from 'primevue/tag';

defineProps({ demo: Boolean });

const mobileSidebarActive = ref(false);

const onMenuToggle = () => {
    mobileSidebarActive.value = !mobileSidebarActive.value;
};
</script>

<template>
    <div class="layout-wrapper min-h-screen flex relative">
        <Sidebar :demo="demo" :mobileActive="mobileSidebarActive" @close-sidebar="mobileSidebarActive = false" />
        
        <div class="layout-main-container flex flex-column min-h-screen flex-grow-1" :class="{ 'sidebar-mobile-active': mobileSidebarActive }">
            <Topbar :demo="demo" @menu-toggle="onMenuToggle" />
            <div class="layout-main flex-grow-1 p-3 md:p-4 overflow-y-auto">
                <div class="glass p-3 md:p-4 border-round-2xl min-h-full shadow-1">
                    <div v-if="demo" class="flex flex-wrap gap-2 align-items-center mb-4">
                        <Tag value="Read-only demo" severity="info" />
                        <span class="text-sm text-700">Sample records for the admin workspace.</span>
                    </div>
                    <RouterView />
                </div>
            </div>
            
            <!-- Mobile Overlay -->
            <div v-if="mobileSidebarActive" class="layout-mask fixed top-0 left-0 w-full h-full bg-black-alpha-40 z-5 lg:hidden" @click="mobileSidebarActive = false"></div>
        </div>
    </div>
</template>

<style scoped>
.layout-main-container {
    margin-left: 18rem;
    transition: margin-left 0.3s;
    width: calc(100% - 18rem);
    min-width: 0;
}

@media (max-width: 991px) {
    .layout-main-container {
        margin-left: 0;
        width: 100%;
    }
}
</style>
