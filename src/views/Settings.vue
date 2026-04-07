<script setup>
import { ref, onMounted } from 'vue';
import { getAuth, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { collection, getDocs, orderBy, query, limit } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import InputSwitch from 'primevue/inputswitch';
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import Toast from 'primevue/toast';
import Dialog from 'primevue/dialog';
import Password from 'primevue/password';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import { useToast } from 'primevue/usetoast';

const auth = getAuth();
const toast = useToast();

const notifications = ref({
    email: true,
    push: true,
    updates: false,
});

const security = ref({
    twoFactor: false,
});

const language = ref('en');
const timezone = ref('UTC+6 (Dhaka Time)');

const languages = [
    { name: 'English', code: 'en' },
    { name: 'Spanish', code: 'es' },
    { name: 'French', code: 'fr' },
    { name: 'Bangla', code: 'bn' },
];

const timezones = [
    'UTC-5 (Eastern Time)',
    'UTC+0 (GMT)',
    'UTC+1 (CET)',
    'UTC+6 (Dhaka Time)',
];

// ─── Change Password ─────────────────────────────────────────────
const changePasswordDialog = ref(false);
const passwordChanging = ref(false);
const passwordForm = ref({ current: '', new: '', confirm: '' });
const pwErrors = ref({ current: '', new: '', confirm: '' });

const openChangePassword = () => {
    passwordForm.value = { current: '', new: '', confirm: '' };
    pwErrors.value = { current: '', new: '', confirm: '' };
    changePasswordDialog.value = true;
};

const validatePassword = () => {
    pwErrors.value = { current: '', new: '', confirm: '' };
    let valid = true;

    if (!passwordForm.value.current) {
        pwErrors.value.current = 'Current password is required.';
        valid = false;
    }
    if (!passwordForm.value.new) {
        pwErrors.value.new = 'New password is required.';
        valid = false;
    } else if (passwordForm.value.new.length < 8) {
        pwErrors.value.new = 'Password must be at least 8 characters.';
        valid = false;
    } else if (!/[A-Z]/.test(passwordForm.value.new)) {
        pwErrors.value.new = 'Must contain at least one uppercase letter.';
        valid = false;
    } else if (!/[0-9]/.test(passwordForm.value.new)) {
        pwErrors.value.new = 'Must contain at least one number.';
        valid = false;
    }
    if (passwordForm.value.new !== passwordForm.value.confirm) {
        pwErrors.value.confirm = 'Passwords do not match.';
        valid = false;
    }
    return valid;
};

const submitPasswordChange = async () => {
    if (!validatePassword()) return;

    const user = auth.currentUser;
    if (!user || !user.email) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'No authenticated user found.', life: 3000 });
        return;
    }

    passwordChanging.value = true;
    try {
        // Re-authenticate before changing password (prevents unauthorized changes)
        const credential = EmailAuthProvider.credential(user.email, passwordForm.value.current);
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, passwordForm.value.new);

        toast.add({ severity: 'success', summary: 'Success', detail: 'Password changed successfully.', life: 3000 });
        changePasswordDialog.value = false;
    } catch (error) {
        const knownErrors = {
            'auth/wrong-password': 'Current password is incorrect.',
            'auth/invalid-credential': 'Current password is incorrect.',
            'auth/too-many-requests': 'Too many attempts. Please try again later.',
            'auth/weak-password': 'New password is too weak.',
        };
        const message = knownErrors[error.code] || 'Failed to change password. Please try again.';
        toast.add({ severity: 'error', summary: 'Error', detail: message, life: 4000 });
    } finally {
        passwordChanging.value = false;
    }
};

// ─── Login History ────────────────────────────────────────────────
const loginHistoryDialog = ref(false);
const loginHistory = ref([]);
const historyLoading = ref(false);

const openLoginHistory = async () => {
    loginHistoryDialog.value = true;
    const user = auth.currentUser;
    if (!user) return;

    historyLoading.value = true;
    try {
        const histRef = collection(db, 'users', user.uid, 'loginHistory');
        const q = query(histRef, orderBy('timestamp', 'desc'), limit(20));
        const snap = await getDocs(q);
        loginHistory.value = snap.docs.map(d => {
            const data = d.data();
            return {
                date: data.timestamp?.toDate().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) || '—',
                device: data.userAgent ? data.userAgent.substring(0, 60) + (data.userAgent.length > 60 ? '…' : '') : '—',
                status: data.success ? 'Success' : 'Failed',
            };
        });
    } catch {
        toast.add({ severity: 'warn', summary: 'Warning', detail: 'Could not load login history.', life: 3000 });
        loginHistory.value = [];
    } finally {
        historyLoading.value = false;
    }
};

const saveSettings = () => {
    toast.add({ severity: 'success', summary: 'Saved', detail: 'Settings updated successfully.', life: 3000 });
};
</script>

