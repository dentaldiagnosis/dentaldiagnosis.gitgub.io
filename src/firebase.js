import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Replace the following with your app's Firebase project configuration
// See: https://firebase.google.com/docs/web/learn-more#config-object
const firebaseConfig = {
    apiKey: "AIzaSyDjkyfgdzX4gazj3Ghx6R-7Gq_1nHV0stA",
    authDomain: "deneme2-c2a48.firebaseapp.com",
    projectId: "deneme2-c2a48",
    storageBucket: "deneme2-c2a48.firebasestorage.app",
    messagingSenderId: "371095705524",
    appId: "1:371095705524:web:271505705d0ccceb8944e1",
    measurementId: "G-V0TEWB7RXX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Authentication and Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);
