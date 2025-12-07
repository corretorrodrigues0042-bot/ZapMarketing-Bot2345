import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { PropertyDossier, ChatMessage } from "../types";

const getAiClient = (customKey?: string) => {
  const key = customKey || process.env.API_KEY;
  if (!key) {
    return null;
  }
  return new GoogleGenAI({ apiKey: key });
};

async function retryWithBackoff<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0 && (error.status === 429 || error.status === 503 || error.message?.includes('Overloaded'))) {
      console.warn(`Gemini API Busy. Retrying in ${delay}ms... (${retries} left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryWithBackoff(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

/**
 * GERA O PRIMEIRO DISPARO (Texto Curto e Persuasivo)
 */
export const generateMarketingCopy = async (
  dossier: PropertyDossier,
  apiKeyOverride?: string
): Promise<string> => {
  const ai = getAiClient(apiKeyOverride);

  if (!ai) return `Olá! Oportunidade única: ${dossier.title} por apenas ${dossier.price}. Vamos agendar uma visita?`;

  try {
    const prompt = `
      Atue como um Corretor de Elite.
      Escreva uma mensagem de WhatsApp (máx 300 caracteres) para um lead frio.
      
      IMÓVEL: ${dossier.title}
      LOCAL: ${dossier.location}
      PREÇO: ${dossier.price}
      DETALHES: ${dossier.details}
      
      Técnica: AIDA (Atenção, Interesse, Desejo, Ação).
      NÃO coloque "Olá nome". Comece direto com uma pergunta ou afirmação impactante sobre o imóvel.
      Use gatilhos de exclusividade.
      Finalize com uma pergunta fechada (ex: "Posso te mandar as fotos?").
    `;

    const response = await retryWithBackoff<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    }));

    return response.text || "Erro ao gerar texto.";
  } catch (error) {
    return "Oportunidade de Imóvel! Responda para ver fotos.";
  }
};

/**
 * CÉREBRO DO BOT VENDEDOR (Simulador e Futura Automação)
 */
export const negotiateRealEstate = async (
  history: ChatMessage[],
  dossier: PropertyDossier,
  apiKeyOverride?: string
): Promise<string> => {
  const ai = getAiClient(apiKeyOverride);

  if (!ai) return "Simulação: Preciso da API Key para negociar. (Configure em Ajustes)";

  const lastMessage = history[history.length - 1].text;

  const prompt = `
    IDENTIDADE: Você é um Corretor de Imóveis Sênior, especialista em negociação de alto padrão.
    OBJETIVO: Agendar uma visita. Não venda o imóvel pelo chat, venda a VISITA.
    
    DADOS DO IMÓVEL (DOSSIÊ):
    - Título: ${dossier.title}
    - Preço: ${dossier.price}
    - Local: ${dossier.location}
    - Detalhes: ${dossier.details}

    TÉCNICAS OBRIGATÓRIAS:
    1. SPIN SELLING: Se o cliente der abertura, faça perguntas de situação ("Hoje você mora de aluguel ou próprio?").
    2. ANCORAGEM: Se perguntarem o preço, fale 2 qualidades do imóvel ANTES de falar o valor.
    3. DOUBLE BIND (Duplo Vínculo): Nunca pergunte "quer visitar?". Pergunte "Prefere visitar terça pela manhã ou quinta à tarde?".
    4. ESCASSEZ: Sutilmente mencione que a agenda de visitas está cheia.
    
    HISTÓRICO DA CONVERSA:
    ${history.map(h => `${h.role === 'user' ? 'CLIENTE' : 'VOCÊ'}: ${h.text}`).join('\n')}
    
    CLIENTE DISSE POR ÚLTIMO: "${lastMessage}"
    
    Responda como o Corretor (curto, direto, estilo WhatsApp, use emojis moderados).
  `;

  try {
    const response = await retryWithBackoff<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    }));
    return response.text || "Erro na IA.";
  } catch (e) {
    return "Desculpe, estou em atendimento agora. Já te respondo.";
  }
};

/**
 * MÓDULO DE ATUALIZAÇÃO MENSAL COM PROPRIETÁRIO
 */
export const generateOwnerUpdateMessage = async (
  dossier: PropertyDossier,
  apiKeyOverride?: string
): Promise<string> => {
  const ai = getAiClient(apiKeyOverride);
  if (!ai) return `Olá ${dossier.ownerName}, tudo bem? O imóvel ${dossier.title} ainda está disponível?`;

  const prompt = `
    Escreva uma mensagem de WhatsApp educada e profissional para o proprietário de um imóvel.
    Nome do Proprietário: ${dossier.ownerName}
    Imóvel: ${dossier.title}
    
    Objetivo: Atualização Mensal de Portfólio.
    Pergunte:
    1. Se o imóvel ainda está disponível para venda.
    2. Se houve alteração no valor (Valor atual cadastrado: ${dossier.price}).
    3. Informe que estamos trabalhando forte na divulgação este mês.
    
    Tom: Parceiro, profissional, confiante. Curto.
  `;

  try {
     const response = await retryWithBackoff<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    }));
    return response.text || "Erro texto proprietário.";
  } catch (e) {
    return "Olá, atualização mensal. O imóvel segue disponível?";
  }
};

/**
 * ANALISA A RESPOSTA DO PROPRIETÁRIO (Para saber se arquiva ou não)
 */
export const analyzeOwnerResponse = async (
  responseText: string, 
  apiKeyOverride?: string
): Promise<{ status: 'AVAILABLE' | 'SOLD' | 'PAUSED', newPrice?: string }> => {
  const ai = getAiClient(apiKeyOverride);
  if (!ai) return { status: 'AVAILABLE' };

  const prompt = `
    Analise a resposta de um proprietário de imóvel sobre a disponibilidade.
    Resposta dele: "${responseText}"
    
    Classifique em:
    - AVAILABLE (Ainda vendendo)
    - SOLD (Já vendeu, alugou ou desistiu)
    - PAUSED (Pediu um tempo)
    
    Se ele citou um novo valor numérico, extraia apenas o número.
    
    Retorne JSON: { "status": "...", "newPrice": "..." }
  `;

  try {
    const response = await retryWithBackoff<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    }));
    return JSON.parse(response.text || '{}');
  } catch (e) {
    return { status: 'AVAILABLE' };
  }
};

// ... (Mantenha as funções de parseContacts e mineLeadsWithAI e generateOsintDorks iguais ao anterior)
export const parseContactsFromRawText = async (rawText: string, apiKeyOverride?: string): Promise<{ name: string; phone: string }[]> => {
  const ai = getAiClient(apiKeyOverride);
  if (!ai) throw new Error("API Key required");

  const prompt = `
    Extraia contatos (Nome e Telefone) deste texto:
    "${rawText.substring(0, 10000)}"
    Retorne JSON Array: [{name, phone}]. Telefone apenas números com DDD e DDI 55.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: { responseMimeType: "application/json" }
  });
  
  return JSON.parse(response.text || '[]');
};

