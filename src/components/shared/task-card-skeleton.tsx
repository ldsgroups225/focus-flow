import { memo } from 'react';

/**
 * Server/Shared Component: Task Card Skeleton
 * Used for loading states
 * Memoized for performance
 */
const TaskCardSkeleton = memo(function TaskCardSkeleton() {
  return (
    <div className="p-4 rounded-lg border bg-card animate-pulse">
      <div className="flex items-start gap-3">
        <div className="mt-1 h-4 w-4 rounded bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 rounded bg-muted" />
          <div className="h-3 w-1/2 rounded bg-muted" />
        </div>
        <div className="flex gap-1">
          <div className="h-6 w-6 rounded bg-muted" />
          <div className="h-6 w-6 rounded bg-muted" />
        </div>
      </div>
    </div>
  );
});

export default TaskCardSkeleton;
export { TaskCardSkeleton };
