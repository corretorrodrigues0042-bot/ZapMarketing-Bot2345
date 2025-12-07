import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// --- CONFIGURAÇÃO INTELIGENTE ---
// O código agora busca as chaves nas Variáveis de Ambiente do Netlify/Vite.
// Se não encontrar, tenta usar valores hardcoded (não recomendado para GitHub público).

const getEnv = (key: string) => {
  // @ts-ignore
  return import.meta.env[key];
}

const firebaseConfig = {
  apiKey: getEnv("VITE_FIREBASE_API_KEY") || "SUA_API_KEY_AQUI",
  authDomain: getEnv("VITE_FIREBASE_AUTH_DOMAIN") || "seu-projeto.firebaseapp.com",
  projectId: getEnv("VITE_FIREBASE_PROJECT_ID") || "seu-projeto",
  storageBucket: getEnv("VITE_FIREBASE_STORAGE_BUCKET") || "seu-projeto.appspot.com",
  messagingSenderId: getEnv("VITE_FIREBASE_MESSAGING_SENDER_ID") || "123456789",
  appId: getEnv("VITE_FIREBASE_APP_ID") || "1:123456789:web:abcdef"
};

// Verifica se as chaves reais foram carregadas (ignora os placeholders)
export const isFirebaseConfigured = 
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== "SUA_API_KEY_AQUI" &&
  !firebaseConfig.apiKey.includes("UNDEFINED");

let app;
let auth;
let db;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    console.log("🔥 Firebase Conectado via Variáveis de Ambiente!");
  } catch (error) {
    console.warn("Erro ao iniciar Firebase. Rodando em modo Offline.", error);
    auth = null;
    db = null;
  }
} else {
  console.log("⚠️ Firebase não configurado. Rodando em MODO LOCAL (Offline).");
  auth = null;
  db = null;
}

export { auth, db };