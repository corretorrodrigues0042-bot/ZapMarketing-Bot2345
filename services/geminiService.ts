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
 * CÉREBRO DO BOT VENDEDOR (AUTOMÁTICO)
 */
export const negotiateRealEstate = async (
  history: ChatMessage[],
  dossier: PropertyDossier,
  apiKeyOverride?: string
): Promise<string> => {
  const ai = getAiClient(apiKeyOverride);

  if (!ai) return "Simulação: Preciso da API Key para negociar. (Configure em Ajustes)";

  // Pega as últimas mensagens para contexto imediato
  const recentHistory = history.slice(-10);
  const lastUserMsg = recentHistory[recentHistory.length -1]?.text || "";

  const prompt = `
    IDENTIDADE: Você é um Corretor de Imóveis Sênior (IA Autônoma).
    MISSÃO: Atender o cliente no WhatsApp, tirar dúvidas sobre o imóvel e AGENDAR VISITA.
    
    IMÓVEL EM PAUTA:
    - Título: ${dossier.title}
    - Preço: ${dossier.price}
    - Local: ${dossier.location}
    - Specs: ${dossier.details}

    DIRETRIZES DE COMPORTAMENTO:
    1. Responda de forma CURTA e NATURAL (pareça humano digitando no zap).
    2. NUNCA invente dados. Se não souber (ex: valor do IPTU se não tiver nas specs), diga "Vou verificar essa informação exata e te retorno", mas continue a conversa.
    3. FOCO TOTAL NO AGENDAMENTO: Sempre tente converter a dúvida em uma visita.
       Ex: "Tem 2 vagas sim. Quer ir ver se cabem seus carros? Tenho horário amanhã."
    4. ANCORAGEM: Se pedirem desconto, valorize o imóvel antes.
    
    HISTÓRICO RECENTE:
    ${recentHistory.map(h => `${h.role === 'user' ? 'CLIENTE' : 'VOCÊ'}: ${h.text}`).join('\n')}
    
    Responda apenas com a mensagem a ser enviada. Sem aspas.
  `;

  try {
    const response = await retryWithBackoff<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    }));
    return response.text || "Olá, posso ajudar com mais informações sobre este imóvel?";
  } catch (e) {
    return "Oi! Desculpe, tive um problema de conexão. Já te respondo.";
  }
};

/**
 * DETECTOR DE INTENÇÃO E AGENDAMENTO (NOVO)
 * Analisa a última mensagem do usuário para ver se ele quer agendar ou parar.
 */
export const detectIntentAndSchedule = async (
    lastUserMessage: string,
    apiKeyOverride?: string
): Promise<{
    intent: 'SCHEDULE_VISIT' | 'STOP_BOT' | 'INFO_REQUEST' | 'NONE';
    extractedDate?: string; // Formato ISO ou descritivo
    summary?: string;
}> => {
    const ai = getAiClient(apiKeyOverride);
    if (!ai) return { intent: 'NONE' };

    const prompt = `
        Analise a mensagem do cliente imobiliário no WhatsApp.
        Mensagem: "${lastUserMessage}"
        
        Classifique a INTENÇÃO em uma das categorias:
        - SCHEDULE_VISIT: Cliente sugeriu dia/hora, disse "pode ser", "vamos marcar", "amanhã às 15h".
        - STOP_BOT: Cliente pediu para parar, xingou, disse que já comprou ou não tem interesse.
        - INFO_REQUEST: Fez uma pergunta sobre o imóvel.
        - NONE: Outros (saudação, conversa fiada).
        
        Se for SCHEDULE_VISIT, extraia a data/hora sugerida para o campo "extractedDate" (tente padronizar ou repita o texto dele ex: "Amanhã 14h").
        
        Retorne JSON: { "intent": "...", "extractedDate": "...", "summary": "..." }
    `;

    try {
        const response = await retryWithBackoff<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: "application/json" }
        }));
        return JSON.parse(response.text || '{}');
    } catch (e) {
        return { intent: 'NONE' };
    }
}

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
 * ANALISA A RESPOSTA DO PROPRIETÁRIO
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
 * ANALISADOR DE EDITAIS E PROCESSOS JURÍDICOS
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

