<script setup>
import { onMounted, computed, ref } from 'vue';
import { useEmployeeStore } from '../stores/employeeStore';
import { ATTENDANCE_STATUS } from '../constants';
import Card from 'primevue/card';
import Chart from 'primevue/chart';
import Avatar from 'primevue/avatar';
import Tag from 'primevue/tag';

const store = useEmployeeStore();

onMounted(async () => {
    await store.generateEmployees();
});

const totalEmployees = computed(() => store.filteredEmployees.length);

const todayStats = computed(() => {
    const today = 1; // Simplified for demo
    let present = 0;
    let leave = 0;
    
    // Single pass through the array for O(n) complexity
    store.filteredEmployees.forEach(e => {
        const status = e.attendance[today]?.status;
        if (status === ATTENDANCE_STATUS.PRESENT) {
            present++;
        } else if (status === ATTENDANCE_STATUS.LEAVE) {
            leave++;
        }
    });

    return {
        present,
        leave,
        absent: totalEmployees.value - present - leave
    };
});

const presentToday = computed(() => todayStats.value.present);
const onLeaveToday = computed(() => todayStats.value.leave);

const presentEmployeesList = computed(() => {
    const today = 1;
    return store.filteredEmployees.filter(e => e.attendance[today]?.status === ATTENDANCE_STATUS.PRESENT);
});

const chartData = computed(() => {
    return {
        labels: ['Present', 'Absent', 'Leave'],
        datasets: [
            {
                data: [todayStats.value.present, todayStats.value.absent, todayStats.value.leave],
                backgroundColor: ['#4CAF50', '#FF5252', '#FFC107'],
                hoverBackgroundColor: ['#66BB6A', '#FF8A80', '#FFD54F']
            }
        ]
    };
});

const chartOptions = ref({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'bottom',
            labels: {
                usePointStyle: true
            }
        }
    }
});
</script>

<template>
    <div class="grid">
        <div class="col-12 lg:col-4 animation-duration-500 animation-ease-out fadeinup">
            <Card class="mb-0">
                <template #title>Total Employees</template>
                <template #content>
                    <div class="text-900 font-medium text-3xl">{{ totalEmployees }}</div>
                </template>
            </Card>
        </div>
        <div class="col-12 lg:col-4 animation-duration-500 animation-ease-out fadeinup" style="animation-delay: 0.1s">
            <Card class="mb-0">
                <template #title>Present Today</template>
                <template #content>
                    <div class="text-900 font-medium text-3xl text-green-500">{{ presentToday }}</div>
                </template>
            </Card>
        </div>
        <div class="col-12 lg:col-4 animation-duration-500 animation-ease-out fadeinup" style="animation-delay: 0.2s">
            <Card class="mb-0">
                <template #title>On Leave</template>
                <template #content>
                    <div class="text-900 font-medium text-3xl text-yellow-500">{{ onLeaveToday }}</div>
                </template>
            </Card>
        </div>

        <div class="col-12 lg:col-6 animation-duration-500 animation-ease-out fadeinup" style="animation-delay: 0.3s">
            <Card class="h-full">
                <template #title>Attendance Overview</template>
                <template #content>
                    <div class="flex justify-content-center h-20rem">
                        <Chart type="doughnut" :data="chartData" :options="chartOptions" class="w-full h-full" />
                    </div>
                </template>
            </Card>
        </div>

        <div class="col-12 lg:col-6 animation-duration-500 animation-ease-out fadeinup" style="animation-delay: 0.4s">
            <Card class="h-full">
                <template #title>Today's Attendance</template>
                <template #content>
                    <ul class="list-none p-0 m-0 overflow-y-auto" style="max-height: 20rem">
                        <li v-for="employee in presentEmployeesList" :key="employee.id" class="flex align-items-center py-3 border-bottom-1 surface-border">
                            <Avatar :label="employee.name.charAt(0)" shape="circle" class="mr-3 bg-green-100 text-green-700 font-bold" />
                            <div class="flex-1">
                                <div class="font-bold mb-1">{{ employee.name }}</div>
                                <div class="text-sm text-600">{{ employee.role }}</div>
                            </div>
                            <div class="flex align-items-center text-700">
                                <i class="pi pi-clock mr-2 text-primary"></i>
                                <span class="font-medium">{{ employee.attendance[1].inTime }}</span>
                            </div>
                        </li>
                    </ul>
                </template>
            </Card>
        </div>
    </div>
</template>

<style scoped>
@keyframes fadeinup {
    0% {
        opacity: 0;
        transform: translateY(20px);
    }
    100% {
        opacity: 1;
        transform: translateY(0);
    }
}
.fadeinup {
    animation-name: fadeinup;
    animation-fill-mode: both;
}
</style>

