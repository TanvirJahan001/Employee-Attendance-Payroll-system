<script setup>
import { onMounted } from 'vue';
import { useEmployeeStore } from '../stores/employeeStore';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import Avatar from 'primevue/avatar';

const store = useEmployeeStore();

onMounted(async () => {
    await store.generateEmployees();
});

const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
};
</script>

<template>
    <div class="mb-4">
        <h2 class="text-3xl font-bold text-800 mb-1">Payroll</h2>
        <p class="text-600">Monthly salary calculation and deductions</p>
    </div>

    <div class="card glass border-0 shadow-none">

        <div class="overflow-x-auto">
            <DataTable :value="store.filteredEmployees" :loading="store.loading" paginator :rows="10" 
                tableStyle="min-width: 60rem"
                class="p-datatable-lg"
                rowHover>
                <Column field="name" header="Employee">
                    <template #body="slotProps">
                        <div class="flex align-items-center gap-3">
                            <Avatar :label="slotProps.data.name.charAt(0)" shape="circle" size="large" 
                                class="bg-indigo-100 text-indigo-700 font-bold" />
                            <div class="flex flex-column">
                                <span class="font-bold text-lg">{{ slotProps.data.name }}</span>
                                <span class="text-sm text-500">{{ slotProps.data.role }}</span>
                            </div>
                        </div>
                    </template>
                </Column>
    
                <Column header="Base Salary">
                    <template #body="slotProps">
                        <span class="font-medium text-lg">{{ formatCurrency(slotProps.data.baseSalary) }}</span>
                    </template>
                </Column>
    
                <Column header="Absent Days" alignHeader="center" class="text-center">
                    <template #body="slotProps">
                        <div class="inline-flex align-items-center justify-content-center w-2rem h-2rem border-circle"
                            :class="store.calculateSalary(slotProps.data).absentDays > 3 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'">
                            {{ store.calculateSalary(slotProps.data).absentDays }}
                        </div>
                    </template>
                </Column>
    
                <Column header="Deduction">
                    <template #body="slotProps">
                        <span class="text-red-500 font-medium" v-if="store.calculateSalary(slotProps.data).deduction > 0">
                            - {{ formatCurrency(store.calculateSalary(slotProps.data).deduction) }}
                        </span>
                        <span v-else class="text-green-500">No Deduction</span>
                    </template>
                </Column>
    
                <Column header="Net Salary">
                    <template #body="slotProps">
                        <span class="text-xl font-bold text-primary">
                            {{ formatCurrency(store.calculateSalary(slotProps.data).final) }}
                        </span>
                    </template>
                </Column>
                
                <Column header="Status">
                     <template #body="slotProps">
                        <Tag value="Processed" severity="success" icon="pi pi-check" rounded></Tag>
                    </template>
                </Column>
            </DataTable>
        </div>
    </div>
</template>
