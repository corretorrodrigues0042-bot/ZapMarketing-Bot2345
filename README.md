# ZapMarketing Bot AI 🤖

Sistema completo de Automação de Marketing Imobiliário para WhatsApp com Inteligência Artificial.

## 🚀 Funcionalidades Principais

1. **Disparos em Massa (Green API)**
   - Integração preparada para o plano gratuito (Developer) da Green API.
   - Envio de textos persuasivos e mídias.

2. **Cérebro de IA (Google Gemini)**
   - O robô cria as mensagens de venda sozinho (Copywriting).
   - Treinador de Bot: Simule negociações antes de enviar.
   - Minerador de Leads: Encontra clientes em comentários de redes sociais.

3. **Gestão (CRM & OneDrive)**
   - Pipeline de Vendas (Kanban).
   - Seletor de Arquivos do OneDrive (Azure).
   - Agenda de Visitas.

## 💻 Pré-requisitos

1. **Node.js**: [Baixar aqui](https://nodejs.org/)
2. **Git**: [Baixar aqui](https://git-scm.com/download/win)

## ⚡ Como Rodar o Projeto (Passo a Passo)

Abra o terminal na pasta do projeto e digite:

1. **Instalar dependências** (apenas na primeira vez):
   ```bash
   npm install
   ```

2. **Ligar o Robô**:
   ```bash
   npm run dev
   ```

3. **Acessar**:
   O terminal vai mostrar um link (geralmente `http://localhost:5173`). Clique nele ou copie e cole no navegador.

## 🛠 Configuração das Chaves

1. No menu lateral, vá em **Configurações API**.
2. **WhatsApp**: Crie uma conta na [Green API](https://console.green-api.com) (Plano Developer Grátis), crie uma instância e copie o `IdInstance` e `ApiTokenInstance`.
3. **IA**: Gere uma chave no [Google AI Studio](https://aistudio.google.com/app/apikey).
4. **OneDrive**: Registre um app no Azure AD se quiser usar arquivos da nuvem.

## 🆘 Solução de Erros Comuns

### Erro: "src refspec main does not match any"
Rode estes comandos no terminal:
```bash
git config --global user.email "seu@email.com"
git config --global user.name "Seu Nome"
git add .
git commit -m "Correcao identidade"
git push -u origin main
```
