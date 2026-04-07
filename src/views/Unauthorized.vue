<script setup>
import { useRouter } from 'vue-router';
import Button from 'primevue/button';

const router = useRouter();
</script>

<template>
    <div class="flex align-items-center justify-content-center min-h-screen flex-column gap-4">
        <i class="pi pi-lock text-6xl text-red-400"></i>
        <h1 class="text-900 text-3xl font-bold m-0">Access Denied</h1>
        <p class="text-600 text-center m-0">You do not have permission to view this page.<br>Please contact your administrator.</p>
        <Button label="Go to Dashboard" icon="pi pi-home" @click="router.push('/dashboard')" />
    </div>
</template>
