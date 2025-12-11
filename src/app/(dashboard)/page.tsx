'use client';

import { useState, useEffect, Suspense } from 'react';
import { Plus, SlidersHorizontal, Orbit, Search, Sparkles, User2, Settings, BarChart3, List, CalendarIcon, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { TaskWithSubTasks } from '@/lib/types';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTaskSelection } from '@/lib/hooks/use-task-selection';
import { useKeyboardShortcuts } from '@/lib/hooks/use-keyboard-shortcuts';
import { FocusView } from '@/app/components/focus-view';
import { AiReviewDialog } from '@/app/components/ai-review-dialog';
import { CommandSearch } from '@/app/components/command-search';
import { ShortcutsHelp } from '@/app/components/shortcuts-help';
import { BulkActionsToolbar } from '@/app/components/bulk-actions-toolbar';
import { TaskForm } from '@/app/components/task-form';
import { AiFeatureSelector } from '@/app/components/ai-feature-selector';
import { AiDependencyDialog } from '@/app/components/ai-dependency-dialog';
import { QuickEntryModal } from '@/app/components/quick-entry-modal';
import { AiPlanningDialog } from '@/app/components/ai-planning-dialog';

import Link from 'next/link';
import { DashboardSheet } from '@/components/ui/dashboard-sheet';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { SidebarContent } from '@/app/components/sidebar-content';
import { getNameFromEmail } from '@/lib/utils/get-name-from-email';
import { getAvatarInitial } from '@/lib/utils/get-avatar-initial';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardProvider, useDashboard } from '@/contexts/dashboard-context';

// Import tab content components directly (not lazy loaded to avoid context issues)
import { TasksTabContent } from '@/components/dashboard/tabs/tasks-tab-content';
import { CalendarTabContent } from '@/components/dashboard/tabs/calendar-tab-content';
import { TimelineTabContent } from '@/components/dashboard/tabs/timeline-tab-content';
import { AnalyticsTabContent } from '@/components/dashboard/tabs/analytics-tab-content';
import { TemplatesTabContent } from '@/components/dashboard/tabs/templates-tab-content';

import { motion, AnimatePresence } from 'framer-motion';
import { slideUp, bouncySpring } from '@/lib/animations';

