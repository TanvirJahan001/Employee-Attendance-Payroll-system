<script setup>
import { ref, onMounted, computed } from 'vue';
import {
    collection, getDocs, query, orderBy, limit, startAfter
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';

const logs    = ref([]);
const loading = ref(false);
const search  = ref('');
const moduleFilter = ref('');
const lastDoc = ref(null);
const hasMore = ref(true);
const PAGE    = 50;

const MODULE_OPTIONS = [
    { label: 'All Modules',  value: '' },
    { label: 'Employees',    value: 'employees' },
    { label: 'Attendance',   value: 'attendance' },
    { label: 'Leave',        value: 'leave' },
    { label: 'Payroll',      value: 'payroll' },
    { label: 'System',       value: 'system' },
];

const loadLogs = async (reset = true) => {
    if (reset) {
        logs.value = [];
        lastDoc.value = null;
        hasMore.value = true;
    }
    if (!hasMore.value) return;

    loading.value = true;
    try {
        let q = query(
            collection(db, 'auditLog'),
            orderBy('timestamp', 'desc'),
            limit(PAGE)
        );
        if (lastDoc.value) {
            q = query(
                collection(db, 'auditLog'),
                orderBy('timestamp', 'desc'),
                startAfter(lastDoc.value),
                limit(PAGE)
            );
        }
        const snap = await getDocs(q);
        const newLogs = snap.docs.map(d => ({
            id: d.id,
            ...d.data(),
            timestamp: d.data().timestamp?.toDate?.() || null,
        }));
        logs.value = reset ? newLogs : [...logs.value, ...newLogs];
        lastDoc.value = snap.docs[snap.docs.length - 1] || null;
        hasMore.value = snap.docs.length === PAGE;
    } catch (err) {
        console.error('[AuditLog] load error', err);
    } finally {
        loading.value = false;
    }
};

onMounted(() => loadLogs());

// ── Filtering ─────────────────────────────────────────────────────────────────

const filteredLogs = computed(() => {
    let list = logs.value;
    if (moduleFilter.value) {
        list = list.filter(l => l.module === moduleFilter.value);
    }
    if (search.value.trim()) {
        const q = search.value.toLowerCase();
        list = list.filter(l =>
            (l.action || '').toLowerCase().includes(q) ||
            (l.details || '').toLowerCase().includes(q) ||
            (l.performedByName || '').toLowerCase().includes(q)
        );
    }
    return list;
});

// ── Helpers ───────────────────────────────────────────────────────────────────

const moduleSeverity = (mod) => {
    switch (mod) {
        case 'employees':  return 'info';
        case 'attendance': return 'success';
        case 'leave':      return 'warn';
        case 'payroll':    return 'secondary';
        default:           return 'contrast';
    }
};

const formatDateTime = (d) => {
    if (!d) return '—';
    return d.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
};
</script>

<template>
    <div class="mb-4">
        <h2 class="text-3xl font-bold text-800 mb-1">Audit Log</h2>
        <p class="text-600">Complete trail of all admin actions in the system</p>
    </div>

    <!-- Filter bar -->
    <div class="flex gap-3 mb-4 flex-wrap">
        <span class="p-input-icon-left flex-1" style="min-width: 200px;">
            <i class="pi pi-search"></i>
            <InputText v-model="search" placeholder="Search actions, details, user…" class="w-full" />
        </span>
        <Dropdown
            v-model="moduleFilter"
            :options="MODULE_OPTIONS"
            optionLabel="label"
            optionValue="value"
            placeholder="Filter by module"
            class="w-12rem"
        />
        <Button icon="pi pi-refresh" severity="secondary" @click="loadLogs(true)" :loading="loading" title="Refresh" />
    </div>

    <!-- Stats -->
    <div class="grid mb-4">
        <div class="col-6 md:col-3">
            <div class="glass p-3 border-round-xl text-center">
                <div class="text-2xl font-bold text-primary">{{ logs.length }}</div>
                <div class="text-500 text-sm">Entries Loaded</div>
            </div>
        </div>
        <div class="col-6 md:col-3">
            <div class="glass p-3 border-round-xl text-center">
                <div class="text-2xl font-bold text-green-600">{{ logs.filter(l => l.module === 'attendance').length }}</div>
                <div class="text-500 text-sm">Attendance Actions</div>
            </div>
        </div>
        <div class="col-6 md:col-3">
            <div class="glass p-3 border-round-xl text-center">
                <div class="text-2xl font-bold text-orange-500">{{ logs.filter(l => l.module === 'leave').length }}</div>
                <div class="text-500 text-sm">Leave Actions</div>
            </div>
        </div>
        <div class="col-6 md:col-3">
            <div class="glass p-3 border-round-xl text-center">
                <div class="text-2xl font-bold text-blue-600">{{ logs.filter(l => l.module === 'employees').length }}</div>
                <div class="text-500 text-sm">Employee Changes</div>
            </div>
        </div>
    </div>

    <!-- Log table -->
    <div class="card glass border-0 shadow-none">
        <DataTable
            :value="filteredLogs"
            :loading="loading"
            paginator
            :rows="20"
            :rowsPerPageOptions="[10, 20, 50]"
            tableStyle="min-width: 50rem"
            rowHover
            :emptyMessage="'No audit log entries found.'"
        >
            <Column header="Timestamp" style="width: 12rem">
                <template #body="{ data }">
                    <span class="font-mono text-sm">{{ formatDateTime(data.timestamp) }}</span>
                </template>
            </Column>

            <Column header="Module" style="width: 8rem">
                <template #body="{ data }">
                    <Tag
                        :value="(data.module || 'system').charAt(0).toUpperCase() + (data.module || 'system').slice(1)"
                        :severity="moduleSeverity(data.module)"
                        rounded
                        class="text-xs"
                    />
                </template>
            </Column>

            <Column header="Action" style="width: 14rem">
                <template #body="{ data }">
                    <span class="font-semibold text-900">{{ data.action || '—' }}</span>
                </template>
            </Column>

            <Column header="Details">
                <template #body="{ data }">
                    <span class="text-600 text-sm">{{ data.details || '—' }}</span>
                </template>
            </Column>

            <Column header="Performed By" style="width: 12rem">
                <template #body="{ data }">
                    <span class="text-700 text-sm">{{ data.performedByName || data.performedBy || '—' }}</span>
                </template>
            </Column>
        </DataTable>

        <div v-if="hasMore && !loading" class="flex justify-content-center mt-3">
            <Button label="Load More" icon="pi pi-plus" severity="secondary" text @click="loadLogs(false)" />
        </div>
    </div>
</template>
