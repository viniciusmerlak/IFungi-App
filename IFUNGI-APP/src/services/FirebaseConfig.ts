// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import Constants from 'expo-constants';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.firebaseApiKey,
  authDomain: Constants.expoConfig?.extra?.firebaseAuthDomain,
  projectId: "pfi-ifungi",
  storageBucket: "pfi-ifungi.firebasestorage.app",
  messagingSenderId: "94721839071",
  appId: "1:94721839071:web:dd469a1a28cab78964fe6a",
  measurementId: "G-PMPJ6BJGQN"
};

// Initialize Firebase
// Removed redundant export declaration for firebaseConfig
export const FIREBASE_APP = initializeApp(firebaseConfig);
export const FIREBASE_AUTH = getAuth(FIREBASE_APP);
export const analytics = getAnalytics(FIREBASE_APP);
export const FIREBASE_CONFIG = firebaseConfig; // Export firebaseConfig for use in other files
