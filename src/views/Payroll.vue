<script setup>
import { onMounted, ref } from 'vue';
import { jsPDF } from 'jspdf';
import { useEmployeeStore } from '../stores/employeeStore';
import { useAuthStore } from '../stores/authStore';
import { useLeaveStore } from '../stores/leaveStore';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../firebaseConfig';
import { useToast } from 'primevue/usetoast';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import Avatar from 'primevue/avatar';
import Button from 'primevue/button';
import Toast from 'primevue/toast';

const store     = useEmployeeStore();
const authStore = useAuthStore();
const leaveStore = useLeaveStore();
const toast     = useToast();
const generatingAll = ref(false);

onMounted(async () => {
    await store.loadEmployees();
    await store.loadAttendanceForDate(store.toDateKey(new Date())); // load today for reference
});

const formatCurrency = (value) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);

const currentMonthLabel = () => {
    const now = new Date();
    return now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
};

// ── Generate single payslip PDF ───────────────────────────────────────────────

const generatePayslip = (employee) => {
    const salary = store.calculateSalary(employee);
    const now    = new Date();
    const month  = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });

    const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
    const W   = pdf.internal.pageSize.getWidth();
    const pad = 50;

    // ── Header band ─────────────────────────────────────────────────
    pdf.setFillColor(79, 70, 229); // indigo-600
    pdf.rect(0, 0, W, 90, 'F');

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(22);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PAYSLIP', pad, 38);

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Employee Attendance & Payroll System', pad, 58);
    pdf.text(`Pay Period: ${month}`, pad, 74);

    // Generated date — right aligned
    pdf.setFontSize(9);
    pdf.text(`Generated: ${now.toLocaleDateString('en-US', { dateStyle: 'medium' })}`, W - pad, 74, { align: 'right' });

    // ── Employee info box ────────────────────────────────────────────
    pdf.setFillColor(243, 244, 246); // gray-100
    pdf.roundedRect(pad, 110, W - pad * 2, 80, 6, 6, 'F');

    pdf.setTextColor(31, 41, 55); // gray-800
    pdf.setFontSize(13);
    pdf.setFont('helvetica', 'bold');
    pdf.text(employee.name, pad + 16, 140);

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(107, 114, 128); // gray-500
    pdf.text(`Role: ${employee.role}`, pad + 16, 158);
    pdf.text(`Department: ${employee.department || employee.role}`, pad + 16, 174);

    // Employee ID — right side
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(79, 70, 229);
    pdf.text(`EMP-${String(employee.id).padStart(4, '0')}`, W - pad - 16, 140, { align: 'right' });
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(107, 114, 128);
    pdf.text(`Email: ${employee.email || 'N/A'}`, W - pad - 16, 158, { align: 'right' });

    // ── Earnings / Deductions table ──────────────────────────────────
    const tableTop = 214;
    const colL = pad;
    const colR = W - pad;

    // Table header
    pdf.setFillColor(79, 70, 229);
    pdf.rect(colL, tableTop, colR - colL, 26, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Description', colL + 16, tableTop + 17);
    pdf.text('Amount', colR - 16, tableTop + 17, { align: 'right' });

    // Row helper
    let rowY = tableTop + 26;
    const drawRow = (label, amount, isDeduction = false, isTotal = false) => {
        const rowH = 32;
        if (isTotal) {
            pdf.setFillColor(238, 242, 255); // indigo-50
        } else {
            pdf.setFillColor(rowY % 64 === 0 ? 249 : 255, rowY % 64 === 0 ? 250 : 255, rowY % 64 === 0 ? 251 : 255);
        }
        pdf.rect(colL, rowY, colR - colL, rowH, 'F');

        pdf.setFontSize(isTotal ? 11 : 10);
        pdf.setFont('helvetica', isTotal ? 'bold' : 'normal');

        if (isDeduction) {
            pdf.setTextColor(220, 38, 38); // red-600
        } else if (isTotal) {
            pdf.setTextColor(79, 70, 229);
        } else {
            pdf.setTextColor(31, 41, 55);
        }

        pdf.text(label, colL + 16, rowY + 20);
        pdf.text(
            (isDeduction && amount > 0 ? '- ' : '') + formatCurrency(amount),
            colR - 16, rowY + 20, { align: 'right' }
        );

        // bottom border
        pdf.setDrawColor(229, 231, 235);
        pdf.line(colL, rowY + rowH, colR, rowY + rowH);
        rowY += rowH;
    };

    drawRow('Basic Salary', salary.base);
    if (salary.absentDays > 0) {
        drawRow(`Absent Days (${salary.absentDays} day(s))`, 0, false);
    }
    if (salary.deduction > 0) {
        drawRow(`Absence Deduction (>${3} days)`, salary.deduction, true);
    }
    drawRow('NET SALARY', salary.final, false, true);

    // ── Attendance summary ────────────────────────────────────────────
    const sumTop = rowY + 24;
    pdf.setFillColor(243, 244, 246);
    pdf.roundedRect(colL, sumTop, (W - pad * 2) / 2 - 8, 72, 6, 6, 'F');
    pdf.roundedRect(colL + (W - pad * 2) / 2 + 8, sumTop, (W - pad * 2) / 2 - 8, 72, 6, 6, 'F');

    pdf.setFontSize(9);
    pdf.setTextColor(107, 114, 128);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Absent Days', colL + 16, sumTop + 20);
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(salary.absentDays > 3 ? 220 : 31, salary.absentDays > 3 ? 38 : 41, salary.absentDays > 3 ? 38 : 55);
    pdf.text(String(salary.absentDays), colL + 16, sumTop + 52);

    const r2x = colL + (W - pad * 2) / 2 + 24;
    pdf.setFontSize(9);
    pdf.setTextColor(107, 114, 128);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Daily Rate', r2x, sumTop + 20);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(79, 70, 229);
    pdf.text(formatCurrency(salary.base / 30), r2x, sumTop + 52);

    // ── Footer ────────────────────────────────────────────────────────
    const footY = pdf.internal.pageSize.getHeight() - 40;
    pdf.setFillColor(79, 70, 229);
    pdf.rect(0, footY, W, 40, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text('This is a system-generated payslip. For queries contact HR.', W / 2, footY + 16, { align: 'center' });
    pdf.text(`Employee Attendance & Payroll System  ·  ${month}`, W / 2, footY + 30, { align: 'center' });

    // Save
    pdf.save(`Payslip_${employee.name.replace(/\s+/g, '_')}_${month.replace(/\s+/g, '_')}.pdf`);

    // Write audit log
    writePayrollAudit(employee.name, month);
};

// ── Generate all payslips ─────────────────────────────────────────────────────

const generateAllPayslips = async () => {
    generatingAll.value = true;
    const month = currentMonthLabel();
    let count = 0;

    for (const emp of store.filteredEmployees) {
        generatePayslip(emp);
        count++;
        // Small delay to avoid browser popup blocking
        await new Promise(r => setTimeout(r, 80));
    }

    toast.add({
        severity: 'success',
        summary: 'Payslips Generated',
        detail: `${count} payslip(s) downloaded for ${month}.`,
        life: 5000,
    });
    generatingAll.value = false;
};

// ── Audit log ─────────────────────────────────────────────────────────────────

const writePayrollAudit = async (employeeName, month) => {
    try {
        const user = getAuth().currentUser;
        if (!user) return;
        await addDoc(collection(db, 'auditLog'), {
            action: 'Payslip Generated',
            details: `Payslip generated for ${employeeName} — ${month}`,
            module: 'payroll',
            performedBy: user.uid,
            performedByName: user.displayName || user.email,
            timestamp: serverTimestamp(),
        });
    } catch { /* non-critical */ }
};
</script>

<template>
    <Toast />

    <div class="flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
            <h2 class="text-3xl font-bold text-800 mb-1">Payroll</h2>
            <p class="text-600">Monthly salary calculation · <strong>{{ currentMonthLabel() }}</strong></p>
        </div>
        <Button
            icon="pi pi-download"
            label="Download All Payslips"
            severity="secondary"
            :loading="generatingAll"
            @click="generateAllPayslips"
        />
    </div>

    <div class="card glass border-0 shadow-none">
        <DataTable
            :value="store.filteredEmployees"
            :loading="store.loading"
            paginator :rows="10"
            tableStyle="min-width: 60rem"
            class="p-datatable-lg"
            rowHover
        >
            <Column field="name" header="Employee">
                <template #body="{ data }">
                    <div class="flex align-items-center gap-3">
                        <Avatar :label="data.name.charAt(0)" shape="circle" size="large" class="bg-indigo-100 text-indigo-700 font-bold" />
                        <div class="flex flex-column">
                            <span class="font-bold text-lg">{{ data.name }}</span>
                            <span class="text-sm text-500">{{ data.role }}</span>
                        </div>
                    </div>
                </template>
            </Column>

            <Column header="Base Salary">
                <template #body="{ data }">
                    <span class="font-medium text-lg">{{ formatCurrency(data.baseSalary) }}</span>
                </template>
            </Column>

            <Column header="Absent Days" alignHeader="center" class="text-center">
                <template #body="{ data }">
                    <div class="inline-flex align-items-center justify-content-center w-2rem h-2rem border-circle"
                        :class="store.calculateSalary(data).absentDays > 3 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'">
                        {{ store.calculateSalary(data).absentDays }}
                    </div>
                </template>
            </Column>

            <Column header="Deduction">
                <template #body="{ data }">
                    <span class="text-red-500 font-medium" v-if="store.calculateSalary(data).deduction > 0">
                        &minus; {{ formatCurrency(store.calculateSalary(data).deduction) }}
                    </span>
                    <span v-else class="text-green-500">No Deduction</span>
                </template>
            </Column>

            <Column header="Net Salary">
                <template #body="{ data }">
                    <span class="text-xl font-bold text-primary">
                        {{ formatCurrency(store.calculateSalary(data).final) }}
                    </span>
                </template>
            </Column>

            <Column header="Status">
                <template #body>
                    <Tag value="Processed" severity="success" icon="pi pi-check" rounded />
                </template>
            </Column>

            <Column header="Payslip" style="width: 9rem">
                <template #body="{ data }">
                    <Button
                        icon="pi pi-file-pdf"
                        label="Download"
                        severity="danger"
                        size="small"
                        text
                        @click="generatePayslip(data)"
                    />
                </template>
            </Column>
        </DataTable>
    </div>
</template>
