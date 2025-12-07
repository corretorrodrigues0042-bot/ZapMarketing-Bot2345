import { User } from '../types';

// Simulando uma tabela de usuários do Banco de Dados Neon
// Em produção, isso seria substituído por chamadas API para seu backend
const STORAGE_KEY_USERS = 'zap_neon_users_v1';
const STORAGE_KEY_SESSION = 'zap_neon_session_v1';

export const authService = {
  // --- REGISTRO ---
  register: async (name: string, email: string, password: string): Promise<{ user: User | null; error?: string }> => {
    // Simula delay de rede
    await new Promise(r => setTimeout(r, 800));

    const users = JSON.parse(localStorage.getItem(STORAGE_KEY_USERS) || '[]');
    
    if (users.find((u: any) => u.email === email)) {
        return { user: null, error: 'Este email já está cadastrado.' };
    }

    const newUser: User = {
        uid: `user-${Date.now()}`, // ID estilo Neon/UUID
        name,
        email,
        plan: 'free',
        isAuthenticated: true,
        isAdmin: false
    };

    // Salva o "hash" da senha (simulado)
    const userRecord = { ...newUser, password }; // Em prod, nunca salve senha pura!
    users.push(userRecord);
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));

    // Auto login
    authService.setSession(newUser);
    return { user: newUser };
  },

  // --- LOGIN ---
  login: async (email: string, password: string): Promise<{ user: User | null; error?: string }> => {
    await new Promise(r => setTimeout(r, 800));
    
    // BACKDOOR PARA ADMIN (Remover em produção se desejar)
    if (email === 'admin@zap.com' && password === 'admin123') {
        const adminUser: User = {
            uid: 'admin-master',
            name: 'Administrador',
            email: 'admin@zap.com',
            plan: 'enterprise',
            isAuthenticated: true,
            isAdmin: true
        };
        authService.setSession(adminUser);
        return { user: adminUser };
    }

    const users = JSON.parse(localStorage.getItem(STORAGE_KEY_USERS) || '[]');
    const found = users.find((u: any) => u.email === email && u.password === password);

    if (found) {
        const { password, ...safeUser } = found;
        authService.setSession(safeUser);
        return { user: safeUser };
    }

    return { user: null, error: 'Email ou senha inválidos.' };
  },

  // --- SESSÃO ---
  setSession: (user: User) => {
    localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(user));
  },

  getSession: (): User | null => {
    const session = localStorage.getItem(STORAGE_KEY_SESSION);
    return session ? JSON.parse(session) : null;
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEY_SESSION);
  },

  // --- HOTMART / APP STORE ACTIVATION ---
  activateLicense: async (userId: string, licenseKey: string): Promise<{ success: boolean; plan?: string }> => {
     await new Promise(r => setTimeout(r, 1000));
     
     // Simulação de validação de chave (Webhook Hotmart)
     // Formatos aceitos para teste: PRO-123, ENT-123
     const key = licenseKey.toUpperCase().trim();
     
     let newPlan: 'pro' | 'enterprise' | null = null;
     
     if (key.startsWith('PRO-') || key === 'VIP2025') newPlan = 'pro';
     if (key.startsWith('ENT-') || key === 'AGENCIA2025') newPlan = 'enterprise';

     if (newPlan) {
         // Atualiza no "Banco de Dados"
         const users = JSON.parse(localStorage.getItem(STORAGE_KEY_USERS) || '[]');
         const updatedUsers = users.map((u: any) => {
             if (u.uid === userId) return { ...u, plan: newPlan };
             return u;
         });
         localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(updatedUsers));
         
         // Atualiza Sessão Atual
         const currentSession = authService.getSession();
         if (currentSession && currentSession.uid === userId) {
             authService.setSession({ ...currentSession, plan: newPlan as any });
         }

         return { success: true, plan: newPlan };
     }

     return { success: false };
  }
};
