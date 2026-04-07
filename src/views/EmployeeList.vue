<script setup>
import { onMounted, ref, reactive } from 'vue';
import { useEmployeeStore } from '../stores/employeeStore';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Calendar from 'primevue/calendar';
import Tag from 'primevue/tag';
import Avatar from 'primevue/avatar';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Dropdown from 'primevue/dropdown';
import ConfirmDialog from 'primevue/confirmdialog';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import Toast from 'primevue/toast';

const store = useEmployeeStore();
const toast = useToast();
const confirm = useConfirm();

onMounted(async () => {
    await store.loadEmployees();
});

// ── Leave dialog ─────────────────────────────────────────────────────────────
const leaveDialogVisible = ref(false);
const selectedEmployee = ref(null);
const leaveDate = ref(null);

const openLeaveDialog = (employee) => {
    selectedEmployee.value = employee;
    leaveDate.value = null;
    leaveDialogVisible.value = true;
};

const saveLeave = async () => {
    if (selectedEmployee.value && leaveDate.value) {
        const dateKey = store.toDateKey(leaveDate.value);
        await store.markLeave(selectedEmployee.value.id, dateKey);
        toast.add({ severity: 'success', summary: 'Leave Marked', detail: `Leave marked for ${selectedEmployee.value.name}`, life: 3000 });
        leaveDialogVisible.value = false;
    }
};

// ── Add / Edit dialog ─────────────────────────────────────────────────────────
const ROLE_OPTIONS = [
    'Designer', 'Manager', 'HR', 'Marketing', 'Developer', 'Sales', 'Finance', 'Operations', 'Support'
];

const empDialogVisible = ref(false);
const empDialogMode = ref('add'); // 'add' | 'edit'
const empForm = reactive({
    id: null,
    name: '',
    role: '',
    department: '',
    baseSalary: null,
    email: '',
    phone: '',
    startDate: '',
});
const empFormErrors = reactive({ name: '', role: '', baseSalary: '' });
const empSaving = ref(false);

const openAddDialog = () => {
    empDialogMode.value = 'add';
    Object.assign(empForm, { id: null, name: '', role: '', department: '', baseSalary: null, email: '', phone: '', startDate: '' });
    Object.assign(empFormErrors, { name: '', role: '', baseSalary: '' });
    empDialogVisible.value = true;
};

const openEditDialog = (employee) => {
    empDialogMode.value = 'edit';
    Object.assign(empForm, {
        id: employee.id,
        name: employee.name,
        role: employee.role,
        department: employee.department || employee.role,
        baseSalary: employee.baseSalary,
        email: employee.email || '',
        phone: employee.phone || '',
        startDate: employee.startDate || '',
    });
    Object.assign(empFormErrors, { name: '', role: '', baseSalary: '' });
    empDialogVisible.value = true;
};

const validateEmpForm = () => {
    let valid = true;
    empFormErrors.name = '';
    empFormErrors.role = '';
    empFormErrors.baseSalary = '';

    if (!empForm.name.trim() || empForm.name.trim().length < 2) {
        empFormErrors.name = 'Name must be at least 2 characters.';
        valid = false;
    }
    if (!empForm.role) {
        empFormErrors.role = 'Role is required.';
        valid = false;
    }
    if (!empForm.baseSalary || empForm.baseSalary < 100) {
        empFormErrors.baseSalary = 'Salary must be at least $100.';
        valid = false;
    }
    return valid;
};

const saveEmployee = async () => {
    if (!validateEmpForm()) return;
    empSaving.value = true;

    try {
        if (empDialogMode.value === 'add') {
            const result = await store.addEmployee({ ...empForm });
            if (result.success) {
                toast.add({ severity: 'success', summary: 'Employee Added', detail: `${empForm.name} has been added successfully.`, life: 3000 });
                empDialogVisible.value = false;
            } else {
                toast.add({ severity: 'error', summary: 'Error', detail: result.error || 'Failed to add employee.', life: 4000 });
            }
        } else {
            const result = await store.updateEmployee(empForm.id, { ...empForm });
            if (result.success) {
                toast.add({ severity: 'success', summary: 'Employee Updated', detail: `${empForm.name} has been updated.`, life: 3000 });
                empDialogVisible.value = false;
            } else {
                toast.add({ severity: 'error', summary: 'Error', detail: result.error || 'Failed to update employee.', life: 4000 });
            }
        }
    } finally {
        empSaving.value = false;
    }
};

