
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Helper function to safely access environment variables in Vite without type errors
const getEnv = (key: string): string => {
  try {
    return (import.meta as any).env?.[key] || "";
  } catch (e) {
    return "";
  }
};

// CONFIGURAÇÃO ZERADA / ENV
const firebaseConfig = {
  apiKey: getEnv("VITE_FIREBASE_API_KEY"),
  authDomain: getEnv("VITE_FIREBASE_AUTH_DOMAIN"),
  projectId: getEnv("VITE_FIREBASE_PROJECT_ID"),
  storageBucket: getEnv("VITE_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: getEnv("VITE_FIREBASE_MESSAGING_SENDER_ID"),
  appId: getEnv("VITE_FIREBASE_APP_ID"),
  measurementId: getEnv("VITE_FIREBASE_MEASUREMENT_ID")
};

// Inicializa o Firebase APENAS se houver API Key configurada
// Caso contrário, exporta null para que o authService use o modo Local
const app = firebaseConfig.apiKey ? initializeApp(firebaseConfig) : null;

export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export const analytics = app ? getAnalytics(app) : null;

export const isFirebaseConfigured = !!app;
