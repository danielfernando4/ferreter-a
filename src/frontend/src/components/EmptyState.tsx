import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="text-slate-400 mb-4">
        {icon || <Inbox size={64} />}
      </div>
      <h3 className="text-xl font-semibold text-slate-700 mb-2">{title}</h3>
      {description && (
        <p className="text-slate-500 text-center max-w-md mb-6">{description}</p>
      )}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-2xl shadow-sm hover:bg-blue-700 transition-all"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
