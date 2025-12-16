
import React, { useState } from 'react';
import { Bot, Send, User, Trash2, BrainCircuit, PlayCircle } from 'lucide-react';
import { negotiateRealEstate } from '../services/geminiService';
import { PropertyDossier, ChatMessage, AppSettings } from '../types';

interface BotTrainerProps {
    settings: AppSettings;
}

const BotTrainer: React.FC<BotTrainerProps> = ({ settings }) => {
    // Estado do Dossiê Limpo
    const [dossier, setDossier] = useState<PropertyDossier>({
        title: '',
        price: '',
        location: '',
        details: '',
        ownerName: '',
        ownerPhone: '',
        isAvailable: true
    });

    const [history, setHistory] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim()) return;

        const userMsg: ChatMessage = { role: 'user', text: input };
        const newHistory = [...history, userMsg];
        
        setHistory(newHistory);
        setInput('');
        setIsThinking(true);

        const botResponseText = await negotiateRealEstate(newHistory, dossier, settings.googleApiKey);
        
        setIsThinking(false);
        setHistory(prev => [...prev, { role: 'model', text: botResponseText }]);
    };

    const resetChat = () => setHistory([]);

    return (
        <div className="max-w-6xl mx-auto h-[calc(100vh-120px)] flex flex-col md:flex-row gap-6">
            
            {/* Left: Configuration (The Dossier) */}
            <div className="w-full md:w-1/3 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-y-auto">
                <div className="mb-6 border-b border-slate-100 pb-4">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <BrainCircuit className="w-6 h-6 text-purple-600" /> Treinador de Bot
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">
                        Configure o contexto do imóvel e teste se o robô consegue te convencer a visitar.
                    </p>
                </div>

                <div className="space-y-4 flex-1">
                    <div>
                        <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Imóvel (Título)</label>
                        <input 
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                            value={dossier.title}
                            onChange={e => setDossier({...dossier, title: e.target.value})}
                            placeholder="Ex: Apartamento Jardins..."
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Preço</label>
                        <input 
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                            value={dossier.price}
                            onChange={e => setDossier({...dossier, price: e.target.value})}
                            placeholder="Ex: R$ 1.500.000"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Detalhes (Munição)</label>
                        <textarea 
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors h-40 resize-none"
                            value={dossier.details}
                            onChange={e => setDossier({...dossier, details: e.target.value})}
                            placeholder="Detalhes técnicos, pontos fortes, condomínio..."
                        />
                    </div>
                </div>
            </div>

            {/* Right: The Arena (Chat) */}
            <div className="flex-1 bg-slate-100 rounded-2xl flex flex-col border border-slate-200 shadow-inner overflow-hidden relative">
                
                {/* Chat Area */}
                <div className="flex-1 p-6 overflow-y-auto space-y-4">
                    {history.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-60">
                            <Bot className="w-16 h-16 mb-2" />
                            <p>O chat está vazio. Inicie enviando uma mensagem como cliente.</p>
                            <p className="text-xs mt-2">Ex: "Vi esse imóvel, qual o preço?"</p>
                        </div>
                    )}
                    
                    {history.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-4 rounded-2xl text-sm shadow-sm ${
                                msg.role === 'user' 
                                ? 'bg-slate-800 text-white rounded-tr-none' 
                                : 'bg-white text-slate-800 rounded-tl-none border border-slate-200'
                            }`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    
                    {isThinking && (
                        <div className="flex justify-start">
                            <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-none border border-slate-200 flex items-center gap-2">
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100" />
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-slate-200 flex gap-2">
                    <button onClick={resetChat} className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Limpar">
                        <Trash2 className="w-5 h-5" />
                    </button>
                    <form onSubmit={handleSendMessage} className="flex-1 flex gap-2">
                        <input 
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                            placeholder="Digite como um cliente..."
                            value={input}
                            onChange={e => setInput(e.target.value)}
                        />
                        <button type="submit" disabled={isThinking || !input} className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50">
                            <Send className="w-5 h-5" />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default BotTrainer;
