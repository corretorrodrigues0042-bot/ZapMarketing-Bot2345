import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { LayoutDashboard, Send, Settings as SettingsIcon, Calendar, Bot, Menu, X, LogOut, Crown, BarChart3, Search, Trello, BrainCircuit, Home, ArrowRight, AlertTriangle, Activity, CreditCard, Shield } from 'lucide-react';
import CampaignBuilder from './components/CampaignBuilder';
import Settings from './components/Settings';
import VisitScheduler from './components/VisitScheduler';
import LeadMiner from './components/LeadMiner';
import PipelineCRM from './components/PipelineCRM';
import BotTrainer from './components/BotTrainer';
import PropertyManager from './components/PropertyManager';
import Subscription from './components/Subscription';
import Auth from './components/Auth';
import AdminPanel from './components/AdminPanel';
import { AppSettings, Campaign, User } from './types';
import { storageService } from './services/storageService';
import { auth, isFirebaseConfigured } from './services/firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';

interface DashboardProps {
  settings: AppSettings;
  userId: string;
}

const Dashboard: React.FC<DashboardProps> = ({ settings, userId }) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [totalVisits, setTotalVisits] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      const camps = await storageService.getCampaigns(userId);
      const visits = await storageService.getVisits(userId);
      setCampaigns(camps);
      setTotalVisits(visits.length);
    };
    loadData();
  }, [userId]);

  const totalEnvios = campaigns.reduce((acc, curr) => acc + (curr.status === 'completed' ? curr.targetContacts.length : 0), 0);
  
  const isConfigured = settings.greenApiInstanceId && settings.greenApiApiToken;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      
      {/* Welcome / Onboarding Banner */}
      {!isConfigured ? (
         <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden border border-slate-700">
            <div className="absolute top-0 right-0 p-8 opacity-10">
               <Bot className="w-64 h-64" />
            </div>
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                   <span className="bg-yellow-500 text-slate-900 text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> AÇÃO NECESSÁRIA
                   </span>
                </div>
                <h2 className="text-3xl font-bold mb-4">Olá! Seu Robô está quase pronto. 🤖</h2>
                <p className="text-slate-300 text-lg mb-8 max-w-2xl leading-relaxed">
                    Para começar a disparar mensagens e agendar visitas, preciso que você conecte o WhatsApp.
                    É rápido, gratuito e seguro.
                </p>
                <NavLink to="/settings" className="bg-green-500 text-white px-8 py-4 rounded-xl font-bold hover:bg-green-600 transition-all inline-flex items-center gap-2 shadow-lg shadow-green-900/20 text-lg">
                    <SettingsIcon className="w-5 h-5" /> Conectar WhatsApp Agora
                </NavLink>
            </div>
         </div>
      ) : (
         <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Painel de Controle</h2>
            <p className="text-slate-500 mb-6">O que você gostaria de fazer hoje?</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <NavLink to="/campaigns" className="group p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center gap-4">
                  <div className="bg-blue-100 p-3 rounded-lg group-hover:bg-blue-500 group-hover:text-white transition-colors text-blue-600">
                     <Send className="w-6 h-6" />
                  </div>
                  <div>
                     <h3 className="font-bold text-slate-900">Novo Disparo</h3>
                     <p className="text-xs text-slate-500">Criar campanha</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 ml-auto group-hover:text-blue-500" />
               </NavLink>

               <NavLink to="/leads" className="group p-4 rounded-xl border border-slate-200 hover:border-purple-500 hover:bg-purple-50 transition-all flex items-center gap-4">
                  <div className="bg-purple-100 p-3 rounded-lg group-hover:bg-purple-500 group-hover:text-white transition-colors text-purple-600">
                     <Search className="w-6 h-6" />
                  </div>
                  <div>
                     <h3 className="font-bold text-slate-900">Minerar Leads</h3>
                     <p className="text-xs text-slate-500">Buscar clientes</p>
                  </div>
                   <ArrowRight className="w-4 h-4 text-slate-300 ml-auto group-hover:text-purple-500" />
               </NavLink>

               <NavLink to="/pipeline" className="group p-4 rounded-xl border border-slate-200 hover:border-green-500 hover:bg-green-50 transition-all flex items-center gap-4">
                  <div className="bg-green-100 p-3 rounded-lg group-hover:bg-green-500 group-hover:text-white transition-colors text-green-600">
                     <Trello className="w-6 h-6" />
                  </div>
                  <div>
                     <h3 className="font-bold text-slate-900">Ver Pipeline</h3>
                     <p className="text-xs text-slate-500">Gerenciar vendas</p>
                  </div>
                   <ArrowRight className="w-4 h-4 text-slate-300 ml-auto group-hover:text-green-500" />
               </NavLink>
            </div>
         </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start mb-4">
             <div className="bg-blue-50 p-2 rounded-lg"><Send className="w-6 h-6 text-blue-600" /></div>
          </div>
          <p className="text-sm font-medium text-slate-500">Campanhas Realizadas</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{campaigns.length}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
           <div className="flex justify-between items-start mb-4">
             <div className="bg-purple-50 p-2 rounded-lg"><Bot className="w-6 h-6 text-purple-600" /></div>
          </div>
          <p className="text-sm font-medium text-slate-500">Mensagens Enviadas</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{totalEnvios}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
           <div className="flex justify-between items-start mb-4">
             <div className="bg-green-50 p-2 rounded-lg"><Calendar className="w-6 h-6 text-green-600" /></div>
          </div>
          <p className="text-sm font-medium text-slate-500">Visitas Agendadas</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{totalVisits}</p>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  
  // Carrega configurações iniciais
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

  // Listener de Autenticação
  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          // Busca o plano atualizado do banco
          const userList = await storageService.getAllUsers();
          const me = userList.find(u => u.uid === firebaseUser.uid);
          
          setUser({
             uid: firebaseUser.uid,
             email: firebaseUser.email || '',
             name: firebaseUser.displayName || 'Usuário',
             plan: me?.plan || 'free',
             isAuthenticated: true,
             isAdmin: firebaseUser.email === 'admin@zapmarketing.com' || me?.isAdmin
          });
        } else {
          setUser(null);
        }
        setLoadingAuth(false);
      });
      return () => unsubscribe();
    } else {
      setLoadingAuth(false);
    }
  }, []);

  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem('zap_marketing_settings', JSON.stringify(newSettings));
    if (user?.uid) {
        storageService.saveUserSettings(user.uid, newSettings);
    }
  };

  const handleCampaignCreated = async (campaign: Campaign) => {
    if (user?.uid) {
        await storageService.saveCampaign(user.uid, campaign);
        alert("Campanha salva com sucesso!");
    }
  };

  const handleLogout = async () => {
    if (isFirebaseConfigured && auth) {
        await signOut(auth);
    }
    setUser(null);
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

  if (loadingAuth) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Activity className="animate-spin text-slate-400" /></div>;
  }

  if (!user || !user.isAuthenticated) {
    return <Auth onLogin={setUser} />;
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
                <div className="flex items-center gap-2 mt-1">
                  {!isFirebaseConfigured ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-yellow-500 status-dot"></span>
                      <p className="text-xs text-yellow-600 font-bold uppercase tracking-wider">Modo Offline</p>
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-green-500 status-dot"></span>
                      <p className="text-xs text-green-600 font-bold uppercase tracking-wider">Sistema Online</p>
                    </>
                  )}
                </div>
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
              <NavItem to="/subscription" icon={CreditCard} label="Meu Plano" />
              <NavItem to="/settings" icon={SettingsIcon} label="Configurações API" />
              
              {/* BOTÃO SECRETO DE ADMIN */}
              {(user.isAdmin || !isFirebaseConfigured) && (
                <div className="mt-8 pt-8 border-t border-slate-100 px-4">
                    <NavLink to="/admin" className="flex items-center gap-3 text-slate-400 hover:text-slate-800 text-xs font-bold uppercase tracking-wider">
                        <Shield className="w-4 h-4" /> Acesso Admin
                    </NavLink>
                </div>
              )}
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
               <NavLink to="/subscription" className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-2 py-1.5 rounded-lg w-full justify-center hover:bg-emerald-100 transition-colors">
                  <Crown className="w-3 h-3" /> Plano {user.plan.toUpperCase()}
               </NavLink>
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
            <Route path="/dashboard" element={<Dashboard settings={settings} userId={user.uid} />} />
            <Route path="/campaigns" element={
              <CampaignBuilder 
                settings={settings} 
                onCampaignCreated={handleCampaignCreated} 
                userId={user.uid}
              />
            } />
            <Route path="/leads" element={<LeadMiner settings={settings} user={user} />} />
            <Route path="/pipeline" element={<PipelineCRM />} />
            <Route path="/properties" element={<PropertyManager settings={settings} userId={user.uid} />} />
            <Route path="/trainer" element={<BotTrainer settings={settings} />} />
            <Route path="/visits" element={<VisitScheduler />} />
            <Route path="/subscription" element={<Subscription user={user} />} />
            <Route path="/settings" element={
              <Settings 
                settings={settings} 
                onSave={handleSaveSettings} 
              />
            } />
            <Route path="/admin" element={<AdminPanel />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;