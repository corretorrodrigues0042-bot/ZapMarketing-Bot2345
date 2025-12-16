
import { User } from '../types';
import { auth, isFirebaseConfigured } from './firebaseConfig';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, signOut } from 'firebase/auth';

const STORAGE_KEY_SESSION = 'zap_marketing_session';

export const authService = {
  // --- REGISTRO ---
  register: async (name: string, email: string, password: string): Promise<{ user: User | null; error?: string }> => {
    // 1. MODO LOCAL (Sem Firebase)
    if (!isFirebaseConfigured || !auth) {
        console.warn("Firebase não configurado. Usando Auth Local.");
        const newUser: User = {
            uid: `local-${Date.now()}`,
            name: name,
            email: email,
            plan: 'free',
            isAuthenticated: true,
            isAdmin: true // No modo local, o usuário é admin
        };
        authService.setSession(newUser);
        return { user: newUser };
    }

    // 2. MODO FIREBASE
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      await updateProfile(firebaseUser, { displayName: name });

      const newUser: User = {
        uid: firebaseUser.uid,
        name: name,
        email: email,
        plan: 'free',
        isAuthenticated: true,
        isAdmin: false
      };

      authService.setSession(newUser);
      return { user: newUser };
    } catch (error: any) {
      console.error("Erro no registro Firebase:", error);
      let errorMessage = "Erro ao criar conta.";
      if (error.code === 'auth/email-already-in-use') errorMessage = "Este e-mail já está em uso.";
      if (error.code === 'auth/weak-password') errorMessage = "A senha é muito fraca (mínimo 6 caracteres).";
      if (error.code === 'auth/invalid-email') errorMessage = "E-mail inválido.";
      return { user: null, error: errorMessage };
    }
  },

  // --- LOGIN ---
  login: async (email: string, password: string): Promise<{ user: User | null; error?: string }> => {
    // 1. MODO LOCAL (Sem Firebase)
    if (!isFirebaseConfigured || !auth) {
        console.warn("Firebase não configurado. Usando Auth Local.");
        const localUser: User = {
            uid: 'local-admin',
            name: 'Admin Local',
            email: email,
            plan: 'free',
            isAuthenticated: true,
            isAdmin: true
        };
        authService.setSession(localUser);
        return { user: localUser };
    }

    // 2. MODO FIREBASE
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      const loggedUser: User = {
        uid: firebaseUser.uid,
        name: firebaseUser.displayName || 'Usuário',
        email: firebaseUser.email || email,
        plan: 'free',
        isAuthenticated: true,
        isAdmin: false 
      };

      authService.setSession(loggedUser);
      return { user: loggedUser };
    } catch (error: any) {
      console.error("Erro no login Firebase:", error);
      let errorMessage = "Erro ao fazer login.";
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = "E-mail ou senha incorretos.";
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Muitas tentativas falhas. Tente novamente mais tarde.";
      }
      return { user: null, error: errorMessage };
    }
  },

  // --- LICENCIAMENTO ---
  activateLicense: async (userId: string, licenseKey: string): Promise<{ success: boolean; plan?: string }> => {
     const key = licenseKey.toUpperCase().trim();
     let newPlan: 'pro' | 'enterprise' | null = null;
     
     if (key.startsWith('PRO') || key === 'VIP2025') newPlan = 'pro';
     if (key.startsWith('ENT') || key === 'AGENCIA2025') newPlan = 'enterprise';

     if (newPlan) {
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

  // --- SESSÃO (LOCALSTORAGE) ---
  setSession: (user: User) => {
    localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(user));
  },

  getSession: (): User | null => {
    const session = localStorage.getItem(STORAGE_KEY_SESSION);
    return session ? JSON.parse(session) : null;
  },

  logout: async () => {
    try {
      if (isFirebaseConfigured && auth) {
        await signOut(auth);
      }
    } catch (error) {
      console.error("Erro ao deslogar", error);
    }
    localStorage.removeItem(STORAGE_KEY_SESSION);
  }
};
