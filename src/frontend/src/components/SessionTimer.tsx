import React, { useState, useEffect } from 'react';
import { useSession } from '../contexts/SessionContext';
import { Clock, X } from 'lucide-react';

export default function SessionTimer() {
  const { timeLeft, showWarning, extend } = useSession();
  const [dismissed, setDismissed] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (showWarning) {
      setDismissed(false);
    }
  }, [showWarning]);

  if (!showWarning || dismissed) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="bg-amber-50 border border-amber-200 rounded-2xl shadow-lg p-4 max-w-xs">
        <div className="flex items-start gap-3">
          <div className="text-amber-500 mt-0.5">
            <Clock size={20} />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-amber-800">Sesión por expirar</h4>
            <p className="text-xs text-amber-700 mt-1">
              Tu sesión expirará en <strong>{formatTime(timeLeft)}</strong>. Haz clic en "Extender" para mantenerla activa.
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={extend}
                className="px-4 py-1.5 text-xs font-medium bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-all"
              >
                Extender sesión
              </button>
              <button
                onClick={() => setDismissed(true)}
                className="px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 rounded-xl transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-amber-400 hover:text-amber-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
