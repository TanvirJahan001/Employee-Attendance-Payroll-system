<script setup>
import { onMounted, ref, reactive, computed } from 'vue';
import { useHolidayStore } from '../stores/holidayStore';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import Checkbox from 'primevue/checkbox';
import Tag from 'primevue/tag';
import ConfirmDialog from 'primevue/confirmdialog';
import Toast from 'primevue/toast';

const store   = useHolidayStore();
const confirm = useConfirm();
const toast   = useToast();

onMounted(() => store.loadHolidays());

// ── Add dialog ────────────────────────────────────────────────────────────────
const addDialog  = ref(false);
const adding     = ref(false);
const addForm    = reactive({ name: '', date: '', type: 'company', recurring: false });
const addErrors  = reactive({ name: '', date: '' });

const TYPE_OPTIONS = [
    { label: 'National Holiday', value: 'national' },
    { label: 'Company Holiday',  value: 'company'  },
];

const openAddDialog = () => {
    Object.assign(addForm, { name: '', date: '', type: 'company', recurring: false });
    Object.assign(addErrors, { name: '', date: '' });
    addDialog.value = true;
};

const validateAdd = () => {
    let valid = true;
    addErrors.name = addErrors.date = '';
    if (!addForm.name.trim()) { addErrors.name = 'Name is required.'; valid = false; }
    if (!addForm.date)         { addErrors.date = 'Date is required.'; valid = false; }
    return valid;
};

const handleAdd = async () => {
    if (!validateAdd()) return;
    adding.value = true;
    const result = await store.addHoliday({ ...addForm });
    adding.value = false;
    if (result.success) {
        toast.add({ severity: 'success', summary: 'Holiday Added', detail: `${addForm.name} has been added.`, life: 3000 });
        addDialog.value = false;
    } else {
        toast.add({ severity: 'error', summary: 'Error', detail: result.error || 'Failed to add holiday.', life: 4000 });
    }
};

const confirmDelete = (holiday) => {
    confirm.require({
        message: `Remove "${holiday.name}" from the holiday calendar?`,
        header: 'Delete Holiday',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger',
        acceptLabel: 'Delete',
        rejectLabel: 'Cancel',
        accept: async () => {
            const result = await store.deleteHoliday(holiday.firestoreId);
            if (result.success) {
                toast.add({ severity: 'success', summary: 'Deleted', detail: `${holiday.name} removed.`, life: 3000 });
            } else {
                toast.add({ severity: 'error', summary: 'Error', detail: result.error, life: 4000 });
            }
        },
    });
};

// ── Computed: group by month for a calendar-like view ─────────────────────────
const currentYear = new Date().getFullYear();

const byMonth = computed(() => {
    const months = Array.from({ length: 12 }, (_, i) => ({
        month: i,
        name: new Date(currentYear, i, 1).toLocaleString('en-US', { month: 'long' }),
        holidays: [],
    }));
    store.holidays.forEach(h => {
        const m = new Date(h.date).getMonth();
        if (!isNaN(m)) months[m].holidays.push(h);
    });
    return months.filter(m => m.holidays.length > 0);
});

const formatDate = (d) =>
    new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
</script>

