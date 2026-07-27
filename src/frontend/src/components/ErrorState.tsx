import React from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorState({
  message = 'Ocurrió un error al cargar los datos',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="text-red-400 mb-4">
        <AlertTriangle size={64} />
      </div>
      <h3 className="text-lg font-semibold text-slate-700 mb-2">Error</h3>
      <p className="text-slate-500 text-sm mb-6 text-center max-w-md">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-2xl shadow-sm hover:bg-blue-700 transition-all"
        >
          <RefreshCw size={16} />
          Reintentar
        </button>
      )}
    </div>
  );
}
