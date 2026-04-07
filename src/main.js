import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './firebaseConfig' // Initialize Firebase
import { useAuthStore } from './stores/authStore'

import PrimeVue from 'primevue/config';
import ToastService from 'primevue/toastservice';
import BadgeDirective from 'primevue/badgedirective';
import Aura from '@primevue/themes/aura';
import 'primeicons/primeicons.css';
import 'primeflex/primeflex.css';

import './style.css'

const app = createApp(App)

const pinia = createPinia();
app.use(pinia)
app.use(router)
app.use(ToastService)
app.use(PrimeVue, {
    theme: {
        preset: Aura,
        options: {
            darkModeSelector: '.my-app-dark',
        }
    }
});
app.directive('badge', BadgeDirective);

// Initialize auth state listener after Pinia is ready
const authStore = useAuthStore();
authStore.init();

app.mount('#app')
