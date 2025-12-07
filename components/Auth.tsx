import React, { useState } from 'react';
import { Bot, Lock, ArrowRight, Loader2, Sparkles, Mail, CheckCircle, Smartphone } from 'lucide-react';
import { User } from '../types';
import { authService } from '../services/authService';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      let result;
      if (isLogin) {
        result = await authService.login(email, password);
      } else {
        result = await authService.register(name, email, password);
      }

      if (result.error) {
        setError(result.error);
      } else if (result.user) {
        onLogin(result.user);
      }
    } catch (err: any) {
      setError("Erro inesperado. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl flex overflow-hidden min-h-[600px] border border-slate-100">
        
        {/* Lado Esquerdo - Marketing/AppStore Vibe */}
        <div className="hidden lg:flex w-5/12 bg-slate-900 text-white p-12 flex-col justify-between relative overflow-hidden">
           {/* Abstract Shapes */}
           <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full blur-[100px] opacity-40 translate-x-1/2 -translate-y-1/2"></div>
           <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600 rounded-full blur-[100px] opacity-40 -translate-x-1/2 translate-y-1/2"></div>
           
           <div className="relative z-10">
              <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 mb-8">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold leading-tight mb-4">
                Automatize suas vendas no WhatsApp.
              </h1>
              <p className="text-slate-400 text-lg leading-relaxed">
                A ferramenta secreta dos Top Corretores e Vendedores. Minere leads, agende visitas e feche contratos enquanto dorme.
              </p>
           </div>

           <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                    <CheckCircle className="w-5 h-5" />
                 </div>
                 <span className="font-medium">IA Generativa Inclusa</span>
              </div>
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                    <CheckCircle className="w-5 h-5" />
                 </div>
                 <span className="font-medium">Gestão de Leads (CRM)</span>
              </div>
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                    <CheckCircle className="w-5 h-5" />
                 </div>
                 <span className="font-medium">Disparos em Massa</span>
              </div>
           </div>
        </div>

        {/* Lado Direito - Formulário */}
        <div className="w-full lg:w-7/12 p-8 md:p-16 flex flex-col justify-center bg-white">
           <div className="max-w-md mx-auto w-full">
              <div className="text-center mb-10">
                 <h2 className="text-3xl font-bold text-slate-900 mb-2">
                    {isLogin ? 'Bem-vindo de volta' : 'Crie sua conta Grátis'}
                 </h2>
                 <p className="text-slate-500">
                    {isLogin ? 'Entre para gerenciar suas campanhas.' : 'Teste todas as funcionalidades hoje.'}
                 </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                 {!isLogin && (
                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-slate-700">Nome Completo</label>
                        <input 
                            type="text" 
                            required 
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                            placeholder="Ex: João Silva"
                        />
                    </div>
                 )}

                 <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Email Profissional</label>
                    <div className="relative">
                        <Mail className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
                        <input 
                            type="email" 
                            required 
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                            placeholder="seu@email.com"
                        />
                    </div>
                 </div>

                 <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700 flex justify-between">
                        Senha
                        {isLogin && <a href="#" className="text-blue-600 hover:underline font-normal">Esqueceu?</a>}
                    </label>
                    <div className="relative">
                        <Lock className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
                        <input 
                            type="password" 
                            required 
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                            placeholder="••••••••"
                        />
                    </div>
                 </div>

                 {error && (
                    <div className="p-4 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                        <Smartphone className="w-4 h-4" /> {error}
                    </div>
                 )}

                 <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transform active:scale-95"
                 >
                    {isLoading ? <Loader2 className="animate-spin" /> : (isLogin ? 'Entrar no Painel' : 'Começar Agora')}
                    {!isLoading && <ArrowRight className="w-5 h-5" />}
                 </button>
              </form>

              <div className="mt-8 text-center">
                 <p className="text-slate-500 text-sm">
                    {isLogin ? 'Ainda não tem conta?' : 'Já possui cadastro?'} 
                    <button 
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-blue-600 font-bold ml-1 hover:underline"
                    >
                        {isLogin ? 'Cadastre-se' : 'Fazer Login'}
                    </button>
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
