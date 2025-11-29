<script setup>
import { ref, onMounted, computed } from 'vue';
import { useEmployeeStore } from '../stores/employeeStore';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Calendar from 'primevue/calendar';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Avatar from 'primevue/avatar';

const store = useEmployeeStore();
const selectedDate = ref(new Date()); // Default to today
// Ensure we default to a valid day in our mock range (1-30) if today is > 30
if (selectedDate.value.getDate() > 30) {
    selectedDate.value.setDate(1);
}

// Derived day number for store lookup (1-30)
const selectedDay = computed(() => {
    return selectedDate.value ? selectedDate.value.getDate() : 1;
});

onMounted(async () => {
    await store.generateEmployees();
});

const getSeverity = (status) => {
    switch (status) {
        case 'Present':
            return 'success';
        case 'Absent':
            return 'danger';
        case 'Leave':
            return 'warning';
        default:
            return 'info';
    }
};
</script>

<template>
    <div class="flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center mb-4 gap-3">
        <div>
            <h2 class="text-3xl font-bold text-800 mb-1">Attendance</h2>
            <p class="text-600">Track employee daily attendance</p>
        </div>
        <div class="flex align-items-center gap-3 w-full md:w-auto">
            <label class="font-medium text-700 white-space-nowrap">Select Date:</label>
            <Calendar v-model="selectedDate" dateFormat="dd/mm/yy" showIcon class="w-full md:w-16rem" :maxDate="new Date()" />
        </div>
    </div>

    <div class="card glass border-0 shadow-none">

        <div class="overflow-x-auto">
            <DataTable :value="store.filteredEmployees" :loading="store.loading" paginator :rows="10" 
                tableStyle="min-width: 50rem"
                class="p-datatable-lg"
                rowHover>
                <Column field="name" header="Employee">
                    <template #body="slotProps">
                        <div class="flex align-items-center gap-3">
                            <Avatar :label="slotProps.data.name.charAt(0)" shape="circle" size="large" 
                                class="bg-primary-100 text-primary-700 font-bold" />
                            <div class="flex flex-column">
                                <span class="font-bold text-lg">{{ slotProps.data.name }}</span>
                                <span class="text-sm text-500">{{ slotProps.data.role }}</span>
                            </div>
                        </div>
                    </template>
                </Column>
                
                <Column header="Status">
                    <template #body="slotProps">
                        <Tag :value="slotProps.data.attendance[selectedDay]?.status || 'Unknown'" 
                            :severity="getSeverity(slotProps.data.attendance[selectedDay]?.status)"
                            class="px-3 py-2 text-sm uppercase" 
                            rounded />
                    </template>
                </Column>
    
                <Column header="Check In">
                    <template #body="slotProps">
                        <div v-if="slotProps.data.attendance[selectedDay]?.inTime" class="flex align-items-center gap-2 text-700">
                            <i class="pi pi-clock text-primary"></i>
                            <span class="font-mono">{{ slotProps.data.attendance[selectedDay]?.inTime }}</span>
                        </div>
                        <span v-else class="text-400">-</span>
                    </template>
                </Column>
    
                <Column header="Check Out">
                    <template #body="slotProps">
                        <div v-if="slotProps.data.attendance[selectedDay]?.outTime" class="flex align-items-center gap-2 text-700">
                            <i class="pi pi-clock text-orange-500"></i>
                            <span class="font-mono">{{ slotProps.data.attendance[selectedDay]?.outTime }}</span>
                        </div>
                        <span v-else class="text-400">-</span>
                    </template>
                </Column>
                
                <Column header="Actions">
                    <template #body="slotProps">
                         <Button v-if="slotProps.data.attendance[selectedDay]?.status === 'Absent'" 
                            icon="pi pi-calendar-plus" 
                            label="Mark Leave" 
                            text severity="warning" 
                            @click="store.markLeave(slotProps.data.id, selectedDay)" />
                    </template>
                </Column>
            </DataTable>
        </div>
    </div>
</template>
