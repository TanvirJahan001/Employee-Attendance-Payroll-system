<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { useToast } from "primevue/usetoast";
import { useAuthStore } from '../stores/authStore';
import { DEMO_EMAIL, DEMO_PASSWORD, startDemoSession } from '../demo/session';
import Toast from 'primevue/toast';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Dialog from 'primevue/dialog';

const email = ref('');
const password = ref('');
const loading = ref(false);
const emailError = ref('');
const passwordError = ref('');
const loginError = ref('');   // inline banner error
const router = useRouter();
const toast = useToast();
const auth = getAuth();
const authStore = useAuthStore();

// Forgot password state
const forgotDialogVisible = ref(false);
const forgotEmail = ref('');
const forgotEmailError = ref('');
const forgotLoading = ref(false);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validate = () => {
    emailError.value = '';
    passwordError.value = '';
    let valid = true;

    if (!email.value.trim()) {
        emailError.value = 'Email is required.';
        valid = false;
    } else if (!EMAIL_REGEX.test(email.value.trim())) {
        emailError.value = 'Enter a valid email address.';
        valid = false;
    }

    if (!password.value) {
        passwordError.value = 'Password is required.';
        valid = false;
    } else if (password.value.length < 6) {
        passwordError.value = 'Password must be at least 6 characters.';
        valid = false;
    }

    return valid;
};

const openDemo = () => {
    startDemoSession();
    return router.push({ name: 'demo-dashboard' });
};

const handleLogin = async () => {
    if (loading.value) return;
    loginError.value = '';
    if (!validate()) return;

    const loginEmail = email.value.trim();
    if (loginEmail.toLowerCase() === DEMO_EMAIL) {
        if (password.value === DEMO_PASSWORD) return openDemo();
        loginError.value = 'Invalid demo password. Use the password shown below.';
        return;
    }

    loading.value = true;
    try {
        const credential = await signInWithEmailAndPassword(auth, loginEmail, password.value);
        await authStore.recordLoginEvent(credential.user.uid, true);
        router.push('/dashboard');
    } catch (error) {
        const knownErrors = {
            'auth/user-not-found': 'Invalid email or password.',
            'auth/wrong-password': 'Invalid email or password.',
            'auth/invalid-credential': 'Invalid email or password.',
            'auth/invalid-email': 'Invalid email address.',
            'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
            'auth/user-disabled': 'This account has been disabled. Contact your administrator.',
            'auth/network-request-failed': 'Network error. Please check your connection.',
        };
        const message = knownErrors[error.code] || `Login failed. (${error.code || 'unknown error'})`;
        loginError.value = message;
        toast.add({ severity: 'error', summary: 'Login Failed', detail: message, life: 4000 });
    } finally {
        loading.value = false;
    }
};

// ── Forgot Password ──────────────────────────────────────────────────────────

const openForgotDialog = () => {
    forgotEmail.value = email.value; // pre-fill if user already typed email
    forgotEmailError.value = '';
    forgotDialogVisible.value = true;
};

const handleForgotPassword = async () => {
    forgotEmailError.value = '';
    if (!forgotEmail.value.trim()) {
        forgotEmailError.value = 'Email is required.';
        return;
    }
    if (!EMAIL_REGEX.test(forgotEmail.value.trim())) {
        forgotEmailError.value = 'Enter a valid email address.';
        return;
    }
    if (forgotEmail.value.trim().toLowerCase() === DEMO_EMAIL) {
        forgotEmailError.value = 'Use the public password shown in the demo section.';
        return;
    }

    forgotLoading.value = true;
    try {
        await sendPasswordResetEmail(auth, forgotEmail.value.trim());
        toast.add({
            severity: 'success',
            summary: 'Email Sent',
            detail: `A password reset link has been sent to ${forgotEmail.value.trim()}. Check your inbox.`,
            life: 6000,
        });
        forgotDialogVisible.value = false;
        forgotEmail.value = '';
    } catch (error) {
        const knownErrors = {
            'auth/user-not-found': 'No account found with this email address.',
            'auth/invalid-email': 'Invalid email address.',
            'auth/too-many-requests': 'Too many requests. Please try again later.',
            'auth/network-request-failed': 'Network error. Please check your connection.',
        };
        forgotEmailError.value = knownErrors[error.code] || 'Failed to send reset email. Please try again.';
    } finally {
        forgotLoading.value = false;
    }
};
</script>

