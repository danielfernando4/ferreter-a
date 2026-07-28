import { PackageOpen } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  title = 'Sin elementos',
  description = 'No hay datos disponibles para mostrar.',
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="bg-slate-100 rounded-full p-4 mb-4">
        <PackageOpen className="w-12 h-12 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 mb-6 text-center max-w-sm">{description}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="px-4 py-2 bg-blue-600 text-white rounded-2xl shadow-sm hover:bg-blue-700 transition-all text-sm font-medium"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
