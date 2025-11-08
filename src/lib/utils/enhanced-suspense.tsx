'use client';

import React, { Suspense } from 'react';

/**
 * Enhanced Suspense Boundaries
 * Multi-layered Suspense with proper error handling for React 19
 */

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Enhanced Error Boundary with retry functionality
 */
interface EnhancedErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export class EnhancedErrorBoundary extends React.Component<EnhancedErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: EnhancedErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by EnhancedErrorBoundary:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} retry={this.handleRetry} />;
      }

      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>{this.state.error.message}</p>
          <button onClick={this.handleRetry}>Try again</button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Layered Suspense with multiple boundaries
 */
export const LayeredSuspense: React.FC<{
  children: React.ReactNode;
  globalFallback?: React.ReactNode;
  sectionFallback?: React.ReactNode;
  itemFallback?: React.ReactNode;
}> = ({
  children,
  globalFallback = <GlobalLoadingSpinner />,
  sectionFallback = <SectionLoadingSkeleton />,
  itemFallback = <ItemLoadingSkeleton />,
}) => {
  return (
    <EnhancedErrorBoundary fallback={ErrorFallback}>
      <Suspense fallback={globalFallback}>
        <div className="suspense-layer global-layer">
          <Suspense fallback={sectionFallback}>
            <Suspense fallback={itemFallback}>{children}</Suspense>
          </Suspense>
        </div>
      </Suspense>
    </EnhancedErrorBoundary>
  );
};

/**
 * Nested Suspense for progressive loading
 */
export const NestedSuspense: React.FC<{
  children: React.ReactNode;
  levels?: number;
}> = ({ children, levels = 3 }) => {
  const createNestedLevels = (level: number): React.ReactNode => {
    if (level === 0) {
      return children;
    }

    return (
      <Suspense fallback={<LevelLoadingSkeleton level={level} />}>
        <div className={`suspense-level level-${level}`}>
          {createNestedLevels(level - 1)}
        </div>
      </Suspense>
    );
  };

  return createNestedLevels(levels);
};

/**
 * Suspended Data with Error Recovery
 */
export const SuspendedData = <T,>({
  promise,
  children,
  fallback,
  errorFallback: ErrorFallback,
  onError,
}: {
  promise: Promise<T>;
  children: (data: T) => React.ReactNode;
  fallback?: React.ReactNode;
  errorFallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  onError?: (error: Error) => void;
}) => {
  return (
    <EnhancedErrorBoundary
      fallback={ErrorFallback}
      onError={(error) => onError?.(error)}
    >
      <Suspense fallback={fallback || <DataLoadingSpinner />}>
        <SuspendedDataContent promise={promise} render={children} />
      </Suspense>
    </EnhancedErrorBoundary>
  );
};

const SuspendedDataContent = <T,>({
  promise,
  render,
}: {
  promise: Promise<T>;
  render: (data: T) => React.ReactNode;
}) => {
  // Using the use() hook for promise resolution
  const data = React.use(promise);
  return <>{render(data)}</>;
};

/**
 * Progressive Suspense for Dashboard
 */
export const DashboardSuspense: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  return (
    <EnhancedErrorBoundary fallback={DashboardErrorFallback}>
      <Suspense fallback={<DashboardGlobalLoading />}>
        <div className="dashboard-container">
          <Suspense fallback={<HeaderLoading />}>
            <div className="dashboard-header">
              {/* Header content here */}
            </div>
          </Suspense>

          <div className="dashboard-content">
            <Suspense fallback={<SidebarLoading />}>
              <aside className="dashboard-sidebar">
                {/* Sidebar content here */}
              </aside>
            </Suspense>

            <main className="dashboard-main">
              <Suspense fallback={<MainContentLoading />}>
                {children}
              </Suspense>
            </main>
          </div>
        </div>
      </Suspense>
    </EnhancedErrorBoundary>
  );
};

/**
 * Task List with Nested Suspense
 */
