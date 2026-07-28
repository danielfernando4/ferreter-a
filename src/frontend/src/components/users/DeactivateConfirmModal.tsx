import { useState } from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import * as api from '../../services/api';

interface DeactivateConfirmModalProps {
  userId: number;
  userName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeactivateConfirmModal({ userId, userName, onConfirm, onCancel }: DeactivateConfirmModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDeactivate = async () => {
    setIsLoading(true);
    setError('');
    try {
      await api.deactivateUsuario(userId);
      onConfirm();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al desactivar usuario';
      setError(msg);
    }
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/30" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-xl border border-slate-200 p-6 w-full max-w-sm">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X className="h-4 w-4 text-slate-400" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Desactivar usuario</h3>
            <p className="text-sm text-slate-500">¿Estás seguro de desactivar a {userName}?</p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm mb-4">
            {error}
          </div>
        )}

        <p className="text-sm text-slate-600 mb-6">
          El usuario no podrá iniciar sesión hasta que sea reactivado.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 disabled:opacity-50 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleDeactivate}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-50 transition-all"
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
