import { Campaign, Contact, Visit, AppSettings } from '../types';
import { MOCK_CONTACTS, MOCK_VISITS } from './mockData';

const KEYS = {
  CAMPAIGNS: 'zap_marketing_campaigns',
  CONTACTS: 'zap_marketing_contacts',
  VISITS: 'zap_marketing_visits',
  SETTINGS: 'zap_marketing_settings'
};

export const storageService = {
  // --- CAMPAIGNS ---
  getCampaigns: (): Campaign[] => {
    try {
      const data = localStorage.getItem(KEYS.CAMPAIGNS);
      return data ? JSON.parse(data) : [];
    } catch { return []; }
  },

  saveCampaign: (campaign: Campaign) => {
    const campaigns = storageService.getCampaigns();
    // Update or Add
    const index = campaigns.findIndex(c => c.id === campaign.id);
    if (index >= 0) {
      campaigns[index] = campaign;
    } else {
      campaigns.unshift(campaign);
    }
    localStorage.setItem(KEYS.CAMPAIGNS, JSON.stringify(campaigns));
  },

  updateCampaignStatus: (id: string, status: 'draft' | 'running' | 'completed' | 'archived') => {
    const campaigns = storageService.getCampaigns();
    const campaign = campaigns.find(c => c.id === id);
    if (campaign) {
      campaign.status = status;
      localStorage.setItem(KEYS.CAMPAIGNS, JSON.stringify(campaigns));
    }
  },

  // --- CONTACTS ---
  getContacts: (): Contact[] => {
    try {
      const data = localStorage.getItem(KEYS.CONTACTS);
      if (!data) {
        // First load: seed with Mocks if empty, then save
        if (MOCK_CONTACTS.length > 0) {
             localStorage.setItem(KEYS.CONTACTS, JSON.stringify(MOCK_CONTACTS));
             return MOCK_CONTACTS;
        }
        return [];
      }
      return JSON.parse(data);
    } catch { return []; }
  },

  saveContact: (contact: Contact) => {
    const contacts = storageService.getContacts();
    const index = contacts.findIndex(c => c.id === contact.id);
    if (index >= 0) {
      contacts[index] = { ...contacts[index], ...contact };
    } else {
      contacts.push(contact);
    }
    localStorage.setItem(KEYS.CONTACTS, JSON.stringify(contacts));
  },

  saveContactsBulk: (newContacts: Contact[]) => {
    const current = storageService.getContacts();
    const ids = new Set(current.map(c => c.id));
    const toAdd = newContacts.filter(c => !ids.has(c.id));
    const updated = [...current, ...toAdd];
    localStorage.setItem(KEYS.CONTACTS, JSON.stringify(updated));
  },

  deleteContact: (id: string) => {
      const contacts = storageService.getContacts().filter(c => c.id !== id);
      localStorage.setItem(KEYS.CONTACTS, JSON.stringify(contacts));
  },

  // --- VISITS ---
  getVisits: (): Visit[] => {
    try {
      const data = localStorage.getItem(KEYS.VISITS);
      return data ? JSON.parse(data) : MOCK_VISITS;
    } catch { return []; }
  },

  saveVisit: (visit: Visit) => {
    const visits = storageService.getVisits();
    visits.push(visit);
    localStorage.setItem(KEYS.VISITS, JSON.stringify(visits));
  },

  updateVisit: (visit: Visit) => {
      const visits = storageService.getVisits().map(v => v.id === visit.id ? visit : v);
      localStorage.setItem(KEYS.VISITS, JSON.stringify(visits));
  }
};
