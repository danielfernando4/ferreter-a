import type { UserOut } from '../../types/auth';
import { AlertTriangle } from 'lucide-react';

interface DeactivateConfirmModalProps {
  userName: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export default function DeactivateConfirmModal({
  userName,
  onConfirm,
  onCancel,
}: DeactivateConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/30" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">Desactivar usuario</h3>
          <p className="text-sm text-slate-500">
            ¿Estás seguro de que deseas desactivar a <strong>{userName}</strong>?
            El usuario no podrá iniciar sesión hasta que sea reactivado.
          </p>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 transition-all"
          >
            Cancelar
          </button>
          <ConfirmButton onConfirm={onConfirm} />
        </div>
      </div>
    </div>
  );
}

function ConfirmButton({ onConfirm }: { onConfirm: () => Promise<void> }) {
  const handleClick = async () => {
    await onConfirm();
  };
  return (
    <button
      onClick={handleClick}
      className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-all"
    >
      Desactivar
    </button>
  );
}
