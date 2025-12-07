import { db } from './firebaseConfig';
import { collection, addDoc, getDocs, updateDoc, doc, query, where, deleteDoc, setDoc } from 'firebase/firestore';
import { Campaign, Contact, Visit, AppSettings, User } from '../types';

// O ID do usuário deve ser passado para garantir que cada um veja apenas seus dados
const getUserCollection = (userId: string, collectionName: string) => {
  return collection(db, `users/${userId}/${collectionName}`);
};

export const storageService = {
  // --- USER SETTINGS ---
  getUserSettings: async (userId: string): Promise<AppSettings | null> => {
    try {
      const docRef = doc(db, 'users', userId);
      // Aqui simplificamos pegando do documento do usuário
      // Na prática, você buscaria o snapshot
      return null; // Implementação simplificada, settings locais por enquanto ou via context
    } catch { return null; }
  },

  saveUserSettings: async (userId: string, settings: AppSettings) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { settings });
    } catch (e) { console.error(e); }
  },

  // --- CAMPAIGNS ---
  getCampaigns: async (userId: string): Promise<Campaign[]> => {
    try {
      const q = query(getUserCollection(userId, 'campaigns'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Campaign));
    } catch (e) { console.error(e); return []; }
  },

  saveCampaign: async (userId: string, campaign: Campaign) => {
    try {
      // Se tiver ID e não for numérico (gerado pelo firebase), atualiza. Se for novo, cria.
      if (campaign.id && campaign.id.length > 20) {
         const docRef = doc(db, `users/${userId}/campaigns`, campaign.id);
         await setDoc(docRef, campaign, { merge: true });
      } else {
         // Limpa ID temporário se houver
         const { id, ...data } = campaign;
         await addDoc(getUserCollection(userId, 'campaigns'), data);
      }
    } catch (e) { console.error(e); }
  },

  updateCampaignStatus: async (userId: string, campaignId: string, status: string) => {
    try {
      const docRef = doc(db, `users/${userId}/campaigns`, campaignId);
      await updateDoc(docRef, { status });
    } catch (e) { console.error(e); }
  },

  // --- CONTACTS ---
  getContacts: async (userId: string): Promise<Contact[]> => {
    try {
      const q = query(getUserCollection(userId, 'contacts'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Contact));
    } catch (e) { console.error(e); return []; }
  },

  saveContact: async (userId: string, contact: Contact) => {
    try {
       // Verifica se já existe pelo telefone para evitar duplicidade
       // Simplificação: Adiciona direto. Num app real, faria check antes.
       const docRef = contact.id && contact.id.length > 20 
         ? doc(db, `users/${userId}/contacts`, contact.id)
         : doc(getUserCollection(userId, 'contacts')); // Novo doc
       
       await setDoc(docRef, { ...contact, id: docRef.id }, { merge: true });
    } catch (e) { console.error(e); }
  },

  saveContactsBulk: async (userId: string, newContacts: Contact[]) => {
    // Firebase Batch write é o ideal aqui
    // Implementação simples loop
    for (const contact of newContacts) {
        await addDoc(getUserCollection(userId, 'contacts'), contact);
    }
  },

  deleteContact: async (userId: string, contactId: string) => {
    try {
      await deleteDoc(doc(db, `users/${userId}/contacts`, contactId));
    } catch (e) { console.error(e); }
  },

  // --- VISITS ---
  getVisits: async (userId: string): Promise<Visit[]> => {
    try {
      const q = query(getUserCollection(userId, 'visits'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Visit));
    } catch (e) { return []; }
  },

  saveVisit: async (userId: string, visit: Visit) => {
    await addDoc(getUserCollection(userId, 'visits'), visit);
  },

  toggleVisit: async (userId: string, visitId: string, completed: boolean) => {
     const docRef = doc(db, `users/${userId}/visits`, visitId);
     await updateDoc(docRef, { completed });
  }
};