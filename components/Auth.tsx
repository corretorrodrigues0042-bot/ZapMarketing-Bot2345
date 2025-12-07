import React, { useState } from 'react';
import { Bot, Lock, ArrowRight, Loader2, Sparkles, ShieldCheck, Mail, Database, HardDrive } from 'lucide-react';
import { User } from '../types';
import { auth, db, isFirebaseConfigured } from '../services/firebaseConfig';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // LOGIN MODO LOCAL / DEMO (Sem Firebase)
  const handleLocalLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
        onLogin({
            uid: 'local-user-admin',
            email: 'admin@local.com',
            name: 'Administrador (Local)',
            plan: 'pro', // No modo local liberamos o PRO para teste
            isAuthenticated: true
        });
        setIsLoading(false);
    }, 1000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Se Firebase NÃO estiver configurado, simula login local
    if (!isFirebaseConfigured || !auth) {
        handleLocalLogin();
        return;
    }

    try {
      if (isLogin) {
        // LOGIN FIREBASE
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;
        
        const docRef = doc(db!, 'users', uid);
        const docSnap = await getDoc(docRef);
        const userData = docSnap.exists() ? docSnap.data() : {};

        onLogin({
          uid: uid,
          email: userCredential.user.email || '',
          name: userCredential.user.displayName || userData.name || 'Usuário',
          plan: userData.plan || 'free',
          isAuthenticated: true
        });

      } else {
        // CADASTRO FIREBASE
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        await updateProfile(user, { displayName: name });

        await setDoc(doc(db!, 'users', user.uid), {
          name: name,
          email: email,
          plan: 'free',
          createdAt: new Date().toISOString()
        });

        onLogin({
          uid: user.uid,
          email: email,
          name: name,
          plan: 'free',
          isAuthenticated: true
        });
      }
    } catch (err: any) {
      console.error(err);
      let msg = "Erro na autenticação.";
      if (err.code === 'auth/invalid-credential') msg = "Email ou senha incorretos.";
      if (err.code === 'auth/email-already-in-use') msg = "Este email já está cadastrado.";
      if (err.code === 'auth/weak-password') msg = "A senha deve ter pelo menos 6 caracteres.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Abstract */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col md:flex-row overflow-hidden z-10 min-h-[500px]">
        
        {/* Left Side - Brand */}
        <div className="hidden md:flex flex-col justify-center w-5/12 p-12 bg-gradient-to-br from-slate-900 to-slate-800 text-white border-r border-white/5 relative">
          <div className="relative z-10 space-y-6">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/50">
               <Bot className="w-7 h-7 text-white" />
            </div>
            
            <div>
              <h1 className="text-3xl font-bold tracking-tight">ZapMarketing</h1>
              <p className="text-slate-400 mt-2 text-sm leading-relaxed">
                Plataforma de automação e inteligência artificial para escala de vendas.
              </p>
            </div>

            <div className="space-y-4 pt-4">
                <div className="flex items-center gap-3 text-sm text-slate-300">
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                    <span>IA Generativa (Gemini)</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-300">
                    {!isFirebaseConfigured ? (
                        <div className="flex items-center gap-2 text-emerald-400">
                            <HardDrive className="w-4 h-4" />
                            <span>Modo Offline (Grátis)</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-emerald-400">
                            <Database className="w-4 h-4" />
                            <span>Banco de Dados Online</span>
                        </div>
                    )}
                </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full md:w-7/12 p-8 md:p-12 bg-white flex flex-col justify-center">
          <div className="max-w-sm mx-auto w-full">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900">
                {!isFirebaseConfigured ? 'Acesso Local' : (isLogin ? 'Acessar Painel' : 'Criar Nova Conta')}
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                {!isFirebaseConfigured 
                    ? 'O Firebase não está configurado. Usaremos armazenamento local.' 
                    : (isLogin ? 'Entre para gerenciar suas campanhas.' : 'Teste grátis. Não precisa de cartão.')}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {!isFirebaseConfigured ? (
                 <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-yellow-800 font-medium mb-2">
                        ⚠️ Modo Demonstração
                    </p>
                    <p className="text-xs text-yellow-700">
                        Como você não configurou as chaves do Firebase, o app vai rodar direto no navegador. 
                        Seus dados ficarão salvos apenas neste computador.
                    </p>
                 </div>
              ) : (
                  <>
                    {!isLogin && (
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Nome Completo</label>
                            <input 
                            type="text" 
                            required
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none"
                            placeholder="Seu nome"
                            />
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                            <input 
                            type="email" 
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none"
                            placeholder="nome@empresa.com"
                            />
                        </div>
                    </div>
                    
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Senha</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                            <input 
                            type="password" 
                            required
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none"
                            placeholder="••••••••"
                            />
                        </div>
                    </div>
                  </>
              )}

              {error && (
                <div className="p-3 bg-red-50 text-red-600 text-xs font-medium rounded-lg border border-red-100 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                  <ShieldCheck className="w-3 h-3" /> {error}
                </div>
              )}

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full py-3.5 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0 mt-2"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {!isFirebaseConfigured ? 'Entrar no Modo Offline' : (isLogin ? 'Entrar' : 'Começar Grátis')}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {isFirebaseConfigured && (
                <div className="mt-8 text-center border-t border-slate-100 pt-6">
                <button 
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-sm text-blue-600 font-bold hover:text-blue-800 transition-colors"
                >
                    {isLogin ? 'Não possui acesso? Crie sua conta grátis' : 'Já tem conta? Fazer login'}
                </button>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;