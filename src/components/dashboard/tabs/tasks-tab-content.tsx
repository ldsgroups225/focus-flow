'use client';

import { useState, Suspense, lazy } from 'react';
import { TaskList } from '@/app/components/task-list';
import { useDashboard } from '@/contexts/dashboard-context';
import { useI18n } from '@/app/components/i18n-provider';
import { Input } from '@/components/ui/input';
import { Search, FolderOpen, Tag, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { TaskWithSubTasks } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { scaleIn, slideUp, spring } from '@/lib/animations';

const LazyTaskForm = lazy(() =>
  import('@/app/components/task-form').then(m => ({ default: m.TaskForm })),
);
const LazyFocusView = lazy(() =>
  import('@/app/components/focus-view').then(m => ({ default: m.FocusView })),
);

export function TasksTabContent() {
  const { t } = useI18n();
  const {
    tasks,
    filteredTasks,
    isLoadingTasks,
    toggleComplete,
    deleteTask,
    toggleSubTask,
    saveTask,
    updatePomodoro,
    logTime,
    activeWorkspace,
    priorityFilter,
    setPriorityFilter,
    tagFilter,
    setTagFilter,
    searchQuery,
    setSearchQuery,
    projects,
    setSelectedProjectId,
    selectedProjectId,
    templates,
    setIsFocusMode,
  } = useDashboard();

  const [editingTask, setEditingTask] = useState<TaskWithSubTasks | 'new' | null>(
    null,
  );
  const [focusTask, setFocusTask] = useState<TaskWithSubTasks | null>(null);

  const handleFocusTask = (task: TaskWithSubTasks | null) => {
    setFocusTask(task);
    setIsFocusMode(!!task);
  };
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(
    new Set(),
  );

  const handleEdit = (task: TaskWithSubTasks | 'new') => {
    setEditingTask(task);
  };

  const handleFocus = (task: TaskWithSubTasks) => {
    handleFocusTask(task);
  };

  const handleSelectTask = (taskId: string) => {
    const newSelected = new Set(selectedTaskIds);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTaskIds(newSelected);
  };

  const activeTasks = filteredTasks.filter(task => !task.completed);
  const completedTasks = filteredTasks.filter(task => task.completed);
  const hasFilters = priorityFilter.length > 0 || tagFilter.length > 0 || !!selectedProjectId || !!searchQuery;

  if (isLoadingTasks) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground font-medium animate-pulse">{t('loading.data')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <motion.div
        variants={slideUp}
        initial="initial"
        animate="animate"
        className="flex gap-3"
      >
        <div className="relative flex-1 group">
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground/60 group-hover:text-primary/70 transition-colors" />
          <Input
            placeholder={t('taskList.searchPlaceholder')}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10 h-11 bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80 transition-all rounded-xl shadow-xs"
          />
        </div>
      </motion.div>

      {/* Active Filters Display */}
      <AnimatePresence>
        {(priorityFilter.length > 0 ||
          tagFilter.length > 0 ||
          selectedProjectId) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={spring}
              className="flex flex-wrap gap-2 overflow-hidden"
            >
              {selectedProjectId && (
                <Badge variant="secondary" className="pl-2 pr-1 h-7 flex items-center gap-1.5 bg-secondary/50 hover:bg-secondary/70 transition-colors border-secondary-foreground/10">
                  <FolderOpen className="h-3 w-3 opacity-60" />
                  <span className="font-medium">{projects.find(p => p.id === selectedProjectId)?.name}</span>
                  <button
                    onClick={() => setSelectedProjectId(undefined)}
                    className="ml-1 h-4 w-4 rounded-full flex items-center justify-center hover:bg-destructive/10 hover:text-destructive transition-colors"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {priorityFilter.map(priority => (
                <Badge key={priority} variant="outline" className="capitalize pl-2 pr-1 h-7 flex items-center gap-1.5 bg-background border-dashed">
                  {priority}
                  <button
                    onClick={() =>
                      setPriorityFilter(priorityFilter.filter(p => p !== priority))
                    }
                    className="ml-1 h-4 w-4 rounded-full flex items-center justify-center hover:bg-muted-foreground/20 transition-colors"
                  >
                    ×
                  </button>
                </Badge>
              ))}
              {tagFilter.map(tag => (
                <Badge key={tag} variant="outline" className="pl-2 pr-1 h-7 flex items-center gap-1.5 bg-background border-dashed">
                  <Tag className="h-3 w-3 opacity-60" />
                  {tag}
                  <button
                    onClick={() => setTagFilter(tagFilter.filter(t => t !== tag))}
                    className="ml-1 h-4 w-4 rounded-full flex items-center justify-center hover:bg-muted-foreground/20 transition-colors"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </motion.div>
          )}
      </AnimatePresence>

      {/* Task List */}
      <div className="min-h-[300px]">
        {filteredTasks.length === 0 ? (
          <motion.div
            variants={scaleIn}
            initial="initial"
            animate="animate"
            transition={spring}
            className="flex flex-col items-center justify-center py-12 px-4 rounded-2xl border-2 border-dashed border-border/50 bg-card/30"
          >
            <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center mb-6 ring-8 ring-primary/5 relative">
              <Sparkles className="h-10 w-10 text-primary opacity-50" />
              {hasFilters && <Search className="h-5 w-5 absolute -bottom-1 -right-1 text-muted-foreground bg-card rounded-full p-0.5" />}
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">
              {hasFilters ? 'No matches found' : 'All caught up!'}
            </h3>
            <p className="text-muted-foreground max-w-xs text-center text-sm">
              {hasFilters
                ? 'Try adjusting your search or filters to find what you are looking for.'
                : 'You have no tasks remaining. Take a break or create a new task to get started.'}
            </p>
          </motion.div>
        ) : (
          <div className="flex flex-col min-h-[calc(100vh-300px)]">
            <div className="space-y-6">
              <TaskList
                tasks={activeTasks}
                setTasks={() => { }}
                onEdit={handleEdit}
                onDelete={deleteTask}
                onToggle={toggleComplete}
                onFocus={handleFocus}
                selectedTaskIds={selectedTaskIds}
                onSelectTask={handleSelectTask}
                onSubTaskToggle={toggleSubTask}
              />
            </div>

            <div className="flex-1" />

            <AnimatePresence>
              {completedTasks.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                >
                  <Accordion type="single" collapsible defaultValue="completed-tasks" className="w-full border rounded-xl bg-card/30 overflow-hidden mt-6">
                    <AccordionItem value="completed-tasks" className="border-none">
                      <AccordionTrigger className="px-4 py-3 hover:bg-accent/50 transition-colors hover:no-underline data-[state=open]:bg-accent/50">
                        <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                          {t('taskList.completed', { count: completedTasks.length })}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4 pt-2">
                        <TaskList
                          tasks={completedTasks}
                          setTasks={() => { }}
                          onEdit={handleEdit}
                          onDelete={deleteTask}
                          onToggle={toggleComplete}
                          onFocus={handleFocus}
                          selectedTaskIds={selectedTaskIds}
                          onSelectTask={handleSelectTask}
                          onSubTaskToggle={toggleSubTask}
                        />
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Task Form Modal */}
      <Suspense fallback={null}>
        {editingTask && (
          <LazyTaskForm
            isOpen={!!editingTask}
            onClose={() => setEditingTask(null)}
            onSave={task => saveTask(task as TaskWithSubTasks, activeWorkspace)}
            task={
              editingTask === 'new'
                ? undefined
                : tasks.find(
                  t =>
                    t.id ===
                    (typeof editingTask === 'object' ? editingTask.id : undefined),
                )
            }
            allTasks={tasks}
            activeWorkspace={activeWorkspace}
            projects={projects}
            templates={templates}
          />
        )}
      </Suspense>

      {/* Focus View Modal */}
      <Suspense fallback={null}>
        {focusTask && (
          <LazyFocusView
            task={focusTask}
            onExit={() => handleFocusTask(null)}
            onPomodoroComplete={updatePomodoro}
            onLogTime={logTime}
          />
        )}
      </Suspense>
    </div>
  );
}
