'use client';

import { useState, useEffect, Suspense } from 'react';
import { Plus, SlidersHorizontal, Orbit, Search, Sparkles, User2, Settings, BarChart3, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TaskList } from '@/app/components/task-list';
import { Filters } from '@/app/components/filters';
import type { Workspace, TaskWithSubTasks } from '@/lib/types';
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
import { useAuth } from '@/components/providers/auth-provider';
import { signOut } from '@/lib/appwrite/auth-services';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTasks } from '@/lib/hooks/use-tasks';
import { useProjects } from '@/lib/hooks/use-projects';
import { useFilters } from '@/lib/hooks/use-filters';
import { useKeyboardShortcuts } from '@/lib/hooks/use-keyboard-shortcuts';
import { useTaskSelection } from '@/lib/hooks/use-task-selection';
import { LazyTaskForm, LazyFocusView, LazyAiReviewDialog, LazyCommandSearch, LazyShortcutsHelp, LazyBulkActionsToolbar } from '@/lib/utils/lazy';
import { AiFeatureSelector } from '@/app/components/ai-feature-selector';
import { AiDependencyDialog } from '@/app/components/ai-dependency-dialog';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DashboardSheet } from '@/components/ui/dashboard-sheet';
import { SidebarContent } from '@/app/components/sidebar-content';
import { getNameFromEmail } from '@/lib/utils/get-name-from-email';
import { getAvatarInitial } from '@/lib/utils/get-avatar-initial';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [activeWorkspace, setActiveWorkspace] = useState<Workspace>('personal');
  const [editingTask, setEditingTask] = useState<TaskWithSubTasks | 'new' | null>(null);
  const [focusTask, setFocusTask] = useState<TaskWithSubTasks | null>(null);
  const [isAiSelectorOpen, setIsAiSelectorOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isDependencyOpen, setIsDependencyOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(undefined);

  const { t } = useI18n();

  // Custom hooks
  const { tasks, isLoading, saveTask, toggleComplete, deleteTask, updatePomodoro, logTime, toggleSubTask, fetchTasks } = useTasks(user?.uid ?? null);
  const { projects, fetchProjects } = useProjects(user?.uid ?? null);
  const { priorityFilter, setPriorityFilter, tagFilter, setTagFilter, setSearchQuery, uniqueTags, filteredTasks, clearFilters } = useFilters(tasks, activeWorkspace, selectedProjectId);
  const { selectedTaskIds, selectTask, deselectAll } = useTaskSelection();

  // Fetch tasks when user changes
  useEffect(() => {
    fetchTasks();
    fetchProjects();
  }, [fetchTasks, fetchProjects]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onNewTask: () => setEditingTask('new'),
    onOpenSearch: () => setIsSearchOpen(true),
    onShowShortcuts: () => setIsShortcutsOpen(true),
    onClearSelection: () => deselectAll(),
  }, !!editingTask || !!focusTask);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleSetEditingTask = (task: TaskWithSubTasks | 'new' | null) => {
    if (task === 'new') {
      clearFilters();
    }
    setEditingTask(task);
  };

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
            <Button variant="outline" size="icon" onClick={() => setIsAiSelectorOpen(true)}>
              <Sparkles className="h-4 w-4" />
              <span className="sr-only">{t('aiFeatures.title')}</span>
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
                    <AvatarImage src={user?.photoURL || undefined} alt={getAvatarInitial(user?.displayName || getNameFromEmail(user?.email))} />
                    <AvatarFallback>{getAvatarInitial(user?.displayName || getNameFromEmail(user?.email))}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="md:hidden flex items-center justify-between px-2 py-2 gap-2">
                  <LanguageSwitcher />
                  <ThemeToggle />
                </div>
                <DropdownMenuSeparator className="md:hidden" />

                <DropdownMenuItem disabled>
                  <User2 className="mr-2 h-4 w-4" />
                  {user?.displayName || getNameFromEmail(user?.email)}
                </DropdownMenuItem>
                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={() => setIsDashboardOpen(true)}>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  {t('dashboard.title')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    {t('settings.title')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  {t('login.signOut')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <aside className="hidden md:block md:col-span-1">
            <SidebarContent
              priorityFilter={priorityFilter}
              setPriorityFilter={setPriorityFilter}
              tagFilter={tagFilter}
              setTagFilter={setTagFilter}
              uniqueTags={uniqueTags}
              projects={projects}
              setSelectedProjectId={setSelectedProjectId}
            />
            <div className="mt-8 space-y-2">
              <h2 className="text-lg font-semibold mb-4">{t('navigation.views')}</h2>
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href="/calendar">{t('dashboard.calendar')}</Link>
              </Button>
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href="/timeline">{t('dashboard.timeline')}</Link>
              </Button>
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href="/analytics">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  {t('analytics.title')}
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href="/templates">
                  <FileText className="mr-2 h-4 w-4" />
                  {t('templates.title')}
                </Link>
              </Button>
            </div>
          </aside>

          <div className="md:col-span-3">
            {isLoading ? (
              <div className="flex justify-center items-center h-80">
                <div className="text-center">
                  <Orbit className="h-12 w-12 animate-spin text-primary mx-auto" />
                  <p className="mt-4 text-muted-foreground">{t('loading.tasks')}</p>
                </div>
              </div>
            ) : (
              <TaskList
                tasks={filteredTasks}
                setTasks={() => { }}
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
        <Button onClick={() => handleSetEditingTask('new')} className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-30" title={t('header.addTask')}>
          <Plus className="h-6 w-6" />
        </Button>

        {/* Modals and Other Global UI - Lazy Loaded */}
        <Suspense fallback={null}>
          {isSearchOpen && (
            <LazyCommandSearch.LazyComponent
              isOpen={isSearchOpen}
              setIsOpen={setIsSearchOpen}
              setSearchQuery={setSearchQuery}
            />
          )}
        </Suspense>

        <Suspense fallback={null}>
          {isShortcutsOpen && (
            <LazyShortcutsHelp.LazyComponent
              isOpen={isShortcutsOpen}
              setIsOpen={setIsShortcutsOpen}
            />
          )}
        </Suspense>

        <Suspense fallback={null}>
          <LazyBulkActionsToolbar.LazyComponent
            selectedTaskIds={selectedTaskIds}
            setSelectedTaskIds={() => { }}
            setTasks={() => { }}
          />
        </Suspense>

        <Suspense fallback={null}>
          {editingTask && (
            <LazyTaskForm.LazyComponent
              isOpen={!!editingTask}
              onClose={() => setEditingTask(null)}
              onSave={(task: Parameters<typeof saveTask>[0]) => saveTask(task, activeWorkspace)}
              task={editingTask === 'new' ? undefined : tasks.find(t => t.id === (typeof editingTask === 'object' ? editingTask.id : undefined))}
              allTasks={tasks}
              activeWorkspace={activeWorkspace}
              projects={projects}
            />
          )}
        </Suspense>

        <Suspense fallback={null}>
          {focusTask && (
            <LazyFocusView.LazyComponent
              task={focusTask}
              onExit={() => setFocusTask(null)}
              onPomodoroComplete={updatePomodoro}
              onLogTime={logTime}
            />
          )}
        </Suspense>

        <AiFeatureSelector
          isOpen={isAiSelectorOpen}
          onClose={() => setIsAiSelectorOpen(false)}
          onSelectReview={() => setIsReviewOpen(true)}
          onSelectDependency={() => setIsDependencyOpen(true)}
        />

        <Suspense fallback={null}>
          {isReviewOpen && (
            <LazyAiReviewDialog.LazyComponent
              isOpen={isReviewOpen}
              onClose={() => setIsReviewOpen(false)}
              tasks={tasks}
            />
          )}
        </Suspense>

        {isDependencyOpen && (
          <AiDependencyDialog
            isOpen={isDependencyOpen}
            onClose={() => setIsDependencyOpen(false)}
            tasks={tasks}
          />
        )}

        <DashboardSheet
          isOpen={isDashboardOpen}
          onClose={() => setIsDashboardOpen(false)}
          tasks={tasks}
        />
      </main>
    </div>
  );
}