<template>
    <div class="glass p-5 min-h-full">
        <Toast />
        <h2 class="text-900 font-bold mb-4 flex align-items-center">
            <i class="pi pi-cog mr-2 text-primary"></i>
            Settings
        </h2>

        <TabView class="custom-tabs" scrollable>
            <TabPanel header="General">
                <div class="p-4">
                    <h4 class="mb-4 text-800">Application Preferences</h4>
                    <div class="grid formgrid p-fluid max-w-30rem">
                        <div class="field col-12 mb-4">
                            <label class="font-medium text-700 mb-2 block">Language</label>
                            <Dropdown v-model="language" :options="languages" optionLabel="name" optionValue="code" class="w-full" />
                        </div>
                        <div class="field col-12 mb-4">
                            <label class="font-medium text-700 mb-2 block">Timezone</label>
                            <Dropdown v-model="timezone" :options="timezones" class="w-full" />
                        </div>
                    </div>
                </div>
            </TabPanel>

            <TabPanel header="Notifications">
                <div class="p-4">
                    <h4 class="mb-4 text-800">Email Notifications</h4>
                    <div class="flex align-items-center justify-content-between mb-4 p-3 surface-50 border-round">
                        <div>
                            <div class="font-medium text-900">Weekly Report</div>
                            <div class="text-500 text-sm">Receive a summary of employee attendance</div>
                        </div>
                        <InputSwitch v-model="notifications.email" />
                    </div>
                    <div class="flex align-items-center justify-content-between mb-4 p-3 surface-50 border-round">
                        <div>
                            <div class="font-medium text-900">System Updates</div>
                            <div class="text-500 text-sm">Get notified about new features</div>
                        </div>
                        <InputSwitch v-model="notifications.updates" />
                    </div>

                    <h4 class="mb-4 mt-5 text-800">Push Notifications</h4>
                    <div class="flex align-items-center justify-content-between mb-4 p-3 surface-50 border-round">
                        <div>
                            <div class="font-medium text-900">New Leave Requests</div>
                            <div class="text-500 text-sm">Instant alert when employee requests leave</div>
                        </div>
                        <InputSwitch v-model="notifications.push" />
                    </div>
                </div>
            </TabPanel>

            <TabPanel header="Security">
                <div class="p-4">
                    <h4 class="mb-4 text-800">Login Security</h4>
                    <div class="flex align-items-center justify-content-between mb-4 p-3 surface-50 border-round">
                        <div>
                            <div class="font-medium text-900">Two-Factor Authentication</div>
                            <div class="text-500 text-sm">Add an extra layer of security</div>
                        </div>
                        <InputSwitch v-model="security.twoFactor" />
                    </div>

                    <div class="mt-5">
                        <Button label="Change Password" icon="pi pi-lock" severity="warning" outlined class="mr-2" @click="openChangePassword" />
                        <Button label="View Login History" icon="pi pi-history" severity="secondary" outlined @click="openLoginHistory" />
                    </div>
                </div>
            </TabPanel>
        </TabView>

        <div class="flex justify-content-end mt-4 pt-4 border-top-1 border-gray-200">
            <Button label="Save All Changes" icon="pi pi-check" @click="saveSettings" />
        </div>

        <!-- Change Password Dialog -->
        <Dialog v-model:visible="changePasswordDialog" modal header="Change Password" :style="{ width: '25rem' }">
            <div class="flex flex-column gap-3 mb-3">
                <div class="flex flex-column gap-1">
                    <label for="current" class="font-semibold">Current Password</label>
                    <Password id="current" v-model="passwordForm.current" :feedback="false" toggleMask :class="{ 'p-invalid': pwErrors.current }" />
                    <small v-if="pwErrors.current" class="p-error">{{ pwErrors.current }}</small>
                </div>
                <div class="flex flex-column gap-1">
                    <label for="newpw" class="font-semibold">New Password</label>
                    <Password id="newpw" v-model="passwordForm.new" toggleMask :class="{ 'p-invalid': pwErrors.new }" />
                    <small v-if="pwErrors.new" class="p-error">{{ pwErrors.new }}</small>
                    <small class="text-500">Min 8 chars, 1 uppercase, 1 number.</small>
                </div>
                <div class="flex flex-column gap-1">
                    <label for="confirm" class="font-semibold">Confirm Password</label>
                    <Password id="confirm" v-model="passwordForm.confirm" :feedback="false" toggleMask :class="{ 'p-invalid': pwErrors.confirm }" />
                    <small v-if="pwErrors.confirm" class="p-error">{{ pwErrors.confirm }}</small>
                </div>
            </div>
            <template #footer>
                <Button label="Cancel" text severity="secondary" @click="changePasswordDialog = false" />
                <Button label="Update Password" :loading="passwordChanging" @click="submitPasswordChange" />
            </template>
        </Dialog>

        <!-- Login History Dialog -->
        <Dialog v-model:visible="loginHistoryDialog" modal header="Login History" :style="{ width: '50rem' }" :breakpoints="{ '960px': '75vw', '640px': '90vw' }">
            <div v-if="historyLoading" class="text-center p-4">Loading...</div>
            <div v-else-if="loginHistory.length === 0" class="text-center p-4 text-500">No login history found.</div>
            <DataTable v-else :value="loginHistory" stripedRows>
                <Column field="date" header="Date & Time"></Column>
                <Column field="device" header="Device / Browser"></Column>
                <Column field="status" header="Status">
                    <template #body="slotProps">
                        <span :class="slotProps.data.status === 'Success' ? 'text-green-500 font-bold' : 'text-red-500 font-bold'">
                            {{ slotProps.data.status }}
                        </span>
                    </template>
                </Column>
            </DataTable>
            <template #footer>
                <Button label="Close" text severity="secondary" @click="loginHistoryDialog = false" />
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
:deep(.p-tabview-nav) {
    background: transparent;
    border-bottom: 1px solid rgba(0,0,0,0.1);
}
:deep(.p-tabview-panels) {
    background: transparent;
    padding: 0;
}
:deep(.p-tabview-nav li .p-tabview-nav-link) {
    background: transparent;
    border: none;
    color: var(--text-color-secondary);
    font-weight: 600;
}
:deep(.p-tabview-nav li.p-highlight .p-tabview-nav-link) {
    color: var(--primary-color);
    border-bottom: 2px solid var(--primary-color);
}
</style>
