<script setup>
import { ref, onMounted, computed } from 'vue';
import { useEmployeeStore } from '../stores/employeeStore';
import { ATTENDANCE_STATUS } from '../constants';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Calendar from 'primevue/calendar';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Avatar from 'primevue/avatar';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';

const store = useEmployeeStore();
const toast = useToast();
const markingLeave = ref(null); // tracks which employee row is loading

const selectedDate = ref(new Date());

// Clamp selected day to valid range for the current month's data
const selectedDay = computed(() => {
    if (!selectedDate.value) return 1;
    const day = selectedDate.value.getDate();
    return Math.min(day, store.currentMonthDays);
});

onMounted(async () => {
    await store.generateEmployees();
});

const getSeverity = (status) => {
    switch (status) {
        case ATTENDANCE_STATUS.PRESENT: return 'success';
        case ATTENDANCE_STATUS.ABSENT:  return 'danger';
        case ATTENDANCE_STATUS.LEAVE:   return 'warning';
        default:                         return 'info';
    }
};

const handleMarkLeave = async (employee) => {
    markingLeave.value = employee.id;
    await store.markLeave(employee.id, selectedDay.value);
    toast.add({ severity: 'success', summary: 'Leave Marked', detail: `${employee.name} marked as on leave.`, life: 3000 });
    markingLeave.value = null;
};
</script>

<template>
    <Toast />
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
                        <Tag
                            :value="slotProps.data.attendance[selectedDay]?.status || 'Unknown'"
                            :severity="getSeverity(slotProps.data.attendance[selectedDay]?.status)"
                            class="px-3 py-2 text-sm uppercase"
                            rounded
                        />
                    </template>
                </Column>

                <Column header="Check In">
                    <template #body="slotProps">
                        <div v-if="slotProps.data.attendance[selectedDay]?.inTime" class="flex align-items-center gap-2 text-700">
                            <i class="pi pi-clock text-primary"></i>
                            <span class="font-mono">{{ slotProps.data.attendance[selectedDay].inTime }}</span>
                        </div>
                        <span v-else class="text-400">-</span>
                    </template>
                </Column>

                <Column header="Check Out">
                    <template #body="slotProps">
                        <div v-if="slotProps.data.attendance[selectedDay]?.outTime" class="flex align-items-center gap-2 text-700">
                            <i class="pi pi-clock text-orange-500"></i>
                            <span class="font-mono">{{ slotProps.data.attendance[selectedDay].outTime }}</span>
                        </div>
                        <span v-else class="text-400">-</span>
                    </template>
                </Column>

                <Column header="Actions">
                    <template #body="slotProps">
                        <Button
                            v-if="slotProps.data.attendance[selectedDay]?.status === ATTENDANCE_STATUS.ABSENT"
                            icon="pi pi-calendar-plus"
                            label="Mark Leave"
                            text
                            severity="warning"
                            :loading="markingLeave === slotProps.data.id"
                            @click="handleMarkLeave(slotProps.data)"
                        />
                    </template>
                </Column>
            </DataTable>
        </div>
    </div>
</template>
