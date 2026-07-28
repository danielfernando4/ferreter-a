import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
}

export default function LoadingState({ message }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <Loader2 className="animate-spin text-blue-600 mb-3" size={32} />
      {message && (
        <p className="text-sm text-slate-500">{message}</p>
      )}
    </div>
  );
}
