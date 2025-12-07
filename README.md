# ZapMarketing Bot AI 🤖 (SaaS Edition)

Plataforma SaaS completa integrada com GitHub, Netlify e Firebase.

## 🚀 Passo 1: GitHub (Código)
1. Crie um repositório no GitHub (ex: `zapmarketing`).
2. Suba estes arquivos para lá.
   ```bash
   git init
   git add .
   git commit -m "Primeira versão"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/zapmarketing.git
   git push -u origin main
   ```

## 🔥 Passo 2: Firebase (Banco de Dados)
1. Vá em [console.firebase.google.com](https://console.firebase.google.com).
2. Crie um projeto novo.
3. Adicione um app Web (`</>`) e copie as configurações (`apiKey`, `authDomain`, etc).
4. Vá em **Authentication** e ative "Email/Password".
5. Vá em **Firestore Database** e crie o banco (pode começar em modo de teste).

## 🌐 Passo 3: Netlify (Hospedagem Automática)
1. Crie conta no [Netlify](https://www.netlify.com).
2. Clique em **"Add new site"** -> **"Import an existing project"**.
3. Escolha **GitHub** e selecione seu repositório `zapmarketing`.
4. Em **Build settings**, deixe como está (`npm run build` e diretório `dist`).
5. **O SEGREDO:** Clique em **"Environment variables"** (ou Show Advanced) e adicione as chaves do Firebase assim:

   | Key | Value (Pegue do Firebase) |
   | --- | --- |
   | `VITE_FIREBASE_API_KEY` | `AIzaSy...` |
   | `VITE_FIREBASE_AUTH_DOMAIN` | `projeto.firebaseapp.com` |
   | `VITE_FIREBASE_PROJECT_ID` | `projeto-id` |
   | `VITE_FIREBASE_STORAGE_BUCKET` | `projeto.appspot.com` |
   | `VITE_FIREBASE_MESSAGING_SENDER_ID` | `123456...` |
   | `VITE_FIREBASE_APP_ID` | `1:123456...` |

6. Clique em **Deploy Site**.

## ✨ Como funciona a Integração?
- Quando você muda código no seu PC, você faz `git push`.
- O **GitHub** recebe o código.
- O **Netlify** vê que o GitHub mudou, pega o código novo, injeta as chaves do **Firebase** e coloca o site no ar sozinho.
