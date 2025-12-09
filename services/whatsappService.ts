import { AppSettings, Contact, DriveFile, WhatsAppMessage } from '../types';

interface SendResult {
  success: boolean;
  error?: string;
}

/**
 * Constrói a URL base da API
 */
const getBaseUrl = (settings: AppSettings, method: string): string => {
  // MODO FÁCIL: Usa ID e Token
  if (settings.greenApiInstanceId && settings.greenApiApiToken) {
    const id = settings.greenApiInstanceId.trim();
    const token = settings.greenApiApiToken.trim();
    // Padrão Green API: https://api.green-api.com/waInstance{ID}/{method}/{TOKEN}
    return `https://api.green-api.com/waInstance${id}/${method}/${token}`;
  }

  // MODO AVANÇADO/LEGADO: Usa a URL completa colada
  if (settings.whatsappApiUrl) {
    let url = settings.whatsappApiUrl.trim();
    url = url.replace(/waInstanceInstance/gi, 'waInstance');
    url = url.replace(/{{|}}/g, '');
    if (!url.startsWith('http')) url = 'https://' + url;

    try {
      if (url.includes('/sendMessage/')) return url.replace('/sendMessage/', `/${method}/`);
      if (url.includes('/getContacts/')) return url.replace('/getContacts/', `/${method}/`);
      if (url.includes('/getChats/')) return url.replace('/getChats/', `/${method}/`);
      if (url.includes('/getStateInstance/')) return url.replace('/getStateInstance/', `/${method}/`);
      if (url.includes('/getChatHistory/')) return url.replace('/getChatHistory/', `/${method}/`);
      if (url.includes('/lastIncomingMessages/')) return url.replace('/lastIncomingMessages/', `/${method}/`);
    } catch (e) {
      console.warn("Erro ao reconstruir URL manual", e);
    }
    return url;
  }

  throw new Error("API não configurada. Informe o Instance ID e Token nas configurações.");
};

/**
 * Busca o Histórico de Mensagens de um Chat Específico
 */
export const getChatHistory = async (settings: AppSettings, chatId: string): Promise<WhatsAppMessage[]> => {
  if (settings.enableSimulation) {
      // Mock para simulação
      return [
          { id: '1', chatId, senderId: chatId, text: 'Olá, vi o anúncio do apartamento.', timestamp: Date.now() - 100000, fromMe: false, type: 'text' },
          { id: '2', chatId, senderId: 'me', text: 'Olá! Tudo bem? Qual apartamento lhe interessou?', timestamp: Date.now() - 90000, fromMe: true, type: 'text' },
          { id: '3', chatId, senderId: chatId, text: 'O da Vila Nova. Ainda está disponível?', timestamp: Date.now() - 80000, fromMe: false, type: 'text' }
      ];
  }

  try {
    let targetUrl = getBaseUrl(settings, 'getChatHistory');
    if (settings.useCorsProxy) targetUrl = 'https://corsproxy.io/?' + encodeURIComponent(targetUrl);

    const payload = { chatId, count: 20 };
    
    const res = await fetch(targetUrl, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) return [];

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    // Mapeia para nosso formato interno
    return data.map((msg: any) => ({
        id: msg.idMessage,
        chatId: msg.chatId,
        senderId: msg.senderId,
        text: msg.textMessage || (msg.typeMessage === 'imageMessage' ? '[Imagem]' : '[Arquivo]'),
        timestamp: msg.timestamp * 1000,
        fromMe: msg.type === 'outgoing',
        type: (msg.typeMessage === 'imageMessage' ? 'image' : 'text') as 'text' | 'image' | 'document' | 'audio'
    })).reverse(); // GreenAPI retorna do mais novo pro antigo, invertemos para chat

  } catch (error) {
      console.error("Erro ao buscar histórico", error);
      return [];
  }
};

/**
 * Busca contatos da Green API.
 */
