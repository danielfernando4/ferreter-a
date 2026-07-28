import { AlertTriangle, Loader2, X } from 'lucide-react';

interface DeactivateConfirmModalProps {
  userName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  action: 'deactivate' | 'reactivate';
}

export default function DeactivateConfirmModal({
  userName,
  onConfirm,
  onCancel,
  isLoading = false,
  action,
}: DeactivateConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-slate-900/50" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div
            className={`p-3 rounded-full mb-4 ${
              action === 'deactivate' ? 'bg-red-100' : 'bg-green-100'
            }`}
          >
            <AlertTriangle
              className={`h-6 w-6 ${
                action === 'deactivate' ? 'text-red-600' : 'text-green-600'
              }`}
            />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">
            {action === 'deactivate' ? 'Desactivar usuario' : 'Reactivar usuario'}
          </h3>
          <p className="text-sm text-slate-500 mb-6">
            {action === 'deactivate'
              ? `¿Estás seguro de desactivar a "${userName}"? El usuario no podrá iniciar sesión.`
              : `¿Estás seguro de reactivar a "${userName}"? El usuario podrá iniciar sesión nuevamente.`}
          </p>

          <div className="flex gap-3 w-full">
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-all flex items-center justify-center gap-2 ${
                action === 'deactivate'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-green-600 hover:bg-green-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isLoading
                ? 'Procesando...'
                : action === 'deactivate'
                  ? 'Desactivar'
                  : 'Reactivar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
