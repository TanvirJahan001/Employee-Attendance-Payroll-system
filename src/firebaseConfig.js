import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Replace with your actual Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDA9m1D1TkWKwhQ0WWyJnFX_c0E_OmEjmw",
    authDomain: "employee-attendance-payroll.firebaseapp.com",
    projectId: "employee-attendance-payroll",
    storageBucket: "employee-attendance-payroll.firebasestorage.app",
    messagingSenderId: "199586240544",
    appId: "1:199586240544:web:1b1c04e8b59a2182d58445"

};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
