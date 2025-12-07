import React from 'react';
import { X, Check, FileText, Settings, AlertTriangle } from 'lucide-react';
import { DriveFile } from '../types';
import { MOCK_DRIVE_FILES } from '../services/mockData';
import { useNavigate } from 'react-router-dom';

interface OneDrivePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (files: DriveFile[]) => void;
  clientId: string;
}

const OneDrivePicker: React.FC<OneDrivePickerProps> = ({ isOpen, onClose, onSelect, clientId }) => {
  const [selectedFiles, setSelectedFiles] = React.useState<Set<string>>(new Set());
  const navigate = useNavigate();

  if (!isOpen) return null;

  // BLOQUEIO: Se não tiver Client ID, obriga a configurar
  if (!clientId) {
    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center animate-in zoom-in-95 duration-200">
                <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle className="w-10 h-10 text-yellow-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Integração Necessária</h3>
                <p className="text-slate-600 mb-8 leading-relaxed">
                    Você pediu acesso ao OneDrive, mas eu preciso da chave <strong>Client ID</strong> para acessar seus arquivos com segurança.
                </p>
                <div className="space-y-3">
                    <button 
                        onClick={() => { onClose(); navigate('/settings'); }}
                        className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                        <Settings className="w-5 h-5" /> Ir para Configurações
                    </button>
                    <button 
                        onClick={onClose}
                        className="w-full py-3.5 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
  }

  const toggleFile = (id: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedFiles(newSelected);
  };

  const handleConfirm = () => {
    const files = MOCK_DRIVE_FILES.filter(f => selectedFiles.has(f.id));
    onSelect(files);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-[#0078D4] text-white">
          <div className="flex items-center gap-2">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.47 13.1c-.88 0-1.66.45-2.15 1.14l-4.47-2.58c.09-.35.15-.72.15-1.1s-.06-.75-.15-1.1l4.47-2.58c.49.69 1.27 1.14 2.15 1.14 1.48 0 2.69-1.21 2.69-2.69S20.95 2.69 19.47 2.69 16.78 3.9 16.78 5.38c0 .38.06.75.15 1.1l-4.47 2.58c-.49-.69-1.27-1.14-2.15-1.14-1.48 0-2.69 1.21-2.69 2.69s1.21 2.69 2.69 2.69c.88 0 1.66-.45 2.15-1.14l4.47 2.58c-.09.35-.15.72-.15 1.1 0 1.48 1.21 2.69 2.69 2.69s2.69-1.21 2.69-2.69-1.21-2.69-2.69-2.69z" opacity="0"/>
               <path d="M9.6 15.6c0-1.7-.8-3.2-2.1-4.2C8.8 10.4 9.6 8.9 9.6 7.2c0-2.9-2.1-5.3-4.9-5.7V0h12v1.5c2.9.4 5 2.8 5 5.7 0 1.7-.8 3.2-2.1 4.2 1.3 1 2.1 2.5 2.1 4.2 0 3.2-2.6 5.8-5.8 5.8-3.2 0-5.8-2.6-5.8-5.8H9.6zM6 14.4c0 1.7 1.3 3 3 3s3-1.3 3-3-1.3-3-3-3-3 1.3-3 3zM15 7.2c0-1.7-1.3-3-3-3s-3 1.3-3 3 1.3 3 3 3 3-1.3 3-3z"/>
            </svg>
            <h3 className="font-semibold">Seus Arquivos do OneDrive</h3>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          <h4 className="text-sm font-bold text-slate-500 mb-4 uppercase tracking-wider flex items-center justify-between">
            <span>Arquivos Recentes</span>
            <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Conectado via Azure</span>
          </h4>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {MOCK_DRIVE_FILES.length > 0 ? MOCK_DRIVE_FILES.map((file) => (
              <div 
                key={file.id}
                onClick={() => toggleFile(file.id)}
                className={`
                  relative cursor-pointer group rounded-xl overflow-hidden border-2 transition-all shadow-sm
                  ${selectedFiles.has(file.id) ? 'border-[#0078D4] bg-blue-50 ring-2 ring-blue-200' : 'border-slate-200 hover:border-blue-300 bg-white hover:-translate-y-1'}
                `}
              >
                {/* Selection Indicator */}
                <div className={`absolute top-2 right-2 w-5 h-5 rounded-full z-10 flex items-center justify-center transition-all ${selectedFiles.has(file.id) ? 'bg-[#0078D4] text-white scale-100' : 'bg-slate-200 text-transparent scale-90 group-hover:bg-white group-hover:border group-hover:border-slate-300'}`}>
                    <Check className="w-3 h-3" />
                </div>
                
                {/* Thumbnail */}
                <div className="aspect-square bg-slate-100 relative overflow-hidden">
                  {file.type === 'image' ? (
                    <img src={file.thumbnail} alt={file.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-50">
                      <FileText className="w-12 h-12" />
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="p-3">
                  <p className="text-xs font-bold text-slate-700 truncate">{file.name}</p>
                  <p className="text-[10px] text-slate-400 uppercase mt-1 font-semibold tracking-wide">{file.type}</p>
                </div>
              </div>
            )) : (
              <div className="col-span-4 text-center py-12 text-slate-400">
                Nenhum arquivo encontrado no drive conectado.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-white flex justify-between items-center">
          <span className="text-sm text-slate-600 font-medium">
            {selectedFiles.size} arquivo(s) selecionado(s)
          </span>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              Cancelar
            </button>
            <button 
              onClick={handleConfirm}
              disabled={selectedFiles.size === 0}
              className="px-6 py-2.5 text-sm font-bold bg-[#0078D4] text-white rounded-lg hover:bg-[#006cbd] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-200 transition-all hover:shadow-xl active:scale-95"
            >
              Confirmar Seleção
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OneDrivePicker;