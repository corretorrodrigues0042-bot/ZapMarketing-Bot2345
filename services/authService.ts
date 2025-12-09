import { User } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const STORAGE_KEY_SESSION = 'zap_marketing_session';

export const authService = {
  // --- REGISTRO (SUPABASE) ---
  register: async (name: string, email: string, password: string): Promise<{ user: User | null; error?: string }> => {
    if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { name } // Salva o nome nos metadados
            }
        });

        if (error) return { user: null, error: error.message };
        
        if (data.user) {
            // Cria o objeto de usuário local
            const newUser: User = {
                uid: data.user.id,
                name: name,
                email: email,
                plan: 'free',
                isAuthenticated: true,
                isAdmin: false
            };
            authService.setSession(newUser);
            return { user: newUser };
        }
    }

    // Fallback Local (Sem Supabase)
    return mockRegister(name, email, password);
  },

  // --- LOGIN (SUPABASE) ---
  login: async (email: string, password: string): Promise<{ user: User | null; error?: string }> => {
    if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) return { user: null, error: error.message };

        if (data.user) {
            // Busca o perfil completo (incluindo plano) da tabela 'profiles'
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', data.user.id)
                .single();

            const loggedUser: User = {
                uid: data.user.id,
                name: profile?.name || data.user.user_metadata.name || 'Usuário',
                email: data.user.email || email,
                plan: profile?.plan || 'free',
                isAuthenticated: true,
                isAdmin: profile?.is_admin || false
            };
            
            authService.setSession(loggedUser);
            return { user: loggedUser };
        }
    }

    // Fallback Local
    return mockLogin(email, password);
  },

  // --- LICENCIAMENTO (PORTA DE INTEGRAÇÃO ABERTA) ---
  // Esta função atualiza o plano no Supabase sem cobrar valor agora.
  // Futuramente, você pode integrar Stripe/Hotmart aqui antes de chamar o update.
  activateLicense: async (userId: string, licenseKey: string): Promise<{ success: boolean; plan?: string }> => {
     
     // 1. Lógica Aberta: Aceita chaves baseadas em prefixo ou chaves mestras
     const key = licenseKey.toUpperCase().trim();
     let newPlan: 'pro' | 'enterprise' | null = null;
     
     if (key.startsWith('PRO') || key === 'VIP2025') newPlan = 'pro';
     if (key.startsWith('ENT') || key === 'AGENCIA2025') newPlan = 'enterprise';

     if (newPlan) {
         if (isSupabaseConfigured && supabase) {
             // Atualiza no Banco de Dados Real
             const { error } = await supabase
                .from('profiles')
                .update({ plan: newPlan })
                .eq('id', userId);
            
             if (error) {
                 console.error("Erro ao ativar licença no DB:", error);
                 return { success: false };
             }

             // Opcional: Registrar o uso da licença em uma tabela 'licenses' para auditoria futura
             await supabase.from('licenses').insert({
                 user_id: userId,
                 key_used: key,
                 plan_activated: newPlan
             });
         }

         // Atualiza Sessão Local
         const currentSession = authService.getSession();
         if (currentSession && currentSession.uid === userId) {
             const updatedUser = { ...currentSession, plan: newPlan as any };
             authService.setSession(updatedUser);
         }

         return { success: true, plan: newPlan };
     }

     return { success: false };
  },

  // --- SESSÃO ---
  setSession: (user: User) => {
    localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(user));
  },

  getSession: (): User | null => {
    const session = localStorage.getItem(STORAGE_KEY_SESSION);
    return session ? JSON.parse(session) : null;
  },

  logout: async () => {
    if (isSupabaseConfigured && supabase) {
        await supabase.auth.signOut();
    }
    localStorage.removeItem(STORAGE_KEY_SESSION);
  }
};

// --- MOCKS (APENAS PARA USO LOCAL SE SUPABASE FALHAR) ---
const mockRegister = async (name: string, email: string, password: string) => {
    await new Promise(r => setTimeout(r, 500));
    const newUser: User = { uid: `local-${Date.now()}`, name, email, plan: 'free', isAuthenticated: true, isAdmin: false };
    authService.setSession(newUser);
    return { user: newUser };
};

const mockLogin = async (email: string, password: string) => {
    await new Promise(r => setTimeout(r, 500));
    if (email === 'admin@zap.com' && password === 'admin') {
         const u: User = { uid: 'admin-local', name: 'Admin Local', email, plan: 'enterprise', isAuthenticated: true, isAdmin: true };
         authService.setSession(u);
         return { user: u };
    }
    const u: User = { uid: 'local-user', name: 'Usuário Local', email, plan: 'free', isAuthenticated: true, isAdmin: false };
    authService.setSession(u);
    return { user: u };
};
