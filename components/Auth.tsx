import React, { useState } from 'react';
import { Bot, Lock, ArrowRight, Loader2, Sparkles, ShieldCheck } from 'lucide-react';
import { User } from '../types';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // SIMULAÇÃO DE BACKEND
    setTimeout(() => {
      setIsLoading(false);
      if (email && password.length >= 6) {
        onLogin({
          email: email,
          name: email.split('@')[0],
          plan: 'pro',
          isAuthenticated: true
        });
      } else {
        setError('Acesso negado. Verifique suas credenciais.');
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Abstract */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl w-full max-w-4xl flex overflow-hidden z-10 min-h-[500px]">
        
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

            <div className="pt-8 border-t border-white/10">
               <div className="flex items-center gap-3 text-sm text-slate-300">
                 <ShieldCheck className="w-5 h-5 text-emerald-400" />
                 <span>Ambiente Seguro & Criptografado</span>
               </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full md:w-7/12 p-8 md:p-12 bg-white flex flex-col justify-center">
          <div className="max-w-sm mx-auto w-full">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900">
                {isLogin ? 'Acessar Painel' : 'Nova Conta'}
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                Entre com suas credenciais corporativas.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Email</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all"
                  placeholder="nome@empresa.com"
                />
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Senha</label>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-600 text-xs font-medium rounded-lg border border-red-100 flex items-center gap-2">
                  <Lock className="w-3 h-3" /> {error}
                </div>
              )}

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full py-3.5 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {isLogin ? 'Entrar' : 'Registrar'}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center border-t border-slate-100 pt-6">
              <button 
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-slate-500 hover:text-slate-900 transition-colors"
              >
                {isLogin ? 'Não possui acesso? Criar conta' : 'Já possui conta? Fazer login'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;