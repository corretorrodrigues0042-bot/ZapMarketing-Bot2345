import React, { useState, useEffect } from 'react';
import { Phone, ArrowRight, ArrowLeft, Trash2, Plus, RefreshCw, Loader2 } from 'lucide-react';
import { Contact } from '../types';
import { storageService } from '../services/storageService';
import { auth } from '../services/firebaseConfig';

const PipelineCRM: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Load from Firebase on mount or refresh
  useEffect(() => {
    const loadContacts = async () => {
      if (!auth.currentUser) return;
      setIsLoading(true);
      const loaded = await storageService.getContacts(auth.currentUser.uid);
      setContacts(loaded.map(c => ({
        ...c,
        pipelineStage: c.pipelineStage || 'new',
        value: c.value || 0
      })));
      setIsLoading(false);
    };
    loadContacts();
  }, [refreshKey]);

  const stages = [
    { id: 'new', label: 'Novos Leads', color: 'bg-slate-100 border-slate-200' },
    { id: 'contacted', label: 'Em Negociação', color: 'bg-blue-50 border-blue-200' },
    { id: 'interested', label: 'Quentes', color: 'bg-orange-50 border-orange-200' },
    { id: 'scheduled', label: 'Visita Agendada', color: 'bg-purple-50 border-purple-200' },
    { id: 'closed', label: 'Venda Fechada', color: 'bg-green-50 border-green-200' },
  ];

  const updateContactAndSave = async (updatedContact: Contact) => {
    // 1. Update Local State (Optimistic UI)
    setContacts(prev => prev.map(c => c.id === updatedContact.id ? updatedContact : c));
    
    // 2. Save to Cloud
    if (auth.currentUser) {
       await storageService.saveContact(auth.currentUser.uid, updatedContact);
    }
  };

  const moveCard = async (contactId: string, direction: 'next' | 'prev') => {
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) return;

    const currentIndex = stages.findIndex(s => s.id === contact.pipelineStage);
    let newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;

    // Bounds check
    if (newIndex < 0) newIndex = 0;
    if (newIndex >= stages.length) newIndex = stages.length - 1;

    const newStage = stages[newIndex].id as any;
    
    // Create updated object
    const updated = { ...contact, pipelineStage: newStage };
    await updateContactAndSave(updated);
  };

  const deleteCard = async (contactId: string) => {
    if(!confirm("Remover este lead do pipeline?")) return;
    
    setContacts(prev => prev.filter(c => c.id !== contactId));
    
    if (auth.currentUser) {
      await storageService.deleteContact(auth.currentUser.uid, contactId);
    }
  };

  const generateDemoLeads = async () => {
    if (!auth.currentUser) return;
    const demo: Contact = { 
        id: `demo-${Date.now()}`, 
        name: 'Cliente Teste', 
        phone: '5511999999999', 
        status: 'pending', 
        pipelineStage: 'new', 
        value: 500000,
        source: 'Simulação'
    };
    await storageService.saveContact(auth.currentUser.uid, demo);
    setRefreshKey(k => k + 1);
  };

  const formatCurrency = (val?: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  if (isLoading && contacts.length === 0) {
      return <div className="h-[calc(100vh-140px)] flex items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-slate-300"/></div>;
  }

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
           <h2 className="text-2xl font-bold text-slate-900">Pipeline de Vendas</h2>
           <p className="text-slate-500">Arraste os cards para avançar na negociação.</p>
        </div>
        <div className="flex gap-2">
            <button onClick={() => setRefreshKey(k => k+1)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
                <RefreshCw className="w-5 h-5" />
            </button>
            <button onClick={generateDemoLeads} className="px-4 py-2 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-2">
               <Plus className="w-4 h-4" /> Add Teste
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-4 h-full min-w-[1000px] pb-4">
          {stages.map(stage => {
             const stageContacts = contacts.filter(c => c.pipelineStage === stage.id);
             const totalValue = stageContacts.reduce((acc, curr) => acc + (curr.value || 0), 0);

             return (
              <div key={stage.id} className={`flex-1 min-w-[280px] flex flex-col rounded-xl border ${stage.color} backdrop-blur-sm`}>
                
                {/* Column Header */}
                <div className="p-4 border-b border-black/5">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">{stage.label}</h3>
                    <span className="bg-white/50 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">{stageContacts.length}</span>
                  </div>
                  <div className="text-xs text-slate-500 font-mono">
                    {formatCurrency(totalValue)}
                  </div>
                </div>

                {/* Cards Container */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {stageContacts.map(contact => (
                    <div key={contact.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 group hover:border-blue-400 hover:shadow-md transition-all">
                      
                      <div className="flex justify-between items-start mb-2">
                         <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500 uppercase">{contact.source || 'Lead'}</span>
                         <button onClick={() => deleteCard(contact.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 className="w-4 h-4" />
                         </button>
                      </div>

                      <h4 className="font-bold text-slate-800 mb-1">{contact.name}</h4>
                      
                      <div className="flex items-center gap-1 text-xs text-slate-500 mb-3">
                         <Phone className="w-3 h-3" /> {contact.phone}
                      </div>

                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-50">
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                          {formatCurrency(contact.value)}
                        </span>
                        
                        <div className="flex gap-1">
                           <button 
                            onClick={() => moveCard(contact.id, 'prev')}
                            disabled={stage.id === 'new'}
                            className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30"
                            title="Voltar Estágio"
                           >
                             <ArrowLeft className="w-4 h-4" />
                           </button>
                           <button 
                            onClick={() => moveCard(contact.id, 'next')}
                            disabled={stage.id === 'closed'}
                            className="p-1.5 hover:bg-blue-50 rounded text-slate-400 hover:text-blue-600 disabled:opacity-30"
                            title="Avançar Estágio"
                           >
                             <ArrowRight className="w-4 h-4" />
                           </button>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PipelineCRM;