// --- FUNÇÃO ROBUSTA PARA CHAMAR O N8N ---
const fetchFromN8N = async (url: string, payload: any) => {
  console.log("🚀 Iniciando Mineração Real via n8n:", url);
  console.log("Payload:", payload);

  const controller = new AbortController();
  // Aumentado para 60 segundos para permitir mineração profunda no n8n
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Erro no n8n: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log("✅ Sucesso n8n:", data);
    
    // Suporte para diferentes estruturas de retorno do n8n (Array direto ou objeto { data: [...] })
    return Array.isArray(data) ? data : (data.data || []);
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      console.error("⏳ Timeout: O n8n demorou mais de 60s para responder.");
    } else {
      console.error("❌ Erro na integração n8n:", error);
    }
    return null; 
  }
}

export const mineLeadsWithAI = async (
  niche: string, 
  city: string, 
  strategy: 'business' | 'comments' | 'groups',
  platform: 'facebook' | 'instagram' | 'threads' | 'legal',
  apiKeyOverride?: string,
  n8nLeadsWebhookUrl?: string
): Promise<{ name: string; phone: string; source: string; description: string }[]> => {
  
  // 1. TENTATIVA VIA N8N (PRIORIDADE TOTAL PARA DADOS REAIS)
  // Se a URL estiver configurada, usamos ela. Se falhar, NÃO cai para simulação da IA.
  if (n8nLeadsWebhookUrl && platform !== 'legal') {
    const n8nData = await fetchFromN8N(n8nLeadsWebhookUrl, { niche, city, platform, strategy });
    if (n8nData) {
      return n8nData;
    } else {
        // Se falhou o n8n e foi configurado, retornamos erro para o usuário verificar o n8n
        // em vez de fingir dados com a IA.
        return [{
            name: "Erro na Mineração Real",
            phone: "N/A",
            source: "n8n",
            description: "O n8n não retornou dados ou deu timeout. Verifique seu workflow."
        }];
    }
  }

  // Fallback apenas se NÃO tiver URL configurada (Modo Manual/IA Assistente)
  const ai = getAiClient(apiKeyOverride);

  if (!ai) {
     return [
       { name: `Configuração Necessária`, phone: "Sistema", source: "Erro", description: "Insira sua API Key em Configurações para realizar a mineração." },
     ];
  }

  let promptContext = "";
  let baseRole = "OSINT (Open Source Intelligence) e Data Mining";

  if (platform === 'legal') {
    // BUSCA REAL DE LEILOEIROS (Auxílio IA para encontrar fontes, não dados finais)
    baseRole = "Assistente Jurídico de Leilões";
    promptContext = `
      OBJETIVO REAL: Encontrar Leiloeiros Oficiais, Varas Cíveis ou Sites de Leilão que atuam em "${city}".
      Busque na sua base de conhecimento por entidades REAIS e OFICIAIS.
      Não invente dados. Liste apenas o que é público e verificável.
    `;
  } else {
    promptContext = `
      PLATAFORMA ALVO: ${platform.toUpperCase()}
      CIDADE: "${city}"
      NICHO: "${niche}"
      
      TAREFA: Listar EMPRESAS, IMOBILIÁRIAS, ADVOCACIA ou PROFISSIONAIS LIBERAIS que atuam publicamente neste nicho nesta cidade.
      Use seu conhecimento de mundo para listar entidades REAIS.
    `;
  }

  const prompt = `
    Atue como um ${baseRole}.
    ${promptContext}
    
    Retorne uma lista JSON de 5 a 8 resultados REAIS.
    
    Estrutura obrigatória:
    [
      {
        "name": "Nome da Empresa ou Leiloeiro Real",
        "phone": "Telefone Público Comercial (ou '55 + DDD...' se não tiver exato)",
        "source": "Fonte (Google Maps, Site Oficial, Instagram Business)",
        "description": "Detalhes reais do negócio (Endereço aproximado ou especialidade)"
      }
    ]
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
    console.error("Erro na mineração:", error);
    return [];
  }
};

export const mineAuctionsWithN8N = async (
    n8nAuctionsWebhookUrl: string,
    niche: string, 
    city: string
): Promise<any[]> => {
    // Timeout estendido e tratamento de erro incluídos no fetchFromN8N
    return await fetchFromN8N(n8nAuctionsWebhookUrl, { niche, city }) || [];
};

export const generateOsintDorks = (niche: string, city: string, platform: 'facebook' | 'instagram' | 'threads' | 'legal') => {
  const terms = encodeURIComponent(`"${niche}" AND "${city}"`);
  const whatsapp = encodeURIComponent(`( "whatsapp" OR "zap" OR "119" OR "contato" )`);
  
  if (platform === 'legal') {
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