import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Search, Paperclip, MoreVertical, Calendar, CheckCircle, BrainCircuit, Home, User, Clock, Loader2, ArrowRight, Bot, Power, Link as LinkIcon, AlertTriangle } from 'lucide-react';
import { Contact, AppSettings, WhatsAppMessage, Campaign, Visit, ChatMessage } from '../types';
import { storageService } from '../services/storageService';
import { getChatHistory, sendWhatsAppMessage } from '../services/whatsappService';
import { negotiateRealEstate } from '../services/geminiService';
import { autoBotService } from '../services/autoBotService';

interface ChatCenterProps {
    settings: AppSettings;
    userId: string;
}

const ChatCenter: React.FC<ChatCenterProps> = ({ settings, userId }) => {
    // STATE: Dados
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
    
    // STATE: UI & Inputs
    const [inputText, setInputText] = useState('');
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    
    // STATE: Contexto da IA & CRM
    const [isThinking, setIsThinking] = useState(false);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [scheduleDate, setScheduleDate] = useState('');
    const [scheduleNotes, setScheduleNotes] = useState('');

    // STATE: AUTOMATION ENGINE
    const [isBotRunning, setIsBotRunning] = useState(false);
    const [botLogs, setBotLogs] = useState<string[]>([]);
    const [lastBotRun, setLastBotRun] = useState<string>('-');

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // 1. Carrega Contatos e Campanhas
    const loadData = async () => {
        const c = await storageService.getContacts(userId);
        const camps = await storageService.getCampaigns(userId);
        setContacts(c);
        setCampaigns(camps.filter(ca => ca.dossier)); // Só campanhas com dossiê
    };

    useEffect(() => {
        loadData();
    }, [userId]);

    // 2. Carrega Conversa ao Selecionar Contato
    useEffect(() => {
        if (!selectedContact) return;
        
        const fetchHistory = async () => {
            setIsLoadingHistory(true);
            const history = await getChatHistory(settings, selectedContact.id);
            setMessages(history);
            setIsLoadingHistory(false);
            scrollToBottom();
        };

        fetchHistory();
        
        // Polling para "mensagens ao vivo" (a cada 10s)
        const interval = setInterval(fetchHistory, 10000);
        return () => clearInterval(interval);
    }, [selectedContact, settings]);

    // 3. ENGINE DO ROBÔ (Polling Global)
    useEffect(() => {
        if (!isBotRunning) return;

        const runBotCycle = async () => {
            setLastBotRun(new Date().toLocaleTimeString());
            const result = await autoBotService.runCycle(settings, userId, contacts, campaigns);
            
            if (result.actions.length > 0) {
                setBotLogs(prev => [...result.actions, ...prev].slice(0, 5));
                // Recarrega dados se houver alteração (ex: agendamento mudou status)
                if (result.handled > 0) loadData();
            }
        };

        // Roda a cada 15 segundos
        const botInterval = setInterval(runBotCycle, 15000);
        return () => clearInterval(botInterval);
    }, [isBotRunning, contacts, campaigns, settings, userId]);


    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // FUNÇÃO: Enviar Mensagem
    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputText.trim() || !selectedContact) return;

        const textToSend = inputText;
        setInputText('');
        setIsSending(true);

        // Optimistic UI Update
        const optimisticMsg: WhatsAppMessage = {
            id: `temp-${Date.now()}`,
            chatId: selectedContact.id,
            senderId: 'me',
            text: textToSend,
            timestamp: Date.now(),
            fromMe: true,
            type: 'text'
        };
        setMessages(prev => [...prev, optimisticMsg]);
        scrollToBottom();

        const result = await sendWhatsAppMessage(selectedContact, textToSend, [], settings);
        
        if (!result.success) {
            alert("Erro ao enviar mensagem.");
        } else {
            // Atualiza status no CRM para 'contacted' se for novo
            if (selectedContact.pipelineStage === 'new') {
                const updated = { ...selectedContact, pipelineStage: 'contacted' as const };
                await storageService.saveContact(userId, updated);
                setContacts(prev => prev.map(c => c.id === updated.id ? updated : c));
            }
        }
        setIsSending(false);
    };

    // FUNÇÃO: IA Sugerir Resposta (Manual Override)
    const handleGenerateAiResponse = async () => {
        if (!selectedContact?.linkedCampaignId) return alert("Vincule um Imóvel a este contato primeiro (Painel à direita).");
        if (!selectedContact) return;

        const campaign = campaigns.find(c => c.id === selectedContact.linkedCampaignId);
        if (!campaign || !campaign.dossier) return;

        setIsThinking(true);

        // Converte histórico do WhatsApp para formato do Gemini
        const chatHistory: ChatMessage[] = messages.map(m => ({
            role: m.fromMe ? 'model' : 'user',
            text: m.text
        }));

        const response = await negotiateRealEstate(chatHistory, campaign.dossier, settings.googleApiKey);
        
        setInputText(response);
        setIsThinking(false);
    };

    // FUNÇÃO: Agendar Visita
    const handleScheduleVisit = async () => {
        if (!selectedContact || !scheduleDate) return;
        
        const visit: Visit = {
            id: `visit-${Date.now()}`,
            contactId: selectedContact.id,
            date: scheduleDate,
            notes: scheduleNotes || 'Agendado pelo Chat',
            completed: false
        };

        await storageService.saveVisit(userId, visit);
        
        // Atualiza CRM
        const updated = { ...selectedContact, pipelineStage: 'scheduled' as const };
        await storageService.saveContact(userId, updated);
        setContacts(prev => prev.map(c => c.id === updated.id ? updated : c));

        alert("Visita Agendada com Sucesso!");
        setShowScheduleModal(false);
        setScheduleDate('');
        setScheduleNotes('');
    };

    // FUNÇÃO: Toggle Auto Reply para um contato
    const toggleContactAutoReply = async (enabled: boolean) => {
        if (!selectedContact) return;
        const updated = { ...selectedContact, autoReplyEnabled: enabled };
        await storageService.saveContact(userId, updated);
        setContacts(prev => prev.map(c => c.id === updated.id ? updated : c));
        setSelectedContact(updated);
    };

    // FUNÇÃO: Vincular Campanha (Imóvel) ao Contato
    const linkCampaignToContact = async (campaignId: string) => {
        if (!selectedContact) return;
        const updated = { ...selectedContact, linkedCampaignId: campaignId };
        await storageService.saveContact(userId, updated);
        setContacts(prev => prev.map(c => c.id === updated.id ? updated : c));
        setSelectedContact(updated);
    };

    const filteredContacts = contacts.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone.includes(searchTerm));

    return (
        <div className="flex h-[calc(100vh-100px)] bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden max-w-[1600px] mx-auto">
            
            {/* 1. SIDEBAR DE CONTATOS (Esquerda) */}
            <div className="w-80 border-r border-slate-200 flex flex-col bg-slate-50">
                <div className="p-4 border-b border-slate-200 bg-white">
                    <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <MessageCircle className="w-5 h-5 text-green-600" /> Chat Center
                    </h2>
                    
                    {/* Bot Master Switch */}
                    <div className={`mb-4 p-3 rounded-xl border flex items-center justify-between transition-all ${isBotRunning ? 'bg-green-100 border-green-300' : 'bg-slate-100 border-slate-200'}`}>
                        <div className="flex items-center gap-2">
                             <div className={`p-1.5 rounded-full ${isBotRunning ? 'bg-green-500 text-white animate-pulse' : 'bg-slate-300 text-slate-500'}`}>
                                <Bot className="w-4 h-4" />
                             </div>
                             <div>
                                 <span className={`text-xs font-bold uppercase block ${isBotRunning ? 'text-green-800' : 'text-slate-500'}`}>
                                     {isBotRunning ? 'IA Ativa' : 'IA Pausada'}
                                 </span>
                                 {isBotRunning && <span className="text-[10px] text-green-600">Checando a cada 15s</span>}
                             </div>
                        </div>
                        <button 
                            onClick={() => setIsBotRunning(!isBotRunning)}
                            className={`p-2 rounded-lg transition-all ${isBotRunning ? 'text-green-700 hover:bg-green-200' : 'text-slate-400 hover:bg-slate-200'}`}
                        >
                            <Power className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input 
                            placeholder="Buscar conversa..."
                            className="w-full pl-9 pr-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                
                {/* Contact List */}
                <div className="flex-1 overflow-y-auto">
                    {filteredContacts.map(contact => (
                        <div 
                            key={contact.id}
                            onClick={() => setSelectedContact(contact)}
                            className={`p-4 border-b border-slate-100 cursor-pointer transition-colors hover:bg-white ${selectedContact?.id === contact.id ? 'bg-white border-l-4 border-l-green-500 shadow-sm' : ''}`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <h3 className="font-bold text-slate-900 text-sm truncate max-w-[140px]">{contact.name}</h3>
                                <div className="flex gap-1">
                                    {contact.autoReplyEnabled && <Bot className="w-3 h-3 text-blue-500" />}
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${
                                        contact.pipelineStage === 'scheduled' ? 'bg-purple-100 text-purple-700' :
                                        contact.pipelineStage === 'closed' ? 'bg-green-100 text-green-700' :
                                        'bg-slate-200 text-slate-600'
                                    }`}>
                                        {contact.pipelineStage || 'Novo'}
                                    </span>
                                </div>
                            </div>
                            <p className="text-xs text-slate-500 truncate">{contact.phone}</p>
                        </div>
                    ))}
                </div>

                {/* Mini Logs */}
                {isBotRunning && botLogs.length > 0 && (
                    <div className="p-2 bg-slate-900 text-green-400 text-[10px] font-mono border-t border-slate-800">
                        <div className="flex justify-between mb-1 opacity-50">
                            <span>LOGS DE IA</span>
                            <span>{lastBotRun}</span>
                        </div>
                        {botLogs.map((log, i) => (
                            <div key={i} className="truncate">• {log}</div>
                        ))}
                    </div>
                )}
            </div>

            {/* 2. ÁREA DE CHAT (Centro) */}
            <div className="flex-1 flex flex-col bg-[#efeae2] relative">
                {selectedContact ? (
                    <>
                        {/* Header Chat */}
                        <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold">
                                    {selectedContact.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">{selectedContact.name}</h3>
                                    <p className="text-xs text-slate-500 flex items-center gap-1">
                                        <span className={`w-2 h-2 rounded-full ${selectedContact.autoReplyEnabled ? 'bg-blue-500' : 'bg-slate-300'}`}></span>
                                        {selectedContact.autoReplyEnabled ? 'Atendimento Automático (IA)' : 'Atendimento Manual'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setShowScheduleModal(true)} className="px-3 py-1.5 bg-purple-100 text-purple-700 text-xs font-bold rounded-lg hover:bg-purple-200 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" /> Agendar
                                </button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat">
                            {isLoadingHistory ? (
                                <div className="flex justify-center pt-10"><Loader2 className="animate-spin text-slate-400" /></div>
                            ) : messages.length === 0 ? (
                                <div className="text-center mt-20 opacity-50">
                                    <MessageCircle className="w-16 h-16 mx-auto mb-2" />
                                    <p>Nenhuma mensagem ainda.</p>
                                </div>
                            ) : (
                                messages.map(msg => (
                                    <div key={msg.id} className={`flex ${msg.fromMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] p-3 rounded-lg text-sm shadow-sm relative ${
                                            msg.fromMe ? 'bg-[#d9fdd3] text-slate-900' : 'bg-white text-slate-900'
                                        }`}>
                                            {msg.type === 'image' ? (
                                                <div className="flex items-center gap-2 text-slate-500 italic">
                                                    <Paperclip className="w-4 h-4" /> Imagem recebida
                                                </div>
                                            ) : (
                                                <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                                            )}
                                            <span className="text-[10px] text-slate-400 block text-right mt-1">
                                                {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white border-t border-slate-200">
                             {/* AI Suggestion Bar */}
                             <div className="flex justify-between items-center mb-2">
                                 <button 
                                    onClick={handleGenerateAiResponse}
                                    disabled={isThinking || !selectedContact.linkedCampaignId}
                                    className="text-xs font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1 disabled:opacity-50"
                                >
                                     {isThinking ? <Loader2 className="w-3 h-3 animate-spin"/> : <BrainCircuit className="w-3 h-3" />}
                                     {selectedContact.linkedCampaignId ? 'IA: Sugerir Resposta' : 'IA: Vincule um imóvel ao lado para usar'}
                                 </button>
                             </div>

                             <form onSubmit={handleSendMessage} className="flex gap-2">
                                <input 
                                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 outline-none transition-all"
                                    placeholder="Digite sua mensagem..."
                                    value={inputText}
                                    onChange={e => setInputText(e.target.value)}
                                />
                                <button 
                                    type="submit" 
                                    disabled={isSending || !inputText.trim()}
                                    className="p-3 bg-green-600 text-white rounded-xl hover:bg-green-500 transition-all shadow-lg shadow-green-200 disabled:opacity-50"
                                >
                                    {isSending ? <Loader2 className="animate-spin w-5 h-5" /> : <Send className="w-5 h-5" />}
                                </button>
                             </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                        <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mb-4">
                            <MessageCircle className="w-10 h-10 text-slate-400" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-600">Selecione uma conversa</h3>
                        <p>Gerencie seus atendimentos e use a IA para vender.</p>
                    </div>
                )}
            </div>

            {/* 3. CONTEXTO LATERAL (Direita) */}
            {selectedContact && (
                <div className="w-80 border-l border-slate-200 bg-white flex flex-col overflow-y-auto">
                    <div className="p-6 border-b border-slate-100">
                        <div className="w-20 h-20 bg-slate-100 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold text-slate-500 border border-slate-200">
                            {selectedContact.name.charAt(0)}
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 text-center">{selectedContact.name}</h2>
                        <p className="text-sm text-slate-500 text-center mb-4">{selectedContact.phone}</p>
                        
                        <div className="flex justify-center gap-2">
                            <button className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500" title="Ver Perfil">
                                <User className="w-4 h-4" />
                            </button>
                            <button className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500" title="Histórico">
                                <Clock className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Automation Control */}
                    <div className="p-6 border-b border-slate-100 bg-slate-50">
                        <h4 className="font-bold text-xs uppercase text-slate-500 mb-3 flex items-center gap-1">
                            <Bot className="w-3 h-3" /> Automação
                        </h4>
                        
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-slate-700">Auto-Resposta</span>
                            <button 
                                onClick={() => toggleContactAutoReply(!selectedContact.autoReplyEnabled)}
                                className={`w-10 h-5 rounded-full p-1 transition-colors ${selectedContact.autoReplyEnabled ? 'bg-green-500' : 'bg-slate-300'}`}
                            >
                                <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${selectedContact.autoReplyEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-tight">
                            Se ativado, o robô responderá este cliente sozinho usando o contexto do imóvel selecionado abaixo.
                        </p>
                    </div>

                    {/* Property Context Selector */}
                    <div className="p-6 flex-1">
                        <h4 className="font-bold text-xs uppercase text-slate-500 mb-3 flex items-center gap-1">
                            <Home className="w-3 h-3" /> Interesse (Contexto)
                        </h4>
                        
                        {campaigns.length === 0 ? (
                            <div className="text-center p-4 border border-dashed rounded-lg text-slate-400 text-xs">
                                Nenhuma campanha criada. Crie uma para vender.
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {campaigns.map(camp => (
                                    <div 
                                        key={camp.id}
                                        onClick={() => linkCampaignToContact(camp.id)}
                                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                                            selectedContact.linkedCampaignId === camp.id 
                                            ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-200' 
                                            : 'bg-white border-slate-200 hover:border-blue-300'
                                        }`}
                                    >
                                        <h5 className="font-bold text-slate-800 text-sm">{camp.dossier?.title}</h5>
                                        <p className="text-xs text-slate-500">{camp.dossier?.price}</p>
                                        {selectedContact.linkedCampaignId === camp.id && (
                                            <div className="flex items-center gap-1 text-[10px] text-blue-600 font-bold mt-1">
                                                <CheckCircle className="w-3 h-3" /> Vinculado
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                        {!selectedContact.linkedCampaignId && campaigns.length > 0 && (
                            <div className="mt-2 flex items-center gap-2 text-yellow-600 bg-yellow-50 p-2 rounded text-xs font-bold">
                                <AlertTriangle className="w-4 h-4" /> Selecione um imóvel acima para a IA saber o que vender.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* MODAL DE AGENDAMENTO */}
            {showScheduleModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95">
                        <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-purple-600" /> Agendar Visita
                        </h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Data e Hora</label>
                                <input 
                                    type="datetime-local"
                                    className="w-full p-3 border border-slate-200 rounded-xl"
                                    value={scheduleDate}
                                    onChange={e => setScheduleDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Observações</label>
                                <textarea 
                                    className="w-full p-3 border border-slate-200 rounded-xl h-24 resize-none"
                                    placeholder="Ex: Cliente prefere manhã. Levar chaves."
                                    value={scheduleNotes}
                                    onChange={e => setScheduleNotes(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setShowScheduleModal(false)} className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl">Cancelar</button>
                                <button onClick={handleScheduleVisit} className="flex-1 py-3 bg-purple-600 text-white font-bold hover:bg-purple-700 rounded-xl">Confirmar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatCenter;