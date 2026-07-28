import { AlertTriangle, Loader2, X } from 'lucide-react';
import { useState } from 'react';
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

  const handleConfirm = async () => {
    setIsLoading(true);
    setError('');
    try {
      await deactivateUsuario(userId);
      onConfirm();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al desactivar usuario';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-red-50 rounded-full p-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <h3 className="font-semibold text-slate-900">Desactivar usuario</h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1 rounded-full hover:bg-slate-100 transition-all"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <p className="text-sm text-slate-600 mb-6">
          ¿Estás seguro de que deseas desactivar a <strong>{userName}</strong>? El usuario ya no podrá
          acceder al sistema.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm mb-4">
            {error}
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 border border-slate-300 rounded-2xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className="px-4 py-2 bg-red-600 text-white rounded-2xl shadow-sm hover:bg-red-700 disabled:opacity-50 transition-all text-sm font-medium flex items-center gap-2"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isLoading ? 'Desactivando...' : 'Desactivar'}
          </button>
        </div>
      </div>
    </div>
  );
}
