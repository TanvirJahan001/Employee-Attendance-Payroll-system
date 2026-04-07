import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './firebaseConfig' // Initialize Firebase

import PrimeVue from 'primevue/config';
import ToastService from 'primevue/toastservice';
import ConfirmationService from 'primevue/confirmationservice';
import Aura from '@primevue/themes/aura';
import 'primeicons/primeicons.css';
import 'primeflex/primeflex.css';

import './style.css'

import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement } from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement);

const app = createApp(App)

const pinia = createPinia();
app.use(pinia)
app.use(router)
app.use(PrimeVue, {
    theme: {
        preset: Aura,
        options: {
            darkModeSelector: '.dark-mode',
        }
    }
})
app.use(ToastService)
app.use(ConfirmationService)

// Initialize auth state listener after Pinia is ready
import { useAuthStore } from './stores/authStore';
const authStore = useAuthStore();
authStore.init();

app.mount('#app')
