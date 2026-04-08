<script setup>
import { RouterView } from 'vue-router';
import { useAuthStore } from './stores/authStore';
import { storeToRefs } from 'pinia';

const authStore = useAuthStore();
const { loading } = storeToRefs(authStore);
</script>

<template>
    <!-- Full-page loading screen while Firebase determines auth state -->
    <div v-if="loading" class="app-loading">
        <div class="loading-card">
            <div class="loading-logo">
                <i class="pi pi-bolt"></i>
            </div>
            <h2>EAP System</h2>
            <div class="loading-spinner">
                <i class="pi pi-spin pi-spinner"></i>
            </div>
            <p>Loading, please wait…</p>
        </div>
    </div>

    <RouterView v-else />
</template>

<style>
body {
    margin: 0;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    background-color: var(--surface-ground);
    color: var(--text-color);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}
</style>

<style scoped>
.app-loading {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab);
    background-size: 400% 400%;
    animation: gradientBG 8s ease infinite;
    z-index: 9999;
}

.loading-card {
    background: rgba(255, 255, 255, 0.25);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.4);
    border-radius: 20px;
    padding: 2.5rem 3rem;
    text-align: center;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
    color: white;
}

.loading-logo {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1rem;
    font-size: 1.5rem;
}

.loading-card h2 {
    margin: 0 0 1.5rem;
    font-size: 1.4rem;
    font-weight: 700;
    text-shadow: 0 1px 4px rgba(0,0,0,0.2);
}

.loading-spinner {
    font-size: 2rem;
    margin-bottom: 1rem;
}

.loading-card p {
    margin: 0;
    font-size: 0.9rem;
    opacity: 0.85;
}

@keyframes gradientBG {
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
}
</style>
