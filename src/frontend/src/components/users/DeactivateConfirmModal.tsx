import { useState } from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';

interface DeactivateConfirmModalProps {
  userName: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export default function DeactivateConfirmModal({
  userName,
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
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-6">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-red-100 rounded-xl flex-shrink-0">
            <AlertTriangle className="text-red-600" size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900 mb-1">
              Desactivar usuario
            </h3>
            <p className="text-sm text-slate-500">
              ¿Estás seguro de que deseas desactivar a{' '}
              <span className="font-medium text-slate-700">{userName}</span>?
              El usuario no podrá iniciar sesión hasta que sea reactivado.
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 transition-all text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 transition-all text-sm"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={16} />
            ) : null}
            {isLoading ? 'Desactivando...' : 'Desactivar'}
          </button>
        </div>
      </div>
    </div>
  );
}
