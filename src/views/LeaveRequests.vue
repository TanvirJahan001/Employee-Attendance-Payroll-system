<script setup>
import { ref, computed, onMounted, reactive } from 'vue';
import { getAuth } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useLeaveStore, LEAVE_TYPES, LEAVE_STATUS } from '../stores/leaveStore';
import { useEmployeeStore } from '../stores/employeeStore';
import { useAuthStore } from '../stores/authStore';
import { useToast } from 'primevue/usetoast';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Tag from 'primevue/tag';
import Toast from 'primevue/toast';
import Avatar from 'primevue/avatar';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';

const leaveStore   = useLeaveStore();
const empStore     = useEmployeeStore();
const authStore    = useAuthStore();
const toast        = useToast();

// Linked employee ID for the current logged-in user
const myEmployeeId   = ref(null);
const myEmployeeName = ref('');
const loadingMe      = ref(true);

onMounted(async () => {
    await empStore.loadEmployees();
    await leaveStore.loadRequests();

    const user = getAuth().currentUser;
    if (user) {
        try {
            const snap = await getDoc(doc(db, 'users', user.uid));
            if (snap.exists() && snap.data().employeeId) {
                myEmployeeId.value = snap.data().employeeId;
            } else {
                const matched = empStore.employees.find(
                    e => e.name.toLowerCase() === (user.displayName || '').toLowerCase()
                );
                if (matched) myEmployeeId.value = matched.id;
            }
            const emp = empStore.employees.find(e => e.id === myEmployeeId.value);
            myEmployeeName.value = emp?.name || user.displayName || 'Unknown';
        } catch { /* proceed */ }
    }
    loadingMe.value = false;
});

// ── Submit form ───────────────────────────────────────────────────────────────

const submitDialog  = ref(false);
const submitting    = ref(false);
const submitForm    = reactive({
    startDate: '',
    endDate:   '',
    type:      '',
    reason:    '',
});
const submitErrors  = reactive({ startDate: '', endDate: '', type: '' });

const openSubmitDialog = () => {
    Object.assign(submitForm, { startDate: '', endDate: '', type: '', reason: '' });
    Object.assign(submitErrors, { startDate: '', endDate: '', type: '' });
    submitDialog.value = true;
};

const validateSubmit = () => {
    let valid = true;
    submitErrors.startDate = submitErrors.endDate = submitErrors.type = '';
    if (!submitForm.startDate) { submitErrors.startDate = 'Start date is required.'; valid = false; }
    if (!submitForm.endDate)   { submitErrors.endDate   = 'End date is required.';   valid = false; }
    if (!submitForm.type)      { submitErrors.type      = 'Leave type is required.'; valid = false; }
    if (submitForm.startDate && submitForm.endDate && submitForm.endDate < submitForm.startDate) {
        submitErrors.endDate = 'End date must be on or after start date.';
        valid = false;
    }
    return valid;
};

const handleSubmit = async () => {
    if (!validateSubmit()) return;
    submitting.value = true;
    const result = await leaveStore.submitRequest({
        employeeId:   myEmployeeId.value,
        employeeName: myEmployeeName.value,
        startDate:    submitForm.startDate,
        endDate:      submitForm.endDate,
        type:         submitForm.type,
        reason:       submitForm.reason,
    });
    submitting.value = false;
    if (result.success) {
        toast.add({ severity: 'success', summary: 'Request Submitted', detail: 'Your leave request has been sent for approval.', life: 4000 });
        submitDialog.value = false;
    } else {
        toast.add({ severity: 'error', summary: 'Error', detail: result.error || 'Failed to submit request.', life: 4000 });
    }
};

// ── Review dialog (admin) ─────────────────────────────────────────────────────

const reviewDialog  = ref(false);
const reviewing     = ref(false);
const selectedReq   = ref(null);
const reviewNote    = ref('');

const openReviewDialog = (req) => {
    selectedReq.value = req;
    reviewNote.value  = '';
    reviewDialog.value = true;
};