// ── Delete ────────────────────────────────────────────────────────────────────
const confirmDelete = (employee) => {
    confirm.require({
        message: `Are you sure you want to delete ${employee.name}? This action cannot be undone.`,
        header: 'Delete Employee',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger',
        acceptLabel: 'Delete',
        rejectLabel: 'Cancel',
        accept: async () => {
            const result = await store.deleteEmployee(employee.id);
            if (result.success) {
                toast.add({ severity: 'success', summary: 'Deleted', detail: `${employee.name} has been removed.`, life: 3000 });
            } else {
                toast.add({ severity: 'error', summary: 'Error', detail: result.error || 'Failed to delete employee.', life: 4000 });
            }
        },
    });
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatCurrency = (value) => {
    return (value || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

const getSalaryDetails = (employee) => {
    return store.calculateSalary(employee);
};
</script>

<template>
    <div class="flex justify-content-between align-items-center mb-4">
        <div>
            <h2 class="text-3xl font-bold text-800 mb-1">Employee Management</h2>
            <p class="text-600">Manage employee information and track their performance</p>
        </div>
        <Button icon="pi pi-plus" label="Add Employee" @click="openAddDialog" class="shadow-2" />
    </div>

    <div class="card glass border-0 shadow-none">
        <Toast />
        <ConfirmDialog />

        <div class="overflow-x-auto">
            <DataTable
                :value="store.filteredEmployees"
                :loading="store.loading"
                paginator
                :rows="20"
                :rowsPerPageOptions="[10, 20, 50]"
                tableStyle="min-width: 55rem"
                rowHover
            >
                <Column field="id" header="ID" sortable style="width: 4rem"></Column>

                <Column field="name" header="Employee" sortable>
                    <template #body="slotProps">
                        <div class="flex align-items-center gap-3">
                            <Avatar
                                :label="slotProps.data.name.charAt(0)"
                                shape="circle"
                                size="large"
                                class="bg-blue-100 text-blue-700 font-bold flex-shrink-0"
                            />
                            <div class="flex flex-column">
                                <span class="font-bold">{{ slotProps.data.name }}</span>
                                <span class="text-sm text-500">{{ slotProps.data.role }}</span>
                                <span v-if="slotProps.data.email" class="text-xs text-400">{{ slotProps.data.email }}</span>
                            </div>
                        </div>
                    </template>
                </Column>

                <Column header="Salary Info">
                    <template #body="slotProps">
                        <div class="flex flex-column">
                            <span>Base: {{ formatCurrency(getSalaryDetails(slotProps.data).base) }}</span>
                            <span class="text-red-500" v-if="getSalaryDetails(slotProps.data).deduction > 0">
                                Deduction: -{{ formatCurrency(getSalaryDetails(slotProps.data).deduction) }}
                            </span>
                            <span class="font-bold">Net: {{ formatCurrency(getSalaryDetails(slotProps.data).final) }}</span>
                        </div>
                    </template>
                </Column>

                <Column header="Attendance">
                    <template #body="slotProps">
                        <div class="flex gap-2 flex-wrap">
                            <Tag severity="danger" :value="`Absent: ${getSalaryDetails(slotProps.data).absentDays}`" />
                        </div>
                    </template>
                </Column>

                <Column header="Actions" style="width: 14rem">
                    <template #body="slotProps">
                        <div class="flex gap-1 flex-wrap">
                            <Button
                                icon="pi pi-pencil"
                                size="small"
                                severity="info"
                                text
                                rounded
                                title="Edit"
                                @click="openEditDialog(slotProps.data)"
                            />
                            <Button
                                icon="pi pi-calendar-plus"
                                size="small"
                                severity="warning"
                                text
                                rounded
                                title="Mark Leave"
                                @click="openLeaveDialog(slotProps.data)"
                            />
                            <Button
                                icon="pi pi-trash"
                                size="small"
                                severity="danger"
                                text
                                rounded
                                title="Delete"
                                @click="confirmDelete(slotProps.data)"
                            />
                        </div>
                    </template>
                </Column>
            </DataTable>
        </div>

        <!-- ── Mark Leave Dialog ───────────────────────────────────────────── -->
        <Dialog
            v-model:visible="leaveDialogVisible"
            modal
            header="Mark Leave"
            :breakpoints="{ '960px': '75vw', '640px': '90vw' }"
            :style="{ width: '25rem' }"
        >
            <div class="flex align-items-center gap-3 mb-3">
                <label for="leavedate" class="font-semibold w-6rem">Date</label>
                <Calendar id="leavedate" v-model="leaveDate" dateFormat="dd/mm/yy" class="flex-auto" showIcon />
            </div>
            <div class="flex justify-content-end gap-2">
                <Button label="Cancel" severity="secondary" @click="leaveDialogVisible = false" />
                <Button label="Save" @click="saveLeave" />
            </div>
        </Dialog>

        <!-- ── Add / Edit Employee Dialog ────────────────────────────────────── -->
        <Dialog
            v-model:visible="empDialogVisible"
            modal
            :header="empDialogMode === 'add' ? 'Add New Employee' : 'Edit Employee'"
            :style="{ width: '36rem' }"
            :breakpoints="{ '960px': '80vw', '640px': '95vw' }"
        >
            <div class="grid formgrid p-fluid">
                <div class="field col-12 md:col-6 mb-3">
                    <label class="font-medium mb-1 block">Full Name *</label>
                    <InputText v-model="empForm.name" :class="{ 'p-invalid': empFormErrors.name }" placeholder="John Smith" maxlength="80" />
                    <small v-if="empFormErrors.name" class="p-error">{{ empFormErrors.name }}</small>
                </div>
                <div class="field col-12 md:col-6 mb-3">
                    <label class="font-medium mb-1 block">Role *</label>
                    <Dropdown
                        v-model="empForm.role"
                        :options="ROLE_OPTIONS"
                        placeholder="Select a role"
                        :class="{ 'p-invalid': empFormErrors.role }"
                        class="w-full"
                        editable
                    />
                    <small v-if="empFormErrors.role" class="p-error">{{ empFormErrors.role }}</small>
                </div>
                <div class="field col-12 md:col-6 mb-3">
                    <label class="font-medium mb-1 block">Department</label>
                    <InputText v-model="empForm.department" placeholder="e.g. Engineering" maxlength="60" />
                </div>
                <div class="field col-12 md:col-6 mb-3">
                    <label class="font-medium mb-1 block">Base Salary (USD) *</label>
                    <InputNumber
                        v-model="empForm.baseSalary"
                        mode="currency"
                        currency="USD"
                        locale="en-US"
                        :min="100"
                        :max="500000"
                        :class="{ 'p-invalid': empFormErrors.baseSalary }"
                        class="w-full"
                    />
                    <small v-if="empFormErrors.baseSalary" class="p-error">{{ empFormErrors.baseSalary }}</small>
                </div>
                <div class="field col-12 md:col-6 mb-3">
                    <label class="font-medium mb-1 block">Email</label>
                    <InputText v-model="empForm.email" type="email" placeholder="john@company.com" maxlength="100" />
                </div>
                <div class="field col-12 md:col-6 mb-3">
                    <label class="font-medium mb-1 block">Phone</label>
                    <InputText v-model="empForm.phone" placeholder="+1 (555) 000-0000" maxlength="20" />
                </div>
                <div class="field col-12 mb-3">
                    <label class="font-medium mb-1 block">Start Date</label>
                    <InputText v-model="empForm.startDate" type="date" class="w-full" />
                </div>
            </div>

            <div class="flex justify-content-end gap-2 mt-2">
                <Button label="Cancel" severity="secondary" text @click="empDialogVisible = false" />
                <Button
                    :label="empDialogMode === 'add' ? 'Add Employee' : 'Save Changes'"
                    :icon="empDialogMode === 'add' ? 'pi pi-plus' : 'pi pi-check'"
                    :loading="empSaving"
                    @click="saveEmployee"
                />
            </div>
        </Dialog>
    </div>
</template>
