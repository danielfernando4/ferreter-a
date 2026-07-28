import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Ocurrió un error',
  message = 'No pudimos cargar la información. Intenta de nuevo.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="text-red-400 mb-4">
        <AlertTriangle size={64} />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-500 text-center max-w-md mb-6">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white rounded-2xl shadow-sm hover:bg-red-700 transition-all"
        >
          <RefreshCw size={18} />
          Reintentar
        </button>
      )}
    </div>
  );
}
