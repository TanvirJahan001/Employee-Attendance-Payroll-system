<script setup>
import { onMounted, computed, ref } from 'vue';
import { useEmployeeStore } from '../stores/employeeStore';
import Card from 'primevue/card';
import Chart from 'primevue/chart';

const store = useEmployeeStore();

onMounted(async () => {
    await store.generateEmployees();
});

const totalEmployees = computed(() => store.filteredEmployees.length);

const presentToday = computed(() => {
    // Simplified: check day 1 for demo or random day
    // In real app, check today's date
    const today = 1; 
    return store.filteredEmployees.filter(e => e.attendance[today]?.status === 'Present').length;
});

const onLeaveToday = computed(() => {
    const today = 1;
    return store.filteredEmployees.filter(e => e.attendance[today]?.status === 'Leave').length;
});

const chartData = computed(() => {
    return {
        labels: ['Present', 'Absent', 'Leave'],
        datasets: [
            {
                data: [presentToday.value, totalEmployees.value - presentToday.value - onLeaveToday.value, onLeaveToday.value],
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
            <Card>
                <template #title>Attendance Overview</template>
                <template #content>
                    <div class="flex justify-content-center">
                        <Chart type="doughnut" :data="chartData" :options="chartOptions" class="w-full" style="max-width: 30rem" />
                    </div>
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

