import React, { useState } from 'react';
import { Search, MessageSquare, Building2, Users, UserPlus, Loader2, ExternalLink, ShieldAlert, Database, Lock, Instagram, Facebook, AtSign } from 'lucide-react';
import { mineLeadsWithAI, generateOsintDorks } from '../services/geminiService';
import { AppSettings, Lead, Contact, User } from '../types';
import { storageService } from '../services/storageService';
import { NavLink } from 'react-router-dom';

interface LeadMinerProps {
  settings: AppSettings;
  user: User;
}

const LeadMiner: React.FC<LeadMinerProps> = ({ settings, user }) => {
  const [niche, setNiche] = useState('');
  const [city, setCity] = useState('');
  const [strategy, setStrategy] = useState<'business' | 'comments' | 'groups'>('comments');
  const [platform, setPlatform] = useState<'facebook' | 'instagram' | 'threads'>('facebook');
  const [isMining, setIsMining] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());
  const [dorks, setDorks] = useState<{label: string, url: string, desc: string}[]>([]);

  // PAYWALL BLOCK
  if (user.plan === 'free') {
      return (
          <div className="max-w-4xl mx-auto py-12 text-center">
              <div className="bg-white rounded-2xl shadow-xl p-12 border border-slate-200 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-purple-600" />
                  
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Lock className="w-10 h-10 text-slate-400" />
                  </div>
                  
                  <h2 className="text-3xl font-bold text-slate-900 mb-4">Funcionalidade Premium</h2>
                  <p className="text-lg text-slate-500 max-w-lg mx-auto mb-8">
                      A mineração de leads com Inteligência Artificial (OSINT) é exclusiva para assinantes PRO.
                      Encontre clientes reais no Facebook, Instagram e Threads automaticamente.
                  </p>

                  <NavLink to="/subscription" className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-900/20 transform hover:-translate-y-1">
                      Desbloquear Agora
                  </NavLink>
                  
                  <p className="text-xs text-slate-400 mt-6">A partir de R$ 97/mês</p>
              </div>
          </div>
      );
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!niche || !city) return;

    setIsMining(true);
    setLeads([]);
    setDorks(generateOsintDorks(niche, city, platform));

    try {
      const results = await mineLeadsWithAI(niche, city, strategy, platform, settings.googleApiKey);
      const formattedLeads: Lead[] = results.map((l, i) => ({
        id: `lead-${Date.now()}-${i}`,
        name: l.name,
        phone: l.phone,
        source: l.source,
        description: l.description
      }));
      setLeads(formattedLeads);
    } catch (error) {
      alert("Erro ao buscar leads. Verifique sua API Key.");
    } finally {
      setIsMining(false);
    }
  };

  const importLead = (lead: Lead) => {
    const newContact: Contact = {
        id: `${lead.phone.replace(/\D/g, '')}@c.us`,
        name: lead.name,
        phone: lead.phone,
        status: 'pending',
        pipelineStage: 'new', // Vai direto para a primeira coluna do CRM
        source: lead.source,
        value: 0
    };
    
    // PERSISTÊNCIA AUTOMÁTICA
    storageService.saveContact(user.uid, newContact);
    
    setImportedIds(prev => new Set(prev).add(lead.id));
  };

  const getPlatformColors = () => {
      switch(platform) {
          case 'instagram': return 'from-pink-600 to-purple-600';
          case 'threads': return 'from-slate-900 to-black';
          default: return 'from-blue-600 to-blue-800';
      }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className={`bg-gradient-to-r ${getPlatformColors()} text-white p-8 rounded-2xl shadow-xl border border-white/10 relative overflow-hidden transition-all duration-500`}>
        <div className="absolute top-0 right-0 p-8 opacity-10">
           <Database className="w-48 h-48 text-white" />
        </div>
        <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
                <span className="bg-white/20 backdrop-blur-md text-xs font-bold px-2 py-1 rounded text-white flex items-center gap-1">
                   <ShieldAlert className="w-3 h-3" /> OSINT ATIVADO
                </span>
            </div>
            <h2 className="text-3xl font-bold text-white">Minerador de Leads</h2>
            <p className="text-white/80 mt-2">Encontre clientes reais escondidos em comentários e bios.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Config Panel */}
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <form onSubmit={handleSearch} className="space-y-5">
                    
                    {/* Platform Selector */}
                    <div>
                        <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">Rede Social Alvo</label>
                        <div className="flex bg-slate-100 p-1 rounded-lg">
                            <button
                                type="button"
                                onClick={() => setPlatform('facebook')}
                                className={`flex-1 flex items-center justify-center py-2 rounded-md transition-all ${platform === 'facebook' ? 'bg-white text-blue-600 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <Facebook className="w-5 h-5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setPlatform('instagram')}
                                className={`flex-1 flex items-center justify-center py-2 rounded-md transition-all ${platform === 'instagram' ? 'bg-white text-pink-600 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <Instagram className="w-5 h-5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setPlatform('threads')}
                                className={`flex-1 flex items-center justify-center py-2 rounded-md transition-all ${platform === 'threads' ? 'bg-white text-black shadow-sm font-bold' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <AtSign className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">Estratégia de Busca</label>
                        <div className="space-y-2">
                             {[
                                 { id: 'comments', icon: MessageSquare, label: 'Comentários', desc: 'Pessoas perguntando "valor?"' },
                                 { id: 'groups', icon: Users, label: platform === 'threads' ? 'Discussões' : 'Grupos/Comunidades', desc: 'Membros engajados' },
                                 { id: 'business', icon: Building2, label: platform === 'instagram' ? 'Influencers/Bios' : 'Empresas', desc: 'Negócios e Criadores' }
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

                    <div className="space-y-4">
                        <input required value={niche} onChange={e => setNiche(e.target.value)} placeholder="Nicho (Ex: Imóveis, Nutrição)" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" />
                        <input required value={city} onChange={e => setCity(e.target.value)} placeholder="Cidade (Ex: São Paulo)" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" />
                    </div>

                    <button 
                        type="submit" 
                        disabled={isMining} 
                        className={`w-full py-3 text-white rounded-xl font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 bg-gradient-to-r ${getPlatformColors()}`}
                    >
                        {isMining ? <Loader2 className="animate-spin w-5 h-5" /> : <Search className="w-5 h-5" />}
                        {isMining ? 'Escaneando Rede...' : 'Iniciar Mineração'}
                    </button>
                </form>
            </div>

            {/* Dorks */}
            {dorks.length > 0 && (
                <div className="bg-slate-800 text-slate-300 p-5 rounded-xl border border-slate-700 animate-in fade-in slide-in-from-top-4">
                    <h4 className="text-white font-bold flex items-center gap-2 mb-3 text-sm">
                        <ShieldAlert className="w-4 h-4 text-yellow-400" /> Links Diretos (Google Dorks)
                    </h4>
                    <div className="space-y-2">
                        {dorks.map((d, i) => (
                            <a key={i} href={d.url} target="_blank" rel="noreferrer" className="block bg-slate-700 hover:bg-slate-600 p-3 rounded-lg border border-slate-600 group transition-colors">
                                <div className="flex justify-between items-center text-white text-xs font-bold mb-1">
                                    {d.label} <ExternalLink className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                                </div>
                                <p className="text-[10px] text-slate-400">{d.desc}</p>
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-3">
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
                            <p className="text-xs text-slate-500">{lead.description}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-mono">{lead.phone}</span>
                                <span className="text-[10px] font-bold text-slate-400">{lead.source}</span>
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={() => importLead(lead)}
                        disabled={importedIds.has(lead.id)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${importedIds.has(lead.id) ? 'bg-green-100 text-green-700' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                    >
                        {importedIds.has(lead.id) ? 'Salvo no CRM' : 'Capturar'}
                    </button>
                </div>
            ))}
            {leads.length === 0 && !isMining && (
                 <div className="text-center py-20 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                     <Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
                     <p>Selecione a rede social e inicie a busca.</p>
                 </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default LeadMiner;