import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import * as api from '../../services/api';

interface DeactivateConfirmModalProps {
  userId: number;
  userName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeactivateConfirmModal({
  userId,
  userName,
  onConfirm,
  onCancel,
}: DeactivateConfirmModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    setIsLoading(true);
    setError('');
    try {
      await api.deactivateUsuario(userId);
      onConfirm();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'message' in err) {
        setError((err as { message: string }).message);
      } else {
        setError('Error al desactivar el usuario');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-red-100">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Desactivar usuario</h3>
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-slate-600 mb-1">
          ¿Está seguro de desactivar al usuario?
        </p>
        <p className="text-sm font-medium text-slate-900 mb-6">{userName}</p>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 transition-all text-sm font-medium disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Desactivar'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
