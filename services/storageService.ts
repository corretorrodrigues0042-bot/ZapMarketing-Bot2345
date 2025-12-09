import { Campaign, Contact, Visit, AppSettings, User } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';

// Helper para chave do LocalStorage (Fallback)
const getLocalKey = (userId: string, key: string) => `zap_marketing_${userId}_${key}`;

/**
 * SERVIÇO DE ARMAZENAMENTO HÍBRIDO (SUPABASE FIRST)
 * Tenta salvar na nuvem (Supabase). Se falhar ou não configurado, usa LocalStorage.
 */
export const storageService = {

  // --- SETTINGS (Salvas no perfil do usuário no Supabase) ---
  getUserSettings: async (userId: string): Promise<AppSettings | null> => {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase
        .from('profiles')
        .select('settings')
        .eq('id', userId)
        .single();
      
      if (data && data.settings) return data.settings as AppSettings;
    }
    // Fallback Local
    const saved = localStorage.getItem(getLocalKey(userId, 'settings'));
    return saved ? JSON.parse(saved) : null;
  },

  saveUserSettings: async (userId: string, settings: AppSettings) => {
    localStorage.setItem(getLocalKey(userId, 'settings'), JSON.stringify(settings));
    
    if (isSupabaseConfigured && supabase) {
      await supabase
        .from('profiles')
        .update({ settings: settings })
        .eq('id', userId);
    }
  },

  // --- CONTACTS (Tabela 'contacts') ---
  getContacts: async (userId: string): Promise<Contact[]> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('contacts')
        .select('content') // Pegamos o JSON inteiro
        .eq('user_id', userId);
      
      if (!error && data) {
          // Mapeia do formato { content: {...} } para o objeto Contact direto
          return data.map((row: any) => row.content as Contact);
      }
    }
    const saved = localStorage.getItem(getLocalKey(userId, 'contacts'));
    return saved ? JSON.parse(saved) : [];
  },

  saveContact: async (userId: string, contact: Contact) => {
    // 1. Local Update (Optimistic UI)
    const localContacts = JSON.parse(localStorage.getItem(getLocalKey(userId, 'contacts')) || '[]');
    const existingIndex = localContacts.findIndex((c: Contact) => c.id === contact.id);
    if (existingIndex >= 0) localContacts[existingIndex] = contact;
    else localContacts.push(contact);
    localStorage.setItem(getLocalKey(userId, 'contacts'), JSON.stringify(localContacts));

    // 2. Supabase Upsert
    if (isSupabaseConfigured && supabase) {
      // Usamos uma coluna JSONB 'content' para flexibilidade total, 
      // mas usamos 'id' e 'user_id' como chaves primárias compostas no banco
      await supabase.from('contacts').upsert({
          id: contact.id, // ID do contato (ex: telefone)
          user_id: userId,
          content: contact // O objeto inteiro JSON
      });
    }
  },

  saveContactsBulk: async (userId: string, newContacts: Contact[]) => {
    // Local Update
    const current = JSON.parse(localStorage.getItem(getLocalKey(userId, 'contacts')) || '[]');
    const combined = [...current, ...newContacts.filter(n => !current.find((c:Contact) => c.id === n.id))];
    localStorage.setItem(getLocalKey(userId, 'contacts'), JSON.stringify(combined));

    // Supabase Bulk Insert
    if (isSupabaseConfigured && supabase) {
        const rows = newContacts.map(c => ({
            id: c.id,
            user_id: userId,
            content: c
        }));
        
        // Upsert em batch é eficiente
        await supabase.from('contacts').upsert(rows);
    }
  },

  deleteContact: async (userId: string, contactId: string) => {
    const list = JSON.parse(localStorage.getItem(getLocalKey(userId, 'contacts')) || '[]');
    const newList = list.filter((c: Contact) => c.id !== contactId);
    localStorage.setItem(getLocalKey(userId, 'contacts'), JSON.stringify(newList));

    if (isSupabaseConfigured && supabase) {
        await supabase
            .from('contacts')
            .delete()
            .eq('id', contactId)
            .eq('user_id', userId);
    }
  },

  // --- CAMPAIGNS (Tabela 'campaigns') ---
  getCampaigns: async (userId: string): Promise<Campaign[]> => {
    if (isSupabaseConfigured && supabase) {
        const { data } = await supabase.from('campaigns').select('content').eq('user_id', userId);
        if (data) return data.map((d: any) => d.content as Campaign);
    }
    const saved = localStorage.getItem(getLocalKey(userId, 'campaigns'));
    return saved ? JSON.parse(saved) : [];
  },

  saveCampaign: async (userId: string, campaign: Campaign) => {
    // Local
    const list = JSON.parse(localStorage.getItem(getLocalKey(userId, 'campaigns')) || '[]');
    const idx = list.findIndex((c: Campaign) => c.id === campaign.id);
    if (idx >= 0) list[idx] = campaign;
    else list.push(campaign);
    localStorage.setItem(getLocalKey(userId, 'campaigns'), JSON.stringify(list));

    // Supabase
    if (isSupabaseConfigured && supabase) {
        await supabase.from('campaigns').upsert({
            id: campaign.id,
            user_id: userId,
            status: campaign.status, // Coluna separada útil para filtros
            content: campaign
        });
    }
  },

  updateCampaignStatus: async (userId: string, campaignId: string, status: string) => {
    const campaigns = await storageService.getCampaigns(userId);
    const updated = campaigns.map(c => c.id === campaignId ? { ...c, status: status as any } : c);
    localStorage.setItem(getLocalKey(userId, 'campaigns'), JSON.stringify(updated));

    if (isSupabaseConfigured && supabase) {
        // Atualiza tanto a coluna de status quanto o JSON interno para manter consistência
        // Precisamos buscar o conteúdo atual, mudar e salvar, ou confiar no client.
        // Aqui faremos um patch simples na coluna status e no content
        const campaign = campaigns.find(c => c.id === campaignId);
        if (campaign) {
            campaign.status = status as any;
            await supabase.from('campaigns').update({
                status: status,
                content: campaign
            }).eq('id', campaignId).eq('user_id', userId);
        }
    }
  },

  // --- VISITS (Tabela 'visits') ---
  getVisits: async (userId: string): Promise<Visit[]> => {
    if (isSupabaseConfigured && supabase) {
        const { data } = await supabase.from('visits').select('content').eq('user_id', userId);
        if (data) return data.map((d: any) => d.content as Visit);
    }
    const saved = localStorage.getItem(getLocalKey(userId, 'visits'));
    return saved ? JSON.parse(saved) : [];
  },

  saveVisit: async (userId: string, visit: Visit) => {
    const list = JSON.parse(localStorage.getItem(getLocalKey(userId, 'visits')) || '[]');
    list.push(visit);
    localStorage.setItem(getLocalKey(userId, 'visits'), JSON.stringify(list));

    if (isSupabaseConfigured && supabase) {
        await supabase.from('visits').upsert({
            id: visit.id,
            user_id: userId,
            content: visit
        });
    }
  },

  toggleVisit: async (userId: string, visitId: string, completed: boolean) => {
     const list = JSON.parse(localStorage.getItem(getLocalKey(userId, 'visits')) || '[]');
     const updated = list.map((v: Visit) => v.id === visitId ? { ...v, completed } : v);
     localStorage.setItem(getLocalKey(userId, 'visits'), JSON.stringify(updated));

     if (isSupabaseConfigured && supabase) {
         // Atualiza o JSON no banco
         const visit = updated.find((v: Visit) => v.id === visitId);
         if (visit) {
            await supabase.from('visits').upsert({
                id: visitId,
                user_id: userId,
                content: visit
            });
         }
     }
  },

  // --- ADMIN (USERS) ---
  getAllUsers: async (): Promise<User[]> => {
    if (isSupabaseConfigured && supabase) {
        const { data } = await supabase.from('profiles').select('*');
        if (data) {
            return data.map((p: any) => ({
                uid: p.id,
                name: p.name || 'Sem Nome',
                email: p.email,
                plan: p.plan || 'free',
                isAuthenticated: true,
                isAdmin: p.is_admin
            }));
        }
    }
    // Local Mock
    return JSON.parse(localStorage.getItem('zap_global_users') || '[]');
  },

  updateUserPlan: async (targetId: string, newPlan: string) => {
    if (isSupabaseConfigured && supabase) {
        await supabase.from('profiles').update({ plan: newPlan }).eq('id', targetId);
    }
    // Local Mock
    const users = JSON.parse(localStorage.getItem('zap_global_users') || '[]');
    const updated = users.map((u: any) => u.uid === targetId ? { ...u, plan: newPlan } : u);
    localStorage.setItem('zap_global_users', JSON.stringify(updated));
  }
};
