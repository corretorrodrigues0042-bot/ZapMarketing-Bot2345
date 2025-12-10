
import React, { useState, useRef, useEffect } from 'react';
import { Cloud, Wand2, Send, Monitor, FileSpreadsheet, Sparkles, Check, ChevronRight, Zap, Bot, Home, DollarSign, MapPin, User, Phone, Loader2, Target, MousePointerClick, ShieldCheck } from 'lucide-react';
import { Campaign, DriveFile, Contact, AppSettings, PropertyDossier } from '../types';
import { storageService } from '../services/storageService';
import { generateMarketingCopy, parseContactsFromRawText } from '../services/geminiService';
import { sendWhatsAppMessage, getGreenApiContacts } from '../services/whatsappService';
import OneDrivePicker from './OneDrivePicker';
import { useNavigate } from 'react-router-dom';

interface CampaignBuilderProps {
  settings: AppSettings;
  onCampaignCreated: (campaign: Campaign) => void;
  userId: string;
}

// Helper para delay humano
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const getRandomDelay = (min = 15000, max = 45000) => Math.floor(Math.random() * (max - min + 1) + min);

const CampaignBuilder: React.FC<CampaignBuilderProps> = ({ settings, onCampaignCreated, userId }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  
  // Property Dossier State
  const [dossier, setDossier] = useState<PropertyDossier>({
    title: '',
    price: '',
    location: '',
    details: '',
    ownerName: '',
    ownerPhone: '',
    isAvailable: true
  });

  const [marketingStrategy, setMarketingStrategy] = useState<string>('balanced');
  const [generatedText, setGeneratedText] = useState('');
  const [generatedOptions, setGeneratedOptions] = useState<{style: string, content: string}[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<DriveFile[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendingProgress, setSendingProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  
  // CARREGA CONTATOS DO STORAGE
  const [contactsList, setContactsList] = useState<Contact[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [isParsingCsv, setIsParsingCsv] = useState(false);

  useEffect(() => {
    const loadContacts = async () => {
      const contacts = await storageService.getContacts(userId);
      setContactsList(contacts);
    };
    loadContacts();
  }, [userId]);

  const handleDossierChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setDossier({ ...dossier, [e.target.name]: e.target.value });
  };

  const handleGenerateText = async () => {
    if (!dossier.title || !dossier.price) return alert('Preencha pelo menos Título e Preço do Dossiê.');
    setIsGenerating(true);
    setGeneratedText('');
    setGeneratedOptions([]);
    
    // Adiciona o contexto da estratégia ao objeto enviado para a IA
    const enrichedDossier = {
      ...dossier,
      details: `${dossier.details}`
    };

    const options = await generateMarketingCopy(enrichedDossier, settings.googleApiKey);
    
    // Se a IA retornar array, salva nas opções. Se não, usa como texto direto.
    if (Array.isArray(options) && options.length > 0) {
        setGeneratedOptions(options);
    } else {
        // @ts-ignore
        setGeneratedText(options);
    }
    
    setIsGenerating(false);
  };

  const selectOption = (text: string) => {
     setGeneratedText(text);
  };

  const handleSyncContacts = async () => {
    if (!settings.whatsappApiUrl && (!settings.greenApiInstanceId || !settings.greenApiApiToken)) {
      alert("Configure a API (ID e Token) nas Configurações primeiro.");
      return;
    }
    
    setIsLoadingContacts(true);
    try {
      const realContacts = await getGreenApiContacts(settings);
      
      if (realContacts.length > 0) {
        // SALVA NO STORAGE
        await storageService.saveContactsBulk(userId, realContacts);
        const updatedContacts = await storageService.getContacts(userId);
        setContactsList(updatedContacts);
      } else {
        alert("A API conectou, mas retornou 0 contatos.");
      }
    } catch (error: any) {
      alert(`Falha ao sincronizar: ${error.message}`);
    } finally {
      setIsLoadingContacts(false);
    }
  };

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      setIsParsingCsv(true);
      try {
        const aiContacts = await parseContactsFromRawText(text, settings.googleApiKey);
        
        const newContacts: Contact[] = aiContacts.map(c => {
           const id = c.phone.includes('@') ? c.phone : `${c.phone}@c.us`;
           return {
             id: id,
             name: c.name || 'Lead Importado',
             phone: c.phone,
             status: 'pending',
             pipelineStage: 'new',
             source: 'CSV/Import'
           };
        });

        if (newContacts.length > 0) {
          // SALVA NO STORAGE AUTOMATICAMENTE AO IMPORTAR
          await storageService.saveContactsBulk(userId, newContacts);
          
          // Recarrega para garantir
          const updatedContacts = await storageService.getContacts(userId);
          setContactsList(updatedContacts);
          
          // Seleciona os novos contatos importados
          const newIds = new Set(selectedContacts);
          newContacts.forEach(c => newIds.add(c.id));
          setSelectedContacts(newIds);
        } else {
          alert('A IA não encontrou contatos válidos.');
        }

      } catch (error: any) {
        alert(`Erro ao processar CSV: ${error.message}`);
      } finally {
        setIsParsingCsv(false);
        if (csvInputRef.current) csvInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const newFiles: DriveFile[] = Array.from(event.target.files).map((file: File) => {
        const isImage = file.type.startsWith('image/');
        return {
          id: `local-${Date.now()}-${Math.random()}`,
          name: file.name,
          url: URL.createObjectURL(file), 
          type: isImage ? 'image' : 'document',
          thumbnail: isImage ? URL.createObjectURL(file) : '',
          fileObject: file 
        };
      });
      setSelectedFiles(prev => [...prev, ...newFiles]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeFile = (id: string) => {
    setSelectedFiles(prev => prev.filter(f => f.id !== id));
  };

  const startCampaign = async () => {
    if (selectedContacts.size === 0) return alert('Selecione contatos');
    
    setIsSending(true);
    setSendingProgress(0);
    setLogs([]);

    const targets = Array.from(selectedContacts).map(id => contactsList.find(c => c.id === id)!);
    const total = targets.length;
    let successCount = 0;

    for (let i = 0; i < total; i++) {
      const contact = targets[i];
      setLogs(prev => [`⏳ Iniciando envio para ${contact.name}...`, ...prev.slice(0, 4)]); 

      // ANTI-BLOQUEIO: DELAY VARIÁVEL
      // Se não for o primeiro contato, espera um tempo aleatório
      if (i > 0) {
          const delay = getRandomDelay(15000, 45000); // 15 a 45 segundos
          setLogs(prev => [`🛡️ Proteção Anti-Block: Aguardando ${Math.floor(delay/1000)}s...`, ...prev.slice(0, 4)]);
          await sleep(delay);
      }
      
      const result = await sendWhatsAppMessage(contact, generatedText, selectedFiles, settings);
      
      if (result.success) {
        successCount++;
        setLogs(prev => [`✅ Enviado com sucesso para ${contact.name}`, ...prev.slice(0, 4)]);
        
        // --- ATUALIZAÇÃO AUTOMÁTICA DO CRM ---
        const updatedContact: Contact = {
            ...contact,
            status: 'sent',
            pipelineStage: 'contacted', // Move no Kanban
            lastInteraction: new Date().toISOString()
        };
        await storageService.saveContact(userId, updatedContact);
      } else {
         setLogs(prev => [`❌ Falha ao enviar para ${contact.name}: ${result.error}`, ...prev.slice(0, 4)]);
         const failedContact: Contact = { ...contact, status: 'failed' };
         await storageService.saveContact(userId, failedContact);
      }

      setSendingProgress(Math.round(((i + 1) / total) * 100));
    }

    setIsSending(false);
    
    const newCampaign: Campaign = {
      id: Date.now().toString(),
      name: dossier.title,
      dossier: dossier, 
      description: generatedText,
      selectedFiles,
      targetContacts: Array.from(selectedContacts),
      status: 'completed',
      progress: 100
    };
    
    onCampaignCreated(newCampaign);
    alert(`Campanha Finalizada! ${successCount} mensagens entregues e CRM atualizado.`);
    
    setStep(1);
    setGeneratedText('');
    setLogs([]);
  };

  return (
    <div className="max-w-6xl mx-auto">
      
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Novo Imóvel & Campanha</h2>
        <div className="flex items-center gap-4 mt-4">
           {[
             { num: 1, label: 'Dossiê do Imóvel' }, 
             { num: 2, label: 'Público Alvo' }, 
             { num: 3, label: 'Disparo' }
            ].map(s => (
             <div key={s.num} className={`flex items-center gap-2 ${step >= s.num ? 'text-blue-600' : 'text-slate-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 ${step >= s.num ? 'border-blue-600 bg-blue-50' : 'border-slate-300'}`}>
                  {step > s.num ? <Check className="w-5 h-5" /> : s.num}
                </div>
                <span className="font-medium text-sm">{s.label}</span>
                {s.num < 3 && <div className="w-12 h-[2px] bg-slate-200 mx-2" />}
             </div>
           ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden min-h-[500px] flex flex-col">
        
        {/* Step 1: PROPERTY DOSSIER */}
        {step === 1 && (
          <div className="flex-1 p-8 flex flex-col lg:flex-row gap-8">
            <div className="flex-1 space-y-6">
               <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-2">
                 <Home className="w-5 h-5 text-blue-600" /> Detalhes do Imóvel
               </h3>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Título do Anúncio</label>
                    <input 
                      name="title"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" 
                      value={dossier.title}
                      onChange={handleDossierChange}
                      placeholder="Ex: Apto Luxo Jardins 200m²"
                    />
                 </div>
                 <div>
                    <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Valor (R$)</label>
                    <div className="relative">
                        <DollarSign className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                        <input 
                        name="price"
                        className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" 
                        value={dossier.price}
                        onChange={handleDossierChange}
                        placeholder="1.500.000,00"
                        />
                    </div>
                 </div>
               </div>

               <div>
                  <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Localização / Bairro</label>
                  <div className="relative">
                      <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                      <input 
                        name="location"
                        className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" 
                        value={dossier.location}
                        onChange={handleDossierChange}
                        placeholder="Ex: Rua Oscar Freire, SP"
                      />
                  </div>
               </div>
               
               <div>
                  <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Descrição Técnica (Para a IA)</label>
                  <textarea 
                    name="details"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl h-24 resize-none focus:ring-2 focus:ring-blue-500 outline-none" 
                    value={dossier.details}
                    onChange={handleDossierChange}
                    placeholder="Cole aqui: Metragem, valor condomínio, lazer, pontos fortes e fracos..."
                  />
               </div>

               <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-2 pt-4">
                 <User className="w-5 h-5 text-green-600" /> Dados do Proprietário (Privado)
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Nome do Proprietário</label>
                    <input 
                      name="ownerName"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none" 
                      value={dossier.ownerName}
                      onChange={handleDossierChange}
                      placeholder="Nome para contato"
                    />
                 </div>
                 <div>
                    <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">WhatsApp do Proprietário</label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                        <input 
                        name="ownerPhone"
                        className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none" 
                        value={dossier.ownerPhone}
                        onChange={handleDossierChange}
                        placeholder="55119..."
                        />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Usado para a IA fazer a checagem mensal automática.</p>
                 </div>
               </div>
            </div>

            {/* Right Side: Media & Preview */}
            <div className="lg:w-1/2 flex flex-col gap-6">
               <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                    <h4 className="font-bold text-slate-700 mb-4 text-sm uppercase">Mídia do Imóvel</h4>
                    <div className="flex gap-4 mb-4">
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="flex-1 border-2 border-dashed border-slate-300 rounded-xl p-4 flex flex-col items-center justify-center hover:bg-white hover:border-blue-400 transition-all text-slate-500"
                        >
                            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} multiple />
                            <Monitor className="w-6 h-6 mb-2" />
                            <span className="text-xs font-semibold">Upload Fotos</span>
                        </button>
                        <button 
                            onClick={() => setIsPickerOpen(true)}
                            className="flex-1 border-2 border-dashed border-slate-300 rounded-xl p-4 flex flex-col items-center justify-center hover:bg-white hover:border-blue-400 transition-all text-slate-500"
                        >
                            <Cloud className="w-6 h-6 mb-2" />
                            <span className="text-xs font-semibold">OneDrive</span>
                        </button>
                    </div>
                    
                    {selectedFiles.length > 0 && (
                        <div className="grid grid-cols-4 gap-2">
                            {selectedFiles.map(f => (
                            <div key={f.id} className="aspect-square bg-white rounded-lg overflow-hidden relative border border-slate-200 group">
                                <img src={f.thumbnail || f.url} className="w-full h-full object-cover" />
                                <button onClick={() => removeFile(f.id)} className="absolute inset-0 bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity font-bold text-xs">REMOVER</button>
                            </div>
                            ))}
                        </div>
                    )}
               </div>

               <div className="flex-1 bg-slate-900 rounded-2xl p-6 text-white relative overflow-hidden flex flex-col">
                    <div className="absolute top-0 right-0 p-6 opacity-10"><Bot className="w-32 h-32" /></div>
                    <div className="relative z-10 flex flex-col flex-1">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h4 className="font-bold text-purple-300 mb-1 flex items-center gap-2"><Zap className="w-4 h-4" /> Copy Automática</h4>
                                <p className="text-xs text-slate-400">O Robô cria 3 opções para você.</p>
                            </div>
                        </div>
                        
                        <div className="flex-1 space-y-3 min-h-[150px] overflow-y-auto mb-4">
                            {isGenerating && (
                              <div className="h-full flex flex-col items-center justify-center bg-slate-800/50 rounded-lg p-6">
                                <Loader2 className="w-8 h-8 text-purple-400 animate-spin mb-2" />
                                <span className="text-xs text-purple-300">Escrevendo 3 versões...</span>
                              </div>
                            )}

                            {!isGenerating && generatedOptions.length > 0 ? (
                                <div className="space-y-3">
                                    <p className="text-xs text-slate-400 uppercase font-bold">Escolha a melhor versão:</p>
                                    {generatedOptions.map((opt, idx) => (
                                        <div 
                                            key={idx}
                                            onClick={() => selectOption(opt.content)}
                                            className={`p-3 rounded-lg border cursor-pointer transition-all hover:scale-[1.02] ${
                                                generatedText === opt.content 
                                                ? 'bg-purple-600 border-purple-400 shadow-lg ring-1 ring-white/50' 
                                                : 'bg-white/10 border-white/10 hover:bg-white/20'
                                            }`}
                                        >
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 bg-purple-900/50 px-2 py-0.5 rounded">{opt.style}</span>
                                                {generatedText === opt.content && <Check className="w-3 h-3 text-white" />}
                                            </div>
                                            <p className="text-xs text-slate-200 leading-relaxed line-clamp-3">{opt.content}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                !isGenerating && generatedText && (
                                     <textarea 
                                        className="w-full h-full bg-transparent border-none text-sm focus:ring-0 text-slate-200 resize-none"
                                        value={generatedText}
                                        onChange={(e) => setGeneratedText(e.target.value)}
                                     />
                                )
                            )}
                            
                            {!isGenerating && !generatedText && generatedOptions.length === 0 && (
                                <div className="h-full flex items-center justify-center text-slate-500 italic text-sm">
                                    Preencha os dados e clique em "Gerar Copy"...
                                </div>
                            )}
                        </div>
                        
                        <div className="flex justify-between mt-auto pt-4 border-t border-white/10">
                             <button 
                                onClick={handleGenerateText}
                                disabled={isGenerating}
                                className="text-purple-300 text-xs font-bold hover:text-white flex items-center gap-1 bg-purple-900/50 px-3 py-2 rounded-lg border border-purple-500/30 hover:bg-purple-900 transition-colors"
                            >
                                <Wand2 className="w-3 h-3" /> {generatedOptions.length > 0 ? 'GERAR NOVAS' : 'CRIAR COPY (IA)'}
                            </button>
                            <button 
                            onClick={() => setStep(2)}
                            disabled={!generatedText}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                            >
                            Próximo <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
               </div>
            </div>
          </div>
        )}

        {/* Step 2: Audience */}
        {step === 2 && (
          <div className="flex-1 p-8 flex flex-col">
            <div className="flex justify-between items-end mb-6">
               <div>
                 <h3 className="text-xl font-bold text-slate-800">Definir Público Alvo</h3>
                 <p className="text-slate-500 text-sm">Selecione quem receberá esta oferta.</p>
               </div>
               <div className="flex gap-2">
                  <button onClick={() => csvInputRef.current?.click()} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 flex items-center gap-2">
                     {isParsingCsv ? <Loader2 className="animate-spin w-4 h-4" /> : <FileSpreadsheet className="w-4 h-4" />} Importar CSV
                  </button>
                  <input type="file" ref={csvInputRef} onChange={handleCsvUpload} className="hidden" accept=".csv,.txt" />
                  
                  <button onClick={handleSyncContacts} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 flex items-center gap-2 shadow-lg shadow-green-200">
                     Sincronizar Whats
                  </button>
               </div>
            </div>

            <div className="flex-1 bg-slate-50 rounded-xl border border-slate-200 overflow-hidden flex flex-col relative">
              <div className="overflow-auto flex-1 h-64">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0">
                      <tr>
                        <th className="p-4 w-12"><input type="checkbox" onChange={(e) => setSelectedContacts(e.target.checked ? new Set(contactsList.map(c=>c.id)) : new Set())} /></th>
                        <th className="p-4">Nome</th>
                        <th className="p-4">Telefone</th>
                        <th className="p-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {contactsList.map(c => (
                        <tr key={c.id} className="hover:bg-blue-50/50">
                          <td className="p-4"><input type="checkbox" checked={selectedContacts.has(c.id)} onChange={() => {
                            const s = new Set(selectedContacts);
                            s.has(c.id) ? s.delete(c.id) : s.add(c.id);
                            setSelectedContacts(s);
                          }} /></td>
                          <td className="p-4 font-medium text-slate-900">{c.name}</td>
                          <td className="p-4 text-slate-500 font-mono">{c.phone}</td>
                           <td className="p-4">
                               <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${c.pipelineStage === 'contacted' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                                   {c.pipelineStage === 'contacted' ? 'Negociando' : 'Novo'}
                               </span>
                           </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
              </div>
            </div>

            <div className="mt-6 flex justify-between items-center border-t border-slate-100 pt-6">
              <button onClick={() => setStep(1)} className="text-slate-500 font-medium hover:text-slate-800">Voltar</button>
              <button 
                onClick={() => setStep(3)}
                disabled={selectedContacts.size === 0}
                className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                Revisar <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Launch */}
        {step === 3 && (
          <div className="flex-1 p-12 flex flex-col items-center justify-center text-center">
            
            {!isSending ? (
              <div className="max-w-md w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-100">
                   <Send className="w-12 h-12" />
                </div>
                
                <div>
                   <h2 className="text-3xl font-bold text-slate-900">Disparar Oferta</h2>
                   <p className="text-slate-500 mt-2">O imóvel será ofertado para {selectedContacts.size} leads.</p>
                   
                   <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-xs mt-4 flex items-center gap-2 justify-center">
                      <ShieldCheck className="w-4 h-4" />
                      <strong>Proteção Anti-Bloqueio Ativa:</strong> O sistema aguardará intervalos variáveis (15s a 45s) entre cada envio.
                   </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-6 text-left border border-slate-200 space-y-3">
                   <div className="flex justify-between">
                     <span className="text-slate-500 text-sm">Imóvel:</span>
                     <span className="font-bold text-slate-900 truncate max-w-[200px]">{dossier.title}</span>
                   </div>
                   <div className="flex justify-between">
                     <span className="text-slate-500 text-sm">Valor:</span>
                     <span className="font-bold text-slate-900">{dossier.price}</span>
                   </div>
                   <div className="flex justify-between">
                     <span className="text-slate-500 text-sm">Mensagem:</span>
                     <span className="font-bold text-slate-900 text-xs italic truncate w-[200px] text-right">"{generatedText.substring(0, 30)}..."</span>
                   </div>
                   <div className="flex justify-between">
                     <span className="text-slate-500 text-sm">Modo:</span>
                     <span className={`font-bold text-xs px-2 py-0.5 rounded ${settings.enableSimulation ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                       {settings.enableSimulation ? 'SIMULAÇÃO' : 'PRODUÇÃO'}
                     </span>
                   </div>
                </div>

                <button 
                  onClick={startCampaign}
                  className="w-full py-4 bg-green-600 text-white rounded-xl font-bold text-lg hover:bg-green-500 transition-all shadow-xl shadow-green-200 flex items-center justify-center gap-3 transform hover:-translate-y-1"
                >
                  <Send className="w-6 h-6" /> INICIAR DISPAROS SEGUROS
                </button>
                
                <button onClick={() => setStep(2)} className="text-slate-400 text-sm hover:text-slate-600">Voltar e editar</button>
              </div>
            ) : (
              <div className="w-full max-w-lg space-y-6">
                 <h3 className="text-2xl font-bold text-slate-800 animate-pulse">Enviando com Segurança...</h3>
                 
                 <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 transition-all duration-300 ease-out" style={{ width: `${sendingProgress}%` }} />
                 </div>
                 
                 <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                    <span>Início</span>
                    <span>{sendingProgress}%</span>
                 </div>

                 <div className="bg-slate-900 text-green-400 p-6 rounded-xl font-mono text-sm h-48 overflow-y-auto text-left shadow-2xl border border-slate-800">
                    {logs.map((log, i) => (
                      <div key={i} className="border-b border-white/5 py-1">{log}</div>
                    ))}
                 </div>
                 
                 <p className="text-xs text-slate-500">Não feche a janela enquanto o processo estiver rodando.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <OneDrivePicker 
        isOpen={isPickerOpen} 
        onClose={() => setIsPickerOpen(false)}
        onSelect={(files) => setSelectedFiles(prev => [...prev, ...files])}
        clientId={settings.onedriveClientId}
      />
    </div>
  );
};

export default CampaignBuilder;