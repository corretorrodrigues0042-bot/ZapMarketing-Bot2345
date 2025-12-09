import { createClient } from '@supabase/supabase-js';

// Função segura para pegar variáveis de ambiente
const getEnv = (key: string) => {
  try {
    // @ts-ignore
    return import.meta?.env?.[key] || '';
  } catch (e) {
    return '';
  }
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

// Cria o cliente apenas se as chaves existirem
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

if (isSupabaseConfigured) {
    console.log("✅ Supabase Conectado.");
} else {
    console.log("⚠️ Supabase não configurado (Faltam VITE_SUPABASE_URL e Key). Usando modo LocalStorage.");
}