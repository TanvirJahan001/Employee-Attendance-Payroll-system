import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import './firebaseConfig'; // Initialize Firebase

import PrimeVue from 'primevue/config';
import ToastService from 'primevue/toastservice';
import ConfirmationService from 'primevue/confirmationservice';
import BadgeDirective from 'primevue/badgedirective';
import Aura from '@primevue/themes/aura';
import 'primeicons/primeicons.css';
import 'primeflex/primeflex.css';

import './style.css';

import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement } from 'chart.js';
import { useAuthStore } from './stores/authStore';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement);

const app = createApp(App);

const pinia = createPinia();
app.use(pinia);
app.use(router);
app.use(PrimeVue, {
    theme: {
        preset: Aura,
        options: {
            darkModeSelector: '.dark-mode',
        }
    }
});
app.use(ToastService);
app.use(ConfirmationService);
app.directive('badge', BadgeDirective);

// Kick off Firebase auth listener BEFORE mounting so authStore.loading
// becomes false before the first navigation guard runs.
const authStore = useAuthStore();
authStore.init();

app.mount('#app');
