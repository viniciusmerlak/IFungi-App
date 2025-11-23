import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import Constants from 'expo-constants';

const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.firebaseApiKey,
  authDomain: Constants.expoConfig?.extra?.firebaseAuthDomain,
  databaseURL: "https://pfi-ifungi-default-rtdb.firebaseio.com", 
  projectId: "pfi-ifungi",
  storageBucket: "pfi-ifungi.firebasestorage.app",
  messagingSenderId: "94721839071",
  appId: "1:94721839071:web:dd469a1a28cab78964fe6a",
  measurementId: "G-PMPJ6BJGQN"
};
export const FIREBASE_APP = initializeApp(firebaseConfig);
export const FIREBASE_AUTH = getAuth(FIREBASE_APP);
export const analytics = getAnalytics(FIREBASE_APP);
export const FIREBASE_CONFIG = firebaseConfig;