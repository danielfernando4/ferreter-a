interface SkeletonProps {
  className?: string;
  lines?: number;
}

export function Skeleton({ className = '', lines = 1 }: SkeletonProps) {
  if (lines > 1) {
    return (
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`animate-pulse bg-slate-200 rounded-2xl ${
              i === lines - 1 ? 'w-3/4' : 'w-full'
            } h-4 ${className}`}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`animate-pulse bg-slate-200 rounded-2xl ${className}`}
    />
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton
              key={j}
              className="h-8 flex-1"
            />
          ))}
        </div>
      ))}
    </div>
  );
}
