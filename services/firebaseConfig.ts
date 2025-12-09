
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// --- CONFIGURAÇÃO HÍBRIDA (ENV + LOCALSTORAGE) ---
// O código busca primeiro nas variáveis de ambiente (arquivo .env).
// Se não achar, busca no LocalStorage (configurado via UI do app).

const getSettingsFromStorage = () => {
    try {
        const saved = localStorage.getItem('zap_marketing_settings');
        return saved ? JSON.parse(saved) : {};
    } catch(e) { return {}; }
}

const settings = getSettingsFromStorage();

const getEnv = (envKey: string, settingKey: string) => {
  let envVal = '';
  try {
    // @ts-ignore
    envVal = import.meta?.env?.[envKey];
  } catch (e) {}

  if (envVal && !envVal.includes("SUA_API_KEY")) return envVal;
  
  // @ts-ignore
  return settings[settingKey];
}

const firebaseConfig = {
  apiKey: getEnv("VITE_FIREBASE_API_KEY", "firebaseApiKey") || "SUA_API_KEY_AQUI",
  authDomain: getEnv("VITE_FIREBASE_AUTH_DOMAIN", "firebaseAuthDomain") || "seu-projeto.firebaseapp.com",
  projectId: getEnv("VITE_FIREBASE_PROJECT_ID", "firebaseProjectId") || "seu-projeto",
  storageBucket: getEnv("VITE_FIREBASE_STORAGE_BUCKET", "firebaseStorageBucket") || "seu-projeto.appspot.com",
  messagingSenderId: getEnv("VITE_FIREBASE_MESSAGING_SENDER_ID", "firebaseMessagingSenderId") || "123456789",
  appId: getEnv("VITE_FIREBASE_APP_ID", "firebaseAppId") || "1:123456789:web:abcdef"
};

// Verifica se as chaves reais foram carregadas
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
    console.log("🔥 Firebase Inicializado com sucesso!");
  } catch (error) {
    console.warn("Erro ao iniciar Firebase. Verifique as chaves.", error);
    auth = null;
    db = null;
  }
} else {
  console.log("⚠️ Firebase não configurado. Rodando em MODO LOCAL (Offline).");
  auth = null;
  db = null;
}

export { auth, db };