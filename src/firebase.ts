// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB9brz9AlwnWVyYseq4086Cy9LKTc4eca8",
  authDomain: "prodgain-crm-system.firebaseapp.com",
  projectId: "prodgain-crm-system",
  storageBucket: "prodgain-crm-system.firebasestorage.app",
  messagingSenderId: "1088281889727",
  appId: "1:1088281889727:web:e9169c6d7f90b733636f0a",
  measurementId: "G-71XR5PRYFD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();