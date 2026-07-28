import { Loader2, AlertTriangle } from 'lucide-react';

interface DeactivateConfirmModalProps {
  userName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  isReactivate?: boolean;
}

export default function DeactivateConfirmModal({
  userName,
  onConfirm,
  onCancel,
  isLoading = false,
  isReactivate = false,
}: DeactivateConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
        <div className="flex flex-col items-center text-center">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
            isReactivate ? 'bg-green-100' : 'bg-red-100'
          }`}>
            <AlertTriangle className={`w-6 h-6 ${isReactivate ? 'text-green-600' : 'text-red-600'}`} />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            {isReactivate ? 'Reactivar usuario' : 'Desactivar usuario'}
          </h3>
          <p className="text-sm text-slate-500 mb-6">
            {isReactivate
              ? `¿Estás seguro de reactivar a "${userName}"?`
              : `¿Estás seguro de desactivar a "${userName}"? Esta acción puede revertirse.`
            }
          </p>
          <div className="flex gap-3 w-full">
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-1 py-2.5 rounded-xl text-white font-medium transition-all flex items-center justify-center gap-2 ${
                isReactivate
                  ? 'bg-green-600 hover:bg-green-700 disabled:bg-green-400'
                  : 'bg-red-600 hover:bg-red-700 disabled:bg-red-400'
              }`}
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoading ? 'Procesando...' : isReactivate ? 'Reactivar' : 'Desactivar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
