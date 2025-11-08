'use client';

import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import { Loader2, Orbit } from 'lucide-react';

type LazyComponentResult<P> = {
  LazyComponent: LazyExoticComponent<ComponentType<P>>;
  loading: ComponentType | null;
};

/**
 * Lazy Loading Utilities
 * Dynamically import components to reduce initial bundle size
 */

// Loading component for lazy-loaded components
const LazyLoadingComponent = () => (
  <div className="flex flex-col items-center justify-center p-8">
    <Orbit className="h-12 w-12 text-primary mb-4 animate-pulse" />
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
    <p className="text-sm text-muted-foreground mt-2">Loading...</p>
  </div>
);

/**
 * Create a lazy-loaded component with custom loading state
 */
export function createLazyComponent<P>(
  importFunc: () => Promise<{ default: ComponentType<P> }>,
  loadingComponent?: ComponentType | null
): LazyComponentResult<P> {
  const LazyComponent = lazy(importFunc);

  return {
    LazyComponent,
    loading: loadingComponent ?? LazyLoadingComponent,
  };
}

/**
 * Predefined lazy-loaded components
 */
type TaskFormComponent = typeof import('@/app/components/task-form')['TaskForm'];
type TaskFormProps = React.ComponentProps<TaskFormComponent>;
export const LazyTaskForm = createLazyComponent<TaskFormProps>(
  () => import('@/app/components/task-form').then(module => ({ default: module.TaskForm })),
  () => (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
);

type FocusViewComponent = typeof import('@/app/components/focus-view')['FocusView'];
type FocusViewProps = React.ComponentProps<FocusViewComponent>;
export const LazyFocusView = createLazyComponent<FocusViewProps>(
  () => import('@/app/components/focus-view').then(module => ({ default: module.FocusView })),
  () => (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
);

type AiReviewDialogComponent = typeof import('@/app/components/ai-review-dialog')['AiReviewDialog'];
type AiReviewDialogProps = React.ComponentProps<AiReviewDialogComponent>;
export const LazyAiReviewDialog = createLazyComponent<AiReviewDialogProps>(
  () => import('@/app/components/ai-review-dialog').then(module => ({ default: module.AiReviewDialog })),
  () => (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
);

type CommandSearchComponent = typeof import('@/app/components/command-search')['CommandSearch'];
type CommandSearchProps = React.ComponentProps<CommandSearchComponent>;
export const LazyCommandSearch = createLazyComponent<CommandSearchProps>(
  () => import('@/app/components/command-search').then(module => ({ default: module.CommandSearch })),
  () => null
);

type ShortcutsHelpComponent = typeof import('@/app/components/shortcuts-help')['ShortcutsHelp'];
type ShortcutsHelpProps = React.ComponentProps<ShortcutsHelpComponent>;
export const LazyShortcutsHelp = createLazyComponent<ShortcutsHelpProps>(
  () => import('@/app/components/shortcuts-help').then(module => ({ default: module.ShortcutsHelp })),
  () => null
);

type BulkActionsToolbarComponent = typeof import('@/app/components/bulk-actions-toolbar')['BulkActionsToolbar'];
type BulkActionsToolbarProps = React.ComponentProps<BulkActionsToolbarComponent>;
export const LazyBulkActionsToolbar = createLazyComponent<BulkActionsToolbarProps>(
  () => import('@/app/components/bulk-actions-toolbar').then(module => ({ default: module.BulkActionsToolbar })),
  () => null
);
