'use client';

import { useState, useCallback, useEffect } from 'react';
import { Plus, SlidersHorizontal, Orbit, Search, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TaskList } from '@/app/components/task-list';
import { TaskForm } from '@/app/components/task-form';
import { Filters } from '@/app/components/filters';
import { FocusView } from '@/app/components/focus-view';
import { AiReviewDialog } from '@/app/components/ai-review-dialog';
import type { Task, Workspace } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from '@/app/components/theme-toggle';
import { LanguageSwitcher } from '@/app/components/language-switcher';
import { WorkspaceSwitcher } from '@/app/components/workspace-switcher';
import { useI18n } from '@/app/components/i18n-provider';
import { CommandSearch } from '@/app/components/command-search';
import { ShortcutsHelp } from '@/app/components/shortcuts-help';
import { BulkActionsToolbar } from '@/app/components/bulk-actions-toolbar';
import { useAuth } from '@/components/providers/auth-provider';
import { signOut } from '@/lib/appwrite/auth-services';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTasks } from '@/lib/hooks/use-tasks';
import { useFilters } from '@/lib/hooks/use-filters';
import { useKeyboardShortcuts } from '@/lib/hooks/use-keyboard-shortcuts';
import { useTaskSelection } from '@/lib/hooks/use-task-selection';
import { useRouter } from 'next/navigation';

interface ClientDashboardProps {
  initialTasks: Task[];
}

export function ClientDashboard({ initialTasks }: ClientDashboardProps) {
  const router = useRouter();
  const { user } = useAuth();
  
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace>('personal');
  const [editingTask, setEditingTask] = useState<Task | 'new' | null>(null);
  const [focusTask, setFocusTask] = useState<Task | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  const { t } = useI18n();

  // Custom hooks
  const { tasks, isLoading, saveTask, toggleComplete, deleteTask, updatePomodoro, logTime, toggleSubTask, fetchTasks, setTasks } = useTasks(user?.uid ?? null);
  const { priorityFilter, setPriorityFilter, tagFilter, setTagFilter, searchQuery, setSearchQuery, uniqueTags, filteredTasks, clearFilters } = useFilters(tasks, activeWorkspace);
  const { selectedTaskIds, selectTask, deselectAll, setSelectedTaskIds } = useTaskSelection();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleSetEditingTask = useCallback((task: Task) => {
    setEditingTask(task);
  }, []);

  const handleOpenNewTask = useCallback(() => {
    clearFilters();
    setEditingTask('new');
  }, [clearFilters]);

  // Initialize with server-fetched tasks
  useEffect(() => {
    if (initialTasks && initialTasks.length > 0) {
      fetchTasks();
    }
  }, [initialTasks, fetchTasks]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onNewTask: handleOpenNewTask,
    onOpenSearch: () => setIsSearchOpen(true),
    onShowShortcuts: () => setIsShortcutsOpen(true),
    onClearSelection: () => deselectAll(),
  }, !!editingTask || !!focusTask);

  const activeEditingTask = editingTask && editingTask !== 'new'
    ? tasks.find(task => task.id === editingTask.id) ?? null
    : null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto max-w-5xl p-4 sm:p-6 md:p-8">
        <header className="flex items-center justify-between mb-6 md:mb-8">
          <div className="flex items-center gap-4">
            <Orbit className="w-7 h-7 md:w-8 md:h-8 text-primary" />
            <WorkspaceSwitcher activeWorkspace={activeWorkspace} setActiveWorkspace={setActiveWorkspace} />
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setIsSearchOpen(true)} className="hidden md:flex">
              <Search className="h-4 w-4" />
            </Button>
            <div className="hidden md:flex items-center gap-2">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
            <Button variant="outline" size="icon" onClick={() => setIsReviewOpen(true)}>
              <Sparkles className="h-4 w-4" />
              <span className="sr-only">{t('aiReview.title')}</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden">
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 p-4">
                <Filters
                  priorityFilter={priorityFilter}
                  setPriorityFilter={setPriorityFilter}
                  tagFilter={tagFilter}
                  setTagFilter={setTagFilter}
                  uniqueTags={uniqueTags}
                />
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.photoURL || undefined} alt={user?.displayName || 'User'} />
                    <AvatarFallback>{user?.displayName?.charAt(0)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="md:hidden flex items-center justify-between px-2 py-2 gap-2">
                  <LanguageSwitcher />
                  <ThemeToggle />
                </div>
                <DropdownMenuSeparator className="md:hidden" />
                <DropdownMenuItem onClick={handleSignOut}>
                  {t('login.signOut')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <aside className="hidden md:block md:col-span-1">
            <div className="sticky top-8 space-y-8">
              <div>
                <h2 className="text-lg font-semibold mb-4">{t('header.filters')}</h2>
                <Filters
                  priorityFilter={priorityFilter}
                  setPriorityFilter={setPriorityFilter}
                  tagFilter={tagFilter}
                  setTagFilter={setTagFilter}
                  uniqueTags={uniqueTags}
                />
              </div>
            </div>
          </aside>

          <div className="md:col-span-3">
            {isLoading ? (
              <div className="flex justify-center items-center h-80">
                <div className="text-center">
                  <Orbit className="h-12 w-12 animate-spin text-primary mx-auto" />
                  <p className="mt-4 text-muted-foreground">Loading tasks...</p>
                </div>
              </div>
            ) : (
              <TaskList
                tasks={filteredTasks}
                setTasks={() => {}}
                onEdit={handleSetEditingTask}
                onDelete={deleteTask}
                onToggle={toggleComplete}
                onFocus={setFocusTask}
                onSubTaskToggle={toggleSubTask}
                selectedTaskIds={selectedTaskIds}
                onSelectTask={selectTask}
              />
            )}
          </div>
        </div>

        {/* Floating Action Button for Quick Capture */}
        <Button onClick={handleOpenNewTask} className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-30" title={t('header.addTask')}>
          <Plus className="h-6 w-6" />
        </Button>

        {/* Modals and Other Global UI */}
        <CommandSearch isOpen={isSearchOpen} setIsOpen={setIsSearchOpen} setSearchQuery={setSearchQuery} />
        <ShortcutsHelp isOpen={isShortcutsOpen} setIsOpen={setIsShortcutsOpen} />
        <BulkActionsToolbar
          selectedTaskIds={selectedTaskIds}
          setSelectedTaskIds={setSelectedTaskIds}
          setTasks={setTasks}
        />
        {editingTask && (
          <TaskForm
            isOpen={!!editingTask}
            onClose={() => setEditingTask(null)}
            onSave={(task) => saveTask(task, activeWorkspace)}
            task={editingTask === 'new' ? undefined : activeEditingTask ?? undefined}
            allTasks={tasks}
            activeWorkspace={activeWorkspace}
          />
        )}
        {focusTask && (
          <FocusView
            task={focusTask}
            onExit={() => setFocusTask(null)}
            onPomodoroComplete={updatePomodoro}
            onLogTime={logTime}
          />
        )}
        {isReviewOpen && (
          <AiReviewDialog
            isOpen={isReviewOpen}
            onClose={() => setIsReviewOpen(false)}
            tasks={tasks}
          />
        )}
      </main>
    </div>
  );
}
