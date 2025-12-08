import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { PropertyDossier, ChatMessage } from "../types";

const getAiClient = (customKey?: string) => {
  let envKey = '';
  try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env) {
      // @ts-ignore
      envKey = process.env.API_KEY;
    }
  } catch (e) {}

  const key = customKey || envKey;
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
 * Agora retorna 3 variações para o usuário escolher.
 */
export const generateMarketingCopy = async (
  dossier: PropertyDossier,
  apiKeyOverride?: string
): Promise<{ style: string; content: string }[]> => {
  const ai = getAiClient(apiKeyOverride);

  const fallback = [{ style: "Padrão", content: `Olá! Oportunidade única: ${dossier.title} por apenas ${dossier.price}. Vamos agendar uma visita?` }];

  if (!ai) return fallback;

  try {
    const prompt = `
      Atue como um Especialista em Copywriting para WhatsApp (Marketing Imobiliário).
      Crie 3 variações de mensagens curtas para vender este imóvel para um lead frio.
      
      DADOS DO IMÓVEL:
      - Título: ${dossier.title}
      - Local: ${dossier.location}
      - Preço: ${dossier.price}
      - Detalhes: ${dossier.details}
      
      REGRAS:
      1. Use emojis com moderação.
      2. Máximo 300 caracteres por mensagem.
      3. Finalize com uma Pergunta (CTA).
      4. Variação 1: Estilo "Urgência/Oportunidade" (Focado em preço/tempo).
      5. Variação 2: Estilo "Storytelling/Emocional" (Focado em conforto/família).
      6. Variação 3: Estilo "Executivo/Investidor" (Curto, direto, focado em localização/números).
    `;

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
              style: { type: Type.STRING },
              content: { type: Type.STRING }
            }
          }
        }
      }
    }));

    const result = JSON.parse(response.text || '[]');
    return Array.isArray(result) && result.length > 0 ? result : fallback;
  } catch (error) {
    console.error("Erro copy", error);
    return fallback;
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

/**
 * ANALISADOR DE EDITAIS E PROCESSOS JURÍDICOS (NOVO)
 */
export const analyzeLegalText = async (
  rawText: string,
  apiKeyOverride?: string
): Promise<{
  title: string;
  address: string;
  valuation: string;
  minimumBid: string;
  discount: string;
  processNumber: string;
  risks: string;
  auctionDate: string;
}> => {
  const ai = getAiClient(apiKeyOverride);
  if (!ai) throw new Error("API Key required");

  const prompt = `
    Atue como um Advogado Especialista em Leilões Imobiliários.
    Analise o texto abaixo (extraído de um Edital, Jusbrasil ou Diário Oficial) e extraia os dados estruturados da oportunidade.

    TEXTO:
    "${rawText.substring(0, 15000)}"

    TAREFAS:
    1. Identifique o imóvel (Tipo e Endereço).
    2. Encontre o Valor de Avaliação.
    3. Encontre o Lance Mínimo (ou 2ª Praça).
    4. Calcule o Desconto (%) aproximado.
    5. Extraia o número do Processo.
    6. Identifique datas relevantes.
    7. Resuma riscos jurídicos (ocupado, dívidas, etc) em 1 frase curta.

    Retorne JSON:
    {
      "title": "Ex: Apartamento 100m² no Centro",
      "address": "Endereço completo se houver",
      "valuation": "R$ X.XXX,XX",
      "minimumBid": "R$ X.XXX,XX",
      "discount": "XX%",
      "processNumber": "0000000-00.0000.0.00.0000",
      "auctionDate": "DD/MM/AAAA",
      "risks": "Resumo dos riscos"
    }
  `;

  try {
    const response = await retryWithBackoff<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    }));
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Erro ao analisar texto jurídico", error);
    throw new Error("Não foi possível analisar o texto.");
  }
};

