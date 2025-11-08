import { memo } from 'react';
import { Orbit } from 'lucide-react';

/**
 * Server/Shared Component: Page Header
 * Pure presentational component - can be used by both server and client
 * Memoized for performance
 */
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}

const PageHeader = memo(function PageHeader({ title, subtitle, icon, actions }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6 md:mb-8">
      <div className="flex items-center gap-4">
        {icon || <Orbit className="w-7 h-7 md:w-8 md:h-8 text-primary" />}
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
});

export default PageHeader;
export type { PageHeaderProps };
