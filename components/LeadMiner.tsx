import React, { useState } from 'react';
import { Search, MessageSquare, Building2, Users, UserPlus, Loader2, ExternalLink, ShieldAlert, Database } from 'lucide-react';
import { mineLeadsWithAI, generateOsintDorks } from '../services/geminiService';
import { AppSettings, Lead, Contact } from '../types';
import { storageService } from '../services/storageService';

interface LeadMinerProps {
  settings: AppSettings;
  userId: string;
}

const LeadMiner: React.FC<LeadMinerProps> = ({ settings, userId }) => {
  const [niche, setNiche] = useState('');
  const [city, setCity] = useState('');
  const [strategy, setStrategy] = useState<'business' | 'comments' | 'groups'>('comments');
  const [isMining, setIsMining] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());
  const [dorks, setDorks] = useState<{label: string, url: string, desc: string}[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!niche || !city) return;

    setIsMining(true);
    setLeads([]);
    setDorks(generateOsintDorks(niche, city));

    try {
      const results = await mineLeadsWithAI(niche, city, strategy, settings.googleApiKey);
      const formattedLeads: Lead[] = results.map((l, i) => ({
        id: `lead-${Date.now()}-${i}`,
        name: l.name,
        phone: l.phone,
        source: l.source,
        description: l.description
      }));
      setLeads(formattedLeads);
    } catch (error) {
      alert("Erro ao buscar leads.");
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
    storageService.saveContact(userId, newContact);
    
    setImportedIds(prev => new Set(prev).add(lead.id));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-slate-900 text-white p-8 rounded-2xl shadow-xl border border-slate-700 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
           <Database className="w-48 h-48 text-blue-400" />
        </div>
        <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
                <span className="bg-blue-600 text-xs font-bold px-2 py-1 rounded text-white animate-pulse">OSINT ATIVADO</span>
            </div>
            <h2 className="text-3xl font-bold text-white">Minerador de Leads</h2>
            <p className="text-slate-400 mt-2">Encontre clientes reais escondidos em comentários e grupos.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Config Panel */}
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <form onSubmit={handleSearch} className="space-y-5">
                    <div>
                        <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">Estratégia</label>
                        <div className="space-y-2">
                             {[
                                 { id: 'comments', icon: MessageSquare, label: 'Comentários', desc: 'Pessoas perguntando "valor?"' },
                                 { id: 'groups', icon: Users, label: 'Grupos', desc: 'Membros de comunidades' },
                                 { id: 'business', icon: Building2, label: 'Empresas', desc: 'Negócios locais' }
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
                        <input required value={niche} onChange={e => setNiche(e.target.value)} placeholder="Nicho (Ex: Imóveis)" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" />
                        <input required value={city} onChange={e => setCity(e.target.value)} placeholder="Cidade (Ex: São Paulo)" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" />
                    </div>

                    <button type="submit" disabled={isMining} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                        {isMining ? <Loader2 className="animate-spin w-5 h-5" /> : <Search className="w-5 h-5" />}
                        {isMining ? 'Escaneando...' : 'Iniciar'}
                    </button>
                </form>
            </div>

            {/* Dorks */}
            {dorks.length > 0 && (
                <div className="bg-slate-800 text-slate-300 p-5 rounded-xl border border-slate-700">
                    <h4 className="text-white font-bold flex items-center gap-2 mb-3 text-sm">
                        <ShieldAlert className="w-4 h-4 text-yellow-400" /> Links Diretos
                    </h4>
                    <div className="space-y-2">
                        {dorks.map((d, i) => (
                            <a key={i} href={d.url} target="_blank" rel="noreferrer" className="block bg-slate-700 hover:bg-slate-600 p-3 rounded-lg border border-slate-600 group">
                                <div className="flex justify-between items-center text-white text-xs font-bold mb-1">
                                    {d.label} <ExternalLink className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-3">
             {leads.map(lead => (
                <div key={lead.id} className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                            {lead.name.charAt(0)}
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900">{lead.name}</h4>
                            <p className="text-xs text-slate-500">{lead.description}</p>
                            <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 mt-1 inline-block">{lead.phone}</span>
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
                 <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                     Nenhum resultado ainda.
                 </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default LeadMiner;