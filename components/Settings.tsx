
import React, { useState } from 'react';
import { Save, Smartphone, QrCode, Loader2, Zap, BrainCircuit, Database, DollarSign, Cloud, Calendar, Globe, Share2, Workflow, Key, Facebook } from 'lucide-react';
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
    
    if (['greenApiInstanceId', 'greenApiApiToken'].includes(e.target.name)) {
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
        // Auto-fix: se por algum motivo simulação estiver true internamente, desliga
        setFormData(prev => ({ ...prev, enableSimulation: false }));
      }
    } else {
      setTestStatus('error');
      setTestMessage(result.message || 'Falha na conexão.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...formData, enableSimulation: false }); // Garante o salvamento como FALSE
    alert('Configurações salvas! A página será recarregada para aplicar as mudanças.');
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
             Gerencie todas as integrações do seu robô em um só lugar.
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
                        <h3 className="text-xl font-bold text-green-900">WhatsApp (API)</h3>
                        <p className="text-sm text-green-700">Conexão via Green API.</p>
                    </div>
                </div>
                <a href="https://console.green-api.com" target="_blank" rel="noreferrer" className="text-xs font-bold text-green-600 hover:underline">
                    Criar Conta Grátis
                </a>
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
                            placeholder="Ex: 110182..."
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl font-mono text-sm bg-slate-50 focus:ring-2 focus:ring-green-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-2">ApiTokenInstance</label>
                        <input
                            type="password"
                            name="greenApiApiToken"
                            value={formData.greenApiApiToken || ''}
                            onChange={handleChange}
                            placeholder="Token..."
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl font-mono text-sm bg-slate-50 focus:ring-2 focus:ring-green-500 outline-none"
                        />
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 border-t border-slate-100">
                    <button
                        type="button"
                        onClick={handleTestConnection}
                        className="w-full sm:w-auto px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 flex items-center justify-center gap-2"
                    >
                        {testStatus === 'loading' ? <Loader2 className="animate-spin" /> : <Zap className="w-4 h-4" />} TESTAR CONEXÃO
                    </button>
                    {testMessage && (
                        <span className={`text-sm font-bold ${testStatus === 'success' ? 'text-green-600' : testStatus === 'error' ? 'text-red-600' : 'text-slate-600'}`}>
                            {testMessage}
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
                    className="h-4 w-4 rounded text-green-600 focus:ring-green-500"
                    />
                    <label htmlFor="useCorsProxy" className="text-sm text-slate-600 cursor-pointer">Usar Proxy (Correção CORS) - Marque se der erro de conexão.</label>
                </div>
            </div>
        </div>

        {/* 2. Automation (n8n) & Meta */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="bg-pink-50 p-6 border-b border-pink-100 flex items-center gap-3">
                <div className="bg-pink-100 p-2 rounded-lg"><Workflow className="w-6 h-6 text-pink-600" /></div>
                <div>
                    <h3 className="text-xl font-bold text-pink-900">Automação & Redes Sociais</h3>
                    <p className="text-sm text-pink-700">Workflows n8n e Integração Meta (Facebook).</p>
                </div>
            </div>
            <div className="p-8 grid grid-cols-1 gap-6">
                 <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Webhook Mineração de Leads (N8N_LEADS_WEBHOOK_URL)</label>
                    <input type="text" name="n8nLeadsWebhookUrl" value={formData.n8nLeadsWebhookUrl || ''} onChange={handleChange} placeholder="https://seu-n8n.com/webhook/..." className="w-full px-4 py-3 border border-slate-200 rounded-xl font-mono text-sm bg-slate-50" />
                </div>
                <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Webhook Mineração de Leilões (N8N_LEILAO_WEBHOOK_URL)</label>
                    <input type="text" name="n8nAuctionsWebhookUrl" value={formData.n8nAuctionsWebhookUrl || ''} onChange={handleChange} placeholder="https://seu-n8n.com/webhook/..." className="w-full px-4 py-3 border border-slate-200 rounded-xl font-mono text-sm bg-slate-50" />
                </div>
            </div>
        </div>

        {/* 3. Meta / Facebook API (SUBSTITUI O FIREBASE) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-blue-50 p-6 border-b border-blue-100 flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg"><Facebook className="w-6 h-6 text-blue-600" /></div>
                <div>
                    <h3 className="text-xl font-bold text-blue-900">Meta Marketing API (Facebook Ads)</h3>
                    <p className="text-sm text-blue-700">Configuração para integração com anúncios e pixel.</p>
                </div>
            </div>
            
            <div className="p-8 space-y-6">
                 <div className="md:col-span-2">
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Access Token (Long Lived)</label>
                    <input 
                        type="password" 
                        name="metaAccessToken" 
                        value={formData.metaAccessToken || ''} 
                        onChange={handleChange} 
                        placeholder="EAAG..." 
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl font-mono text-sm bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none" 
                    />
                    <p className="text-[10px] text-slate-400 mt-2">
                        Gere no <a href="https://developers.facebook.com" target="_blank" className="underline hover:text-blue-500 font-bold">Facebook Developers</a>. Necessário para mineração avançada.
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                         <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Ad Account ID</label>
                         <input 
                            type="text" 
                            name="metaAdAccountId" 
                            value={formData.metaAdAccountId || ''} 
                            onChange={handleChange} 
                            placeholder="act_12345678" 
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl font-mono text-sm bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none" 
                        />
                    </div>
                     <div>
                         <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Pixel ID (Opcional)</label>
                         <input 
                            type="text" 
                            name="metaPixelId" 
                            value={formData.metaPixelId || ''} 
                            onChange={handleChange} 
                            placeholder="123456789" 
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl font-mono text-sm bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none" 
                        />
                    </div>
                </div>
            </div>
        </div>

        {/* 4. Databases (Supabase Only Now) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-emerald-50 p-6 border-b border-emerald-100 flex items-center gap-3">
                <div className="bg-emerald-100 p-2 rounded-lg"><Database className="w-6 h-6 text-emerald-600" /></div>
                <div>
                    <h3 className="text-xl font-bold text-emerald-900">Banco de Dados (Supabase)</h3>
                    <p className="text-sm text-emerald-700">Persistência de dados na nuvem.</p>
                </div>
            </div>
            
            <div className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                         <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Supabase URL (VITE_SUPABASE_URL)</label>
                         <input 
                            type="text" 
                            name="supabaseUrl" 
                            value={formData.supabaseUrl || ''} 
                            onChange={handleChange} 
                            placeholder="https://xyz.supabase.co" 
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl font-mono text-sm bg-slate-50 focus:ring-2 focus:ring-emerald-500 outline-none" 
                        />
                    </div>
                    <div>
                         <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Supabase Anon Key (VITE_SUPABASE_ANON_KEY)</label>
                         <input 
                            type="password" 
                            name="supabaseAnonKey" 
                            value={formData.supabaseAnonKey || ''} 
                            onChange={handleChange} 
                            placeholder="eyJh..." 
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl font-mono text-sm bg-slate-50 focus:ring-2 focus:ring-emerald-500 outline-none" 
                        />
                    </div>
                </div>
            </div>
        </div>

         {/* 5. Sales Configuration */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="bg-yellow-50 p-6 border-b border-yellow-100 flex items-center gap-3">
                <div className="bg-yellow-100 p-2 rounded-lg"><DollarSign className="w-6 h-6 text-yellow-600" /></div>
                <div>
                    <h3 className="text-xl font-bold text-yellow-900">Configuração de Vendas (Admin)</h3>
                    <p className="text-sm text-yellow-700">Configure aqui seus links de checkout (Hotmart/Kiwify) para seus clientes pagarem.</p>
                </div>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Link Checkout PRO</label>
                    <input type="text" name="salesUrlPro" value={formData.salesUrlPro || ''} onChange={handleChange} placeholder="https://pay.kiwify.com.br/..." className="w-full px-4 py-3 border border-slate-200 rounded-xl font-mono text-sm bg-slate-50" />
                </div>
                <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Link Checkout ENTERPRISE</label>
                    <input type="text" name="salesUrlEnterprise" value={formData.salesUrlEnterprise || ''} onChange={handleChange} placeholder="https://pay.hotmart.com/..." className="w-full px-4 py-3 border border-slate-200 rounded-xl font-mono text-sm bg-slate-50" />
                </div>
                 <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">WhatsApp de Vendas/Suporte</label>
                    <input type="text" name="salesContactPhone" value={formData.salesContactPhone || ''} onChange={handleChange} placeholder="5511999999999" className="w-full px-4 py-3 border border-slate-200 rounded-xl font-mono text-sm bg-slate-50" />
                </div>
            </div>
        </div>

        {/* 6. Google Services (Gemini & Calendar) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-purple-50 p-6 border-b border-purple-100 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="bg-purple-100 p-2 rounded-lg">
                        <BrainCircuit className="w-6 h-6 text-purple-700" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-purple-900">Google Cloud & IA</h3>
                        <p className="text-sm text-purple-700">Gemini (IA) e Calendar.</p>
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
        
        {/* 7. Microsoft OneDrive */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="bg-blue-50 p-6 border-b border-blue-100 flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg"><Cloud className="w-6 h-6 text-blue-600" /></div>
                <div>
                    <h3 className="text-xl font-bold text-blue-900">Microsoft OneDrive</h3>
                    <p className="text-sm text-blue-700">Para upload de arquivos da nuvem.</p>
                </div>
            </div>
            <div className="p-8">
                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Azure Client ID</label>
                <input
                    type="text"
                    name="onedriveClientId"
                    value={formData.onedriveClientId || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl font-mono text-sm bg-slate-50"
                />
            </div>
        </div>

        <button 
        type="submit"
        className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-500 transition-all shadow-xl shadow-blue-900/20 flex items-center justify-center gap-2"
        >
        <Save className="w-5 h-5" /> SALVAR CONFIGURAÇÕES COMPLETAS
        </button>

      </form>
    </div>
  );
};

export default Settings;
