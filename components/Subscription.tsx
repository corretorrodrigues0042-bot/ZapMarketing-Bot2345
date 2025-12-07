import React from 'react';
import { Check, Zap, Crown, Shield } from 'lucide-react';
import { User } from '../types';

interface SubscriptionProps {
    user: User;
}

const Subscription: React.FC<SubscriptionProps> = ({ user }) => {
    // DICA PARA VENDA: Crie Links de Pagamento no Stripe e cole nas hrefs abaixo
    const STRIPE_LINK_PRO = "https://buy.stripe.com/SEU_LINK_AQUI"; 
    const STRIPE_LINK_ENTERPRISE = "https://buy.stripe.com/SEU_LINK_AQUI";

    return (
        <div className="max-w-6xl mx-auto py-12 px-4">
            <div className="text-center mb-16">
                <h2 className="text-4xl font-bold text-slate-900 mb-4">Escolha seu Plano</h2>
                <p className="text-xl text-slate-500 max-w-2xl mx-auto">
                    Potencialize suas vendas com automação e inteligência artificial. Cancele quando quiser.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Free Plan */}
                <div className="bg-white rounded-2xl p-8 border border-slate-200 flex flex-col">
                    <div className="mb-4">
                        <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Iniciante</span>
                        <h3 className="text-3xl font-bold text-slate-900 mt-2">Grátis</h3>
                        <p className="text-slate-400 text-sm mt-1">Para testar a ferramenta.</p>
                    </div>
                    <ul className="space-y-4 mb-8 flex-1">
                        <li className="flex gap-3 text-slate-600 text-sm"><Check className="w-5 h-5 text-green-500" /> 10 Disparos / dia</li>
                        <li className="flex gap-3 text-slate-600 text-sm"><Check className="w-5 h-5 text-green-500" /> 1 Campanha Ativa</li>
                        <li className="flex gap-3 text-slate-600 text-sm"><Check className="w-5 h-5 text-green-500" /> CRM Básico</li>
                        <li className="flex gap-3 text-slate-400 text-sm line-through"><Shield className="w-5 h-5" /> Sem IA Avançada</li>
                    </ul>
                    <button className="w-full py-3 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 cursor-default">
                        Plano Atual
                    </button>
                </div>

                {/* Pro Plan (Best Seller) */}
                <div className="bg-slate-900 rounded-2xl p-8 border border-slate-800 flex flex-col relative transform scale-105 shadow-2xl">
                    <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl">
                        MAIS POPULAR
                    </div>
                    <div className="mb-4">
                        <span className="text-sm font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                             <Zap className="w-4 h-4" /> Profissional
                        </span>
                        <h3 className="text-3xl font-bold text-white mt-2">R$ 97<span className="text-lg text-slate-400 font-normal">/mês</span></h3>
                        <p className="text-slate-400 text-sm mt-1">Para corretores autônomos.</p>
                    </div>
                    <ul className="space-y-4 mb-8 flex-1">
                        <li className="flex gap-3 text-slate-300 text-sm"><Check className="w-5 h-5 text-blue-400" /> Disparos Ilimitados</li>
                        <li className="flex gap-3 text-slate-300 text-sm"><Check className="w-5 h-5 text-blue-400" /> 10 Campanhas Simultâneas</li>
                        <li className="flex gap-3 text-slate-300 text-sm"><Check className="w-5 h-5 text-blue-400" /> IA Generativa (Copywriter)</li>
                        <li className="flex gap-3 text-slate-300 text-sm"><Check className="w-5 h-5 text-blue-400" /> Mineração de Leads (OSINT)</li>
                        <li className="flex gap-3 text-slate-300 text-sm"><Check className="w-5 h-5 text-blue-400" /> Suporte Prioritário</li>
                    </ul>
                    <a 
                        href={STRIPE_LINK_PRO} 
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-4 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-all text-center shadow-lg shadow-blue-900/50 block"
                    >
                        Assinar Agora
                    </a>
                </div>

                {/* Enterprise Plan */}
                <div className="bg-white rounded-2xl p-8 border border-slate-200 flex flex-col">
                     <div className="mb-4">
                        <span className="text-sm font-bold text-purple-600 uppercase tracking-wider flex items-center gap-2">
                             <Crown className="w-4 h-4" /> Imobiliária
                        </span>
                        <h3 className="text-3xl font-bold text-slate-900 mt-2">R$ 297<span className="text-lg text-slate-400 font-normal">/mês</span></h3>
                        <p className="text-slate-400 text-sm mt-1">Para times e agências.</p>
                    </div>
                    <ul className="space-y-4 mb-8 flex-1">
                        <li className="flex gap-3 text-slate-600 text-sm"><Check className="w-5 h-5 text-purple-500" /> Tudo do Plano Pro</li>
                        <li className="flex gap-3 text-slate-600 text-sm"><Check className="w-5 h-5 text-purple-500" /> Multi-usuários (Até 5)</li>
                        <li className="flex gap-3 text-slate-600 text-sm"><Check className="w-5 h-5 text-purple-500" /> API Dedicada</li>
                        <li className="flex gap-3 text-slate-600 text-sm"><Check className="w-5 h-5 text-purple-500" /> Treinamento Personalizado</li>
                    </ul>
                    <a 
                        href={STRIPE_LINK_ENTERPRISE}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-3 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-50 transition-all text-center block"
                    >
                        Falar com Consultor
                    </a>
                </div>
            </div>
        </div>
    );
};

export default Subscription;