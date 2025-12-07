import React from 'react';
import { Calendar, CheckCircle, Clock } from 'lucide-react';
import { Visit, Contact } from '../types';
import { MOCK_VISITS, MOCK_CONTACTS } from '../services/mockData';

const VisitScheduler: React.FC = () => {
  const [visits, setVisits] = React.useState<Visit[]>(MOCK_VISITS);

  const getContactName = (id: string) => MOCK_CONTACTS.find(c => c.id === id)?.name || 'Desconhecido';

  const markCompleted = (id: string) => {
    setVisits(visits.map(v => v.id === id ? { ...v, completed: !v.completed } : v));
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Agenda de Visitas</h2>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
          + Nova Visita
        </button>
      </div>

      <div className="grid gap-4">
        {visits.map(visit => (
          <div key={visit.id} className={`p-4 rounded-xl border transition-all ${visit.completed ? 'bg-slate-50 border-slate-200' : 'bg-white border-blue-100 shadow-sm'}`}>
            <div className="flex justify-between items-start">
              <div className="flex gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${visit.completed ? 'bg-slate-200 text-slate-400' : 'bg-blue-50 text-blue-600'}`}>
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h3 className={`font-semibold text-lg ${visit.completed ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                    {getContactName(visit.contactId)}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                    <Clock className="w-4 h-4" />
                    {new Date(visit.date).toLocaleString()}
                  </div>
                  <p className="mt-2 text-slate-600 text-sm bg-slate-50 p-2 rounded border border-slate-100 inline-block">
                    {visit.notes}
                  </p>
                </div>
              </div>
              
              <button 
                onClick={() => markCompleted(visit.id)}
                className={`p-2 rounded-full border ${visit.completed ? 'text-green-600 border-green-200 bg-green-50' : 'text-slate-300 border-slate-200 hover:text-green-500 hover:border-green-300'}`}
              >
                <CheckCircle className="w-6 h-6" />
              </button>
            </div>
          </div>
        ))}

        {visits.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            Nenhuma visita agendada.
          </div>
        )}
      </div>
    </div>
  );
};

export default VisitScheduler;