import { useState } from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';

interface DeactivateConfirmModalProps {
  userName: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export default function DeactivateConfirmModal({ userName, onConfirm, onCancel }: DeactivateConfirmModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 max-w-sm w-full mx-4">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle size={24} className="text-red-600" />
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 transition-all">
            <X size={20} />
          </button>
        </div>

        <h3 className="text-lg font-semibold text-slate-900 mb-2">Desactivar usuario</h3>
        <p className="text-sm text-slate-600 mb-6">
          ¿Estás seguro de que deseas desactivar a <strong>{userName}</strong>? 
          El usuario no podrá iniciar sesión hasta que sea reactivado.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : null}
            {isLoading ? 'Desactivando...' : 'Desactivar'}
          </button>
        </div>
      </div>
    </div>
  );
}
