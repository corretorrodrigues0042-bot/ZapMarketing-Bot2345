// --- MIGRAÇÃO PARA NEON DB ---
// O Supabase foi removido conforme solicitado.
// Este arquivo agora serve como placeholder para a futura conexão direta com o Neon (PostgreSQL).

export const isSupabaseConfigured = false;
export const supabase = null;

// Função segura para ler variáveis de ambiente sem quebrar o app
const getEnvVar = (key: string) => {
  try {
    // @ts-ignore
    return import.meta.env?.[key] || '';
  } catch (e) {
    return '';
  }
};

export const neonConfig = {
    connectionString: getEnvVar('VITE_DATABASE_URL'), // URL do Neon
    ssl: true
};

console.log("🚀 Sistema migrado para Arquitetura Neon/Local (Supabase removido).");
