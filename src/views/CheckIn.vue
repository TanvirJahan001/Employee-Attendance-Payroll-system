<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { getAuth } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useEmployeeStore } from '../stores/employeeStore';
import { useAuthStore } from '../stores/authStore';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Card from 'primevue/card';
import Toast from 'primevue/toast';
import Avatar from 'primevue/avatar';

const store = useEmployeeStore();
const authStore = useAuthStore();
const toast = useToast();

const today = store.toDateKey(new Date());
const now = ref(new Date());
let clockInterval = null;

// The employee record linked to the current user's uid
// Stored in Firestore users/{uid} as employeeId field (set by admin)
const linkedEmployeeId = ref(null);
const loadingEmployee = ref(true);
const checkingIn = ref(false);
const checkingOut = ref(false);

// Live clock
onMounted(async () => {
    clockInterval = setInterval(() => { now.value = new Date(); }, 1000);

    // Load employees
    await store.loadEmployees();
    await store.loadAttendanceForDate(today);

    // Resolve which employee record belongs to this user
    const user = getAuth().currentUser;
    if (user) {
        try {
            const snap = await getDoc(doc(db, 'users', user.uid));
            if (snap.exists() && snap.data().employeeId) {
                linkedEmployeeId.value = snap.data().employeeId;
            } else {
                // Fallback: match by display name (for demo purposes)
                const matched = store.employees.find(
                    e => e.name.toLowerCase() === (user.displayName || '').toLowerCase()
                );
                if (matched) linkedEmployeeId.value = matched.id;
            }
        } catch (err) {
            console.error('[CheckIn] failed to load user mapping', err);
        }
    }
    loadingEmployee.value = false;
});

onUnmounted(() => {
    if (clockInterval) clearInterval(clockInterval);
});

// ── computed ──────────────────────────────────────────────────────────────────

const employee = computed(() =>
    linkedEmployeeId.value != null
        ? store.employees.find(e => e.id === linkedEmployeeId.value)
        : null
);

const todayRecord = computed(() =>
    linkedEmployeeId.value != null
        ? store.getAttendance(linkedEmployeeId.value, today)
        : { status: 'Absent', inTime: null, outTime: null }
);

const isCheckedIn  = computed(() => !!todayRecord.value?.inTime);
const isCheckedOut = computed(() => !!todayRecord.value?.outTime);

const formattedTime = computed(() => {
    return now.value.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
});

const formattedDate = computed(() => {
    return now.value.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
});

// ── actions ───────────────────────────────────────────────────────────────────

const handleCheckIn = async () => {
    if (!linkedEmployeeId.value) return;
    checkingIn.value = true;
    const result = await store.checkIn(linkedEmployeeId.value, today);
    if (result.success) {
        toast.add({ severity: 'success', summary: 'Checked In!', detail: `Welcome! You checked in at ${todayRecord.value.inTime}.`, life: 4000 });
    } else {
        toast.add({ severity: 'warn', summary: 'Notice', detail: result.error || 'Check-in failed.', life: 4000 });
    }
    checkingIn.value = false;
};

const handleCheckOut = async () => {
    if (!linkedEmployeeId.value) return;
    checkingOut.value = true;
    const result = await store.checkOut(linkedEmployeeId.value, today);
    if (result.success) {
        toast.add({ severity: 'info', summary: 'Checked Out', detail: `See you tomorrow! You checked out at ${todayRecord.value.outTime}.`, life: 4000 });
    } else {
        toast.add({ severity: 'warn', summary: 'Notice', detail: result.error || 'Check-out failed.', life: 4000 });
    }
    checkingOut.value = false;
};

const statusSeverity = computed(() => {
    if (isCheckedOut.value) return 'secondary';
    if (isCheckedIn.value) return 'success';
    return 'danger';
});

const statusLabel = computed(() => {
    if (isCheckedOut.value) return 'Checked Out';
    if (isCheckedIn.value) return 'Checked In';
    return 'Not Checked In';
});
</script>

