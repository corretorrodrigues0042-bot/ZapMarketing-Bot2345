
import { createClient } from '@supabase/supabase-js';

// CONFIGURAÇÃO DO SUPABASE
// Credenciais integradas conforme solicitado
const DEFAULT_SUPABASE_URL = "https://bxdjwybiwpbaqjdhaubl.supabase.co";
const DEFAULT_SUPABASE_KEY = "sb_publishable_AAeX-dKg1EPHcJR0zCdUww_B6axrYYY";

// Função segura para pegar variáveis de ambiente ou do LocalStorage
const getSettings = () => {
  let settings: any = {};
  try {
    const saved = localStorage.getItem('zap_marketing_settings');
    if (saved) settings = JSON.parse(saved);
  } catch (e) {}
  return settings;
};

const settings = getSettings();

const getEnvOrSetting = (envKey: string, settingKey: string, defaultValue: string) => {
  let val = '';
  try {
    // @ts-ignore
    val = import.meta?.env?.[envKey];
  } catch (e) {}
  
  if (val) return val;
  // Se o usuário tiver algo salvo no localStorage (settings), usa. Se não, usa o Default Hardcoded.
  return settings[settingKey] || defaultValue;
};

const supabaseUrl = getEnvOrSetting('VITE_SUPABASE_URL', 'supabaseUrl', DEFAULT_SUPABASE_URL);
const supabaseAnonKey = getEnvOrSetting('VITE_SUPABASE_ANON_KEY', 'supabaseAnonKey', DEFAULT_SUPABASE_KEY);

// Verifica se temos chaves válidas (não vazias)
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

// Cria o cliente apenas se as chaves existirem
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    }) 
  : null;

if (isSupabaseConfigured) {
    console.log("✅ Supabase Conectado:", supabaseUrl);
} else {
    console.log("ℹ️ Supabase não configurado (Modo LocalStorage Ativo).");
}
