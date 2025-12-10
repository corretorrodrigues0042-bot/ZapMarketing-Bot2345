
import React, { useState } from 'react';
import { Save, Cloud, MessageCircle, Smartphone, QrCode, Globe, CheckCircle, XCircle, Loader2, Zap, BrainCircuit, ExternalLink, Key, Database, Flame, Workflow, DollarSign, CreditCard, Lock, Calendar } from 'lucide-react';
import { AppSettings, User } from '../types';
import { validateConnection } from '../services/whatsappService';

interface SettingsProps {
  settings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
  user: User; 
}

const Settings: React.FC<SettingsProps> = ({ settings, onSave, user }) => {
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
    alert('Configurações salvas!');
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
          <h2 className="text-3xl font-bold mb-2">Configurações do Sistema</h2>
          <p className="text-slate-300 text-lg leading-relaxed">
             Gerencie as chaves de API e conexões externas.
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
                <h3 className="text-xl font-bold text-green-900">WhatsApp API (Green API)</h3>
                <p className="text-sm text-green-700">Credenciais de conexão.</p>
                </div>
            </div>
        </div>

        <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">IdInstance</label>
                <input
                type="text"
                name="greenApiInstanceId"
                value={formData.greenApiInstanceId || ''}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl font-mono text-sm bg-slate-50"
                />
            </div>

            <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">ApiTokenInstance</label>
                <input
                type="password"
                name="greenApiApiToken"
                value={formData.greenApiApiToken || ''}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl font-mono text-sm bg-slate-50"
                />
            </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 border-t border-slate-100">
            <button
                type="button"
                onClick={handleTestConnection}
                className="w-full sm:w-auto px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 flex items-center justify-center gap-2"
                >
                {testStatus === 'loading' ? <Loader2 className="animate-spin" /> : <Zap className="w-4 h-4" />} TESTAR
                </button>
                {testMessage && <span className="text-sm font-bold text-slate-600">{testMessage}</span>}
            </div>
            
            <div className="flex items-center gap-2 mt-2">
                <input
                id="useCorsProxy"
                name="useCorsProxy"
                type="checkbox"
                checked={formData.useCorsProxy}
                onChange={handleChange}
                className="h-4 w-4 rounded text-green-600"
                />
                <label htmlFor="useCorsProxy" className="text-sm text-slate-600 cursor-pointer">Usar Proxy (Correção CORS)</label>
            </div>
        </div>
        </div>

        {/* 2. Google Services (Gemini & Calendar) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-purple-50 p-6 border-b border-purple-100 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="bg-purple-100 p-2 rounded-lg">
                        <BrainCircuit className="w-6 h-6 text-purple-700" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-purple-900">Google Cloud (IA & Agenda)</h3>
                        <p className="text-sm text-purple-700">Gemini AI e Google Calendar API.</p>
                    </div>
                </div>
            </div>
            <div className="p-8 grid grid-cols-1 gap-6">
                <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Google Gemini API Key</label>
                    <input
                        type="password"
                        name="googleApiKey"
                        value={formData.googleApiKey || ''}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl font-mono text-sm bg-slate-50"
                    />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                        <div className="md:col-span-2 flex items-center gap-2 mb-2">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        <h4 className="font-bold text-slate-700">Integração Google Agenda</h4>
                        </div>
                        <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Client ID (OAuth)</label>
                        <input
                            type="text"
                            name="googleCalendarClientId"
                            value={formData.googleCalendarClientId || ''}
                            onChange={handleChange}
                            placeholder="ex: ...apps.googleusercontent.com"
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl font-mono text-sm bg-slate-50"
                        />
                        </div>
                        <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Calendar ID</label>
                        <input
                            type="text"
                            name="googleCalendarId"
                            value={formData.googleCalendarId || ''}
                            onChange={handleChange}
                            placeholder="primary"
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl font-mono text-sm bg-slate-50"
                        />
                        </div>
                </div>
            </div>
        </div>

        {/* 3. Firebase & N8N */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-orange-50 p-6 border-b border-orange-100 flex items-center gap-3">
                <div className="bg-orange-100 p-2 rounded-lg"><Database className="w-6 h-6 text-orange-600" /></div>
                <h3 className="text-xl font-bold text-orange-900">Backend & Automação</h3>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Webhook N8N (Leads)</label>
                        <input type="text" name="n8nLeadsWebhookUrl" value={formData.n8nLeadsWebhookUrl || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-sm" />
                </div>
                {/* Firebase Fields Simplified */}
                <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Firebase API Key</label>
                        <input type="text" name="firebaseApiKey" value={formData.firebaseApiKey || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-sm" />
                </div>
                <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Auth Domain</label>
                        <input type="text" name="firebaseAuthDomain" value={formData.firebaseAuthDomain || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-sm" />
                </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Project ID</label>
                        <input type="text" name="firebaseProjectId" value={formData.firebaseProjectId || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-sm" />
                </div>
            </div>
        </div>

        {/* MODO SIMULAÇÃO */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 flex items-start gap-4">
            <div className="mt-1">
               <input
                  id="enableSimulation"
                  name="enableSimulation"
                  type="checkbox"
                  checked={formData.enableSimulation}
                  onChange={handleChange}
                  className="h-5 w-5 rounded border-gray-300 text-yellow-600 focus:ring-yellow-600"
               />
            </div>
            <div>
               <label htmlFor="enableSimulation" className="font-bold text-slate-800 block cursor-pointer select-none">
                  Modo Segurança (Simulação)
               </label>
               <p className="text-sm text-slate-600 mt-1">
                 Se ativado, o sistema finge que enviou a mensagem. Use para testar novos fluxos sem enviar mensagens reais para seus clientes.
               </p>
            </div>
        </div>

        <button 
        type="submit"
        className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-500 transition-all shadow-xl shadow-blue-900/20 flex items-center justify-center gap-2"
        >
        <Save className="w-5 h-5" /> SALVAR CONFIGURAÇÕES
        </button>

      </form>
    </div>
  );
};

export default Settings;
