<script setup>
import { ref } from 'vue';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import InputSwitch from 'primevue/inputswitch';
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import Toast from 'primevue/toast';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import { useToast } from 'primevue/usetoast';

const toast = useToast();

const notifications = ref({
    email: true,
    push: true,
    updates: false,
    newsletter: true
});

const security = ref({
    twoFactor: false,
    sessionTimeout: '30 mins'
});

const theme = ref('light');
const language = ref('en');
const timezone = ref('UTC+6 (Dhaka Time)');

const languages = [
    { name: 'English', code: 'en' },
    { name: 'Spanish', code: 'es' },
    { name: 'French', code: 'fr' },
    { name: 'Bangla', code: 'bn' }
];

const timezones = [
    'UTC-5 (Eastern Time)', 
    'UTC+0 (GMT)', 
    'UTC+1 (CET)',
    'UTC+6 (Dhaka Time)'
];

// Change Password Logic
const changePasswordDialog = ref(false);
const passwordForm = ref({
    current: '',
    new: '',
    confirm: ''
});

const openChangePassword = () => {
    passwordForm.value = { current: '', new: '', confirm: '' };
    changePasswordDialog.value = true;
};

const submitPasswordChange = () => {
    if (passwordForm.value.new !== passwordForm.value.confirm) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'New passwords do not match', life: 3000 });
        return;
    }
    // Mock API call
    setTimeout(() => {
        toast.add({ severity: 'success', summary: 'Success', detail: 'Password changed successfully', life: 3000 });
        changePasswordDialog.value = false;
    }, 1000);
};

// Login History Logic
const loginHistoryDialog = ref(false);
const loginHistory = ref([
    { date: '2023-11-28 10:30 AM', ip: '192.168.1.1', device: 'Chrome / Windows', status: 'Success' },
    { date: '2023-11-27 09:15 AM', ip: '192.168.1.1', device: 'Chrome / Windows', status: 'Success' },
    { date: '2023-11-26 02:45 PM', ip: '10.0.0.5', device: 'Safari / iPhone', status: 'Success' },
    { date: '2023-11-25 11:20 AM', ip: '192.168.1.1', device: 'Chrome / Windows', status: 'Failed' },
]);

const openLoginHistory = () => {
    loginHistoryDialog.value = true;
};

const saveSettings = () => {
    toast.add({ severity: 'success', summary: 'Saved', detail: 'Settings updated successfully', life: 3000 });
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
                <div class="flex flex-column gap-2">
                    <label for="current" class="font-semibold">Current Password</label>
                    <Password id="current" v-model="passwordForm.current" :feedback="false" toggleMask />
                </div>
                <div class="flex flex-column gap-2">
                    <label for="new" class="font-semibold">New Password</label>
                    <Password id="new" v-model="passwordForm.new" toggleMask />
                </div>
                <div class="flex flex-column gap-2">
                    <label for="confirm" class="font-semibold">Confirm Password</label>
                    <Password id="confirm" v-model="passwordForm.confirm" :feedback="false" toggleMask />
                </div>
            </div>
            <template #footer>
                <Button label="Cancel" text severity="secondary" @click="changePasswordDialog = false" />
                <Button label="Update Password" @click="submitPasswordChange" />
            </template>
        </Dialog>

        <!-- Login History Dialog -->
        <Dialog v-model:visible="loginHistoryDialog" modal header="Login History" :style="{ width: '50rem' }" :breakpoints="{ '960px': '75vw', '640px': '90vw' }">
            <DataTable :value="loginHistory" stripedRows>
                <Column field="date" header="Date & Time"></Column>
                <Column field="device" header="Device"></Column>
                <Column field="ip" header="IP Address"></Column>
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
