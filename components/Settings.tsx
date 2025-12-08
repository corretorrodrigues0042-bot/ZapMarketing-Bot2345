
import React, { useState } from 'react';
import { Save, Cloud, MessageCircle, Smartphone, QrCode, Globe, CheckCircle, XCircle, Loader2, Zap, BrainCircuit, ExternalLink, Key, Database, Flame } from 'lucide-react';
import { AppSettings } from '../types';
import { validateConnection } from '../services/whatsappService';

interface SettingsProps {
  settings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
}

const Settings: React.FC<SettingsProps> = ({ settings, onSave }) => {
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
    
    if (['greenApiInstanceId', 'greenApiApiToken', 'whatsappApiUrl'].includes(e.target.name)) {
      setTestStatus('idle');
      setTestMessage('');
    }
  };

  const handleTestConnection = async () => {
    setTestStatus('loading');
    setTestMessage('Verificando chaves...');
    const result = await validateConnection(formData);

    if (result.success) {
      setTestStatus('success');
      setTestMessage(result.message || 'Conectado com sucesso!');
      if (formData.enableSimulation) {
        if(confirm("Conexão bem sucedida! Deseja DESATIVAR o 'Modo Simulação' para começar a enviar mensagens reais agora?")) {
          setFormData(prev => ({ ...prev, enableSimulation: false }));
        }
      }
    } else {
      setTestStatus('error');
      setTestMessage(result.message || 'Falha na conexão.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    alert('Configurações salvas! A página será recarregada para aplicar o Banco de Dados.');
    window.location.reload();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      
      {/* Header Info */}
      <div className="bg-slate-900 text-white rounded-2xl p-8 shadow-2xl flex flex-col md:flex-row items-center gap-8 border border-slate-700">
        <div className="bg-green-500 rounded-2xl p-4 shadow-lg shadow-green-900/50">
           <QrCode className="w-16 h-16 text-white" />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-3xl font-bold mb-2">Central de Conexões</h2>
          <p className="text-slate-300 text-lg leading-relaxed">
            Configure abaixo as chaves do WhatsApp, Inteligência Artificial e Banco de Dados.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* 1. WhatsApp Configuration */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-green-50 p-6 border-b border-green-100 flex justify-between items-center">
             <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <Smartphone className="w-6 h-6 text-green-700" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-green-900">WhatsApp (Green API)</h3>
                  <p className="text-sm text-green-700">Conexão para envio de mensagens e arquivos.</p>
                </div>
             </div>
             <a 
                href="https://console.green-api.com" 
                target="_blank" 
                rel="noreferrer"
                className="hidden md:flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-700 transition-colors shadow-sm"
             >
                Pegar Chave Grátis <ExternalLink className="w-4 h-4" />
             </a>
          </div>

          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">IdInstance (ID da Instância)</label>
                <input
                  type="text"
                  name="greenApiInstanceId"
                  value={formData.greenApiInstanceId || ''}
                  onChange={handleChange}
                  placeholder="Ex: 1101823901"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-mono text-sm bg-slate-50 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">ApiTokenInstance (Token)</label>
                <input
                  type="password"
                  name="greenApiApiToken"
                  value={formData.greenApiApiToken || ''}
                  onChange={handleChange}
                  placeholder="Cole seu token aqui..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-mono text-sm bg-slate-50 transition-all"
                />
              </div>
            </div>

             {/* Mobile Button */}
             <a 
                href="https://console.green-api.com" 
                target="_blank" 
                rel="noreferrer"
                className="md:hidden w-full flex items-center justify-center gap-2 bg-green-100 text-green-800 px-4 py-3 rounded-xl text-sm font-bold hover:bg-green-200"
             >
                Obter Chaves na Green API <ExternalLink className="w-4 h-4" />
             </a>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 border-t border-slate-100">
               <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testStatus === 'loading' || !formData.greenApiInstanceId || !formData.greenApiApiToken}
                  className="w-full sm:w-auto px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform active:scale-95"
                >
                  {testStatus === 'loading' ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Verificando...</>
                  ) : (
                    <><Zap className="w-5 h-5" /> TESTAR CONEXÃO</>
                  )}
                </button>

                {testStatus === 'success' && (
                  <span className="flex items-center gap-2 text-green-600 font-bold bg-green-50 px-4 py-2 rounded-lg animate-in fade-in slide-in-from-left-4">
                    <CheckCircle className="w-5 h-5" /> {testMessage}
                  </span>
                )}
                
                {testStatus === 'error' && (
                  <span className="flex items-center gap-2 text-red-600 font-bold bg-red-50 px-4 py-2 rounded-lg animate-in fade-in slide-in-from-left-4">
                    <XCircle className="w-5 h-5" /> {testMessage}
                  </span>
                )}
            </div>
            
            <div className="flex items-center gap-2 mt-2">
                <input
                  id="useCorsProxy"
                  name="useCorsProxy"
                  type="checkbox"
                  checked={formData.useCorsProxy}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-600"
                />
                <label htmlFor="useCorsProxy" className="text-sm text-slate-600 flex items-center gap-1 cursor-pointer select-none">
                   <Globe className="w-3 h-3" /> Usar Proxy (Ative se der erro de CORS)
                </label>
            </div>
          </div>
        </div>

        {/* 2. Firebase Database */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
           <div className="bg-orange-50 p-6 border-b border-orange-100 flex justify-between items-center">
             <div className="flex items-center gap-3">
                <div className="bg-orange-100 p-2 rounded-lg">
                  <Flame className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-orange-900">Banco de Dados (Firebase)</h3>
                  <p className="text-sm text-orange-700">Para salvar seus contatos e campanhas na nuvem.</p>
                </div>
             </div>
          </div>
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="col-span-1 md:col-span-2 bg-orange-50 border border-orange-200 rounded-lg p-3 text-xs text-orange-800 mb-2">
                <strong>Instrução:</strong> Copie os valores do arquivo de configuração do Firebase (onde você viu as chaves) e cole abaixo.
             </div>

             <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">apiKey</label>
                <input
                  type="text"
                  name="firebaseApiKey"
                  value={formData.firebaseApiKey || ''}
                  onChange={handleChange}
                  placeholder="Ex: AIzaSy..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none font-mono text-sm"
                />
             </div>
             <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">authDomain</label>
                <input
                  type="text"
                  name="firebaseAuthDomain"
                  value={formData.firebaseAuthDomain || ''}
                  onChange={handleChange}
                  placeholder="Ex: projeto.firebaseapp.com"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none font-mono text-sm"
                />
             </div>
             <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">projectId</label>
                <input
                  type="text"
                  name="firebaseProjectId"
                  value={formData.firebaseProjectId || ''}
                  onChange={handleChange}
                  placeholder="Ex: zapmarketing-bot"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none font-mono text-sm"
                />
             </div>
             <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">storageBucket</label>
                <input
                  type="text"
                  name="firebaseStorageBucket"
                  value={formData.firebaseStorageBucket || ''}
                  onChange={handleChange}
                  placeholder="Ex: projeto.appspot.com"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none font-mono text-sm"
                />
             </div>
             <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">messagingSenderId</label>
                <input
                  type="text"
                  name="firebaseMessagingSenderId"
                  value={formData.firebaseMessagingSenderId || ''}
                  onChange={handleChange}
                  placeholder="Ex: 123456789"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none font-mono text-sm"
                />
             </div>
             <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">appId</label>
                <input
                  type="text"
                  name="firebaseAppId"
                  value={formData.firebaseAppId || ''}
                  onChange={handleChange}
                  placeholder="Ex: 1:12345:web:abcde"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none font-mono text-sm"
                />
             </div>
          </div>
        </div>

        {/* 3. Google Gemini */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
           <div className="bg-purple-50 p-6 border-b border-purple-100 flex justify-between items-center">
             <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <BrainCircuit className="w-6 h-6 text-purple-700" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-purple-900">Inteligência Artificial</h3>
                  <p className="text-sm text-purple-700">Google Gemini (Cérebro do Robô).</p>
                </div>
             </div>
             <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noreferrer"
                className="hidden md:flex items-center gap-2 text-purple-700 hover:text-purple-900 font-bold text-sm"
             >
                Gerar Chave <ExternalLink className="w-4 h-4" />
             </a>
          </div>
          <div className="p-8">
             <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Google API Key</label>
             <input
                type="password"
                name="googleApiKey"
                value={formData.googleApiKey || ''}
                onChange={handleChange}
                placeholder="Cole sua API Key do Google AI Studio..."
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none font-mono text-sm bg-slate-50"
              />
          </div>
        </div>

        {/* 4. OneDrive Configuration */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-blue-50 p-6 border-b border-blue-100 flex justify-between items-center">
             <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Cloud className="w-6 h-6 text-blue-700" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-blue-900">Microsoft OneDrive</h3>
                  <p className="text-sm text-blue-700">Para enviar fotos e documentos direto da nuvem.</p>
                </div>
             </div>
          </div>
          <div className="p-8">
             <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-sm text-blue-800">
               <strong>Como configurar:</strong>
               <ol className="list-decimal list-inside mt-2 space-y-1 ml-2">
                 <li>Acesse o portal <a href="https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade" target="_blank" className="underline font-bold">Azure App Registrations</a>.</li>
                 <li>Crie um "Novo Registro" (Single Tenant ou Multitenant).</li>
                 <li>Em Autenticação, adicione URI de Redirecionamento SPA: <code>http://localhost:5173</code> (ou seu domínio).</li>
                 <li>Copie o "ID do Aplicativo (Cliente)" e cole abaixo.</li>
               </ol>
             </div>
            
            <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Azure Client ID</label>
            <div className="relative">
                <Key className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  name="onedriveClientId"
                  value={formData.onedriveClientId}
                  onChange={handleChange}
                  placeholder="Cole seu Client ID aqui para ativar a integração..."
                  className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm bg-slate-50"
                />
            </div>
          </div>
        </div>

        {/* Simulation Mode */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 flex items-start gap-4">
           <div className="pt-1">
              <input
                id="enableSimulation"
                name="enableSimulation"
                type="checkbox"
                checked={formData.enableSimulation}
                onChange={handleChange}
                className="w-5 h-5 text-yellow-600 rounded focus:ring-yellow-500"
              />
           </div>
           <div>
              <label htmlFor="enableSimulation" className="text-yellow-900 font-bold text-lg cursor-pointer">
                 Modo de Segurança (Simulação)
              </label>
              <p className="text-yellow-800 text-sm mt-1">
                 Se ativado, o robô vai fingir que enviou. Desative apenas quando tiver certeza que quer enviar para clientes reais.
              </p>
           </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            className="flex items-center gap-2 px-10 py-4 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all shadow-xl font-bold text-lg"
          >
            <Save className="w-6 h-6" />
            Salvar Tudo
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
