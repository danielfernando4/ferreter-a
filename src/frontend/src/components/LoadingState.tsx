import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Cargando...' }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <Loader2 size={40} className="text-blue-600 animate-spin mb-4" />
      <p className="text-slate-500">{message}</p>
    </div>
  );
}