const handleReview = async (status) => {
    if (!selectedReq.value) return;
    reviewing.value = true;
    const result = await leaveStore.reviewRequest(selectedReq.value.firestoreId, status, reviewNote.value);
    reviewing.value = false;
    if (result.success) {
        const label = status === LEAVE_STATUS.APPROVED ? 'Approved' : 'Rejected';
        toast.add({ severity: status === LEAVE_STATUS.APPROVED ? 'success' : 'warn', summary: label, detail: `Leave request has been ${label.toLowerCase()}.`, life: 3000 });
        reviewDialog.value = false;
    } else {
        toast.add({ severity: 'error', summary: 'Error', detail: result.error || 'Review failed.', life: 4000 });
    }
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const statusSeverity = (status) => {
    switch (status) {
        case LEAVE_STATUS.APPROVED: return 'success';
        case LEAVE_STATUS.REJECTED: return 'danger';
        default:                    return 'warn';
    }
};

const formatDate = (d) => {
    if (!d) return '—';
    if (d instanceof Date) return d.toLocaleDateString('en-US', { dateStyle: 'medium' });
    return new Date(d).toLocaleDateString('en-US', { dateStyle: 'medium' });
};

const daysBetween = (start, end) => {
    if (!start || !end) return 1;
    const ms = new Date(end) - new Date(start);
    return Math.max(1, Math.round(ms / 86400000) + 1);
};

// Filter own requests for employee tab
const myRequests = computed(() =>
    myEmployeeId.value != null
        ? leaveStore.requests.filter(r => r.employeeId === myEmployeeId.value)
        : []
);
</script>

<template>
    <Toast />

    <div class="flex justify-content-between align-items-center mb-4">
        <div>
            <h2 class="text-3xl font-bold text-800 mb-1">Leave Management</h2>
            <p class="text-600">
                <span v-if="authStore.isAdmin">Review and manage employee leave requests</span>
                <span v-else>Submit and track your leave requests</span>
            </p>
        </div>
        <div class="flex gap-2">
            <Button
                v-if="authStore.isAdmin && leaveStore.pendingCount > 0"
                :badge="String(leaveStore.pendingCount)"
                icon="pi pi-bell"
                label="Pending"
                severity="warning"
                badgeSeverity="danger"
                @click="() => {}"
            />
            <Button icon="pi pi-plus" label="Request Leave" @click="openSubmitDialog" :disabled="loadingMe || !myEmployeeId" />
        </div>
    </div>

    <!-- ── ADMIN: full list with tabs ───────────────────────────────────────── -->
    <template v-if="authStore.isAdmin">
        <TabView>
            <TabPanel header="All Requests">
                <div class="card glass border-0 shadow-none mt-3">
                    <DataTable
                        :value="leaveStore.requests"
                        :loading="leaveStore.loading"
                        paginator :rows="10"
                        tableStyle="min-width: 55rem"
                        rowHover
                        sortField="submittedAt" :sortOrder="-1"
                    >
                        <Column header="Employee" sortable sortField="employeeName">
                            <template #body="{ data }">
                                <div class="flex align-items-center gap-2">
                                    <Avatar :label="data.employeeName?.charAt(0)" shape="circle" class="bg-primary-100 text-primary-700 font-bold" />
                                    <span class="font-medium">{{ data.employeeName }}</span>
                                </div>
                            </template>
                        </Column>
                        <Column header="Type">
                            <template #body="{ data }">{{ leaveStore.getTypeLabel(data.type) }}</template>
                        </Column>
                        <Column header="Dates">
                            <template #body="{ data }">
                                <div class="flex flex-column">
                                    <span class="font-medium">{{ data.startDate }} → {{ data.endDate }}</span>
                                    <span class="text-500 text-sm">{{ daysBetween(data.startDate, data.endDate) }} day(s)</span>
                                </div>
                            </template>
                        </Column>
                        <Column header="Submitted">
                            <template #body="{ data }">{{ formatDate(data.submittedAt) }}</template>
                        </Column>
                        <Column header="Status" sortable sortField="status">
                            <template #body="{ data }">
                                <Tag
                                    :value="data.status.charAt(0).toUpperCase() + data.status.slice(1)"
                                    :severity="statusSeverity(data.status)"
                                    rounded
                                />
                            </template>
                        </Column>
                        <Column header="Actions" style="width: 8rem">
                            <template #body="{ data }">
                                <Button
                                    v-if="data.status === LEAVE_STATUS.PENDING"
                                    icon="pi pi-eye"
                                    label="Review"
                                    size="small"
                                    severity="info"
                                    text
                                    @click="openReviewDialog(data)"
                                />
                                <span v-else class="text-400 text-sm">—</span>
                            </template>
                        </Column>
                    </DataTable>
                </div>
            </TabPanel>

            <TabPanel :header="`Pending (${leaveStore.pendingCount})`">
                <div class="card glass border-0 shadow-none mt-3">
                    <DataTable
                        :value="leaveStore.pendingRequests"
                        :loading="leaveStore.loading"
                        tableStyle="min-width: 55rem"
                        rowHover
                        :emptyMessage="'No pending requests — all caught up!'"
                    >
                        <Column header="Employee">
                            <template #body="{ data }">
                                <div class="flex align-items-center gap-2">
                                    <Avatar :label="data.employeeName?.charAt(0)" shape="circle" class="bg-orange-100 text-orange-700 font-bold" />
                                    <span class="font-medium">{{ data.employeeName }}</span>
                                </div>
                            </template>
                        </Column>
                        <Column header="Type"><template #body="{ data }">{{ leaveStore.getTypeLabel(data.type) }}</template></Column>
                        <Column header="Dates">
                            <template #body="{ data }">
                                <span>{{ data.startDate }} → {{ data.endDate }}</span>
                                <span class="text-500 text-sm ml-2">({{ daysBetween(data.startDate, data.endDate) }} day(s))</span>
                            </template>
                        </Column>
                        <Column header="Reason">
                            <template #body="{ data }">
                                <span class="text-600">{{ data.reason || '—' }}</span>
                            </template>
                        </Column>
                        <Column header="Actions">
                            <template #body="{ data }">
                                <Button icon="pi pi-check" label="Review" size="small" @click="openReviewDialog(data)" />
                            </template>
                        </Column>
                    </DataTable>
                </div>
            </TabPanel>
        </TabView>
    </template>

    <!-- ── EMPLOYEE: own requests ────────────────────────────────────────────── -->
    <template v-else>
        <div class="card glass border-0 shadow-none">
            <DataTable
                :value="myRequests"
                :loading="leaveStore.loading || loadingMe"
                paginator :rows="10"
                tableStyle="min-width: 40rem"
                rowHover
                :emptyMessage="'No leave requests yet. Click \'Request Leave\' to submit one.'"
            >
                <Column header="Type"><template #body="{ data }">{{ leaveStore.getTypeLabel(data.type) }}</template></Column>
                <Column header="Dates">
                    <template #body="{ data }">
                        <span>{{ data.startDate }} → {{ data.endDate }}</span>
                        <span class="text-500 text-sm ml-2">({{ daysBetween(data.startDate, data.endDate) }} day(s))</span>
                    </template>
                </Column>
                <Column header="Submitted"><template #body="{ data }">{{ formatDate(data.submittedAt) }}</template></Column>
                <Column header="Status">
                    <template #body="{ data }">
                        <Tag :value="data.status.charAt(0).toUpperCase() + data.status.slice(1)" :severity="statusSeverity(data.status)" rounded />
                    </template>
                </Column>
                <Column header="Note">
                    <template #body="{ data }">
                        <span class="text-600 text-sm">{{ data.reviewNote || '—' }}</span>
                    </template>
                </Column>
            </DataTable>
        </div>
    </template>

    <!-- ── Submit Leave Dialog ────────────────────────────────────────────────── -->
    <Dialog v-model:visible="submitDialog" modal header="Request Leave" :style="{ width: '32rem' }" :breakpoints="{ '640px': '95vw' }">
        <div class="grid formgrid p-fluid">
            <div class="field col-12 mb-3">
                <label class="font-medium mb-1 block">Leave Type *</label>
                <Dropdown v-model="submitForm.type" :options="LEAVE_TYPES" optionLabel="label" optionValue="value" placeholder="Select leave type" :class="{ 'p-invalid': submitErrors.type }" class="w-full" />
                <small v-if="submitErrors.type" class="p-error">{{ submitErrors.type }}</small>
            </div>
            <div class="field col-12 md:col-6 mb-3">
                <label class="font-medium mb-1 block">Start Date *</label>
                <InputText v-model="submitForm.startDate" type="date" :class="{ 'p-invalid': submitErrors.startDate }" class="w-full" />
                <small v-if="submitErrors.startDate" class="p-error">{{ submitErrors.startDate }}</small>
            </div>
            <div class="field col-12 md:col-6 mb-3">
                <label class="font-medium mb-1 block">End Date *</label>
                <InputText v-model="submitForm.endDate" type="date" :class="{ 'p-invalid': submitErrors.endDate }" class="w-full" />
                <small v-if="submitErrors.endDate" class="p-error">{{ submitErrors.endDate }}</small>
            </div>
            <div class="field col-12 mb-3">
                <label class="font-medium mb-1 block">Reason <span class="text-400">(optional)</span></label>
                <Textarea v-model="submitForm.reason" rows="3" maxlength="300" class="w-full" placeholder="Brief reason for leave…" autoResize />
                <small class="text-500">{{ submitForm.reason.length }}/300</small>
            </div>
        </div>
        <div class="flex justify-content-end gap-2 mt-2">
            <Button label="Cancel" severity="secondary" text @click="submitDialog = false" />
            <Button label="Submit Request" icon="pi pi-send" :loading="submitting" @click="handleSubmit" />
        </div>
    </Dialog>

    <!-- ── Review Leave Dialog (admin) ───────────────────────────────────────── -->
    <Dialog v-model:visible="reviewDialog" modal header="Review Leave Request" :style="{ width: '32rem' }" :breakpoints="{ '640px': '95vw' }">
        <template v-if="selectedReq">
            <div class="p-3 border-round surface-100 mb-4">
                <div class="grid">
                    <div class="col-6"><span class="text-500">Employee</span><div class="font-bold">{{ selectedReq.employeeName }}</div></div>
                    <div class="col-6"><span class="text-500">Type</span><div class="font-bold">{{ leaveStore.getTypeLabel(selectedReq.type) }}</div></div>
                    <div class="col-6 mt-3"><span class="text-500">Start Date</span><div class="font-bold">{{ selectedReq.startDate }}</div></div>
                    <div class="col-6 mt-3"><span class="text-500">End Date</span><div class="font-bold">{{ selectedReq.endDate }}</div></div>
                    <div class="col-12 mt-3" v-if="selectedReq.reason"><span class="text-500">Reason</span><div class="text-700">{{ selectedReq.reason }}</div></div>
                </div>
            </div>
            <div class="field mb-4">
                <label class="font-medium mb-1 block">Review Note <span class="text-400">(optional)</span></label>
                <Textarea v-model="reviewNote" rows="2" maxlength="200" class="w-full" placeholder="Add a note for the employee…" autoResize />
            </div>
            <div class="flex gap-2">
                <Button label="Reject" icon="pi pi-times" severity="danger" :loading="reviewing" class="flex-1" @click="handleReview(LEAVE_STATUS.REJECTED)" />
                <Button label="Approve" icon="pi pi-check" severity="success" :loading="reviewing" class="flex-1" @click="handleReview(LEAVE_STATUS.APPROVED)" />
            </div>
        </template>
    </Dialog>
</template>