function DashboardContent() {
  const { user, signOut } = useAuth();

  const {
    tasks,
    isLoadingTasks,
    saveTask,
    updatePomodoro,
    logTime,
    projects,
    templates,
    priorityFilter,
    setPriorityFilter,
    tagFilter,
    setTagFilter,
    setSearchQuery,
    uniqueTags,
    activeWorkspace,
    setActiveWorkspace,
    setSelectedProjectId,
    isFocusMode,
  } = useDashboard();

  const [editingTask, setEditingTask] = useState<TaskWithSubTasks | 'new' | null>(null);
  const [focusTask, setFocusTask] = useState<TaskWithSubTasks | null>(null);
  const [isAiSelectorOpen, setIsAiSelectorOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isDependencyOpen, setIsDependencyOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isQuickEntryOpen, setIsQuickEntryOpen] = useState(false);
  const [isAiPlanningOpen, setIsAiPlanningOpen] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState("tasks");

  const { t } = useI18n();
  const { selectedTaskIds, deselectAll } = useTaskSelection();

  useKeyboardShortcuts({
    onNewTask: () => setEditingTask('new'),
    onOpenSearch: () => setIsSearchOpen(true),
    onShowShortcuts: () => setIsShortcutsOpen(true),
    onClearSelection: () => deselectAll(),
  }, !!editingTask || !!focusTask || isQuickEntryOpen);

  // Quick Entry keyboard shortcut (Cmd/Ctrl + Shift + T)
  useEffect(() => {
    const handleQuickEntry = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        setIsQuickEntryOpen(true);
      }
    };
    window.addEventListener('keydown', handleQuickEntry);
    return () => window.removeEventListener('keydown', handleQuickEntry);
  }, []);

  const handleSignOut = async () => {
    await signOut();
  };

  const handleSetEditingTask = (task: TaskWithSubTasks | 'new' | null) => {
    setEditingTask(task);
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="sticky top-0 z-40 w-full backdrop-blur-xl bg-background/80 border-b border-border/40 shadow-sm"
      >
        <div className="container mx-auto max-w-5xl px-4 sm:px-6 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="p-1.5 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                <Orbit className="w-6 h-6 text-primary" />
              </div>
              <span className="font-bold text-lg tracking-tight hidden sm:inline-block">FocusFlow</span>
            </Link>
            <div className="h-6 w-px bg-border/50 hidden sm:block" />
            <WorkspaceSwitcher activeWorkspace={activeWorkspace} setActiveWorkspace={setActiveWorkspace} />
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(true)} className="hidden md:flex opacity-70 hover:opacity-100 hover:bg-accent/50 rounded-xl">
              <Search className="size-4.5" />
            </Button>
            <div className="hidden md:flex items-center gap-2">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsAiSelectorOpen(true)}
              className="sm:hidden border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/40 text-primary transition-all rounded-xl"
            >
              <Sparkles className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAiSelectorOpen(true)}
              className="hidden sm:flex items-center gap-2 border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/40 text-primary transition-all rounded-xl"
            >
              <Sparkles className="size-3.5" />
              <span className="font-medium text-xs">{t('aiFeatures.title')}</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setIsMobileSidebarOpen(true)} className="md:hidden">
              <SlidersHorizontal className="size-5" />
              <span className="sr-only">{t('header.filters')}</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-2 ring-transparent hover:ring-border transition-all p-0 overflow-hidden">
                  <Avatar className="h-full w-full">
                    <AvatarImage src={user?.photoURL || undefined} alt={getAvatarInitial(user?.displayName || getNameFromEmail(user?.email))} />
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">{getAvatarInitial(user?.displayName || getNameFromEmail(user?.email))}</AvatarFallback>
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
                  <User2 className="mr-2 size-4" />
                  {user?.displayName || getNameFromEmail(user?.email)}
                </DropdownMenuItem>
                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={() => setIsDashboardOpen(true)}>
                  <BarChart3 className="mr-2 size-4" />
                  {t('dashboard.title')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 size-4" />
                    {t('settings.title')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-950/20">
                  {t('login.signOut')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Tabs Navigation - Inside Header for sticky behavior */}
        <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur-md">
          <Tabs value={activeMobileTab} onValueChange={setActiveMobileTab} className="w-full">
            <TabsList className="w-full h-12 rounded-none bg-transparent p-0 justify-around">
              <TabsTrigger value="tasks" className="flex-1 h-full rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none bg-transparent">
                <div className='flex flex-col items-center gap-0.5'>
                  <List className="size-4" />
                  <span className="text-[10px] uppercase tracking-wide">{t('navigation.tasks')}</span>
                </div>
              </TabsTrigger>
              <TabsTrigger value="calendar" className="flex-1 h-full rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none bg-transparent">
                <div className='flex flex-col items-center gap-0.5'>
                  <CalendarIcon className="size-4" />
                  <span className="text-[10px] uppercase tracking-wide">{t('navigation.calendar')}</span>
                </div>
              </TabsTrigger>
              <TabsTrigger value="timeline" className="flex-1 h-full rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none bg-transparent">
                <div className='flex flex-col items-center gap-0.5'>
                  <Clock className="size-4" />
                  <span className="text-[10px] uppercase tracking-wide">{t('navigation.timeline')}</span>
                </div>
              </TabsTrigger>
              {/* <TabsTrigger value="analytics" className="flex-1 h-full rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none bg-transparent">
                  <div className='flex flex-col items-center gap-0.5'>
                    <BarChart3 className="size-4" />
                    <span className="text-[10px] uppercase tracking-wide">{t('navigation.analytics')}</span>
                  </div>
                </TabsTrigger> */}
            </TabsList>

            {/* Note: TabsContent cannot be inside sticky header if we want it to scroll in body.
                  We need to rethink this structure slightly. The TabsList SHOULD be sticky, but Content should be in Main.
                  However, Radix Tabs expects Content to be inside Tabs.
                  For now lets keep it here but realize content is hidden on mobile unless we move TabsContent out.
                  Ah, the original code had Tabs wrapping everything.
                  We'll use a controlled state for tabs to separate List and Content if needed, but for now let's just use Tabs primitive.
                  Actually, simple fix: Mobile Tabs inside main content, sticky header only contains generic nav if needed.
                  But user usually wants nav bar sticky.

                  Let's revert to: Sticky Header contains basic top bar.
                  TabsList is sticky below it? Or just put content in main.
              */}
          </Tabs>
        </div>
      </motion.header>


      <main className="container mx-auto max-w-5xl p-4 sm:p-6 md:p-8 pt-6">

        {/* Mobile Tabs Content - Controlled by State */}
        <div className="w-full md:hidden">
          {activeMobileTab === 'tasks' && (
            <div className="mt-0 space-y-4">
              <TasksTabContent />
            </div>
          )}
          {activeMobileTab === 'calendar' && (
            <div className="mt-0">
              <CalendarTabContent />
            </div>
          )}
          {activeMobileTab === 'timeline' && (
            <div className="mt-0">
              <TimelineTabContent />
            </div>
          )}
          {activeMobileTab === 'analytics' && (
            <div className="mt-0">
              <AnalyticsTabContent />
            </div>
          )}
          {activeMobileTab === 'templates' && (
            <div className="mt-0">
              <TemplatesTabContent />
            </div>
          )}
        </div>

        {/* Desktop Layout with Sidebar */}
        <div className="hidden md:grid grid-cols-1 md:grid-cols-4 gap-8">
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="md:col-span-1"
          >
            <SidebarContent
              priorityFilter={priorityFilter}
              setPriorityFilter={setPriorityFilter}
              tagFilter={tagFilter}
              setTagFilter={setTagFilter}
              uniqueTags={uniqueTags}
              projects={projects}
              setProjectFilter={setSelectedProjectId}
              className="top-24" // Sticky top offset
            />
            <div className="mt-8 space-y-2 sticky top-[calc(24px+300px)]">
              {/* This second sticky block depends on height of sidebar content, simplified for now */}
            </div>
          </motion.aside>

          <motion.div
            variants={slideUp}
            initial="hidden"
            animate="show"
            className="md:col-span-3 min-h-[500px]"
          >
            {isLoadingTasks ? (
              <div className="flex justify-center items-center h-80">
                <div className="text-center">
                  <Orbit className="h-12 w-12 animate-spin text-primary mx-auto" />
                  <p className="mt-4 text-muted-foreground font-medium animate-pulse">{t('loading.tasks')}</p>
                </div>
              </div>
            ) : (
              <TasksTabContent />
            )}
          </motion.div>
        </div>

        {/* Floating Action Button for Quick Capture - Enhanced */}
        {!isFocusMode && (
          <motion.div
            initial={{ scale: 0, rotate: 90 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ ...bouncySpring, delay: 0.5 }}
            className="fixed bottom-8 right-8 z-50"
          >
            <Button
              onClick={() => handleSetEditingTask('new')}
              className="h-16 w-16 rounded-full shadow-2xl shadow-primary/30 hover:shadow-primary/50 transition-all duration-300 bg-primary hover:bg-primary/90"
              title={t('header.addTask')}
            >
              <Plus className="h-8 w-8" />
            </Button>
          </motion.div>
        )}

        {/* Modals and Other Global UI */}
        <Suspense fallback={null}>
          <AnimatePresence>
            {isSearchOpen && (
              <CommandSearch
                isOpen={isSearchOpen}
                setIsOpen={setIsSearchOpen}
                setSearchQuery={setSearchQuery}
              />
            )}
          </AnimatePresence>
        </Suspense>

        <Suspense fallback={null}>
          {isShortcutsOpen && (
            <ShortcutsHelp
              isOpen={isShortcutsOpen}
              setIsOpen={setIsShortcutsOpen}
            />
          )}
        </Suspense>

        <Suspense fallback={null}>
          <BulkActionsToolbar
            selectedTaskIds={selectedTaskIds}
            setSelectedTaskIds={deselectAll}
            setTasks={() => { }}
          />
        </Suspense>

        <Suspense fallback={null}>
          {editingTask && (
            <TaskForm
              isOpen={!!editingTask}
              onClose={() => setEditingTask(null)}
              onSave={(task) => saveTask(task as TaskWithSubTasks, activeWorkspace)}
              task={editingTask === 'new' ? undefined : tasks.find((t: TaskWithSubTasks) => t.id === (typeof editingTask === 'object' ? editingTask.id : undefined))}
              allTasks={tasks}
              activeWorkspace={activeWorkspace}
              projects={projects}
              templates={templates}
            />
          )}
        </Suspense>

        <Suspense fallback={null}>
          {focusTask && (
            <FocusView
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
          onSelectPlanning={() => setIsAiPlanningOpen(true)}
        />

        <Suspense fallback={null}>
          {isReviewOpen && (
            <AiReviewDialog
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

        {/* Quick Entry Modal */}
        <QuickEntryModal
          isOpen={isQuickEntryOpen}
          onClose={() => setIsQuickEntryOpen(false)}
          onSave={(task) => saveTask(task as TaskWithSubTasks, activeWorkspace)}
          activeWorkspace={activeWorkspace}
        />

        {/* AI Planning Dialog */}
        <AiPlanningDialog
          isOpen={isAiPlanningOpen}
          onClose={() => setIsAiPlanningOpen(false)}
          tasks={tasks}
          onApplyPriority={async (taskId, priority) => {
            const task = tasks.find(t => t.id === taskId);
            if (task) {
              await saveTask({ ...task, priority }, activeWorkspace);
            }
          }}
        />

        {/* Mobile Sidebar Sheet */}
        <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
          <SheetContent side="left" className="w-[300px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{t('dashboard.title')}</SheetTitle>
            </SheetHeader>
            <div className="px-4 pb-4 mt-6">
              <SidebarContent
                priorityFilter={priorityFilter}
                setPriorityFilter={setPriorityFilter}
                tagFilter={tagFilter}
                setTagFilter={setTagFilter}
                uniqueTags={uniqueTags}
                projects={projects}
                setProjectFilter={(id) => {
                  setSelectedProjectId(id);
                  setIsMobileSidebarOpen(false);
                }}
              />
              <Button variant="outline" size="sm" className="mt-8 w-full" asChild onClick={() => setIsMobileSidebarOpen(false)}>
                <Link href="/analytics">
                  <BarChart3 className="mr-2 size-4" />
                  {t('analytics.title')}
                </Link>
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <DashboardProvider>
      <DashboardContent />
    </DashboardProvider>
  );
}
