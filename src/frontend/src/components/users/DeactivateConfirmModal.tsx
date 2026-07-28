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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X className="h-5 w-5 text-slate-400" />
        </button>

        <div className="text-center mb-6">
          <div className="h-14 w-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-7 w-7 text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Desactivar Usuario</h3>
          <p className="text-sm text-slate-600 mt-2">
            ¿Estás seguro de que deseas desactivar a <strong>{userName}</strong>?
            <br />
            El usuario no podrá iniciar sesión hasta que sea reactivado.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-all"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Desactivar'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
