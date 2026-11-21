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

-   Node.js (v16.0 or higher)
-   npm or yarn

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/employee-attendance-payroll.git
    cd employee-attendance-payroll
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Configure Firebase**
    -   Create a project in the [Firebase Console](https://console.firebase.google.com/).
    -   Create a `.env` file in the root directory.
    -   Add your Firebase configuration keys:
        ```env
        VITE_FIREBASE_API_KEY=your_api_key
        VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
        VITE_FIREBASE_PROJECT_ID=your_project_id
        VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
        VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
        VITE_FIREBASE_APP_ID=your_app_id
        ```

4.  **Run the development server**
    ```bash
    npm run dev
    ```

5.  **Build for production**
    ```bash
    npm run build
    ```

### Daily demo attendance

The demo dataset uses eight employee profiles labeled **(Demo)** and tagged with `demoDataset: daily-attendance-v1`. The scheduled job adds the day's sample attendance and fills in checkout times for past days. It only works with those demo profiles and preserves existing attendance entries and administrator edits.

The **Daily demo attendance** GitHub Actions workflow is scheduled for 9:17 a.m. Asia/Dhaka. It requires the deployed Firestore rules and the dedicated Firebase Authentication user with UID `demo-attendance-scheduler`. The workflow reads the `DEMO_FIREBASE_PROJECT_ID` repository variable and the `DEMO_FIREBASE_WEB_API_KEY`, `DEMO_SYNC_EMAIL`, and `DEMO_SYNC_PASSWORD` Actions secrets.

You can also run it from **Actions → Daily demo attendance → Run workflow**. GitHub may disable scheduled workflows on public repositories after 60 days without repository activity. [GitHub Actions scheduling](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)

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
