import { AppSettings, Contact, Campaign, ChatMessage, WhatsAppMessage, Visit } from '../types';
import { getChatHistory, sendWhatsAppMessage } from './whatsappService';
import { negotiateRealEstate, detectIntentAndSchedule } from './geminiService';
import { storageService } from './storageService';

/**
 * SERVIÇO DE AUTOMAÇÃO DE CHAT (BOT AUTÔNOMO)
 * Executa o loop de verificação, resposta IA e agendamento.
 */

// Cache simples para evitar responder a mesma mensagem 2x durante a sessão
const processedMessageIds = new Set<string>();

export const autoBotService = {
    
    // Executa um ciclo completo de verificação
    runCycle: async (
        settings: AppSettings, 
        userId: string, 
        contacts: Contact[], 
        campaigns: Campaign[]
    ): Promise<{ handled: number; actions: string[] }> => {
        
        // Se a automação global estiver desligada, aborta
        // (Assumimos que existe uma flag global nos settings, se não, usamos true por default se ativado no componente)
        
        let actionsLog: string[] = [];
        let handledCount = 0;

        // Filtra apenas contatos com autoReply ligado
        const activeContacts = contacts.filter(c => c.autoReplyEnabled && c.linkedCampaignId);

        for (const contact of activeContacts) {
            try {
                // 1. Busca histórico recente
                const history = await getChatHistory(settings, contact.id);
                if (history.length === 0) continue;

                const lastMsg = history[history.length - 1];

                // 2. Verifica se precisa responder
                // Regra: Última msg não é minha (fromMe=false) E ainda não processei esse ID
                if (!lastMsg.fromMe && !processedMessageIds.has(lastMsg.id)) {
                    
                    // Adiciona ao cache para não loopar
                    processedMessageIds.add(lastMsg.id);

                    // 3. Analisa Intenção PRIMEIRO (Antes de responder)
                    // Se o cliente disse "pare", a gente desliga o bot para ele.
                    const intentAnalysis = await detectIntentAndSchedule(lastMsg.text, settings.googleApiKey);
                    
                    if (intentAnalysis.intent === 'STOP_BOT') {
                        // Desliga bot para este contato
                        const updatedContact = { ...contact, autoReplyEnabled: false, status: 'failed' as const };
                        await storageService.saveContact(userId, updatedContact);
                        actionsLog.push(`⛔ Bot desligado para ${contact.name} (Solicitado pelo cliente).`);
                        continue;
                    }

                    if (intentAnalysis.intent === 'SCHEDULE_VISIT') {
                        // Agendar Visita
                        const visit: Visit = {
                            id: `visit-auto-${Date.now()}`,
                            contactId: contact.id,
                            date: intentAnalysis.extractedDate || new Date().toISOString(),
                            notes: `Agendado via IA: "${lastMsg.text}"`,
                            completed: false
                        };
                        await storageService.saveVisit(userId, visit);
                        
                        // Atualiza pipeline
                        const updatedContact = { 
                            ...contact, 
                            pipelineStage: 'scheduled' as const,
                            autoReplyEnabled: false // Desliga bot após agendar para humano assumir? Ou mantem? Vamos desligar para evitar gafes.
                        };
                        await storageService.saveContact(userId, updatedContact);
                        
                        // Envia confirmação
                        await sendWhatsAppMessage(contact, "Perfeito! Deixei pré-agendado aqui na minha agenda. Um consultor humano vai apenas confirmar o horário exato com você em breve. Obrigado!", [], settings);
                        
                        actionsLog.push(`📅 Visita agendada para ${contact.name}!`);
                        handledCount++;
                        continue;
                    }

                    // 4. Se não for stop nem agendamento, gera resposta de negociação
                    const campaign = campaigns.find(c => c.id === contact.linkedCampaignId);
                    
                    if (campaign && campaign.dossier) {
                        // Prepara histórico para IA
                        const aiHistory: ChatMessage[] = history.map(m => ({
                            role: m.fromMe ? 'model' : 'user',
                            text: m.text
                        }));

                        const aiResponse = await negotiateRealEstate(aiHistory, campaign.dossier, settings.googleApiKey);
                        
                        // Envia
                        await sendWhatsAppMessage(contact, aiResponse, [], settings);
                        
                        // Atualiza CRM (Last Interaction)
                        const updatedContact = { ...contact, lastInteraction: new Date().toISOString() };
                        await storageService.saveContact(userId, updatedContact);

                        actionsLog.push(`🤖 Respondido para ${contact.name}: "${aiResponse.substring(0, 20)}..."`);
                        handledCount++;
                    }
                }

            } catch (error) {
                console.error(`Erro ao processar bot para ${contact.name}`, error);
            }
        }

        return { handled: handledCount, actions: actionsLog };
    }
};