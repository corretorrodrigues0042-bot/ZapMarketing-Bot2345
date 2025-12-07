import { Campaign, Contact, Visit, AppSettings, User } from '../types';

// SERVIÇO DE DADOS HÍBRIDO (LOCAL / PREPARADO PARA NEON)
// Como removemos o Supabase, agora gerenciamos os dados localmente.
// Isso permite que o app funcione offline ou seja distribuído como SaaS standalone.

const getDBKey = (userId: string, table: string) => `zap_neon_${userId}_${table}`;

export const storageService = {
  // --- ADMIN FUNCTIONS ---
  getAllUsers: async (): Promise<User[]> => {
    // Busca do "Banco de Dados" simulado no AuthService
    const users = JSON.parse(localStorage.getItem('zap_neon_users_v1') || '[]');
    return users.map((u: any) => {
        const { password, ...safeUser } = u;
        return safeUser;
    });
  },

  updateUserPlan: async (targetUserId: string, newPlan: 'free' | 'pro' | 'enterprise') => {
    const users = JSON.parse(localStorage.getItem('zap_neon_users_v1') || '[]');
    const updatedUsers = users.map((u: any) => u.uid === targetUserId ? { ...u, plan: newPlan } : u);
    localStorage.setItem('zap_neon_users_v1', JSON.stringify(updatedUsers));
  },

  // --- USER SETTINGS ---
  getUserSettings: async (userId: string): Promise<AppSettings | null> => {
    const saved = localStorage.getItem(`zap_settings_${userId}`);
    return saved ? JSON.parse(saved) : null;
  },

  saveUserSettings: async (userId: string, settings: AppSettings) => {
    localStorage.setItem(`zap_settings_${userId}`, JSON.stringify(settings));
  },

  // --- CAMPAIGNS ---
  getCampaigns: async (userId: string): Promise<Campaign[]> => {
    return JSON.parse(localStorage.getItem(getDBKey(userId, 'campaigns')) || '[]');
  },

  saveCampaign: async (userId: string, campaign: Campaign) => {
    const key = getDBKey(userId, 'campaigns');
    const items = await storageService.getCampaigns(userId);
    const existingIndex = items.findIndex(i => i.id === campaign.id);
    
    if (existingIndex >= 0) {
        items[existingIndex] = campaign;
    } else {
        items.push(campaign);
    }
    
    localStorage.setItem(key, JSON.stringify(items));
  },

  updateCampaignStatus: async (userId: string, campaignId: string, status: string) => {
    const campaigns = await storageService.getCampaigns(userId);
    const updated = campaigns.map(c => c.id === campaignId ? { ...c, status: status as any } : c);
    localStorage.setItem(getDBKey(userId, 'campaigns'), JSON.stringify(updated));
  },

  // --- CONTACTS ---
  getContacts: async (userId: string): Promise<Contact[]> => {
    return JSON.parse(localStorage.getItem(getDBKey(userId, 'contacts')) || '[]');
  },

  saveContact: async (userId: string, contact: Contact) => {
    const key = getDBKey(userId, 'contacts');
    const items = await storageService.getContacts(userId);
    const existingIndex = items.findIndex(i => i.id === contact.id);

    if (existingIndex >= 0) {
        items[existingIndex] = contact;
    } else {
        items.push(contact);
    }
    
    localStorage.setItem(key, JSON.stringify(items));
  },

  saveContactsBulk: async (userId: string, newContacts: Contact[]) => {
    const key = getDBKey(userId, 'contacts');
    const items = await storageService.getContacts(userId);
    
    const existingIds = new Set(items.map(i => i.id));
    const toAdd = newContacts.filter(c => !existingIds.has(c.id));
    
    localStorage.setItem(key, JSON.stringify([...items, ...toAdd]));
  },

  deleteContact: async (userId: string, contactId: string) => {
    const key = getDBKey(userId, 'contacts');
    const items = await storageService.getContacts(userId);
    const filtered = items.filter(i => i.id !== contactId);
    localStorage.setItem(key, JSON.stringify(filtered));
  },

  // --- VISITS ---
  getVisits: async (userId: string): Promise<Visit[]> => {
    return JSON.parse(localStorage.getItem(getDBKey(userId, 'visits')) || '[]');
  },

  saveVisit: async (userId: string, visit: Visit) => {
    const key = getDBKey(userId, 'visits');
    const items = await storageService.getVisits(userId);
    items.push(visit);
    localStorage.setItem(key, JSON.stringify(items));
  },

  toggleVisit: async (userId: string, visitId: string, completed: boolean) => {
     const key = getDBKey(userId, 'visits');
     const items = await storageService.getVisits(userId);
     const updated = items.map(v => v.id === visitId ? { ...v, completed } : v);
     localStorage.setItem(key, JSON.stringify(updated));
  }
};
