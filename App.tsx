import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { LayoutDashboard, Send, Settings as SettingsIcon, Calendar, Bot, Menu, X, LogOut, Crown, BarChart3, Search, Trello, BrainCircuit, Home } from 'lucide-react';
import CampaignBuilder from './components/CampaignBuilder';
import Settings from './components/Settings';
import VisitScheduler from './components/VisitScheduler';
import LeadMiner from './components/LeadMiner';
import PipelineCRM from './components/PipelineCRM';
import BotTrainer from './components/BotTrainer';
import PropertyManager from './components/PropertyManager';
import Auth from './components/Auth';
import { AppSettings, Campaign, User } from './types';
import { storageService } from './services/storageService';

const Dashboard = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    setCampaigns(storageService.getCampaigns());
  }, []);

  const totalEnvios = campaigns.reduce((acc, curr) => acc + (curr.status === 'completed' ? curr.targetContacts.length : 0), 0);
  const totalVisitas = storageService.getVisits().length;
  
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Visão Geral</h1>
          <p className="text-slate-500">Dados carregados do banco de dados local.</p>
        </div>
        <div className="flex gap-2">
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 border border-emerald-200">
               <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
               SISTEMA OPERACIONAL
            </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start mb-4">
             <div className="bg-blue-50 p-2 rounded-lg"><Send className="w-6 h-6 text-blue-600" /></div>
          </div>
          <p className="text-sm font-medium text-slate-500">Campanhas</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{campaigns.length}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
           <div className="flex justify-between items-start mb-4">
             <div className="bg-purple-50 p-2 rounded-lg"><Bot className="w-6 h-6 text-purple-600" /></div>
          </div>
          <p className="text-sm font-medium text-slate-500">Envios</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{totalEnvios}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
           <div className="flex justify-between items-start mb-4">
             <div className="bg-green-50 p-2 rounded-lg"><Calendar className="w-6 h-6 text-green-600" /></div>
          </div>
          <p className="text-sm font-medium text-slate-500">Visitas</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{totalVisitas}</p>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('zap_marketing_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('zap_marketing_settings');
    return saved ? JSON.parse(saved) : {
      greenApiInstanceId: '',
      greenApiApiToken: '',
      whatsappApiUrl: '',
      whatsappToken: '',
      onedriveClientId: '',
      googleApiKey: '', 
      enableSimulation: true,
      useCorsProxy: true,
    };
  });

  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem('zap_marketing_settings', JSON.stringify(newSettings));
  };

  const handleCampaignCreated = (campaign: Campaign) => {
    storageService.saveCampaign(campaign);
    // Força atualização se necessário ou navega
  };

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('zap_marketing_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('zap_marketing_user');
    setMobileMenuOpen(false);
  };

  const NavItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => (
    <NavLink 
      to={to} 
      onClick={() => setMobileMenuOpen(false)}
      className={({ isActive }) => `
        flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium
        ${isActive ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}
      `}
    >
      <Icon className="w-5 h-5" />
      {label}
    </NavLink>
  );

  if (!user || !user.isAuthenticated) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <HashRouter>
      <div className="flex min-h-screen bg-slate-50 font-sans">
        {/* Mobile Header */}
        <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-slate-200 z-20 px-4 py-3 flex items-center justify-between shadow-sm">
           <div className="flex items-center gap-2">
            <div className="bg-slate-900 p-1.5 rounded text-white">
              <Bot className="w-5 h-5" />
            </div>
            <span className="font-bold text-slate-900">ZapMarketing</span>
           </div>
           <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-slate-600">
             {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
           </button>
        </div>

        {/* Sidebar */}
        <aside className={`
          w-72 bg-white border-r border-slate-200 fixed inset-y-0 z-10 transition-transform duration-300 md:translate-x-0
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          md:block top-[57px] md:top-0 flex flex-col justify-between
        `}>
          <div>
            <div className="hidden md:flex p-6 items-center gap-3 border-b border-slate-100">
              <div className="bg-slate-900 p-2.5 rounded-xl text-white shadow-lg shadow-slate-200">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-bold text-slate-900 leading-tight text-lg">ZapMarketing</h1>
                <p className="text-xs text-slate-400 font-medium">Enterprise Edition</p>
              </div>
            </div>
            <nav className="p-4 space-y-1">
              <p className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Vendas</p>
              <NavItem to="/dashboard" icon={LayoutDashboard} label="Visão Geral" />
              <NavItem to="/campaigns" icon={Send} label="Novo Imóvel/Campanha" />
              <NavItem to="/pipeline" icon={Trello} label="CRM Pipeline" />
              <NavItem to="/properties" icon={Home} label="Gestão Portfólio" />
              
              <p className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 mt-6">Inteligência</p>
              <NavItem to="/trainer" icon={BrainCircuit} label="Treinar Robô" />
              <NavItem to="/leads" icon={Search} label="Minerar Leads (FB)" />
              <NavItem to="/visits" icon={Calendar} label="Agenda Visitas" />
              
              <p className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 mt-6">Sistema</p>
              <NavItem to="/settings" icon={SettingsIcon} label="Configurações API" />
            </nav>
          </div>

          <div className="p-4 border-t border-slate-100">
             <div className="bg-slate-50 p-4 rounded-xl mb-3 border border-slate-100">
               <div className="flex items-center gap-3 mb-2">
                 <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-lg">
                    {user.name.charAt(0).toUpperCase()}
                 </div>
                 <div className="flex-1 min-w-0">
                   <p className="text-sm font-bold text-slate-800 truncate">{user.name}</p>
                   <p className="text-xs text-slate-500 truncate">{user.email}</p>
                 </div>
               </div>
               <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-2 py-1.5 rounded-lg w-full justify-center">
                  <Crown className="w-3 h-3" /> Assinatura {user.plan.toUpperCase()}
               </div>
             </div>
             <button 
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 text-slate-500 hover:text-red-600 hover:bg-red-50 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
             >
               <LogOut className="w-4 h-4" /> Encerrar Sessão
             </button>
          </div>
        </aside>

        {/* Mobile Spacer */}
        <div className="md:w-72 flex-shrink-0 hidden md:block" />

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8 overflow-x-hidden mt-[57px] md:mt-0 max-w-[1600px]">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/campaigns" element={
              <CampaignBuilder 
                settings={settings} 
                onCampaignCreated={handleCampaignCreated} 
              />
            } />
            <Route path="/leads" element={<LeadMiner settings={settings} />} />
            <Route path="/pipeline" element={<PipelineCRM />} />
            <Route path="/properties" element={<PropertyManager settings={settings} />} />
            <Route path="/trainer" element={<BotTrainer settings={settings} />} />
            <Route path="/visits" element={<VisitScheduler />} />
            <Route path="/settings" element={
              <Settings 
                settings={settings} 
                onSave={handleSaveSettings} 
              />
            } />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;