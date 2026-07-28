import { AlertTriangle, X } from 'lucide-react';

interface DeactivateConfirmModalProps {
  userName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function DeactivateConfirmModal({
  userName,
  onConfirm,
  onCancel,
  isLoading,
}: DeactivateConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onCancel}
      />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Desactivar Usuario
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            ¿Estás seguro de que deseas desactivar a{' '}
            <span className="font-medium text-slate-900">{userName}</span>?
            El usuario no podrá acceder al sistema hasta que sea reactivado.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-3 rounded-2xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 disabled:opacity-50 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-3 rounded-2xl bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mx-auto" />
            ) : (
              'Desactivar'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
