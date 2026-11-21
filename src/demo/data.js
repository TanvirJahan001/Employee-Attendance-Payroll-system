import { employeesData } from '../data/employees';
import { DEMO_EMAIL } from './session';

export const demoEmployees = employeesData.slice(0, 8).map(employee => ({
    ...employee,
    name: `${employee.name} (Demo)`,
    department: employee.role,
}));

export const demoAccount = {
    name: 'Demo Admin',
    initials: 'DA',
    email: DEMO_EMAIL,
    location: 'Dhaka',
    bio: 'Sample administrator profile for the attendance and payroll workspace.',
};

const dateFromToday = (offset) => {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    return date;
};

const dateLabel = (offset) => dateFromToday(offset).toLocaleDateString('sv-SE');

export const demoLeaveRequests = () => [
    { employeeName: demoEmployees[2].name, type: 'annual', startDate: dateLabel(4), endDate: dateLabel(5), status: 'pending', submittedAt: dateFromToday(-1), reason: 'Family plans' },
    { employeeName: demoEmployees[3].name, type: 'sick', startDate: dateLabel(-3), endDate: dateLabel(-3), status: 'approved', submittedAt: dateFromToday(-4) },
    { employeeName: demoEmployees[4].name, type: 'casual', startDate: dateLabel(-7), endDate: dateLabel(-6), status: 'rejected', submittedAt: dateFromToday(-9) },
];

export const demoHolidays = (year) => [
    { firestoreId: 'sample-1', name: "New Year's Day", date: `${year}-01-01`, type: 'national', recurring: true },
    { firestoreId: 'sample-2', name: 'May Day', date: `${year}-05-01`, type: 'national', recurring: true },
    { firestoreId: 'sample-3', name: 'Company Retreat', date: `${year}-09-15`, type: 'company', recurring: false },
    { firestoreId: 'sample-4', name: 'Year-End Break', date: `${year}-12-31`, type: 'company', recurring: true },
];

export const demoAuditLog = () => [
    { action: 'Payslip Generated', details: `Sample payslip generated for ${demoEmployees[0].name}`, module: 'payroll' },
    { action: 'Leave Request Approved', details: `Sick leave approved for ${demoEmployees[3].name}`, module: 'leave' },
    { action: 'Leave Marked', details: `Attendance marked as leave for ${demoEmployees[3].name}`, module: 'attendance' },
    { action: 'Employee Added', details: `${demoEmployees[7].name} joined the team`, module: 'employees' },
].map((entry, index) => ({ ...entry, id: index + 1, timestamp: dateFromToday(-index - 1), performedByName: demoAccount.name }));