export const mineLeadsWithAI = async (
  niche: string, 
  city: string, 
  strategy: 'business' | 'comments' | 'groups',
  apiKeyOverride?: string
): Promise<{ name: string; phone: string; source: string; description: string }[]> => {
  const ai = getAiClient(apiKeyOverride);

  if (!ai) {
     return [
       { name: `Interessado ${niche}`, phone: "5511999999999", source: "Comentários Facebook", description: "Comentou 'quero saber mais' no post de venda" },
     ];
  }

  let promptContext = "";
  if (strategy === 'comments') {
    promptContext = `
      Foco: Encontrar PESSOAS FÍSICAS que comentaram em posts de vendas de "${niche}" na cidade de "${city}".
      Contexto: Pessoas perguntando "valor?", "ainda disponível?", "tenho interesse" e deixando o telefone nos comentários.
    `;
  } else if (strategy === 'groups') {
    promptContext = `
      Foco: Encontrar membros ativos de grupos de "${niche}" na cidade de "${city}".
    `;
  } else {
    promptContext = `
      Foco: Encontrar empresas e negócios locais de "${niche}" na cidade de "${city}".
    `;
  }

  const prompt = `
    Aja como um minerador de dados (OSINT).
    ${promptContext}
    Gere uma lista de 5 a 8 leads fictícios mas realistas.
    Retorne JSON Array.
  `;

  try {
    const response = await retryWithBackoff<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              phone: { type: Type.STRING },
              source: { type: Type.STRING },
              description: { type: Type.STRING }
            }
          }
        }
      }
    }));
    return JSON.parse(response.text || '[]');
  } catch (error) {
    return [];
  }
};

export const generateOsintDorks = (niche: string, city: string) => {
  const base = "site:facebook.com";
  const terms = encodeURIComponent(`"${niche}" AND "${city}"`);
  const whatsapp = encodeURIComponent(`( "whatsapp" OR "zap" OR "celular" )`);
  return [
    {
      label: "Comentários com Telefone",
      url: `https://www.google.com/search?q=${base} ${terms} ${whatsapp} "comentários"`,
      desc: "Busca posts onde pessoas deixaram o número nos comentários."
    },
    {
      label: "Imóveis/Vendas + 'Tenho Interesse'",
      url: `https://www.google.com/search?q=${base} ${terms} "tenho interesse" ${whatsapp}`,
      desc: "Filtra pessoas demonstrando intenção de compra."
    },
    {
      label: "Grupos Públicos do Nicho",
      url: `https://www.google.com/search?q=${base}/groups ${terms} ${whatsapp}`,
      desc: "Varre discussões dentro de grupos públicos."
    }
  ];
};