<template>
    <Toast />
    <ConfirmDialog />

    <div class="flex justify-content-between align-items-center mb-4">
        <div>
            <h2 class="text-3xl font-bold text-800 mb-1">Holiday Calendar</h2>
            <p class="text-600">Manage company and national holidays — excluded from attendance calculations</p>
        </div>
        <Button icon="pi pi-plus" label="Add Holiday" @click="openAddDialog" class="shadow-2" />
    </div>

    <!-- Stats bar -->
    <div class="grid mb-4">
        <div class="col-12 md:col-4">
            <div class="glass p-3 border-round-xl text-center">
                <div class="text-2xl font-bold text-primary">{{ store.holidays.length }}</div>
                <div class="text-500 text-sm">Total Holidays</div>
            </div>
        </div>
        <div class="col-12 md:col-4">
            <div class="glass p-3 border-round-xl text-center">
                <div class="text-2xl font-bold text-blue-600">{{ store.holidays.filter(h => h.type === 'national').length }}</div>
                <div class="text-500 text-sm">National Holidays</div>
            </div>
        </div>
        <div class="col-12 md:col-4">
            <div class="glass p-3 border-round-xl text-center">
                <div class="text-2xl font-bold text-purple-600">{{ store.holidays.filter(h => h.type === 'company').length }}</div>
                <div class="text-500 text-sm">Company Holidays</div>
            </div>
        </div>
    </div>

    <!-- Month cards -->
    <div class="grid mb-4" v-if="!store.loading">
        <div v-for="month in byMonth" :key="month.month" class="col-12 md:col-6 lg:col-4">
            <div class="glass p-4 border-round-xl h-full">
                <h4 class="text-900 font-bold mb-3 flex align-items-center gap-2">
                    <i class="pi pi-calendar text-primary"></i>
                    {{ month.name }}
                </h4>
                <ul class="list-none p-0 m-0">
                    <li
                        v-for="h in month.holidays"
                        :key="h.firestoreId"
                        class="flex align-items-center justify-content-between py-2 border-bottom-1 surface-border last:border-none"
                    >
                        <div class="flex flex-column">
                            <span class="font-medium text-900">{{ h.name }}</span>
                            <span class="text-500 text-xs">{{ formatDate(h.date) }}</span>
                        </div>
                        <div class="flex align-items-center gap-2">
                            <Tag
                                :value="h.type === 'national' ? 'National' : 'Company'"
                                :severity="h.type === 'national' ? 'info' : 'secondary'"
                                class="text-xs"
                                rounded
                            />
                            <Button icon="pi pi-trash" text severity="danger" rounded size="small" @click="confirmDelete(h)" />
                        </div>
                    </li>
                </ul>
            </div>
        </div>
    </div>

    <div v-if="store.loading" class="text-center py-8">
        <i class="pi pi-spin pi-spinner text-4xl text-primary mb-3 block"></i>
        <p class="text-500">Loading holidays…</p>
    </div>

    <!-- Full list table -->
    <div class="card glass border-0 shadow-none">
        <h4 class="font-bold text-800 mb-3">All Holidays</h4>
        <DataTable :value="store.holidays" :loading="store.loading" paginator :rows="10" tableStyle="min-width:35rem" rowHover sortField="date" :sortOrder="1">
            <Column field="date" header="Date" sortable>
                <template #body="{ data }">
                    <span class="font-mono">{{ data.date }}</span>
                    <span class="text-500 text-sm ml-2">({{ formatDate(data.date) }})</span>
                </template>
            </Column>
            <Column field="name" header="Holiday Name" sortable />
            <Column field="type" header="Type">
                <template #body="{ data }">
                    <Tag :value="data.type === 'national' ? 'National' : 'Company'" :severity="data.type === 'national' ? 'info' : 'secondary'" rounded />
                </template>
            </Column>
            <Column field="recurring" header="Recurring">
                <template #body="{ data }">
                    <i :class="data.recurring ? 'pi pi-check text-green-500' : 'pi pi-minus text-400'" />
                </template>
            </Column>
            <Column header="Actions" style="width: 5rem">
                <template #body="{ data }">
                    <Button icon="pi pi-trash" text severity="danger" rounded size="small" @click="confirmDelete(data)" />
                </template>
            </Column>
        </DataTable>
    </div>

    <!-- ── Add Holiday Dialog ──────────────────────────────────────────────── -->
    <Dialog v-model:visible="addDialog" modal header="Add Holiday" :style="{ width: '28rem' }" :breakpoints="{ '640px': '95vw' }">
        <div class="grid formgrid p-fluid">
            <div class="field col-12 mb-3">
                <label class="font-medium mb-1 block">Holiday Name *</label>
                <InputText v-model="addForm.name" :class="{ 'p-invalid': addErrors.name }" placeholder="e.g. Company Outing Day" maxlength="100" />
                <small v-if="addErrors.name" class="p-error">{{ addErrors.name }}</small>
            </div>
            <div class="field col-12 mb-3">
                <label class="font-medium mb-1 block">Date *</label>
                <InputText v-model="addForm.date" type="date" :class="{ 'p-invalid': addErrors.date }" class="w-full" />
                <small v-if="addErrors.date" class="p-error">{{ addErrors.date }}</small>
            </div>
            <div class="field col-12 mb-3">
                <label class="font-medium mb-1 block">Type</label>
                <Dropdown v-model="addForm.type" :options="TYPE_OPTIONS" optionLabel="label" optionValue="value" class="w-full" />
            </div>
            <div class="field col-12 mb-3 flex align-items-center gap-2">
                <Checkbox v-model="addForm.recurring" :binary="true" inputId="recurring" />
                <label for="recurring" class="cursor-pointer">Recurring every year</label>
            </div>
        </div>
        <div class="flex justify-content-end gap-2 mt-2">
            <Button label="Cancel" severity="secondary" text @click="addDialog = false" />
            <Button label="Add Holiday" icon="pi pi-plus" :loading="adding" @click="handleAdd" />
        </div>
    </Dialog>
</template>
