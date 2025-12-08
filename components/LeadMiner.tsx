import React, { useState } from 'react';
import { Search, MessageSquare, Building2, Users, UserPlus, Loader2, ExternalLink, ShieldAlert, Database, Lock, Instagram, Facebook, AtSign, Gavel, Globe, Wifi, Image as ImageIcon, FileText, ArrowRight, BrainCircuit, Check, AlertTriangle, Plus } from 'lucide-react';
import { mineLeadsWithAI, generateOsintDorks, analyzeLegalText } from '../services/geminiService';
import { AppSettings, Lead, Contact, User } from '../types';
import { storageService } from '../services/storageService';
import { NavLink } from 'react-router-dom';

interface LeadMinerProps {
  settings: AppSettings;
  user: User;
}

const TOOLS_LIST = [
    { name: 'OSINT Framework', desc: 'Diretório extenso de ferramentas e recursos.', url: 'https://osintframework.com/', icon: Database },
    { name: 'Maltego', desc: 'Visualiza conexões entre pessoas, domínios e IPs.', url: 'https://www.maltego.com/', icon: Users },
    { name: 'Shodan', desc: 'Motor de busca para IoT e portas abertas.', url: 'https://www.shodan.io/', icon: Globe },
    { name: 'Jusbrasil', desc: 'Maior fonte de dados jurídicos e processuais.', url: 'https://www.jusbrasil.com.br/', icon: Gavel },
    { name: 'Portal de Leilões', desc: 'Agregador de leilões judiciais.', url: 'https://www.portaldeleiloes.com.br/', icon:  Building2 },
    { name: 'Babel X', desc: 'Busca multilingue na web e dark web com IA.', url: 'https://www.babelstreet.com/babel-x', icon: MessageSquare },
    { name: 'TinEye', desc: 'Busca reversa de imagens (onde a foto aparece).', url: 'https://tineye.com/', icon: ImageIcon },
    { name: 'Wigle.net', desc: 'Geolocalização via Wi-Fi e redes móveis.', url: 'https://wigle.net/', icon: Wifi },
];

