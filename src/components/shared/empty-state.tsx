import { memo } from 'react';
import { LucideIcon } from 'lucide-react';

/**
 * Server/Shared Component: Empty State
 * Pure presentational component for when there's no data
 * Memoized for performance
 */
interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

const EmptyState = memo(function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-12 text-center">
      <Icon className="text-muted-foreground h-12 w-12 mb-4" />
      <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4">{description}</p>
      {action}
    </div>
  );
});

export default EmptyState;
export type { EmptyStateProps };