<template>
    <Toast />

    <div class="mb-4">
        <h2 class="text-3xl font-bold text-800 mb-1">My Attendance</h2>
        <p class="text-600">Record your daily check-in and check-out</p>
    </div>

    <div class="grid">
        <!-- Live clock card -->
        <div class="col-12 lg:col-5">
            <div class="glass p-5 text-center h-full flex flex-column justify-content-center align-items-center">
                <div class="text-500 text-lg mb-2">{{ formattedDate }}</div>
                <div class="text-900 font-bold mb-4" style="font-size: 3.5rem; font-variant-numeric: tabular-nums; letter-spacing: -2px;">
                    {{ formattedTime }}
                </div>

                <Tag :value="statusLabel" :severity="statusSeverity" class="text-base px-4 py-2 mb-5" rounded />

                <!-- Check-in / Check-out buttons -->
                <div class="flex gap-3">
                    <Button
                        v-if="!isCheckedIn"
                        label="Check In"
                        icon="pi pi-sign-in"
                        size="large"
                        class="px-5 py-3 text-lg font-bold shadow-4"
                        :loading="checkingIn"
                        :disabled="loadingEmployee || !employee"
                        @click="handleCheckIn"
                    />
                    <Button
                        v-else-if="!isCheckedOut"
                        label="Check Out"
                        icon="pi pi-sign-out"
                        size="large"
                        severity="warning"
                        class="px-5 py-3 text-lg font-bold shadow-4"
                        :loading="checkingOut"
                        @click="handleCheckOut"
                    />
                    <div v-else class="text-center">
                        <i class="pi pi-check-circle text-green-500 text-5xl mb-2 block"></i>
                        <p class="text-600 text-sm">You're done for the day!<br>See you tomorrow.</p>
                    </div>
                </div>

                <!-- No employee linked warning -->
                <div v-if="!loadingEmployee && !employee" class="mt-4 p-3 border-round bg-yellow-50 border-1 border-yellow-200">
                    <i class="pi pi-exclamation-triangle text-yellow-600 mr-2"></i>
                    <span class="text-700 text-sm">Your account is not linked to an employee record. Please contact your administrator.</span>
                </div>
            </div>
        </div>

        <!-- Today's summary -->
        <div class="col-12 lg:col-7">
            <div class="glass p-5 h-full">
                <h3 class="text-900 font-bold mb-4 flex align-items-center">
                    <i class="pi pi-calendar mr-2 text-primary"></i>
                    Today's Summary
                </h3>

                <div v-if="loadingEmployee" class="text-center py-5">
                    <i class="pi pi-spin pi-spinner text-4xl text-primary mb-3 block"></i>
                    <p class="text-500">Loading your attendance data…</p>
                </div>

                <template v-else-if="employee">
                    <!-- Employee info -->
                    <div class="flex align-items-center gap-3 mb-5 p-3 border-round surface-100">
                        <Avatar
                            :label="employee.name.charAt(0)"
                            shape="circle"
                            size="large"
                            class="bg-primary-100 text-primary-700 font-bold flex-shrink-0"
                        />
                        <div>
                            <div class="font-bold text-lg">{{ employee.name }}</div>
                            <div class="text-500">{{ employee.role }}</div>
                        </div>
                    </div>

                    <!-- Time records -->
                    <div class="grid">
                        <div class="col-6">
                            <Card class="text-center">
                                <template #title>
                                    <span class="text-sm text-500 font-normal">Check-In Time</span>
                                </template>
                                <template #content>
                                    <div class="text-2xl font-bold text-green-600">
                                        {{ todayRecord.inTime || '—' }}
                                    </div>
                                </template>
                            </Card>
                        </div>
                        <div class="col-6">
                            <Card class="text-center">
                                <template #title>
                                    <span class="text-sm text-500 font-normal">Check-Out Time</span>
                                </template>
                                <template #content>
                                    <div class="text-2xl font-bold text-orange-500">
                                        {{ todayRecord.outTime || '—' }}
                                    </div>
                                </template>
                            </Card>
                        </div>
                    </div>

                    <!-- Hours worked -->
                    <div v-if="isCheckedIn && isCheckedOut" class="mt-3 p-3 border-round bg-green-50 border-1 border-green-200 text-center">
                        <i class="pi pi-clock text-green-600 mr-2"></i>
                        <span class="font-semibold text-green-800">
                            Hours worked today:
                            {{
                                (() => {
                                    const [ih, im] = todayRecord.inTime.split(':').map(Number);
                                    const [oh, om] = todayRecord.outTime.split(':').map(Number);
                                    const mins = (oh * 60 + om) - (ih * 60 + im);
                                    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
                                })()
                            }}
                        </span>
                    </div>

                    <p class="text-500 text-xs mt-4 text-center">
                        Attendance is recorded in real-time to Firestore.
                    </p>
                </template>

                <div v-else class="text-center py-5 text-500">
                    <i class="pi pi-user-plus text-4xl mb-3 block text-300"></i>
                    No employee record linked to your account yet.
                </div>
            </div>
        </div>
    </div>
</template>
