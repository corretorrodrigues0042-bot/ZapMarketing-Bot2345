import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// --- CONFIGURAÇÃO ---
// Se você não colocar as chaves, o App vai rodar em MODO LOCAL (LocalStorage) automaticamente.
// O plano SPARK do Firebase é GRATUITO para o que precisamos.

const firebaseConfig = {
  apiKey: "SUA_API_KEY_AQUI", // <--- Cole sua chave aqui APENAS se quiser sincronizar online
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

// Verifica se está configurado corretamente
export const isFirebaseConfigured = firebaseConfig.apiKey && firebaseConfig.apiKey !== "SUA_API_KEY_AQUI";

let app;
let auth;
let db;

// Só inicializa o Firebase se tiver chave, para não dar erro no console
if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (error) {
    console.warn("Erro ao iniciar Firebase. Rodando em modo Offline.", error);
    // Fallback para garantir que o app não quebre
    auth = null;
    db = null;
  }
} else {
  console.log("⚠️ Firebase não configurado. Rodando em MODO LOCAL (Offline).");
  auth = null;
  db = null;
}

export { auth, db };