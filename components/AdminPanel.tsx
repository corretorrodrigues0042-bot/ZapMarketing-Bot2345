import React, { useEffect, useState } from 'react';
import { ShieldCheck, Users, Search, CreditCard, Check, X } from 'lucide-react';
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
    if(!confirm(`Tem certeza que deseja mudar o plano deste usuário para ${newPlan.toUpperCase()}?`)) return;
    
    await storageService.updateUserPlan(userId, newPlan);
    setUsers(prev => prev.map(u => u.uid === userId ? { ...u, plan: newPlan } : u));
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-slate-900 text-white p-8 rounded-2xl shadow-xl flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-3">
             <ShieldCheck className="w-8 h-8 text-green-400" /> Painel do Dono (SaaS)
          </h2>
          <p className="text-slate-400 mt-2">
            Gerencie seus clientes e ative os planos PRO manualmente após receber o pagamento.
          </p>
        </div>
        <div className="bg-white/10 px-6 py-4 rounded-xl text-center">
           <span className="block text-3xl font-bold">{users.length}</span>
           <span className="text-xs uppercase tracking-wider opacity-70">Total de Usuários</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex gap-4">
           <div className="relative flex-1">
              <Search className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
              <input 
                placeholder="Buscar usuário por nome ou email..."
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-900"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
           </div>
           <button onClick={loadUsers} className="px-6 py-3 bg-slate-100 font-bold text-slate-600 rounded-xl hover:bg-slate-200">
             Atualizar Lista
           </button>
        </div>

        {isLoading ? (
            <div className="p-12 text-center text-slate-500">Carregando usuários...</div>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                        <tr>
                            <th className="p-6">Usuário</th>
                            <th className="p-6">Email</th>
                            <th className="p-6">Plano Atual</th>
                            <th className="p-6 text-center">Ações (Mudar Plano)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredUsers.map(user => (
                            <tr key={user.uid} className="hover:bg-slate-50 transition-colors">
                                <td className="p-6 font-bold text-slate-900">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600">
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                        {user.name}
                                    </div>
                                </td>
                                <td className="p-6 text-slate-500 font-mono text-sm">{user.email}</td>
                                <td className="p-6">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                                        user.plan === 'pro' ? 'bg-blue-100 text-blue-700' :
                                        user.plan === 'enterprise' ? 'bg-purple-100 text-purple-700' :
                                        'bg-slate-100 text-slate-500'
                                    }`}>
                                        {user.plan}
                                    </span>
                                </td>
                                <td className="p-6">
                                    <div className="flex justify-center gap-2">
                                        <button 
                                            onClick={() => handleUpdatePlan(user.uid, 'free')}
                                            className={`px-3 py-1.5 rounded text-xs font-bold border ${user.plan === 'free' ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'}`}
                                            disabled={user.plan === 'free'}
                                        >
                                            FREE
                                        </button>
                                        <button 
                                            onClick={() => handleUpdatePlan(user.uid, 'pro')}
                                            className={`px-3 py-1.5 rounded text-xs font-bold border ${user.plan === 'pro' ? 'bg-blue-600 text-white cursor-not-allowed' : 'bg-white border-blue-200 text-blue-600 hover:bg-blue-50'}`}
                                            disabled={user.plan === 'pro'}
                                        >
                                            PRO
                                        </button>
                                        <button 
                                            onClick={() => handleUpdatePlan(user.uid, 'enterprise')}
                                            className={`px-3 py-1.5 rounded text-xs font-bold border ${user.plan === 'enterprise' ? 'bg-purple-600 text-white cursor-not-allowed' : 'bg-white border-purple-200 text-purple-600 hover:bg-purple-50'}`}
                                            disabled={user.plan === 'enterprise'}
                                        >
                                            ENTERPRISE
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;