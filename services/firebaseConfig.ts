import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// --- CONFIGURAÇÃO INTELIGENTE ---
// Garante acesso seguro ao import.meta.env para evitar erros em ambientes onde ele não existe
const getEnv = (key: string) => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      return import.meta.env[key];
    }
  } catch (e) {
    console.warn("Ambiente sem suporte a import.meta.env");
  }
  return undefined;
};

// Tenta pegar do ambiente ou usa valores placeholders
const apiKey = getEnv("VITE_FIREBASE_API_KEY") || "SUA_API_KEY_AQUI";
const authDomain = getEnv("VITE_FIREBASE_AUTH_DOMAIN") || "seu-projeto.firebaseapp.com";
const projectId = getEnv("VITE_FIREBASE_PROJECT_ID") || "seu-projeto";
const storageBucket = getEnv("VITE_FIREBASE_STORAGE_BUCKET") || "seu-projeto.appspot.com";
const messagingSenderId = getEnv("VITE_FIREBASE_MESSAGING_SENDER_ID") || "123456789";
const appId = getEnv("VITE_FIREBASE_APP_ID") || "1:123456789:web:abcdef";

const firebaseConfig = {
  apiKey,
  authDomain,
  projectId,
  storageBucket,
  messagingSenderId,
  appId
};

// Verifica se as chaves reais foram carregadas
export const isFirebaseConfigured = 
  apiKey && 
  apiKey !== "SUA_API_KEY_AQUI" &&
  !apiKey.includes("UNDEFINED");

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
  console.log("⚠️ Firebase não configurado (Chaves ausentes). Rodando em MODO LOCAL (Offline).");
  auth = null;
  db = null;
}

export { auth, db };