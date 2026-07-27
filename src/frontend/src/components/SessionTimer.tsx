import React from 'react';
import { Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import { useSession } from '../contexts/SessionContext';

const SessionTimer: React.FC = () => {
  const { showWarning, timeRemaining, extendSessionNow } = useSession();

  if (!showWarning) return null;

  const minutes = Math.floor(timeRemaining / 60000);
  const seconds = Math.floor((timeRemaining % 60000) / 1000);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-50 border-b border-amber-200 px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 text-amber-700">
          <AlertTriangle size={18} />
          <span className="text-sm font-medium">
            Tu sesión expirará en {minutes}:{seconds.toString().padStart(2, '0')} minutos
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs text-amber-600">
            <Clock size={14} />
            <span>Actividad para extender</span>
          </div>
          <button
            type="button"
            onClick={extendSessionNow}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-2xl hover:bg-amber-200 transition-all"
          >
            <RefreshCw size={14} />
            Extender Sesión
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionTimer;