const LeadMiner: React.FC<LeadMinerProps> = ({ settings, user }) => {
  const [activeTab, setActiveTab] = useState<'social' | 'legal'>('social');
  
  const [niche, setNiche] = useState('');
  const [city, setCity] = useState('');
  
  // Social State
  const [strategy, setStrategy] = useState<'business' | 'comments' | 'groups'>('comments');
  const [platform, setPlatform] = useState<'facebook' | 'instagram' | 'threads' | 'legal'>('facebook');
  
  // Mining State
  const [isMining, setIsMining] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());
  const [dorks, setDorks] = useState<{label: string, url: string, desc: string}[]>([]);

  // Legal Analysis State
  const [legalText, setLegalText] = useState('');
  const [isAnalyzingLegal, setIsAnalyzingLegal] = useState(false);
  const [legalOpportunity, setLegalOpportunity] = useState<any>(null);

  // PAYWALL BLOCK REMOVIDO - ACESSO LIBERADO

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!city) return;
    
    // Se estiver na aba Legal, o nicho é fixo "imóvel", mas usamos o campo para tipo (apto, casa)
    const searchNiche = activeTab === 'legal' ? (niche || 'imóvel') : niche;
    if (activeTab === 'social' && !searchNiche) return;

    setIsMining(true);
    setLeads([]);
    setLegalOpportunity(null);
    
    const targetPlatform = activeTab === 'legal' ? 'legal' : platform;
    setDorks(generateOsintDorks(searchNiche, city, targetPlatform));

    try {
      // Se for social, roda a IA para leads. Se for legal, só gera os dorks (a IA é usada na etapa 2)
      if (activeTab === 'social') {
        const results = await mineLeadsWithAI(searchNiche, city, strategy, targetPlatform, settings.googleApiKey);
        const formattedLeads: Lead[] = results.map((l, i) => ({
            id: `lead-${Date.now()}-${i}`,
            name: l.name,
            phone: l.phone,
            source: l.source,
            description: l.description
        }));
        setLeads(formattedLeads);
      }
    } catch (error) {
      alert("Erro ao buscar leads. Verifique sua API Key.");
    } finally {
      setIsMining(false);
    }
  };

  const handleAnalyzeLegalText = async () => {
      if (!legalText) return alert("Cole o texto do edital ou processo primeiro.");
      setIsAnalyzingLegal(true);
      try {
          const result = await analyzeLegalText(legalText, settings.googleApiKey);
          setLegalOpportunity(result);
      } catch (error) {
          alert("Não foi possível analisar o texto. Tente novamente.");
      } finally {
          setIsAnalyzingLegal(false);
      }
  };

  const importLead = (lead: Lead) => {
    if (lead.phone === "N/A") return;

    const newContact: Contact = {
        id: `${lead.phone.replace(/\D/g, '')}@c.us`,
        name: lead.name,
        phone: lead.phone,
        status: 'pending',
        pipelineStage: 'new', // Vai direto para a primeira coluna do CRM
        source: lead.source,
        value: 0
    };
    
    storageService.saveContact(user.uid, newContact);
    setImportedIds(prev => new Set(prev).add(lead.id));
  };

  const saveOpportunityToCrm = () => {
     if (!legalOpportunity) return;
     const newContact: Contact = {
        id: `jud-${Date.now()}`,
        name: `Oportunidade: ${legalOpportunity.title.substring(0, 20)}...`,
        phone: '551100000000', // Placeholder
        status: 'pending',
        pipelineStage: 'new',
        source: 'Leilão/Judicial',
        value: parseFloat(legalOpportunity.valuation.replace(/[^0-9,]/g, '').replace(',', '.')) || 0
     };
     storageService.saveContact(user.uid, newContact);
     alert("Oportunidade salva no CRM!");
     setLegalOpportunity(null);
     setLegalText('');
  };

  const getHeaderColors = () => {
      if (activeTab === 'legal') return 'from-slate-800 to-slate-900';
      switch(platform) {
          case 'instagram': return 'from-pink-600 to-purple-600';
          case 'threads': return 'from-slate-900 to-black';
          default: return 'from-blue-600 to-blue-800';
      }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      
      {/* Main Header */}
      <div className={`bg-gradient-to-r ${getHeaderColors()} text-white p-8 rounded-2xl shadow-xl border border-white/10 relative overflow-hidden transition-all duration-500`}>
        <div className="absolute top-0 right-0 p-8 opacity-10">
           {activeTab === 'legal' ? <Gavel className="w-48 h-48 text-white" /> : <Database className="w-48 h-48 text-white" />}
        </div>
        <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
                <span className="bg-white/20 backdrop-blur-md text-xs font-bold px-2 py-1 rounded text-white flex items-center gap-1">
                   <ShieldAlert className="w-3 h-3" /> INTELIGÊNCIA DE DADOS
                </span>
            </div>
            <h2 className="text-3xl font-bold text-white">
                {activeTab === 'legal' ? 'Leilões, Penhoras e Judiciais' : 'Minerador de Redes Sociais'}
            </h2>
            <p className="text-white/80 mt-2 max-w-2xl">
                {activeTab === 'legal' 
                    ? 'Use a IA para encontrar e analisar editais, leilões e processos com alto potencial de lucro.' 
                    : 'Encontre clientes reais escondidos em comentários, bios e comunidades.'}
            </p>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex justify-center">
          <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 inline-flex">
              <button 
                onClick={() => setActiveTab('social')}
                className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'social' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                  <Users className="w-4 h-4" /> Redes Sociais
              </button>
              <button 
                onClick={() => setActiveTab('legal')}
                className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'legal' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                  <Gavel className="w-4 h-4" /> Leilões & Judiciais
              </button>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Search & Analyzer Input */}
        <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 sticky top-4">
                
                {/* Search Form */}
                <form onSubmit={handleSearch} className="space-y-5 border-b border-slate-100 pb-6 mb-6">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Search className="w-4 h-4" /> 1. Busca da Fonte
                    </h3>
                    
                    {activeTab === 'social' && (
                        <div>
                            <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">Plataforma</label>
                            <div className="flex bg-slate-100 p-1 rounded-lg">
                                <button type="button" onClick={() => setPlatform('facebook')} className={`flex-1 flex items-center justify-center py-2 rounded-md transition-all ${platform === 'facebook' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}><Facebook className="w-5 h-5" /></button>
                                <button type="button" onClick={() => setPlatform('instagram')} className={`flex-1 flex items-center justify-center py-2 rounded-md transition-all ${platform === 'instagram' ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-400'}`}><Instagram className="w-5 h-5" /></button>
                                <button type="button" onClick={() => setPlatform('threads')} className={`flex-1 flex items-center justify-center py-2 rounded-md transition-all ${platform === 'threads' ? 'bg-white text-black shadow-sm' : 'text-slate-400'}`}><AtSign className="w-5 h-5" /></button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'social' && (
                        <div>
                            <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">Modo de Busca</label>
                            <div className="space-y-2">
                                {[
                                    { id: 'comments', icon: MessageSquare, label: 'Comentários', desc: 'Pessoas perguntando "valor?"' },
                                    { id: 'groups', icon: Users, label: platform === 'threads' ? 'Discussões' : 'Grupos', desc: 'Membros engajados' },
                                    { id: 'business', icon: Building2, label: 'Bios/Perfis', desc: 'Negócios e Criadores' }
                                ].map((s: any) => (
                                    <button 
                                    key={s.id}
                                    type="button"
                                    onClick={() => setStrategy(s.id)}
                                    className={`w-full p-3 rounded-lg border text-left flex items-center gap-3 transition-all ${strategy === s.id ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-slate-200 text-slate-600'}`}
                                    >
                                        <s.icon className="w-5 h-5" />
                                        <div>
                                            <div className="font-bold text-sm">{s.label}</div>
                                            <div className="text-[10px] opacity-70">{s.desc}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">
                                {activeTab === 'social' ? 'Nicho / Interesse' : 'Tipo de Imóvel'}
                            </label>
                            <input 
                                required={activeTab === 'social'} 
                                value={niche} 
                                onChange={e => setNiche(e.target.value)} 
                                placeholder={activeTab === 'social' ? "Ex: Imóveis, Nutrição" : "Ex: Apartamento, Terreno (Opcional)"} 
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Cidade / Região</label>
                            <input 
                                required 
                                value={city} 
                                onChange={e => setCity(e.target.value)} 
                                placeholder="Ex: São Paulo" 
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={isMining} 
                        className={`w-full py-3 text-white rounded-xl font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 bg-gradient-to-r ${getHeaderColors()}`}
                    >
                        {isMining ? <Loader2 className="animate-spin w-5 h-5" /> : <Search className="w-5 h-5" />}
                        {isMining ? 'Processando...' : (activeTab === 'legal' ? 'Gerar Links de Busca' : 'Iniciar Mineração')}
                    </button>
                </form>

                {/* Legal Text Analyzer Input */}
                {activeTab === 'legal' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <BrainCircuit className="w-4 h-4 text-purple-600" /> 2. Analisar Edital/Processo
                            </h3>
                        </div>
                        <p className="text-xs text-slate-500">
                            Encontrou um PDF ou site interessante? Copie o texto e cole abaixo para a IA extrair os dados.
                        </p>
                        <textarea 
                            value={legalText}
                            onChange={(e) => setLegalText(e.target.value)}
                            className="w-full h-40 p-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none resize-none font-mono"
                            placeholder="Cole aqui o texto do edital, descrição do leilão ou detalhes do processo..."
                        />
                        <button 
                            onClick={handleAnalyzeLegalText}
                            disabled={isAnalyzingLegal || !legalText}
                            className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isAnalyzingLegal ? <Loader2 className="animate-spin w-4 h-4" /> : <BrainCircuit className="w-4 h-4" />}
                            Analisar Oportunidade
                        </button>
                    </div>
                )}
            </div>
        </div>

        {/* MIDDLE/RIGHT COLUMN: Results */}
        <div className="lg:col-span-7 space-y-4">
            
            {/* Dorks Card */}
            {dorks.length > 0 && (
                <div className="bg-slate-800 text-slate-300 p-5 rounded-xl border border-slate-700 animate-in fade-in slide-in-from-top-4">
                    <h4 className="text-white font-bold flex items-center gap-2 mb-3 text-sm">
                        <ShieldAlert className="w-4 h-4 text-yellow-400" /> 
                        {activeTab === 'legal' ? 'Links de Busca (Fontes Oficiais)' : 'Links Diretos (Google Dorks)'}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {dorks.map((d, i) => (
                            <a key={i} href={d.url} target="_blank" rel="noreferrer" className="block bg-slate-700 hover:bg-slate-600 p-3 rounded-lg border border-slate-600 group transition-colors">
                                <div className="flex justify-between items-center text-white text-xs font-bold mb-1">
                                    {d.label} <ExternalLink className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                                </div>
                                <p className="text-[10px] text-slate-400 truncate">{d.desc}</p>
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {/* Legal Analysis Result */}
            {legalOpportunity && (
                <div className="bg-white rounded-xl border border-purple-100 shadow-lg overflow-hidden animate-in zoom-in-95 duration-300">
                    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 text-white flex justify-between items-center">
                        <h3 className="font-bold flex items-center gap-2"><Check className="w-5 h-5" /> Análise Concluída</h3>
                        <span className="bg-white/20 px-2 py-1 rounded text-xs font-mono">{legalOpportunity.discount} OFF</span>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                             <div className="p-3 bg-slate-50 rounded-lg">
                                <span className="text-[10px] text-slate-400 uppercase font-bold">Avaliação</span>
                                <p className="text-lg font-bold text-slate-700">{legalOpportunity.valuation}</p>
                             </div>
                             <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                                <span className="text-[10px] text-green-600 uppercase font-bold">Lance Mínimo</span>
                                <p className="text-lg font-bold text-green-700">{legalOpportunity.minimumBid}</p>
                             </div>
                        </div>
                        
                        <div>
                            <h4 className="font-bold text-slate-800 mb-1">{legalOpportunity.title}</h4>
                            <p className="text-sm text-slate-600">{legalOpportunity.address}</p>
                        </div>

                        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 flex gap-3">
                            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                            <div>
                                <span className="text-xs font-bold text-yellow-800 uppercase">Resumo de Riscos</span>
                                <p className="text-sm text-yellow-700 leading-tight mt-1">{legalOpportunity.risks}</p>
                            </div>
                        </div>
                        
                        <div className="flex justify-between items-center text-xs text-slate-500 pt-2 border-t border-slate-100">
                             <span>Processo: {legalOpportunity.processNumber}</span>
                             <span>Data: {legalOpportunity.auctionDate}</span>
                        </div>

                        <button 
                            onClick={saveOpportunityToCrm}
                            className="w-full py-3 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                        >
                            <Plus className="w-4 h-4" /> Adicionar Oportunidade ao Pipeline
                        </button>
                    </div>
                </div>
            )}

            {/* Leads List (Social) */}
            {activeTab === 'social' && (
                <div className="space-y-3">
                    {leads.map(lead => (
                        <div key={lead.id} className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold bg-gradient-to-br ${
                                    lead.source.toLowerCase().includes('insta') ? 'from-pink-500 to-purple-600' :
                                    lead.source.toLowerCase().includes('threads') ? 'from-slate-800 to-black' :
                                    'from-blue-500 to-blue-700'
                                }`}>
                                    {lead.name.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900">{lead.name}</h4>
                                    <p className="text-xs text-slate-500 max-w-[200px] truncate">{lead.description}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        {lead.phone !== 'N/A' && <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-mono">{lead.phone}</span>}
                                        <span className="text-[10px] font-bold text-slate-400">{lead.source}</span>
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={() => importLead(lead)}
                                disabled={importedIds.has(lead.id) || lead.phone === 'N/A'}
                                className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                                    lead.phone === 'N/A' ? 'bg-slate-100 text-slate-400 cursor-not-allowed' :
                                    importedIds.has(lead.id) ? 'bg-green-100 text-green-700' : 'bg-slate-900 text-white hover:bg-slate-800'
                                }`}
                            >
                                {lead.phone === 'N/A' ? 'Info' : (importedIds.has(lead.id) ? 'Salvo' : 'Capturar')}
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Placeholder state */}
            {leads.length === 0 && !legalOpportunity && !isMining && dorks.length === 0 && (
                 <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                     <Search className="w-10 h-10 mx-auto mb-2 opacity-20" />
                     <p className="text-sm">Configure a busca à esquerda para começar.</p>
                 </div>
            )}

            {/* Tools List for Legal Tab */}
            {activeTab === 'legal' && !legalOpportunity && (
                 <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 p-4 border-b border-slate-100">
                        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                            <Database className="w-4 h-4 text-blue-600" /> Ferramentas Recomendadas
                        </h3>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {TOOLS_LIST.filter(t => ['Jusbrasil', 'Portal de Leilões'].includes(t.name)).map((tool, idx) => (
                            <a 
                                key={idx} 
                                href={tool.url} 
                                target="_blank" 
                                rel="noreferrer"
                                className="block p-4 hover:bg-blue-50 transition-colors group"
                            >
                                <div className="flex items-center gap-3 mb-1">
                                    <tool.icon className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                                    <span className="font-bold text-slate-700 text-sm group-hover:text-blue-700">{tool.name}</span>
                                    <ExternalLink className="w-3 h-3 text-slate-300 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <p className="text-[10px] text-slate-500 leading-relaxed">{tool.desc}</p>
                            </a>
                        ))}
                    </div>
                 </div>
            )}
        </div>

      </div>
    </div>
  );
};

export default LeadMiner;