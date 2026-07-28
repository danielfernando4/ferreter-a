import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="text-slate-400 mb-4">
        {icon || <Inbox size={48} />}
      </div>
      <h3 className="text-lg font-medium text-slate-900 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 mb-4 text-center max-w-sm">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all text-sm font-medium"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
