<script setup>
import { onMounted, ref } from 'vue';
import { useEmployeeStore } from '../stores/employeeStore';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Calendar from 'primevue/calendar';
import Tag from 'primevue/tag';
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

const openLeaveDialog = (employee) => {
    selectedEmployee.value = employee;
    leaveDialogVisible.value = true;
};

const saveLeave = () => {
    if (selectedEmployee.value && leaveDate.value) {
        // Assuming leaveDate is a Date object, we need the day of month for our simplified logic
        const day = leaveDate.value.getDate();
        store.markLeave(selectedEmployee.value.id, day);
        toast.add({ severity: 'success', summary: 'Success', detail: `Leave marked for ${selectedEmployee.value.name}`, life: 3000 });
        leaveDialogVisible.value = false;
        leaveDate.value = null;
    }
};

const formatCurrency = (value) => {
    return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

const getSalaryDetails = (employee) => {
    return store.calculateSalary(employee);
};
</script>

<template>
    <div class="card">
        <Toast />
        <h2 class="mb-4">Employee Management</h2>
        
        <div class="overflow-x-auto">
            <DataTable :value="store.filteredEmployees" paginator :rows="20" :rowsPerPageOptions="[10, 20, 50]" tableStyle="min-width: 50rem">
                <Column field="id" header="ID" sortable></Column>
                <Column field="name" header="Name" sortable></Column>
                <Column field="role" header="Role" sortable></Column>
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
                        <div class="flex gap-2">
                            <Tag severity="success" :value="`Present: ${30 - getSalaryDetails(slotProps.data).absentDays}`" />
                            <Tag severity="danger" :value="`Absent: ${getSalaryDetails(slotProps.data).absentDays}`" />
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
            <div class="flex align-items-center gap-3 mb-3">
                <label for="leavedate" class="font-semibold w-6rem">Date</label>
                <Calendar id="leavedate" v-model="leaveDate" dateFormat="dd/mm/yy" class="flex-auto" />
            </div>
            <div class="flex justify-content-end gap-2">
                <Button type="button" label="Cancel" severity="secondary" @click="leaveDialogVisible = false"></Button>
                <Button type="button" label="Save" @click="saveLeave"></Button>
            </div>
        </Dialog>
    </div>
</template>
