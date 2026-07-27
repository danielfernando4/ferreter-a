import React from 'react';

interface SkeletonProps {
  count?: number;
  className?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ count = 1, className = 'h-6 w-full' }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`animate-pulse bg-slate-200 rounded-lg ${className}`}
        />
      ))}
    </>
  );
};

export default Skeleton;
