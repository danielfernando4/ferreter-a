import React, { useState } from 'react';
import { Loader2, AlertTriangle, X } from 'lucide-react';

interface DeactivateConfirmModalProps {
  userName: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

const DeactivateConfirmModal: React.FC<DeactivateConfirmModalProps> = ({
  userName,
  onConfirm,
  onCancel,
}) => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1 rounded-lg hover:bg-slate-100 transition-colors text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <h3 className="text-lg font-semibold text-slate-900 mb-2">Desactivar usuario</h3>
        <p className="text-sm text-slate-500 mb-6">
          ¿Estás seguro de que deseas desactivar a <strong>{userName}</strong>?
          El usuario no podrá iniciar sesión hasta que sea reactivado.
        </p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Desactivar'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeactivateConfirmModal;
