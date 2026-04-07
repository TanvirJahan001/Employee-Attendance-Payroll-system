<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useEmployeeStore } from '../stores/employeeStore';
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
const selectedDate = ref(new Date());
const loadingAttendance = ref(false);

// Derive the YYYY-MM-DD key for the selected date
const selectedDateKey = computed(() => store.toDateKey(selectedDate.value));

// Load employees + attendance whenever the date changes
const loadData = async () => {
    loadingAttendance.value = true;
    await store.loadEmployees();
    await store.loadAttendanceForDate(selectedDateKey.value);
    loadingAttendance.value = false;
};

onMounted(loadData);
watch(selectedDate, loadData);

// ── Helpers ───────────────────────────────────────────────────────────────────

const getRecord = (employee) => store.getAttendance(employee.id, selectedDateKey.value);

const getSeverity = (status) => {
    switch (status) {
        case 'Present': return 'success';
        case 'Absent':  return 'danger';
        case 'Leave':   return 'warning';
        default:        return 'info';
    }
};

const handleMarkLeave = async (employee) => {
    await store.markLeave(employee.id, selectedDateKey.value);
    toast.add({ severity: 'success', summary: 'Leave Marked', detail: `${employee.name} marked as on leave.`, life: 3000 });
};
</script>

<template>
    <div class="flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center mb-4 gap-3">
        <div>
            <h2 class="text-3xl font-bold text-800 mb-1">Attendance</h2>
            <p class="text-600">Track daily employee attendance — real-time from Firestore</p>
        </div>
        <div class="flex align-items-center gap-3 w-full md:w-auto">
            <label class="font-medium text-700 white-space-nowrap">Select Date:</label>
            <Calendar v-model="selectedDate" dateFormat="dd/mm/yy" showIcon class="w-full md:w-16rem" :maxDate="new Date()" />
        </div>
    </div>

    <Toast />

    <div class="card glass border-0 shadow-none">
        <div class="overflow-x-auto">
            <DataTable
                :value="store.filteredEmployees"
                :loading="store.loading || loadingAttendance"
                paginator
                :rows="10"
                tableStyle="min-width: 50rem"
                class="p-datatable-lg"
                rowHover
            >
                <Column field="name" header="Employee">
                    <template #body="slotProps">
                        <div class="flex align-items-center gap-3">
                            <Avatar
                                :label="slotProps.data.name.charAt(0)"
                                shape="circle"
                                size="large"
                                class="bg-primary-100 text-primary-700 font-bold"
                            />
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
                            :value="getRecord(slotProps.data).status"
                            :severity="getSeverity(getRecord(slotProps.data).status)"
                            class="px-3 py-2 text-sm uppercase"
                            rounded
                        />
                    </template>
                </Column>

                <Column header="Check In">
                    <template #body="slotProps">
                        <div v-if="getRecord(slotProps.data).inTime" class="flex align-items-center gap-2 text-700">
                            <i class="pi pi-clock text-primary"></i>
                            <span class="font-mono">{{ getRecord(slotProps.data).inTime }}</span>
                        </div>
                        <span v-else class="text-400">—</span>
                    </template>
                </Column>

                <Column header="Check Out">
                    <template #body="slotProps">
                        <div v-if="getRecord(slotProps.data).outTime" class="flex align-items-center gap-2 text-700">
                            <i class="pi pi-clock text-orange-500"></i>
                            <span class="font-mono">{{ getRecord(slotProps.data).outTime }}</span>
                        </div>
                        <span v-else class="text-400">—</span>
                    </template>
                </Column>

                <Column header="Actions">
                    <template #body="slotProps">
                        <Button
                            v-if="getRecord(slotProps.data).status === 'Absent'"
                            icon="pi pi-calendar-plus"
                            label="Mark Leave"
                            text
                            severity="warning"
                            @click="handleMarkLeave(slotProps.data)"
                        />
                    </template>
                </Column>
            </DataTable>
        </div>
    </div>
</template>
