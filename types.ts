export interface Contact {
  id: string;
  name: string;
  phone: string;
  status: 'pending' | 'sent' | 'failed' | 'visited';
  pipelineStage?: 'new' | 'contacted' | 'interested' | 'scheduled' | 'closed';
  lastInteraction?: string;
  value?: number; // Valor potencial da venda
  source?: string;
}

export interface DriveFile {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'document';
  thumbnail: string;
  fileObject?: File; // Arquivo físico para upload (opcional)
}

export interface PropertyDossier {
  title: string;
  price: string;
  location: string;
  details: string; // Metragem, quartos, lazer
  ownerName: string;
  ownerPhone: string;
  lastCheckDate?: string;
  isAvailable: boolean;
}

export interface Campaign {
  id: string;
  name: string; // Agora atua como Nome da Campanha
  dossier?: PropertyDossier; // O contexto rico do imóvel
  description: string; // Texto base do disparo
  selectedFiles: DriveFile[];
  targetContacts: string[]; // IDs of contacts
  status: 'draft' | 'running' | 'completed' | 'archived';
  scheduledDate?: string;
  progress: number;
}

export interface AppSettings {
  // Campos simplificados para o usuário
  greenApiInstanceId: string;
  greenApiApiToken: string;
  
  // Configuração Manual da IA
  googleApiKey: string;
  
  // Mantido para compatibilidade ou uso avançado (backend próprio)
  whatsappApiUrl: string;
  
  whatsappToken: string;
  onedriveClientId: string;
  enableSimulation: boolean; // If true, mocks the sending
  useCorsProxy: boolean; // If true, uses a proxy to bypass browser restrictions
}

export interface Visit {
  id: string;
  contactId: string;
  date: string;
  notes: string;
  completed: boolean;
}

export interface User {
  uid: string; // Firebase UID
  email: string;
  name: string;
  plan: 'free' | 'pro' | 'enterprise';
  isAuthenticated: boolean;
  companyName?: string;
  isAdmin?: boolean; // NOVO: Permite acesso ao painel de controle
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  source: string; // 'facebook', 'instagram', 'google'
  description?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}