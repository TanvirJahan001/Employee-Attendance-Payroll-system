# Employee Attendance & Payroll System

A Vue 3 web app for employee records, daily check-ins, leave approvals, and monthly payroll. Employees use a self-service workspace, and administrators manage attendance, holidays, payroll, and audit history. The app uses Firebase for authentication and storage and runs on Vercel.

## Live demo

Open the [live login page](https://employee-attendance-payroll-system.vercel.app/login) and select **Try Demo**. You can also enter these public demo details in the sign-in form.

| Field | Value |
| --- | --- |
| Email | `demo@example.invalid` |
| Password | `ExploreAttendance!` |

The read-only demo opens the dashboard, employee directory, attendance calendar, and payroll. Search for an employee, pick a date to see sample check-in and check-out times, or download an example PDF payslip. The preview uses eight built-in sample profiles and generated attendance. The session stays in the current browser tab and is cleared when you select **Exit Demo**. The public details open only the sample workspace.

## Features and access

| Area | Employee | Administrator |
| --- | --- | --- |
| Dashboard | View today's own attendance | View team attendance totals, status chart, and recent check-ins |
| Employees | Use self-service features linked to an employee record | Add, edit, delete, and search employee records |
| Attendance | Record own check-in and check-out | Review daily records by date and mark an employee on leave |
| Leave requests | Submit requests and see decisions | Review, approve, or reject requests with a note |
| Payroll | | View monthly USD salary, absence count, deductions, and net pay. Download individual or batch PDF payslips |
| Holidays | | Maintain the holiday calendar and recurring entries |
| Audit log | View own sign-in history in Settings | Browse and filter recorded employee, leave, attendance, and payroll events |
| Account | Reset or change password and update profile | Same account features |

The payroll calculator applies one daily-rate deduction when absences exceed three days. It counts calendar dates without attendance records as absent. General preferences, notification options, and the two-factor switch are currently interface controls only.

## Tech stack

- **Frontend** — Vue 3, Vue Router, Pinia, Vite, PrimeVue, PrimeFlex, and PrimeIcons
- **Charts and exports** — Chart.js and jsPDF
- **Backend** — Firebase Authentication, Cloud Firestore, and optional Cloud Storage for profile photos
- **Hosting and scheduled jobs** — Vercel and an alternate GitHub Actions workflow

## Local setup

You’ll need npm, Node.js 20.19+ on the 20.x line or Node.js 22.12+, and a Firebase project for local development.

```bash
git clone https://github.com/TanvirJahan001/Employee-Attendance-Payroll-system.git
cd Employee-Attendance-Payroll-system
npm ci
cp .env.example .env
```

1. Register a Web app in your Firebase project. Open **Project settings → General → Your apps**, then copy the Web app's SDK configuration into the corresponding variables in your local `.env`. The tracked [environment template](.env.example) lists the expected variable names. [Firebase Web setup](https://firebase.google.com/docs/web/setup)
2. Enable **Email/Password** under **Authentication → Sign-in method** and create your first user under **Authentication → Users**. Copy its UID. For local password-reset links, add `localhost` under **Authentication → Settings → Authorized domains**. [Firebase email/password setup](https://firebase.google.com/docs/auth/web/password-auth)
3. Create the default Firestore database in production mode. Deploy the repository's rules and indexes from the project root. Replace `YOUR_PROJECT_ID` with the ID of your development project. [Firestore setup](https://firebase.google.com/docs/firestore/quickstart)

   ```bash
   npx firebase-tools login
   npx firebase-tools deploy --only firestore:rules,firestore:indexes --project YOUR_PROJECT_ID
   ```
4. In Firestore, create a `users/<UID>` document for your first user with a string field named `role` and value `admin`. To link an employee's Authentication account, set its Firestore user document's `role` to `employee` and add a numeric `employeeId` matching the employee record's `id`.
5. Run `npm run dev`, then open the URL printed by Vite. When an administrator first loads an empty `employees` collection, the app imports the bundled sample employees.

For profile photo uploads, enable Cloud Storage, set the bucket variable to your project's bucket, and deploy its rules with `npx firebase-tools deploy --only storage --project YOUR_PROJECT_ID`. Cloud Storage for Firebase requires the Blaze plan. [Firebase Storage billing requirements](https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024)

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local Vite server |
| `npm run build` | Create the production bundle in `dist/` |
| `npm run preview` | Serve the production bundle locally |

## Deployment

The GitHub repository is connected to Vercel. For your own deployment, import the repository into Vercel, select the Vite framework preset, and configure your Firebase web settings in the build environment. Add the deployed hostname to your Firebase Authentication authorized domains and deploy the Firebase rules and indexes to the same project. The repository's [Vercel configuration](vercel.json) handles direct navigation to Vue Router URLs. Keep local environment files and private deployment credentials out of Git. [Vercel for GitHub](https://vercel.com/docs/git/vercel-for-github)

### Scheduled Firestore sample attendance

The hosted app also has a scheduled job for a Firestore sample dataset. It generates attendance for eight tagged demo employees and fills missing checkout times on eligible past records. It preserves administrator edits and other records. The visitor preview uses its own built-in fixtures.

The Vercel schedule starts during the 9 a.m. Asia/Dhaka hour. The repository also includes a GitHub Actions runner for the same job. Use one runner per dataset and configure its dedicated Firebase identity and credentials in the hosting platform's secret settings. [Vercel Cron Jobs](https://vercel.com/docs/schedules/cron-jobs)

## Project structure

| Path | Purpose |
| --- | --- |
| `src/views/` | Login, dashboard, employees, attendance, payroll, leave, holidays, audit, profile, and settings |
| `src/router/`, `src/layout/`, `src/components/` | Routes, access checks, application layouts, and shared UI |
| `src/stores/`, `src/data/`, `src/demo/` | Pinia state, sample records, and the browser demo session |
| `src/firebaseConfig.js` | Firebase client initialization |
| `firestore.rules`, `firestore.indexes.json`, `storage.rules` | Firebase permissions and indexes |
| `api/`, `server/`, `scripts/`, `.github/workflows/` | Scheduled sample data generation and its runners |

## Contributing

Open an issue or pull request on GitHub. Run `npm run build` before submitting a change and include the steps you used to check it. The project is maintained by [Tanvir Jahan](https://github.com/TanvirJahan001).
