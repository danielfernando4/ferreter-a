import { useState } from 'react';
import { Loader2, AlertTriangle, X } from 'lucide-react';

interface DeactivateConfirmModalProps {
  userName: string;
  isActive: boolean;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export default function DeactivateConfirmModal({
  userName,
  isActive,
  onConfirm,
  onCancel,
}: DeactivateConfirmModalProps) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-lg border border-slate-200 p-6 w-full max-w-sm mx-4">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-full ${isActive ? 'bg-red-100' : 'bg-green-100'}`}>
            <AlertTriangle className={`w-5 h-5 ${isActive ? 'text-red-600' : 'text-green-600'}`} />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">
            {isActive ? 'Desactivar usuario' : 'Activar usuario'}
          </h3>
        </div>

        <p className="text-sm text-slate-600 mb-6">
          {isActive
            ? `¿Estás seguro de desactivar a "${userName}"? El usuario no podrá iniciar sesión.`
            : `¿Estás seguro de reactivar a "${userName}"? El usuario podrá iniciar sesión nuevamente.`
          }
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className={`flex-1 py-2.5 px-4 rounded-xl text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 ${
              isActive
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isActive ? (
              'Desactivar'
            ) : (
              'Activar'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
