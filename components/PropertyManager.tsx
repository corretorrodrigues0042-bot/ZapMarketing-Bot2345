import React, { useState, useEffect } from 'react';
import { Home, CalendarClock, CheckCircle, XCircle, RefreshCw, Loader2 } from 'lucide-react';
import { AppSettings, Campaign, Contact } from '../types';
import { generateOwnerUpdateMessage, analyzeOwnerResponse } from '../services/geminiService';
import { sendWhatsAppMessage } from '../services/whatsappService';
import { storageService } from '../services/storageService';

interface PropertyManagerProps {
    settings: AppSettings;
    userId: string;
}

const PropertyManager: React.FC<PropertyManagerProps> = ({ settings, userId }) => {
    const [properties, setProperties] = useState<Campaign[]>([]);
    const [checkingId, setCheckingId] = useState<string | null>(null);
    const [results, setResults] = useState<Record<string, string>>({});

    useEffect(() => {
        // Carrega campanhas com dossiê (imóveis)
        const loadProperties = async () => {
             const allCampaigns = await storageService.getCampaigns(userId);
             setProperties(allCampaigns.filter(c => c.dossier));
        };
        loadProperties();
    }, [userId, checkingId]); // Recarrega se houver alteração

    const handleCheckOwner = async (campaign: Campaign) => {
        if (!campaign.dossier) return;
        setCheckingId(campaign.id);
        
        try {
            const message = await generateOwnerUpdateMessage(campaign.dossier, settings.googleApiKey);
            
            const ownerContact: Contact = {
                id: campaign.dossier.ownerPhone.includes('@') ? campaign.dossier.ownerPhone : `${campaign.dossier.ownerPhone.replace(/\D/g, '')}@c.us`,
                name: campaign.dossier.ownerName,
                phone: campaign.dossier.ownerPhone,
                status: 'pending'
            };

            const sendResult = await sendWhatsAppMessage(ownerContact, message, [], settings);

            if (sendResult.success) {
                // SIMULAÇÃO DE RESPOSTA
                await new Promise(r => setTimeout(r, 2000));
                
                const mockResponses = ["Oi, ainda está a venda.", "Já vendi.", "Aumentei o valor."];
                const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];
                
                const analysis = await analyzeOwnerResponse(randomResponse, settings.googleApiKey);
                
                if (analysis.status === 'SOLD') {
                    setResults(prev => ({ ...prev, [campaign.id]: `VENDIDO - Arquivando...` }));
                    await storageService.updateCampaignStatus(userId, campaign.id, 'archived');
                } else {
                    setResults(prev => ({ ...prev, [campaign.id]: `CONFIRMADO - Ativo` }));
                }

            } else {
                setResults(prev => ({ ...prev, [campaign.id]: "Erro no envio." }));
            }

        } catch (error) {
            console.error(error);
        } finally {
            setCheckingId(null);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Portfólio & Proprietários</h2>
                    <p className="text-slate-500">Gestão automática de disponibilidade.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {properties.length === 0 ? (
                    <div className="p-12 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400">
                        <Home className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Nenhum imóvel cadastrado.</p>
                    </div>
                ) : (
                    properties.map(camp => (
                        <div key={camp.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center">
                                    <Home className="w-6 h-6 text-slate-500" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">{camp.dossier?.title}</h3>
                                    <p className="text-sm text-slate-500">
                                        {camp.dossier?.price} • {camp.status === 'archived' ? 'ARQUIVADO' : 'ATIVO'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                {results[camp.id] && (
                                    <span className="text-sm font-bold text-slate-600">{results[camp.id]}</span>
                                )}
                                <button 
                                    onClick={() => handleCheckOwner(camp)}
                                    disabled={!!checkingId || camp.status === 'archived'}
                                    className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 text-sm font-bold hover:bg-slate-50 flex items-center gap-2"
                                >
                                    {checkingId === camp.id ? <Loader2 className="animate-spin w-4 h-4"/> : <RefreshCw className="w-4 h-4" />}
                                    Checar
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default PropertyManager;