// ... (Mantenha as funções de parseContacts)
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
  platform: 'facebook' | 'instagram' | 'threads' | 'legal',
  apiKeyOverride?: string
): Promise<{ name: string; phone: string; source: string; description: string }[]> => {
  const ai = getAiClient(apiKeyOverride);

  // Se for busca jurídica, não gera leads fictícios, pois o foco são os links (Dorks).
  if (platform === 'legal') {
    return [];
  }

  if (!ai) {
     return [
       { name: `Lead ${niche} - Exemplo`, phone: "5511999999999", source: platform.charAt(0).toUpperCase() + platform.slice(1), description: "Simulação sem API Key configurada" },
     ];
  }

  let promptContext = "";
  
  if (platform === 'instagram') {
    promptContext = `
      PLATAFORMA: INSTAGRAM
      Foco: Perfis que tem "Link na Bio" ou "WhatsApp na Bio" relacionados a "${niche}" em "${city}".
      Identifique influenciadores locais, profissionais liberais ou pessoas pedindo info nos comentários.
      Formato do Source: @usuario_insta
    `;
  } else if (platform === 'threads') {
    promptContext = `
      PLATAFORMA: THREADS (Meta)
      Foco: Discussões ativas sobre "${niche}" em "${city}".
      Pessoas engajadas em threads sobre o tema.
      Formato do Source: @usuario_threads
    `;
  } else {
    // Facebook
    promptContext = `
      PLATAFORMA: FACEBOOK
      Foco: Grupos e Comentários sobre "${niche}" em "${city}".
      Pessoas que comentaram "tenho interesse", "valor" e deixaram telefone.
    `;
  }

  const prompt = `
    Aja como um minerador de dados (OSINT).
    ${promptContext}
    Gere uma lista de 5 a 8 leads fictícios mas altamente realistas baseados nesse perfil.
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

export const generateOsintDorks = (niche: string, city: string, platform: 'facebook' | 'instagram' | 'threads' | 'legal') => {
  const terms = encodeURIComponent(`"${niche}" AND "${city}"`);
  const whatsapp = encodeURIComponent(`( "whatsapp" OR "zap" OR "119" OR "contato" )`);
  
  if (platform === 'legal') {
    // DORKS JURÍDICOS AVANÇADOS (LEILÕES, PENHORAS, PROCESSOS)
    return [
      {
        label: "Editais PDF (Tribunais)",
        url: `https://www.google.com/search?q=filetype:pdf "edital de leilão" "imóvel" "${city}" site:jus.br`,
        desc: "Busca arquivos PDF oficiais em sites do governo/justiça."
      },
      {
        label: "Diários Oficiais (Municipais)",
        url: `https://www.google.com/search?q=(site:imprensaoficial.com.br OR site:diariomunicipal.com.br) "leilão" "imóvel" "${city}"`,
        desc: "Varredura em Diários Oficiais de Prefeituras."
      },
      {
        label: "Dívida Ativa/Prefeitura",
        url: `https://www.google.com/search?q=site:gov.br "dívida ativa" "leilão" "imóvel" "${city}"`,
        desc: "Busca leilões fiscais e dívida ativa em sites governamentais."
      },
      {
        label: "Oportunidades Jusbrasil",
        url: `https://www.google.com/search?q=site:jusbrasil.com.br "leilão" "imóvel" "penhora" "${city}"`,
        desc: "Varredura de processos de leilão e penhora no Jusbrasil."
      },
      {
        label: "Caixa/Bancos (Venda Direta)",
        url: `https://www.google.com/search?q="venda direta" "caixa" "imóvel" "${city}" -leilão`,
        desc: "Imóveis retomados por bancos (Licitações abertas)."
      },
      {
        label: "Leiloeiros Oficiais (Sodré/Zukerman)",
        url: `https://www.google.com/search?q=(site:sodresantoro.com.br OR site:zukerman.com.br OR site:leiloesjudiciais.com.br) "imóvel" "${city}"`,
        desc: "Busca nos maiores portais de leilão do país."
      }
    ];
  } else if (platform === 'instagram') {
    const base = "site:instagram.com";
    return [
      {
        label: "Link na Bio + WhatsApp",
        url: `https://www.google.com/search?q=${base} ${terms} "link na bio" ${whatsapp}`,
        desc: "Busca perfis do Instagram que mencionam WhatsApp na bio."
      },
      {
        label: "Comentários 'Tenho Interesse'",
        url: `https://www.google.com/search?q=${base} ${terms} "tenho interesse"`,
        desc: "Busca leads quentes nos comentários de posts."
      },
      {
        label: "Busca por Reels/Vídeos",
        url: `https://www.google.com/search?q=${base}/reel ${terms}`,
        desc: "Encontra criadores de conteúdo locais."
      }
    ];
  } else if (platform === 'threads') {
    const base = "site:threads.net";
    return [
      {
        label: "Discussões no Threads",
        url: `https://www.google.com/search?q=${base} ${terms} ${whatsapp}`,
        desc: "Busca conversas e replies no Threads com contatos."
      },
      {
        label: "Perfis de Especialistas",
        url: `https://www.google.com/search?q=${base}/@ ${terms} "bio"`,
        desc: "Encontra perfis relevantes na rede."
      }
    ];
  } else {
    // Facebook (Default)
    const base = "site:facebook.com";
    return [
      {
        label: "Comentários com Telefone",
        url: `https://www.google.com/search?q=${base} ${terms} ${whatsapp} "comentários"`,
        desc: "Busca posts onde pessoas deixaram o número nos comentários."
      },
      {
        label: "Grupos Públicos",
        url: `https://www.google.com/search?q=${base}/groups ${terms} ${whatsapp}`,
        desc: "Varre discussões dentro de grupos públicos."
      },
      {
        label: "Marketplace / Vendas",
        url: `https://www.google.com/search?q=${base}/marketplace ${terms}`,
        desc: "Busca anúncios de venda direta."
      }
    ];
  }
};