export const TaskListSuspense = <T,>({
  tasksPromise,
  renderTasks,
}: {
  tasksPromise: Promise<T[]>;
  renderTasks: (tasks: T[]) => React.ReactNode;
}) => {
  return (
    <EnhancedErrorBoundary fallback={TaskListErrorFallback}>
      <Suspense fallback={<TaskListGlobalLoading />}>
        <div className="task-list-container">
          <Suspense fallback={<TaskStatsLoading />}>
            <div className="task-stats">
              {/* Stats content */}
            </div>
          </Suspense>

          <Suspense fallback={<TaskItemsLoading />}>
            <TaskItemsList tasksPromise={tasksPromise} renderTasks={renderTasks} />
          </Suspense>
        </div>
      </Suspense>
    </EnhancedErrorBoundary>
  );
};

const TaskItemsList = <T,>({
  tasksPromise,
  renderTasks,
}: {
  tasksPromise: Promise<T[]>;
  renderTasks: (tasks: T[]) => React.ReactNode;
}) => {
  const tasks = React.use(tasksPromise);
  return <>{renderTasks(tasks)}</>;
};

/**
 * Loading Components
 */
const GlobalLoadingSpinner: React.FC = () => (
  <div className="global-loading">
    <div className="spinner" />
    <p>Loading application...</p>
  </div>
);

const SectionLoadingSkeleton: React.FC = () => (
  <div className="section-loading">
    <div className="skeleton-box" style={{ height: '200px' }} />
  </div>
);

const ItemLoadingSkeleton: React.FC = () => (
  <div className="item-loading">
    <div className="skeleton-line" style={{ height: '20px', marginBottom: '8px' }} />
    <div className="skeleton-line" style={{ height: '20px', width: '80%' }} />
  </div>
);

const DataLoadingSpinner: React.FC = () => (
  <div className="data-loading">
    <div className="spinner small" />
    <span>Loading data...</span>
  </div>
);

const DashboardGlobalLoading: React.FC = () => (
  <div className="dashboard-global-loading">
    <div className="loading-header" />
    <div className="loading-grid">
      <div className="loading-card" />
      <div className="loading-card" />
      <div className="loading-card" />
    </div>
  </div>
);

const HeaderLoading: React.FC = () => (
  <div className="header-loading">
    <div className="skeleton-box" style={{ height: '60px' }} />
  </div>
);

const SidebarLoading: React.FC = () => (
  <div className="sidebar-loading">
    <div className="skeleton-box" style={{ width: '250px', height: '400px' }} />
  </div>
);

const MainContentLoading: React.FC = () => (
  <div className="main-content-loading">
    <div className="skeleton-box" style={{ height: '300px' }} />
  </div>
);

const TaskListGlobalLoading: React.FC = () => (
  <div className="task-list-loading">
    <div className="loading-stats" />
    <div className="loading-items">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="loading-item">
          <div className="skeleton-line" style={{ height: '60px' }} />
        </div>
      ))}
    </div>
  </div>
);

const TaskStatsLoading: React.FC = () => (
  <div className="task-stats-loading">
    <div className="skeleton-box" style={{ height: '100px' }} />
  </div>
);

const TaskItemsLoading: React.FC = () => (
  <div className="task-items-loading">
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="skeleton-box" style={{ height: '80px', marginBottom: '8px' }} />
    ))}
  </div>
);

const LevelLoadingSkeleton: React.FC<{ level: number }> = ({ level }) => (
  <div className={`level-loading level-${level}`}>
    <div className="skeleton-box" style={{ height: `${100 - level * 10}px` }} />
  </div>
);

/**
 * Error Fallback Components
 */
const ErrorFallback: React.FC<{ error: Error; retry: () => void }> = ({ error, retry }) => (
  <div className="error-fallback">
    <h3>Error occurred</h3>
    <p>{error.message}</p>
    <button onClick={retry}>Retry</button>
  </div>
);

const DashboardErrorFallback: React.FC<{ error: Error; retry: () => void }> = ({ error, retry }) => (
  <div className="dashboard-error">
    <h2>Dashboard Error</h2>
    <p>{error.message}</p>
    <button onClick={retry}>Reload Dashboard</button>
  </div>
);

const TaskListErrorFallback: React.FC<{ error: Error; retry: () => void }> = ({ error, retry }) => (
  <div className="task-list-error">
    <h3>Failed to load tasks</h3>
    <p>{error.message}</p>
    <button onClick={retry}>Retry</button>
  </div>
);
