import React from 'react';

export const SkeletonText = ({ className = 'h-4 w-full' }) => {
  return (
    <div className={`skeleton-shimmer rounded-md ${className}`} />
  );
};

export const SkeletonCard = ({ className = 'h-32 w-full' }) => {
  return (
    <div className={`skeleton-shimmer rounded-2xl border border-brand-border/40 p-6 ${className}`} />
  );
};

export const SkeletonAvatar = ({ className = 'w-10 h-10' }) => {
  return (
    <div className={`skeleton-shimmer rounded-full ${className}`} />
  );
};

export const SkeletonBadge = ({ className = 'h-6 w-16' }) => {
  return (
    <div className={`skeleton-shimmer rounded-full ${className}`} />
  );
};

export const SkeletonTable = ({ rows = 5, cols = 4 }) => {
  return (
    <div className="w-full bg-brand-card/60 rounded-2xl p-6 border border-brand-border/40 animate-fade-in">
      <div className="flex gap-4 pb-4 border-b border-brand-border/30">
        {Array.from({ length: cols }).map((_, colIndex) => (
          <SkeletonText key={colIndex} className="h-5 flex-1" />
        ))}
      </div>
      <div className="divide-y divide-brand-border/20 pt-2">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex gap-4 py-4 items-center">
            {Array.from({ length: cols }).map((_, colIndex) => (
              <SkeletonText key={colIndex} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const SkeletonChart = ({ className = 'h-64 w-full' }) => {
  return (
    <div className={`bg-brand-card/60 rounded-2xl p-6 border border-brand-border/40 flex flex-col gap-4 animate-fade-in ${className}`}>
      <div className="flex justify-between items-center">
        <SkeletonText className="h-6 w-36" />
        <SkeletonText className="h-8 w-24 rounded-lg" />
      </div>
      <div className="flex-1 flex items-end gap-3 pt-6">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="skeleton-shimmer flex-1 rounded-t-lg"
            style={{ height: `${Math.max(20, (index * 23 + 37) % 90)}%` }}
          />
        ))}
      </div>
    </div>
  );
};

export const PageSkeleton = () => {
  return (
    <div className="space-y-8 animate-fade-in w-full">
      <div className="flex justify-between items-center pb-2">
        <div className="space-y-2">
          <SkeletonText className="h-8 w-48" />
          <SkeletonText className="h-4 w-72" />
        </div>
        <SkeletonText className="h-10 w-32 rounded-xl" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SkeletonCard className="h-36" />
        <SkeletonCard className="h-36" />
        <SkeletonCard className="h-36" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <SkeletonChart className="h-80" />
        </div>
        <div>
          <SkeletonCard className="h-80" />
        </div>
      </div>

      <SkeletonTable rows={4} cols={5} />
    </div>
  );
};

export default PageSkeleton;
