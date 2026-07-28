import { useState } from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import { deactivateUsuario } from '../../services/api';

interface DeactivateConfirmModalProps {
  userName: string;
  userId: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeactivateConfirmModal({
  userName,
  userId,
  onConfirm,
  onCancel,
}: DeactivateConfirmModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDeactivate = async () => {
    setIsLoading(true);
    setError('');
    try {
      await deactivateUsuario(userId);
      onConfirm();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Error al desactivar usuario');
      } else {
        setError('Error al desactivar usuario');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-2xl flex items-center justify-center">
              <AlertTriangle size={22} className="text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Desactivar Usuario</h3>
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded-lg hover:bg-slate-100 transition-all"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-2xl text-sm mb-4">
            {error}
          </div>
        )}

        <p className="text-slate-600 text-sm mb-6">
          ¿Estás seguro de que deseas desactivar a <strong>{userName}</strong>?
          El usuario no podrá iniciar sesión hasta que sea reactivado.
        </p>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-5 py-2.5 border border-slate-300 rounded-2xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleDeactivate}
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-2xl shadow-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium"
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <AlertTriangle size={16} />
            )}
            {isLoading ? 'Desactivando...' : 'Desactivar'}
          </button>
        </div>
      </div>
    </div>
  );
}
