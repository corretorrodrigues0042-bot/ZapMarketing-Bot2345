import React, { useEffect, useState } from 'react';
import { ShieldCheck, Search, X, Users, DollarSign, Activity } from 'lucide-react';
import { User } from '../types';
import { storageService } from '../services/storageService';

const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loadUsers = async () => {
    setIsLoading(true);
    const data = await storageService.getAllUsers();
    setUsers(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleUpdatePlan = async (userId: string, newPlan: 'free' | 'pro' | 'enterprise') => {
    const confirmMessage = newPlan === 'free' 
        ? "Deseja remover o acesso Premium deste usuário?" 
        : `Confirmar pagamento e ativar plano ${newPlan.toUpperCase()}?`;

    if(!confirm(confirmMessage)) return;
    
    await storageService.updateUserPlan(userId, newPlan);
    setUsers(prev => prev.map(u => u.uid === userId ? { ...u, plan: newPlan } : u));
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalUsers = users.length;
  const proUsers = users.filter(u => u.plan === 'pro').length;
  const enterpriseUsers = users.filter(u => u.plan === 'enterprise').length;
  const estimatedRevenue = (proUsers * 97) + (enterpriseUsers * 297);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <div className="bg-slate-900 text-white p-8 rounded-2xl shadow-xl border border-slate-700">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
                <h2 className="text-3xl font-bold flex items-center gap-3">
                    <ShieldCheck className="w-8 h-8 text-green-400" /> Painel do Dono
                </h2>
                <p className="text-slate-400 mt-2">
                    Gerencie seus clientes. Quando receber um Pix, ative o plano aqui.
                </p>
            </div>
            
            <div className="flex gap-4">
                <div className="bg-white/10 px-6 py-4 rounded-xl backdrop-blur-sm border border-white/5">
                    <div className="flex items-center gap-2 text-slate-400 text-xs uppercase font-bold mb-1">
                        <Users className="w-4 h-4" /> Usuários
                    </div>
                    <span className="text-2xl font-bold text-white">{totalUsers}</span>
                </div>
                <div className="bg-green-500/20 px-6 py-4 rounded-xl backdrop-blur-sm border border-green-500/30">
                     <div className="flex items-center gap-2 text-green-300 text-xs uppercase font-bold mb-1">
                        <DollarSign className="w-4 h-4" /> Receita Mensal
                    </div>
                    <span className="text-2xl font-bold text-green-400">R$ {estimatedRevenue},00</span>
                </div>
            </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50/50">
           <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
              <input 
                placeholder="Buscar por email ou nome..."
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-900 transition-shadow shadow-sm"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
           </div>
           <button onClick={loadUsers} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm">
             <Activity className="w-4 h-4" /> Atualizar Lista
           </button>
        </div>

        {isLoading ? (
            <div className="p-20 text-center">
                <div className="animate-spin w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full mx-auto mb-4"></div>
                <p className="text-slate-500 font-medium">Carregando base de clientes...</p>
            </div>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold tracking-wider">
                        <tr>
                            <th className="p-6 border-b border-slate-100">Cliente</th>
                            <th className="p-6 border-b border-slate-100">Contato</th>
                            <th className="p-6 border-b border-slate-100">Status do Plano</th>
                            <th className="p-6 border-b border-slate-100 text-center">Ações Administrativas</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredUsers.map(user => (
                            <tr key={user.uid} className="hover:bg-slate-50/80 transition-colors group">
                                <td className="p-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-lg border border-slate-200 group-hover:border-slate-300">
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-900">{user.name}</div>
                                            <div className="text-xs text-slate-400">UID: {user.uid.slice(0, 8)}...</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-6">
                                    <div className="text-sm font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded w-fit">
                                        {user.email}
                                    </div>
                                </td>
                                <td className="p-6">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${
                                        user.plan === 'pro' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                        user.plan === 'enterprise' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                        'bg-slate-100 text-slate-500 border-slate-200'
                                    }`}>
                                        <span className={`w-2 h-2 rounded-full ${
                                            user.plan === 'free' ? 'bg-slate-400' : 'bg-current animate-pulse'
                                        }`}></span>
                                        {user.plan}
                                    </span>
                                </td>
                                <td className="p-6">
                                    <div className="flex justify-center items-center gap-2">
                                        {user.plan !== 'free' && (
                                            <button 
                                                onClick={() => handleUpdatePlan(user.uid, 'free')}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors tooltip-trigger"
                                                title="Rebaixar para Grátis"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                        
                                        <div className="h-6 w-px bg-slate-200 mx-2"></div>

                                        <button 
                                            onClick={() => handleUpdatePlan(user.uid, 'pro')}
                                            disabled={user.plan === 'pro'}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                user.plan === 'pro' 
                                                ? 'bg-blue-50 text-blue-300 cursor-default' 
                                                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-200'
                                            }`}
                                        >
                                            ATIVAR PRO
                                        </button>
                                        
                                        <button 
                                            onClick={() => handleUpdatePlan(user.uid, 'enterprise')}
                                            disabled={user.plan === 'enterprise'}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                user.plan === 'enterprise'
                                                ? 'bg-purple-50 text-purple-300 cursor-default'
                                                : 'bg-white border border-purple-200 text-purple-600 hover:bg-purple-50'
                                            }`}
                                        >
                                            ENT
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredUsers.length === 0 && (
                            <tr>
                                <td colSpan={4} className="p-12 text-center text-slate-400">
                                    Nenhum usuário encontrado.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;