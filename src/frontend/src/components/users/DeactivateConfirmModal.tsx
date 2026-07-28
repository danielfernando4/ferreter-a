import { AlertTriangle, Loader2, X } from 'lucide-react';
import { useState } from 'react';
import * as api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

interface DeactivateConfirmModalProps {
  userId: number;
  userName: string;
  action: 'deactivate' | 'reactivate';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeactivateConfirmModal({
  userId,
  userName,
  action,
  onConfirm,
  onCancel,
}: DeactivateConfirmModalProps) {
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const isDeactivate = action === 'deactivate';

  const handleConfirm = async () => {
    setIsLoading(true);
    setError('');
    try {
      if (isDeactivate) {
        await api.deactivateUsuario(token!, userId);
      } else {
        await api.reactivateUsuario(token!, userId);
      }
      onConfirm();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cambiar estado';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-sm mx-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${isDeactivate ? 'bg-red-100' : 'bg-green-100'}`}>
              <AlertTriangle className={isDeactivate ? 'text-red-600' : 'text-green-600'} size={22} />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">
              {isDeactivate ? 'Desactivar usuario' : 'Reactivar usuario'}
            </h3>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <p className="text-sm text-slate-600 mb-2">
          {isDeactivate
            ? `¿Estás seguro de desactivar al usuario "${userName}"? No podrá acceder al sistema.`
            : `¿Estás seguro de reactivar al usuario "${userName}"? Podrá acceder al sistema nuevamente.`}
        </p>

        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 rounded-xl border border-red-200 mb-4">
            {error}
          </div>
        )}

        <div className="flex gap-3 justify-end mt-6">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              isDeactivate
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : null}
            {isLoading ? 'Procesando...' : isDeactivate ? 'Desactivar' : 'Reactivar'}
          </button>
        </div>
      </div>
    </div>
  );
}
