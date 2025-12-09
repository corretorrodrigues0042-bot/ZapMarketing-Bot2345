
export interface Contact {
  id: string;
  name: string;
  phone: string;
  status: 'pending' | 'sent' | 'failed' | 'visited';
  pipelineStage?: 'new' | 'contacted' | 'interested' | 'scheduled' | 'closed';
  lastInteraction?: string;
  value?: number; // Valor potencial da venda
  source?: string;
  
  // NOVOS CAMPOS PARA AUTOMATIZAÇÃO
  autoReplyEnabled?: boolean; // Se true, o bot responde sozinho este cliente
  linkedCampaignId?: string; // Qual imóvel este cliente está interessado (para contexto da IA)
  lastMessageId?: string; // Para evitar respostas duplicadas
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

export interface WhatsAppMessage {
  id: string;
  chatId: string;
  senderId: string; // Quem enviou
  text: string;
  timestamp: number;
  fromMe: boolean;
  type: 'text' | 'image' | 'document' | 'audio';
}

export interface AppSettings {
  // Campos simplificados para o usuário
  greenApiInstanceId: string;
  greenApiApiToken: string;
  
  // Configuração Manual da IA
  googleApiKey: string;
  
  // Configuração Manual do Firebase (Banco de Dados)
  firebaseApiKey?: string;
  firebaseAuthDomain?: string;
  firebaseProjectId?: string;
  firebaseStorageBucket?: string;
  firebaseMessagingSenderId?: string;
  firebaseAppId?: string;

  // Configuração de Automação n8n
  n8nLeadsWebhookUrl?: string;
  n8nAuctionsWebhookUrl?: string;

  // PORTAS DE VENDA (Checkout Gateways)
  salesUrlPro?: string; // Link para Stripe/Hotmart Pro
  salesUrlEnterprise?: string; // Link para Stripe/Hotmart Enterprise
  salesContactPhone?: string; // Telefone para dúvidas de vendas

  // Configuração do Robô
  botCheckInterval?: number; // Em segundos (ex: 10)
  globalAutoReply?: boolean; // Liga/Desliga geral

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