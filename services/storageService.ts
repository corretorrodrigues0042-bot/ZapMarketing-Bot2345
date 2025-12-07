import { db, isFirebaseConfigured } from './firebaseConfig';
import { collection, addDoc, getDocs, updateDoc, doc, query, deleteDoc, setDoc, getDoc } from 'firebase/firestore';
import { Campaign, Contact, Visit, AppSettings, User } from '../types';

// Utilitário para salvar no LocalStorage (Modo Grátis/Offline)
const localStore = {
  get: (key: string) => JSON.parse(localStorage.getItem(key) || '[]'),
  set: (key: string, data: any) => localStorage.setItem(key, JSON.stringify(data)),
  add: (userId: string, collection: string, item: any) => {
    const key = `zap_${userId}_${collection}`;
    const items = localStore.get(key);
    const newItem = { ...item, id: item.id || `local-${Date.now()}` };
    items.push(newItem);
    localStore.set(key, items);
    return newItem;
  },
  update: (userId: string, collection: string, itemId: string, updates: any) => {
    const key = `zap_${userId}_${collection}`;
    const items = localStore.get(key);
    const newItems = items.map((i: any) => i.id === itemId ? { ...i, ...updates } : i);
    localStore.set(key, newItems);
  },
  delete: (userId: string, collection: string, itemId: string) => {
    const key = `zap_${userId}_${collection}`;
    const items = localStore.get(key);
    localStore.set(key, items.filter((i: any) => i.id !== itemId));
  }
};

const getUserCollection = (userId: string, collectionName: string) => {
  if (!db) throw new Error("Firebase not initialized");
  return collection(db, `users/${userId}/${collectionName}`);
};