<template>
    <div class="flex align-items-center justify-content-center min-h-screen p-3">
        <Toast />

        <div class="glass p-4 md:p-6 w-full max-w-30rem border-round-2xl relative overflow-hidden">
            <!-- Decorative circles -->
            <div class="absolute top-0 right-0 w-10rem h-10rem bg-primary-400 border-circle opacity-20 blur-3xl" style="transform: translate(30%, -30%)"></div>
            <div class="absolute bottom-0 left-0 w-8rem h-8rem bg-pink-400 border-circle opacity-20 blur-3xl" style="transform: translate(-30%, 30%)"></div>

            <div class="text-center mb-5 relative z-1">
                <div class="text-4xl font-bold text-900 mb-2">Employee Attendance &amp; Payroll System</div>
                <div class="text-700">Welcome back! Please login to continue.</div>
            </div>

            <form @submit.prevent="handleLogin" class="relative z-1" novalidate>
                <div class="field mb-4">
                    <label for="email" class="block text-900 font-medium mb-2">Email</label>
                    <span class="p-input-icon-left w-full">
                        <i class="pi pi-envelope text-600"></i>
                        <InputText
                            id="email"
                            v-model="email"
                            type="email"
                            placeholder="Enter your email"
                            autocomplete="email"
                            :class="['w-full bg-white-alpha-50 border-none focus:bg-white transition-colors', { 'p-invalid': emailError }]"
                        />
                    </span>
                    <small v-if="emailError" class="p-error">{{ emailError }}</small>
                </div>

                <div class="field mb-5">
                    <label for="password" class="block text-900 font-medium mb-2">Password</label>
                    <span class="p-input-icon-left w-full">
                        <i class="pi pi-lock text-600 z-2"></i>
                        <Password
                            inputId="password"
                            v-model="password"
                            placeholder="Enter your password"
                            :feedback="false"
                            toggleMask
                            autocomplete="current-password"
                            :class="['w-full', { 'p-invalid': passwordError }]"
                            inputClass="w-full bg-white-alpha-50 border-none focus:bg-white transition-colors pl-5"
                        />
                    </span>
                    <small v-if="passwordError" class="p-error">{{ passwordError }}</small>
                </div>

                <!-- Inline auth error banner -->
                <div v-if="loginError" class="login-error-banner mb-3">
                    <i class="pi pi-exclamation-circle mr-2"></i>{{ loginError }}
                </div>

                <Button label="Sign In" type="submit" class="w-full p-3 text-lg font-bold shadow-4 hover:shadow-6 transition-all" :loading="loading" rounded />

                <div class="text-center mt-4">
                    <a
                        href="#"
                        class="text-primary-600 font-medium no-underline hover:underline cursor-pointer"
                        @click.prevent="openForgotDialog"
                    >
                        Forgot Password?
                    </a>
                </div>
            </form>

            <section class="relative z-1 mt-5 p-3 border-1 surface-border border-round-xl" aria-labelledby="demo-title">
                <h2 id="demo-title" class="text-lg text-900 mt-0 mb-1">Public demo</h2>
                <p class="text-700 text-sm mt-0 mb-3">Explore the admin workspace with sample data and read-only access.</p>
                <dl class="text-sm text-900 mt-0 mb-3">
                    <div class="flex flex-wrap gap-2 mb-2">
                        <dt class="font-semibold">Email</dt>
                        <dd class="m-0"><code>{{ DEMO_EMAIL }}</code></dd>
                    </div>
                    <div class="flex flex-wrap gap-2">
                        <dt class="font-semibold">Password</dt>
                        <dd class="m-0"><code>{{ DEMO_PASSWORD }}</code></dd>
                    </div>
                </dl>
                <Button label="Try Demo" icon="pi pi-arrow-right" iconPos="right" type="button" class="w-full"
                    severity="secondary" :disabled="loading" @click="openDemo" />
            </section>
        </div>

        <!-- ── Forgot Password Dialog ───────────────────────────────────────── -->
        <Dialog
            v-model:visible="forgotDialogVisible"
            modal
            header="Reset Your Password"
            :style="{ width: '26rem' }"
            :breakpoints="{ '640px': '90vw' }"
        >
            <p class="text-600 mb-4">
                Enter your email address and we'll send you a link to reset your password.
            </p>
            <div class="field mb-4">
                <label for="forgotEmail" class="block font-medium mb-2">Email Address</label>
                <span class="p-input-icon-left w-full">
                    <i class="pi pi-envelope"></i>
                    <InputText
                        id="forgotEmail"
                        v-model="forgotEmail"
                        type="email"
                        placeholder="your@email.com"
                        class="w-full"
                        :class="{ 'p-invalid': forgotEmailError }"
                        @keyup.enter="handleForgotPassword"
                    />
                </span>
                <small v-if="forgotEmailError" class="p-error">{{ forgotEmailError }}</small>
            </div>
            <div class="flex justify-content-end gap-2">
                <Button label="Cancel" severity="secondary" text @click="forgotDialogVisible = false" />
                <Button label="Send Reset Link" icon="pi pi-send" :loading="forgotLoading" @click="handleForgotPassword" />
            </div>
        </Dialog>
    </div>
</template>

<style scoped>
.login-error-banner {
    background: rgba(220, 38, 38, 0.12);
    border: 1px solid rgba(220, 38, 38, 0.4);
    border-radius: 8px;
    padding: 0.65rem 1rem;
    color: #dc2626;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
}
</style>
