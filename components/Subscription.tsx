import React from 'react';
import { Check, Zap, Crown, Shield, Smartphone, ArrowRight } from 'lucide-react';
import { User } from '../types';

interface SubscriptionProps {
    user: User;
}

const Subscription: React.FC<SubscriptionProps> = ({ user }) => {
    
    // GERA O LINK DE WHATSAPP JÁ COM O EMAIL DO CLIENTE PARA FACILITAR A LIBERAÇÃO
    const getPaymentLink = (plan: string, price: string) => {
        const message = `Olá! Quero assinar o plano *${plan}* do ZapMarketing.\n\nMeu Email de cadastro é: *${user.email}*\nValor: R$ ${price}\n\nQual a chave Pix?`;
        
        // --- CONFIGURAÇÃO: COLOQUE SEU NÚMERO AQUI ---
        const seuNumeroWhatsApp = "5511999999999"; 
        
        return `https://wa.me/${seuNumeroWhatsApp}?text=${encodeURIComponent(message)}`;
    };

    return (
        <div className="max-w-6xl mx-auto py-12 px-4">
            <div className="text-center mb-16">
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4 inline-block">
                    Planos & Preços
                </span>
                <h2 className="text-4xl font-bold text-slate-900 mb-4">Escolha seu Poder de Fogo</h2>
                <p className="text-xl text-slate-500 max-w-2xl mx-auto">
                    Libere o potencial máximo da Inteligência Artificial para vender imóveis no automático.
                </p>
                
                <div className="mt-8 flex justify-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg text-slate-600 font-medium text-sm">
                        <Shield className="w-4 h-4" /> Pagamento Seguro via Pix ou Cartão
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                
                {/* Free Plan */}
                <div className="bg-white rounded-2xl p-8 border border-slate-200 flex flex-col hover:border-slate-300 transition-all">
                    <div className="mb-4">
                        <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Iniciante</span>
                        <h3 className="text-3xl font-bold text-slate-900 mt-2">Grátis</h3>
                        <p className="text-slate-400 text-sm mt-1">Para conhecer a plataforma.</p>
                    </div>
                    <ul className="space-y-4 mb-8 flex-1">
                        <li className="flex gap-3 text-slate-600 text-sm"><Check className="w-5 h-5 text-green-500 flex-shrink-0" /> 10 Disparos manuais/dia</li>
                        <li className="flex gap-3 text-slate-600 text-sm"><Check className="w-5 h-5 text-green-500 flex-shrink-0" /> 1 Campanha Ativa</li>
                        <li className="flex gap-3 text-slate-600 text-sm"><Check className="w-5 h-5 text-green-500 flex-shrink-0" /> Gestão de Leads Básica</li>
                        <li className="flex gap-3 text-slate-400 text-sm line-through"><Shield className="w-5 h-5 flex-shrink-0" /> Sem IA de Mineração</li>
                    </ul>
                    <button disabled className="w-full py-3 rounded-xl border border-slate-200 font-bold text-slate-500 bg-slate-50 cursor-default">
                        {user.plan === 'free' ? 'Seu Plano Atual' : 'Disponível'}
                    </button>
                </div>

                {/* Pro Plan (Best Seller) */}
                <div className="bg-slate-900 rounded-2xl p-8 border border-slate-800 flex flex-col relative transform md:-translate-y-4 shadow-2xl ring-1 ring-white/10">
                    <div className="absolute top-0 right-0 left-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold px-3 py-1.5 rounded-t-xl text-center tracking-widest uppercase">
                        Recomendado para Corretores
                    </div>
                    <div className="mb-4 mt-4">
                        <span className="text-sm font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                             <Zap className="w-4 h-4" /> Profissional
                        </span>
                        <h3 className="text-4xl font-bold text-white mt-2">R$ 97<span className="text-lg text-slate-400 font-normal">/mês</span></h3>
                        <p className="text-slate-400 text-sm mt-1">Ferramentas completas de automação.</p>
                    </div>
                    <ul className="space-y-4 mb-8 flex-1">
                        <li className="flex gap-3 text-slate-300 text-sm"><Check className="w-5 h-5 text-blue-400 flex-shrink-0" /> <strong>Disparos Ilimitados</strong></li>
                        <li className="flex gap-3 text-slate-300 text-sm"><Check className="w-5 h-5 text-blue-400 flex-shrink-0" /> 10 Campanhas Simultâneas</li>
                        <li className="flex gap-3 text-slate-300 text-sm"><Check className="w-5 h-5 text-blue-400 flex-shrink-0" /> <strong>IA Copywriter</strong> (Cria os textos)</li>
                        <li className="flex gap-3 text-slate-300 text-sm"><Check className="w-5 h-5 text-blue-400 flex-shrink-0" /> <strong>Mineração de Leads</strong> (Facebook/Insta)</li>
                        <li className="flex gap-3 text-slate-300 text-sm"><Check className="w-5 h-5 text-blue-400 flex-shrink-0" /> Suporte Prioritário</li>
                    </ul>
                    
                    {user.plan === 'pro' || user.plan === 'enterprise' ? (
                         <div className="w-full py-4 rounded-xl bg-green-500/20 border border-green-500/50 text-green-400 font-bold text-center flex items-center justify-center gap-2">
                            <Check className="w-5 h-5" /> Plano Ativo
                         </div>
                    ) : (
                        <a 
                            href={getPaymentLink('Profissional', '97,00')} 
                            target="_blank"
                            rel="noreferrer"
                            className="w-full py-4 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-all text-center shadow-lg shadow-blue-900/50 flex items-center justify-center gap-2 group"
                        >
                            <Smartphone className="w-5 h-5" /> Assinar Agora
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </a>
                    )}
                </div>

                {/* Enterprise Plan */}
                <div className="bg-white rounded-2xl p-8 border border-slate-200 flex flex-col hover:border-purple-300 transition-all">
                     <div className="mb-4">
                        <span className="text-sm font-bold text-purple-600 uppercase tracking-wider flex items-center gap-2">
                             <Crown className="w-4 h-4" /> Imobiliária
                        </span>
                        <h3 className="text-3xl font-bold text-slate-900 mt-2">R$ 297<span className="text-lg text-slate-400 font-normal">/mês</span></h3>
                        <p className="text-slate-400 text-sm mt-1">Para times e agências.</p>
                    </div>
                    <ul className="space-y-4 mb-8 flex-1">
                        <li className="flex gap-3 text-slate-600 text-sm"><Check className="w-5 h-5 text-purple-500 flex-shrink-0" /> Tudo do Plano Pro</li>
                        <li className="flex gap-3 text-slate-600 text-sm"><Check className="w-5 h-5 text-purple-500 flex-shrink-0" /> Multi-usuários (Até 5 logins)</li>
                        <li className="flex gap-3 text-slate-600 text-sm"><Check className="w-5 h-5 text-purple-500 flex-shrink-0" /> API Dedicada de Alta Velocidade</li>
                        <li className="flex gap-3 text-slate-600 text-sm"><Check className="w-5 h-5 text-purple-500 flex-shrink-0" /> Consultoria de Implementação</li>
                    </ul>
                    {user.plan === 'enterprise' ? (
                         <div className="w-full py-3 rounded-xl bg-purple-100 text-purple-700 font-bold text-center">
                             Plano Ativo
                         </div>
                    ) : (
                        <a 
                            href={getPaymentLink('Enterprise', '297,00')}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full py-3 rounded-xl border-2 border-slate-100 font-bold text-slate-700 hover:border-purple-200 hover:bg-purple-50 hover:text-purple-700 transition-all text-center flex items-center justify-center gap-2"
                        >
                            <Smartphone className="w-4 h-4" /> Falar com Consultor
                        </a>
                    )}
                </div>
            </div>
            
            <div className="mt-12 text-center text-slate-400 text-sm">
                Precisa de ajuda? <a href="#" className="underline hover:text-slate-600">Entre em contato com o suporte</a>.
            </div>
        </div>
    );
};

export default Subscription;