# 🏢 Employee Attendance & Payroll System

![Vue.js](https://img.shields.io/badge/vuejs-%2335495e.svg?style=for-the-badge&logo=vuedotjs&logoColor=%234FC08D)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![Firebase](https://img.shields.io/badge/firebase-%23039BE5.svg?style=for-the-badge&logo=firebase)
![PrimeVue](https://img.shields.io/badge/PrimeVue-10b981?style=for-the-badge&logo=primevue&logoColor=white)

A modern, comprehensive **Employee Attendance & Payroll System** built with **Vue 3** and **Firebase**. This application streamlines HR processes, allowing for efficient employee management, real-time attendance tracking, and automated payroll calculations.

## ✨ Features

-   **📊 Interactive Dashboard**: Real-time overview of total employees, attendance stats, and payroll summaries.
-   **👥 Employee Management**: centralized database to manage employee profiles, roles, and details.
-   **📅 Smart Attendance**: Track daily check-ins, check-outs, and attendance status (Present, Absent, Leave).
-   **💰 Automated Payroll**: Calculate monthly salaries, deductions based on attendance, and net pay automatically.
-   **🔐 Secure Authentication**: Robust login system powered by Firebase Auth.
-   **🎨 Modern UI/UX**: Beautiful, responsive interface built with PrimeVue and custom glassmorphism effects.
-   **📱 Fully Responsive**: Seamless experience across desktop, tablet, and mobile devices.

## 🛠️ Tech Stack

-   **Framework**: [Vue.js 3](https://vuejs.org/) (Composition API)
-   **Build Tool**: [Vite](https://vitejs.dev/)
-   **State Management**: [Pinia](https://pinia.vuejs.org/)
-   **UI Library**: [PrimeVue](https://primevue.org/) & [PrimeFlex](https://primeflex.org/)
-   **Backend / Auth**: [Firebase](https://firebase.google.com/)
-   **Styling**: SCSS / SASS
-   **Charts**: [Chart.js](https://www.chartjs.org/)

## 🚀 Getting Started

Follow these steps to set up the project locally.

### Prerequisites

-   Node.js 20.19+ on the 20.x line, or 22.12+
-   npm

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/TanvirJahan001/Employee-Attendance-Payroll-system.git
    cd Employee-Attendance-Payroll-system
    ```

2.  **Install dependencies**
    ```bash
    npm ci
    ```

3.  **Add your Firebase web configuration**

    In the [Firebase Console](https://console.firebase.google.com/), open your project and go to **Project settings → General → Your apps**. Register a Web app if needed, then open its SDK setup **Config**. Copy [`.env.example`](.env.example) to `.env` and map the values from that config.

    | Firebase config field | Variable in `.env` |
    | --- | --- |
    | `apiKey` | `VITE_FIREBASE_API_KEY` |
    | `authDomain` | `VITE_FIREBASE_AUTH_DOMAIN` |
    | `projectId` | `VITE_FIREBASE_PROJECT_ID` |
    | `storageBucket` | `VITE_FIREBASE_STORAGE_BUCKET` |
    | `messagingSenderId` | `VITE_FIREBASE_MESSAGING_SENDER_ID` |
    | `appId` | `VITE_FIREBASE_APP_ID` |

    The repository ignores `.env`. Restart Vite after editing it. If you deploy the frontend, set the same variables in the host's build environment and rebuild. [Firebase Web setup](https://firebase.google.com/docs/web/setup)

4.  **Set up the Firebase services**

    - In **Authentication → Sign-in method**, enable **Email/Password**. In **Users**, add your first account and copy its UID. For local password-reset links, add `localhost` under **Authentication → Settings → Authorized domains** if it is missing. [Firebase Authentication setup](https://firebase.google.com/docs/auth/web/password-auth)
    - In **Firestore Database**, create the **Standard** database with ID `(default)` in **production mode** if needed. Deploy the repository's rules and leave-request index from the project root. Replace `YOUR_PROJECT_ID` with the same project ID you set in `.env`. [Firestore setup](https://firebase.google.com/docs/firestore/quickstart), [Firebase CLI setup](https://firebase.google.com/docs/cli)

        ```bash
        npx firebase-tools login
        npx firebase-tools deploy --only firestore:rules,firestore:indexes --project YOUR_PROJECT_ID
        ```

    - In **Firestore Database → Data**, create the collection `users` and a document whose ID is the UID you copied. Add a **string** field named `role` with value `admin`. If that document already exists, edit its `role` field. Employees can check in and request leave when their `users/<UID>` document has a **number** field named `employeeId` that matches their employee record's `id`.
    - Profile photo uploads are optional. They use Cloud Storage, which requires the Blaze plan. If you enable Storage, update `VITE_FIREBASE_STORAGE_BUCKET` with the actual bucket from the web config and run `npx firebase-tools deploy --only storage --project YOUR_PROJECT_ID`. [Cloud Storage billing requirements](https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024)

5.  **Run the development server**
    ```bash
    npm run dev
    ```

    Open the local URL shown in the terminal and sign in with your Firebase Authentication account. The admin dashboard imports the bundled sample employees if the `employees` collection is empty.

6.  **Build for production**
    ```bash
    npm run build
    ```

### Daily demo attendance

The demo dataset uses eight employee profiles labeled **(Demo)** and tagged with `demoDataset: daily-attendance-v1`. The scheduled job adds the day's sample attendance and fills in checkout times for past days. It only works with those demo profiles and preserves existing attendance entries and administrator edits.

Vercel calls `/api/demo-attendance` once daily during the 9 a.m. Asia/Dhaka hour. The job requires the deployed Firestore rules, a dedicated Firebase Authentication user with UID `vercel-demo-attendance-scheduler`, and the production Vercel secrets `DEMO_VERCEL_SYNC_EMAIL`, `DEMO_VERCEL_SYNC_PASSWORD`, and `CRON_SECRET`. It uses the project's existing Firebase web API key and project ID.

You can trigger it from **Vercel → Schedules → Cron Jobs**. Keep one scheduled runner enabled for this dataset. [Managing Vercel Cron Jobs](https://vercel.com/docs/schedules/cron-jobs/manage-cron-jobs)

## 📂 Project Structure

```
src/
├── assets/          # Static assets (images, fonts)
├── components/      # Reusable UI components (Sidebar, Topbar, etc.)
├── data/            # Mock data or static configurations
├── router/          # Vue Router configuration
├── stores/          # Pinia state stores (employeeStore, etc.)
├── views/           # Main page views (Dashboard, Attendance, Payroll, etc.)
├── App.vue          # Root component
└── main.js          # Application entry point
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/TanvirJahan001">Tanvir Jahan</a>
</p>