export const getGreenApiContacts = async (settings: AppSettings): Promise<Contact[]> => {
  const fetchFromApi = async (method: string) => {
    let targetUrl = getBaseUrl(settings, method);
    
    if (settings.useCorsProxy) {
      targetUrl = 'https://corsproxy.io/?' + encodeURIComponent(targetUrl);
    }
    
    console.log(`Buscando via ${method}...`, targetUrl);
    const res = await fetch(targetUrl, { 
      method: 'GET',
      headers: { 'Cache-Control': 'no-cache' }
    });
    
    if (!res.ok) throw new Error(`Erro HTTP ${res.status}`);
    return res.json();
  };

  try {
    let rawData: any[] = [];
    try {
      rawData = await fetchFromApi('getContacts');
    } catch (e) {
      console.warn("getContacts falhou, tentando fallback chats...");
    }

    if (!Array.isArray(rawData) || rawData.length === 0) {
      rawData = await fetchFromApi('getChats');
    }

    if (!Array.isArray(rawData)) {
      throw new Error("API retornou dados inválidos.");
    }

    const contacts: Contact[] = rawData
      .filter((item: any) => {
        const id = item.id || item.chatId;
        return id && id.endsWith('@c.us');
      })
      .map((item: any) => {
        const fullId = item.id || item.chatId;
        const name = item.name || item.contactName || fullId.replace(/\D/g, '');
        const phone = fullId.replace(/\D/g, '');

        return {
          id: fullId,
          name: name,
          phone: phone,
          status: 'pending'
        };
      });

    const uniqueContacts = Array.from(new Map(contacts.map(c => [c.id, c])).values());
    return uniqueContacts;

  } catch (error: any) {
    console.error("Erro getGreenApiContacts:", error);
    throw new Error(`Falha na importação: ${error.message}`);
  }
};

/**
 * Testa a conexão
 */
export const validateConnection = async (settings: AppSettings): Promise<{ success: boolean; status?: string; message?: string }> => {
  try {
    let testUrl = getBaseUrl(settings, 'getStateInstance');

    if (settings.useCorsProxy) {
      testUrl = 'https://corsproxy.io/?' + encodeURIComponent(testUrl);
    }

    const response = await fetch(testUrl, { method: 'GET' });

    if (!response.ok) {
      if (response.status === 403 || response.status === 401) {
         throw new Error(`Acesso negado (${response.status}). Verifique ID e Token.`);
      }
      throw new Error(`Erro HTTP ${response.status}`);
    }

    const data = await response.json();
    
    if (data && data.stateInstance) {
      const isAuth = data.stateInstance === 'authorized';
      return { 
        success: isAuth, 
        status: data.stateInstance,
        message: isAuth ? 'Conectado e Autorizado!' : `Status: ${data.stateInstance} (Escaneie o QR)`
      };
    }
    return { success: true, message: "Conexão OK" };

  } catch (error: any) {
    return { success: false, message: error.message || "Falha ao conectar." };
  }
};

/**
 * Envia Mensagem
 */
export const sendWhatsAppMessage = async (
  contact: Contact,
  text: string,
  files: DriveFile[],
  settings: AppSettings
): Promise<SendResult> => {
  if (settings.enableSimulation) {
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 500));
    return { success: Math.random() > 0.05 };
  }

  try {
    let targetUrl = '';
    let requestOptions: RequestInit = {};
    const chatId = contact.id.includes('@') ? contact.id : `${contact.phone.replace(/\D/g, '')}@c.us`;

    if (files.length > 0) {
      const file = files[0];
      
      if (file.fileObject) {
          targetUrl = getBaseUrl(settings, 'sendFileByUpload');
          const formData = new FormData();
          formData.append('chatId', chatId);
          formData.append('caption', text);
          formData.append('file', file.fileObject);
          requestOptions = { method: 'POST', body: formData };
      } else {
          targetUrl = getBaseUrl(settings, 'sendFileByUrl');
          const payload = {
            chatId: chatId,
            urlFile: file.url,
            fileName: file.name,
            caption: text
          };
          requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          };
      }
    } 
    else {
      targetUrl = getBaseUrl(settings, 'sendMessage');
      const payload = { chatId: chatId, message: text };
      requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      };
    }

    if (settings.useCorsProxy) {
      targetUrl = 'https://corsproxy.io/?' + encodeURIComponent(targetUrl);
    }

    console.log(`Enviando para: ${targetUrl}`);
    const response = await fetch(targetUrl, requestOptions);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Erro API: ${errText}`);
    }

    return { success: true };

  } catch (error: any) {
    console.error("Erro no envio:", error);
    return { success: false, error: error.message };
  }
};