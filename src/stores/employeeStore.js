import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { db } from '../firebaseConfig';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { employeesData } from '../data/employees';

export const useEmployeeStore = defineStore('employee', () => {
    const employees = ref([]);
    const loading = ref(false);
    const searchQuery = ref('');
    const currentMonthDays = 30;

    const filteredEmployees = computed(() => {
        if (!searchQuery.value) return employees.value;
        const lowerQuery = searchQuery.value.toLowerCase();
        return employees.value.filter(emp =>
            emp.name.toLowerCase().includes(lowerQuery) ||
            emp.role.toLowerCase().includes(lowerQuery)
        );
    });

    // Load employee data from employees.js
    const generateEmployees = async () => {
        if (employees.value.length > 0) return; // Already loaded

        loading.value = true;
        const newEmployees = [];

        // Use actual employee data instead of mock names
        for (const empData of employeesData) {
            const attendance = generateRandomAttendance();
            newEmployees.push({
                id: empData.id,
                name: empData.name,
                role: empData.role,
                baseSalary: empData.baseSalary,
                attendance: attendance,
                leaves: [] // Array of dates
            });
        }

        employees.value = newEmployees;

        // Try to save to Firestore (optional for now, can be done manually)
        // await saveToFirestore();
        loading.value = false;
    };

    const generateRandomAttendance = () => {
        const attendance = {};
        for (let day = 1; day <= currentMonthDays; day++) {
            // 80% chance of being present
            const isPresent = Math.random() > 0.2;

            if (isPresent) {
                // Random start time 8:00 - 9:00
                const startHour = 8;
                const startMinute = Math.floor(Math.random() * 60);
                const startTime = `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`;

                // Random end time 18:00 - 20:00
                const endHour = 18 + Math.floor(Math.random() * 3);
                const endMinute = Math.floor(Math.random() * 60);
                const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;

                attendance[day] = {
                    status: 'Present',
                    inTime: startTime,
                    outTime: endTime
                };
            } else {
                attendance[day] = {
                    status: 'Absent',
                    inTime: null,
                    outTime: null
                };
            }
        }
        return attendance;
    };

    const markLeave = (employeeId, day) => {
        const emp = employees.value.find(e => e.id === employeeId);
        if (emp) {
            if (!emp.leaves.includes(day)) {
                emp.leaves.push(day);
                // Update attendance status for that day
                if (emp.attendance[day]) {
                    emp.attendance[day].status = 'Leave';
                }
            }
        }
    };

    // Salary Calculation Logic
    const calculateSalary = (employee) => {
        let absentDays = 0;

        for (let day = 1; day <= currentMonthDays; day++) {
            const record = employee.attendance[day];
            // Check if absent AND not on leave
            if (record.status === 'Absent' && !employee.leaves.includes(day)) {
                absentDays++;
            }
        }

        let deduction = 0;
        if (absentDays > 3) {
            // Deduct 1 day salary
            const dailySalary = employee.baseSalary / currentMonthDays;
            deduction = dailySalary;
        }

        return {
            base: employee.baseSalary,
            deduction: deduction,
            final: employee.baseSalary - deduction,
            absentDays: absentDays
        };
    };

    return {
        employees,
        loading,
        generateEmployees,
        markLeave,
        calculateSalary,
        searchQuery,
        filteredEmployees
    };
});