export const storageService = {
  // --- ADMIN FUNCTIONS ---
  getAllUsers: async (): Promise<User[]> => {
    if (!isFirebaseConfigured || !db) return []; // Modo local não tem admin
    try {
        const q = collection(db, 'users');
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ 
            uid: d.id, 
            ...d.data() 
        } as User));
    } catch (e) { console.error("Erro admin:", e); return []; }
  },

  updateUserPlan: async (targetUserId: string, newPlan: 'free' | 'pro' | 'enterprise') => {
    if (!isFirebaseConfigured || !db) return;
    try {
        await updateDoc(doc(db, 'users', targetUserId), { plan: newPlan });
    } catch (e) { console.error("Erro update plan:", e); }
  },

  // --- USER SETTINGS ---
  getUserSettings: async (userId: string): Promise<AppSettings | null> => {
    if (!isFirebaseConfigured) {
       const saved = localStorage.getItem(`zap_settings_${userId}`);
       return saved ? JSON.parse(saved) : null;
    }
    try {
      // Tenta buscar do firebase
      if(db) {
          const docRef = doc(db, 'users', userId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists() && docSnap.data().settings) {
              return docSnap.data().settings;
          }
      }
      return null; 
    } catch { return null; }
  },

  saveUserSettings: async (userId: string, settings: AppSettings) => {
    // Sempre salva no LocalStorage para garantir performance
    localStorage.setItem(`zap_settings_${userId}`, JSON.stringify(settings));
    
    if (isFirebaseConfigured && db) {
      try {
        const userRef = doc(db, 'users', userId);
        await setDoc(userRef, { settings }, { merge: true });
      } catch (e) { console.error(e); }
    }
  },

  // --- CAMPAIGNS ---
  getCampaigns: async (userId: string): Promise<Campaign[]> => {
    if (!isFirebaseConfigured || !db) return localStore.get(`zap_${userId}_campaigns`);
    
    try {
      const q = query(getUserCollection(userId, 'campaigns'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Campaign));
    } catch (e) { console.error(e); return []; }
  },

  saveCampaign: async (userId: string, campaign: Campaign) => {
    if (!isFirebaseConfigured || !db) {
      // Modo Local: Atualiza ou Cria
      const key = `zap_${userId}_campaigns`;
      const items = localStore.get(key);
      const exists = items.find((i: any) => i.id === campaign.id);
      if (exists) {
         localStore.update(userId, 'campaigns', campaign.id, campaign);
      } else {
         localStore.add(userId, 'campaigns', campaign);
      }
      return;
    }

    try {
      if (campaign.id && campaign.id.length > 20) {
         const docRef = doc(db, `users/${userId}/campaigns`, campaign.id);
         await setDoc(docRef, campaign, { merge: true });
      } else {
         const { id, ...data } = campaign;
         await addDoc(getUserCollection(userId, 'campaigns'), data);
      }
    } catch (e) { console.error(e); }
  },

  updateCampaignStatus: async (userId: string, campaignId: string, status: string) => {
    if (!isFirebaseConfigured || !db) {
       localStore.update(userId, 'campaigns', campaignId, { status });
       return;
    }
    try {
      const docRef = doc(db, `users/${userId}/campaigns`, campaignId);
      await updateDoc(docRef, { status });
    } catch (e) { console.error(e); }
  },

  // --- CONTACTS ---
  getContacts: async (userId: string): Promise<Contact[]> => {
    if (!isFirebaseConfigured || !db) return localStore.get(`zap_${userId}_contacts`);

    try {
      const q = query(getUserCollection(userId, 'contacts'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Contact));
    } catch (e) { console.error(e); return []; }
  },

  saveContact: async (userId: string, contact: Contact) => {
    if (!isFirebaseConfigured || !db) {
        // Verifica duplicidade simples no modo local
        const items = localStore.get(`zap_${userId}_contacts`);
        if (!items.find((i:any) => i.id === contact.id)) {
            localStore.add(userId, 'contacts', contact);
        }
        return;
    }

    try {
       const docRef = contact.id && contact.id.length > 20 
         ? doc(db, `users/${userId}/contacts`, contact.id)
         : doc(getUserCollection(userId, 'contacts')); 
       await setDoc(docRef, { ...contact, id: docRef.id }, { merge: true });
    } catch (e) { console.error(e); }
  },

  saveContactsBulk: async (userId: string, newContacts: Contact[]) => {
    if (!isFirebaseConfigured || !db) {
        const key = `zap_${userId}_contacts`;
        const items = localStore.get(key);
        // Merge simples
        const existingIds = new Set(items.map((i:any) => i.id));
        const toAdd = newContacts.filter(c => !existingIds.has(c.id));
        localStore.set(key, [...items, ...toAdd]);
        return;
    }
    
    for (const contact of newContacts) {
        await addDoc(getUserCollection(userId, 'contacts'), contact);
    }
  },

  deleteContact: async (userId: string, contactId: string) => {
    if (!isFirebaseConfigured || !db) {
        localStore.delete(userId, 'contacts', contactId);
        return;
    }
    try {
      await deleteDoc(doc(db, `users/${userId}/contacts`, contactId));
    } catch (e) { console.error(e); }
  },

  // --- VISITS ---
  getVisits: async (userId: string): Promise<Visit[]> => {
    if (!isFirebaseConfigured || !db) return localStore.get(`zap_${userId}_visits`);

    try {
      const q = query(getUserCollection(userId, 'visits'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Visit));
    } catch (e) { return []; }
  },

  saveVisit: async (userId: string, visit: Visit) => {
    if (!isFirebaseConfigured || !db) {
        localStore.add(userId, 'visits', visit);
        return;
    }
    await addDoc(getUserCollection(userId, 'visits'), visit);
  },

  toggleVisit: async (userId: string, visitId: string, completed: boolean) => {
     if (!isFirebaseConfigured || !db) {
        localStore.update(userId, 'visits', visitId, { completed });
        return;
     }
     const docRef = doc(db, `users/${userId}/visits`, visitId);
     await updateDoc(docRef, { completed });
  }
};