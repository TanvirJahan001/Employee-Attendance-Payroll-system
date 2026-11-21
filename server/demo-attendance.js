import { createHash } from 'node:crypto';

export const DEMO_DATASET = 'daily-attendance-v1';
export const DEMO_SYNC_UID = 'demo-attendance-scheduler';

const employees = [
    { id: 101, name: 'Amina Karim', role: 'HR Coordinator', department: 'People', baseSalary: 3200 },
    { id: 102, name: 'Rafi Ahmed', role: 'Product Designer', department: 'Design', baseSalary: 4100 },
    { id: 103, name: 'Nabila Rahman', role: 'Software Engineer', department: 'Engineering', baseSalary: 4900 },
    { id: 104, name: 'Imran Hossain', role: 'QA Analyst', department: 'Engineering', baseSalary: 3750 },
    { id: 105, name: 'Sumaiya Chowdhury', role: 'Accountant', department: 'Finance', baseSalary: 3950 },
    { id: 106, name: 'Arif Hasan', role: 'Support Specialist', department: 'Operations', baseSalary: 3000 },
    { id: 107, name: 'Farhana Akter', role: 'Operations Lead', department: 'Operations', baseSalary: 4650 },
    { id: 108, name: 'Mahin Islam', role: 'Marketing Analyst', department: 'Marketing', baseSalary: 3550 },
];

const dateFormat = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Dhaka', year: 'numeric', month: '2-digit', day: '2-digit',
});
const timeFormat = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Dhaka', hour: '2-digit', minute: '2-digit',
});
const readMask = ['demoDataset', 'recordedBy', 'status', 'inTime', 'outTime'];

function dateBefore(date, days) {
    const day = new Date(date + 'T00:00:00Z');
    day.setUTCDate(day.getUTCDate() - days);
    return day.toISOString().slice(0, 10);
}

function attendanceFor(employeeId, date, localTime) {
    const random = createHash('sha256').update(`${employeeId}:${date}`).digest();
    const isWeekend = [5, 6].includes(new Date(date + 'T00:00:00Z').getUTCDay());
    const absentRate = isWeekend ? 25 : 8;
    const roll = random[0] % 100;
    const status = roll < absentRate ? 'Absent' : roll < absentRate + 8 ? 'Leave' : 'Present';
    const inTime = `08:${String(30 + random[1] % 30)}`;
    const outTime = `17:${String(random[2] % 60).padStart(2, '0')}`;

    return {
        employeeId,
        date,
        status,
        inTime: status === 'Present' && localTime >= inTime ? inTime : null,
        outTime: status === 'Present' && localTime >= outTime ? outTime : null,
        demoDataset: DEMO_DATASET,
        recordedBy: DEMO_SYNC_UID,
    };
}

function fields(values) {
    return Object.fromEntries(Object.entries(values).map(([key, value]) => {
        if (value === null) return [key, { nullValue: null }];
        if (typeof value === 'number') return [key, { integerValue: String(value) }];
        return [key, { stringValue: value }];
    }));
}

function firestore({ projectId, token, origin = 'https://firestore.googleapis.com' }) {
    const database = `projects/${projectId}/databases/(default)`;
    const documentName = (path) => `${database}/documents/${path}`;

    async function call(method, body) {
        const response = await fetch(`${origin}/v1/${database}/documents:${method}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(20000),
        });
        if (!response.ok) throw new Error(`Firestore ${method} returned HTTP ${response.status}`);
        return response.json();
    }

    async function read(paths, fieldPaths) {
        if (paths.length === 0) return new Map();
        const rows = await call('batchGet', {
            documents: paths.map(documentName),
            mask: { fieldPaths },
        });
        return new Map(rows.filter(row => row.found).map(({ found }) => [
            found.name.slice(database.length + '/documents/'.length), found,
        ]));
    }

    async function write(writes) {
        if (writes.length === 0) return 0;
        await call('commit', { writes });
        return writes.length;
    }

    function create(path, values, timestampFields = ['updatedAt']) {
        return {
            update: { name: documentName(path), fields: fields(values) },
            currentDocument: { exists: false },
            updateTransforms: timestampFields.map(fieldPath => ({ fieldPath, setToServerValue: 'REQUEST_TIME' })),
        };
    }

    function updateTimes(path, values, version) {
        return {
            update: { name: documentName(path), fields: fields(values) },
            updateMask: { fieldPaths: Object.keys(values) },
            currentDocument: { updateTime: version },
            updateTransforms: [{ fieldPath: 'updatedAt', setToServerValue: 'REQUEST_TIME' }],
        };
    }

    return { read, write, create, updateTimes };
}

export async function seedDemoEmployees(options) {
    const db = firestore(options);
    const existing = await db.read(employees.map(({ id }) => `employees/${id}`), ['demoDataset']);
    for (const [path, document] of existing) {
        if (document.fields?.demoDataset?.stringValue !== DEMO_DATASET) {
            throw new Error(`Employee ID ${path.split('/')[1]} already belongs to another dataset`);
        }
    }

    const writes = employees.filter(({ id }) => !existing.has(`employees/${id}`)).map(employee =>
        db.create(`employees/${employee.id}`, {
            ...employee, name: `${employee.name} (Demo)`, email: '', phone: '',
            startDate: '2025-01-15', demoDataset: DEMO_DATASET,
        }, ['createdAt', 'updatedAt'])
    );
    return db.write(writes);
}

export async function syncDemoAttendance(options, { now = new Date(), historyDays = 6 } = {}) {
    const db = firestore(options);
    const today = dateFormat.format(now);
    const currentTime = timeFormat.format(now);
    const employeeDocs = await db.read(employees.map(({ id }) => `employees/${id}`), ['demoDataset']);
    const employeeIds = employees.filter(({ id }) =>
        employeeDocs.get(`employees/${id}`)?.fields?.demoDataset?.stringValue === DEMO_DATASET
    ).map(({ id }) => id);
    if (!employeeIds.length) throw new Error('The demo employees have not been seeded');

    let recordsWritten = 0;
    for (let offset = historyDays; offset >= 0; offset--) {
        const date = dateBefore(today, offset);
        const localTime = offset === 0 ? currentTime : '23:59';
        const paths = employeeIds.map(id => `attendance/${id}_${date}`);
        const existing = await db.read(paths, readMask);
        const writes = [];

        for (const [index, id] of employeeIds.entries()) {
            const path = paths[index];
            const generated = attendanceFor(id, date, localTime);
            const previous = existing.get(path);
            if (!previous) {
                if (generated.status !== 'Present' || generated.inTime) writes.push(db.create(path, generated));
                continue;
            }

            const saved = previous.fields ?? {};
            if (saved.demoDataset?.stringValue !== DEMO_DATASET ||
                saved.recordedBy?.stringValue !== DEMO_SYNC_UID ||
                saved.status?.stringValue !== 'Present' ||
                saved.inTime?.stringValue !== generated.inTime ||
                saved.outTime?.stringValue ||
                !generated.outTime) continue;

            writes.push(db.updateTimes(path, { outTime: generated.outTime }, previous.updateTime));
        }

        recordsWritten += await db.write(writes);
    }
    return { date: today, employeeCount: employeeIds.length, recordsWritten };
}
