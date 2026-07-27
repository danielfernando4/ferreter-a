import React from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({ message, onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="text-red-400 mb-4">
        <AlertCircle size={64} />
      </div>
      <h3 className="text-xl font-semibold text-slate-700 mb-2">Error</h3>
      <p className="text-slate-500 text-center max-w-md mb-6">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white rounded-2xl shadow-sm hover:bg-red-700 transition-all"
        >
          <RefreshCw size={18} />
          Reintentar
        </button>
      )}
    </div>
  );
};

export default ErrorState;
