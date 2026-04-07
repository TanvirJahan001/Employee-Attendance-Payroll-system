<script setup>
import { onMounted, ref } from 'vue';
import { useEmployeeStore } from '../stores/employeeStore';
import { ATTENDANCE_STATUS } from '../constants';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Calendar from 'primevue/calendar';
import Tag from 'primevue/tag';
import Avatar from 'primevue/avatar';
import { useToast } from 'primevue/usetoast';
import Toast from 'primevue/toast';

const store = useEmployeeStore();
const toast = useToast();

onMounted(async () => {
    await store.generateEmployees();
});

const leaveDialogVisible = ref(false);
const selectedEmployee = ref(null);
const leaveDate = ref(null);
const savingLeave = ref(false);

const openLeaveDialog = (employee) => {
    selectedEmployee.value = employee;
    leaveDate.value = null;
    leaveDialogVisible.value = true;
};

const saveLeave = async () => {
    if (!selectedEmployee.value || !leaveDate.value) return;

    const day = leaveDate.value.getDate();
    // Clamp to valid month range
    const clampedDay = Math.min(day, store.currentMonthDays);

    savingLeave.value = true;
    await store.markLeave(selectedEmployee.value.id, clampedDay);
    toast.add({ severity: 'success', summary: 'Leave Marked', detail: `Leave marked for ${selectedEmployee.value.name}`, life: 3000 });
    leaveDialogVisible.value = false;
    leaveDate.value = null;
    savingLeave.value = false;
};

const formatCurrency = (value) => {
    return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

const getSalaryDetails = (employee) => {
    return store.calculateSalary(employee);
};

// Correctly count present days: total days - absent - leave
const getPresentDays = (employee) => {
    const { absentDays } = getSalaryDetails(employee);
    const leaveDays = employee.leaves.length;
    return store.currentMonthDays - absentDays - leaveDays;
};
</script>

<template>
    <div class="mb-4">
        <h2 class="text-3xl font-bold text-800 mb-1">Employee Management</h2>
        <p class="text-600">Manage employee information and track their performance</p>
    </div>

    <div class="card glass border-0 shadow-none">
        <Toast />

        <div class="overflow-x-auto">
            <DataTable :value="store.filteredEmployees" paginator :rows="20" :rowsPerPageOptions="[10, 20, 50]" tableStyle="min-width: 50rem">
                <Column field="id" header="ID" sortable></Column>
                <Column field="name" header="Employee" sortable>
                    <template #body="slotProps">
                        <div class="flex align-items-center gap-3">
                            <Avatar :label="slotProps.data.name.charAt(0)" shape="circle" size="large" class="bg-blue-100 text-blue-700 font-bold" />
                            <div class="flex flex-column">
                                <span class="font-bold text-lg">{{ slotProps.data.name }}</span>
                                <span class="text-sm text-500">{{ slotProps.data.role }}</span>
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
                            <Tag severity="success" :value="`Present: ${getPresentDays(slotProps.data)}`" />
                            <Tag severity="danger" :value="`Absent: ${getSalaryDetails(slotProps.data).absentDays}`" />
                            <Tag v-if="slotProps.data.leaves.length" severity="warning" :value="`Leave: ${slotProps.data.leaves.length}`" />
                        </div>
                    </template>
                </Column>
                <Column header="Actions">
                    <template #body="slotProps">
                        <Button icon="pi pi-calendar-plus" label="Mark Leave" severity="warning" size="small" @click="openLeaveDialog(slotProps.data)" />
                    </template>
                </Column>
            </DataTable>
        </div>

        <Dialog v-model:visible="leaveDialogVisible" modal header="Mark Leave" :breakpoints="{ '960px': '75vw', '640px': '90vw' }" :style="{ width: '25rem' }">
            <p class="text-700 mb-3">Marking leave for: <strong>{{ selectedEmployee?.name }}</strong></p>
            <div class="flex align-items-center gap-3 mb-3">
                <label for="leavedate" class="font-semibold w-6rem">Date</label>
                <Calendar id="leavedate" v-model="leaveDate" dateFormat="dd/mm/yy" class="flex-auto" :maxDate="new Date()" showIcon />
            </div>
            <div class="flex justify-content-end gap-2">
                <Button type="button" label="Cancel" severity="secondary" @click="leaveDialogVisible = false" />
                <Button type="button" label="Save" :loading="savingLeave" :disabled="!leaveDate" @click="saveLeave" />
            </div>
        </Dialog>
    </div>
</template>
