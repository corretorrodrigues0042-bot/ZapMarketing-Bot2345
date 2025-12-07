# ZapMarketing Bot AI 🤖 (Enterprise Edition)

Plataforma SaaS de Automação de Marketing Imobiliário, pronta para escalar.
Este sistema integra WhatsApp (Green API), Inteligência Artificial (Gemini) e Nuvem (OneDrive) em uma interface moderna.

## 🚀 Funcionalidades Premium

1. **Disparos em Massa**: Envio ilimitado (dependendo da API) com anexos.
2. **IA Treinável**: O bot negocia visitas usando técnicas de SPIN Selling e Gatilhos Mentais.
3. **Minerador de Leads (OSINT)**: Encontra clientes reais em grupos e comentários do Facebook.
4. **CRM Kanban**: Gestão visual de pipeline de vendas.
5. **Gestão de Portfólio**: IA checa automaticamente com proprietários se o imóvel ainda está disponível.

---

## ☁️ Como Colocar no Ar (Deploy)

### Opção 1: Netlify (Mais Fácil)
1. Crie uma conta no [Netlify](https://www.netlify.com).
2. Arraste a pasta `dist` (gerada após o comando de build) para o painel do Netlify.
   *Ou conecte seu GitHub para deploy automático.*
3. **Importante**: O arquivo `_redirects` na pasta public garante que as rotas funcionem.

### Opção 2: Firebase Hosting (Google)
1. Instale o Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Inicialize: `firebase init` (Selecione Hosting -> Use existing project -> Pasta pública: `dist` -> Configure as SPA: `Yes`).
4. Build e Deploy:
   ```bash
   npm run build
   firebase deploy
   ```

---

## 💰 Instruções para Venda (SaaS)

Se você vai vender o acesso a este software:

1. **Domínio Próprio**: Configure um domínio (ex: `app.suaagencia.com`) no painel da hospedagem.
2. **OneDrive**: Se usar a integração com OneDrive, adicione o domínio final no Portal Azure em "Redirect URIs".
3. **Cobrança**: O sistema atual usa chaves de API do próprio usuário (BYOK - Bring Your Own Key). Isso reduz seu custo de servidor a **ZERO**. Você cobra pela "Licença de Uso" do software.

## 💻 Comandos Úteis

- **Rodar Localmente**: `npm run dev`
- **Gerar Versão Final**: `npm run build` (Cria a pasta /dist pronta para upload)

---
*Desenvolvido com React, Vite, TailwindCSS e Google Gemini.*