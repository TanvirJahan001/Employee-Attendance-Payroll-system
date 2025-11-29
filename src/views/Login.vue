<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { useToast } from "primevue/usetoast";
import Toast from 'primevue/toast';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';

const email = ref('');
const password = ref('');
const loading = ref(false);
const router = useRouter();
const toast = useToast();
const auth = getAuth();

const handleLogin = async () => {
    loading.value = true;
    try {
        await signInWithEmailAndPassword(auth, email.value, password.value);
        router.push('/dashboard');
    } catch (error) {
        console.error(error);
        toast.add({ severity: 'error', summary: 'Login Failed', detail: error.message, life: 3000 });
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <div class="flex align-items-center justify-content-center min-h-screen">
        <Toast />
        
        <div class="glass p-4 md:p-6 w-full max-w-30rem border-round-2xl relative overflow-hidden">
            <!-- Decorative circle inside card -->
            <div class="absolute top-0 right-0 w-10rem h-10rem bg-primary-400 border-circle opacity-20 blur-3xl" style="transform: translate(30%, -30%)"></div>
            <div class="absolute bottom-0 left-0 w-8rem h-8rem bg-pink-400 border-circle opacity-20 blur-3xl" style="transform: translate(-30%, 30%)"></div>

            <div class="text-center mb-5 relative z-1">
                <div class="text-4xl font-bold text-900 mb-2">Employee Attendance & Payroll system</div>
                <div class="text-700">Welcome back! Please login to continue.</div>
            </div>

            <form @submit.prevent="handleLogin" class="relative z-1">
                <div class="field mb-4">
                    <label for="email" class="block text-900 font-medium mb-2">Email</label>
                    <span class="p-input-icon-left w-full">
                        <i class="pi pi-envelope text-600"></i>
                        <InputText id="email" v-model="email" placeholder="Enter your email" class="w-full bg-white-alpha-50 border-none focus:bg-white transition-colors" />
                    </span>
                </div>

                <div class="field mb-5">
                    <label for="password" class="block text-900 font-medium mb-2">Password</label>
                    <span class="p-input-icon-left w-full">
                        <i class="pi pi-lock text-600 z-2"></i>
                        <Password id="password" v-model="password" placeholder="Enter your password" :feedback="false" toggleMask class="w-full" inputClass="w-full bg-white-alpha-50 border-none focus:bg-white transition-colors pl-5" />
                    </span>
                </div>

                <Button label="Sign In" type="submit" class="w-full p-3 text-lg font-bold shadow-4 hover:shadow-6 transition-all" :loading="loading" rounded />
                
                <div class="text-center mt-4">
                    <a href="#" class="text-primary-600 hover:text-primary-800 no-underline font-medium transition-colors">Forgot Password? Contact Admin</a>
                </div>
            </form>
        </div>
    </div>
</template>

<style scoped>
/* Scoped styles if needed, but mostly using global classes now */
</style>
