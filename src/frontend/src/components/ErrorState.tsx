import { RefreshCw, AlertTriangle } from 'lucide-react';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="text-red-400 mb-4">
        <AlertTriangle size={48} />
      </div>
      <h3 className="text-lg font-medium text-slate-900 mb-1">
        Ocurrió un error
      </h3>
      <p className="text-sm text-slate-500 mb-4 text-center max-w-sm">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all text-sm font-medium"
        >
          <RefreshCw size={16} />
          Intentar de nuevo
        </button>
      )}
    </div>
  );
}
