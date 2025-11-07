'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Plus, SlidersHorizontal, Orbit, Search, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TaskList } from './components/task-list';
import { TaskForm } from './components/task-form';
import { Filters } from './components/filters';
import { FocusView } from './components/focus-view';
import { AiReviewDialog } from './components/ai-review-dialog';
import type { Task, Priority, Workspace } from '@/lib/types';
import { initialTasks } from '@/lib/initial-tasks';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from './components/theme-toggle';
import { LanguageSwitcher } from './components/language-switcher';
import { WorkspaceSwitcher } from './components/workspace-switcher';
import { useI18n } from './components/i18n-provider';
import { CommandSearch } from './components/command-search';
import { BulkActionsToolbar } from './components/bulk-actions-toolbar';
import { ShortcutsHelp } from './components/shortcuts-help';
import { useToast } from '@/hooks/use-toast';
import { DataManagement } from './components/data-management';


export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [editingTask, setEditingTask] = useState<Task | 'new' | null>(null);
  const [focusTask, setFocusTask] = useState<Task | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  // Filters & Search State
  const [priorityFilter, setPriorityFilter] = useState<Priority[]>([]);
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace>('personal');
  
  // Productivity Features State
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  
  const { t } = useI18n();
  const { toast } = useToast();

  // Load tasks from local storage on initial render
  useEffect(() => {
    try {
      const savedTasks = localStorage.getItem('focus-flow-tasks');
      if (savedTasks) {
        // Parse and revive dates
        const parsedTasks = JSON.parse(savedTasks).map((task: any) => ({
          ...task,
          dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
          completedDate: task.completedDate ? new Date(task.completedDate) : undefined,
        }));
        setTasks(parsedTasks);
      } else {
        setTasks(initialTasks);
      }
    } catch (error) {
      console.error("Failed to load tasks from local storage:", error);
      setTasks(initialTasks);
    }
  }, []);

  // Save tasks to local storage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('focus-flow-tasks', JSON.stringify(tasks));
    } catch (error) {
      console.error("Failed to save tasks to local storage:", error);
    }
  }, [tasks]);

  const workspaceTasks = useMemo(() => {
    return tasks.filter(task => task.workspace === activeWorkspace);
  }, [tasks, activeWorkspace]);

  const uniqueTags = useMemo(() => {
    const allTags = workspaceTasks.flatMap(task => task.tags);
    return [...new Set(allTags)];
  }, [workspaceTasks]);
  
  const tasksWithStatus = useMemo(() => {
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    return workspaceTasks.map(task => {
      const blockingTasks = (task.dependsOn ?? [])
        .map(depId => taskMap.get(depId))
        .filter((dep): dep is Task => !!dep && !dep.completed);
      
      return {
        ...task,
        isBlocked: blockingTasks.length > 0,
        blockingTasks: blockingTasks.map(t => t.title),
      };
    });
  }, [tasks, workspaceTasks]);

  const filteredTasks = useMemo(() => {
    return tasksWithStatus.filter(task => {
      const priorityMatch = priorityFilter.length === 0 || priorityFilter.includes(task.priority);
      const tagMatch = tagFilter.length === 0 || task.tags.some(tag => tagFilter.includes(tag));
      const searchMatch = searchQuery === '' || 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return priorityMatch && tagMatch && searchMatch;
    });
  }, [tasksWithStatus, priorityFilter, tagFilter, searchQuery]);

  const handleSaveTask = useCallback((taskToSave: Omit<Task, 'id' | 'completed' | 'completedPomodoros' | 'timeSpent' | 'completedDate'> & { id?: string }) => {
    setTasks(prevTasks => {
      const allTasks = [...prevTasks];
      const dependsOn = taskToSave.dependsOn?.filter(depId => allTasks.some(t => t.id === depId)) || [];
      const workspace = taskToSave.workspace || activeWorkspace;

      if (taskToSave.id) {
        return allTasks.map(task => 
          task.id === taskToSave.id 
            ? { ...task, ...taskToSave, dependsOn, workspace, subTasks: taskToSave.subTasks || [] } 
            : task
        );
      } else {
        const newTask: Task = {
          ...taskToSave,
          id: Date.now().toString(),
          completed: false,
          completedPomodoros: 0,
          timeSpent: 0,
          dependsOn,
          workspace,
          completedDate: undefined,
          subTasks: taskToSave.subTasks || [],
        };
        return [newTask, ...allTasks];
      }
    });
    setEditingTask(null);
  }, [activeWorkspace]);

  const handleToggleComplete = useCallback((taskId: string) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, completed: !task.completed, completedDate: !task.completed ? new Date() : undefined } : task
      )
    );
  }, []);

  const handleDeleteTask = useCallback((taskId: string) => {
    const taskToDelete = tasks.find(t => t.id === taskId);
    if (!taskToDelete) return;

    const originalTasks = tasks;

    // Temporarily remove the task for UI responsiveness
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));

    toast({
      title: t('toast.taskDeleted'),
      description: taskToDelete.title,
      action: (
        <Button variant="secondary" size="sm" onClick={() => {
          setTasks(originalTasks);
        }}>
          {t('toast.undo')}
        </Button>
      ),
    });
    
    setSelectedTaskIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(taskId);
      return newSet;
    });
  }, [tasks, toast, t]);
  
  const handlePomodoroComplete = useCallback((taskId: string) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId
          ? { ...task, completedPomodoros: task.completedPomodoros + 1 }
          : task
      )
    );
    setFocusTask(prevTask => prevTask && prevTask.id === taskId ? { ...prevTask, completedPomodoros: prevTask.completedPomodoros + 1 } : prevTask);
  }, []);

  const handleLogTime = useCallback((taskId: string, seconds: number) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId
          ? { ...task, timeSpent: task.timeSpent + seconds }
          : task
      )
    );
     setFocusTask(prevTask => prevTask && prevTask.id === taskId ? { ...prevTask, timeSpent: prevTask.timeSpent + seconds } : prevTask);
  }, []);

  const handleSubTaskToggle = useCallback((taskId: string, subTaskIndex: number) => {
    setTasks(prevTasks => prevTasks.map(task => {
        if (task.id === taskId && task.subTasks) {
            const newSubTasks = [...task.subTasks];
            newSubTasks[subTaskIndex] = {
                ...newSubTasks[subTaskIndex],
                completed: !newSubTasks[subTaskIndex].completed
            };
            return { ...task, subTasks: newSubTasks };
        }
        return task;
    }));
  }, []);

  const handleSelectTask = useCallback((taskId: string) => {
    setSelectedTaskIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  }, []);
  
  // Keyboard Shortcuts Effect
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isEditing = !!editingTask || !!focusTask;
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isCtrlOrMeta = isMac ? e.metaKey : e.ctrlKey;

      if (isCtrlOrMeta && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(o => !o);
      }
      if (e.key === '?' && !isEditing) {
        e.preventDefault();
        setIsShortcutsOpen(true);
      }
      if (e.key === 'n' && !isEditing) {
        e.preventDefault();
        setEditingTask('new');
      }
      if (e.key === 'Escape') {
          setSelectedTaskIds(new Set());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingTask, focusTask]);

  const handleSetEditingTask = (task: Task | 'new' | null) => {
    if (task === 'new') {
        setPriorityFilter([]);
        setTagFilter([]);
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
            <LanguageSwitcher />
            <ThemeToggle />
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

            <Button onClick={() => handleSetEditingTask('new')}>
              <Plus className="sm:mr-2 h-4 w-4" />
              <span className='hidden sm:inline'>{t('header.addTask')}</span>
            </Button>
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
                <div>
                  <h2 className="text-lg font-semibold mb-4">{t('data.title')}</h2>
                  <DataManagement tasks={tasks} setTasks={setTasks} />
                </div>
             </div>
          </aside>
          
          <div className="md:col-span-3">
            <TaskList
              tasks={filteredTasks}
              setTasks={setTasks}
              onEdit={handleSetEditingTask}
              onDelete={handleDeleteTask}
              onToggle={handleToggleComplete}
              onFocus={setFocusTask}
              onSubTaskToggle={handleSubTaskToggle}
              selectedTaskIds={selectedTaskIds}
              onSelectTask={handleSelectTask}
            />
          </div>
        </div>

        {/* Floating Action Button for Quick Capture */}
        <Button onClick={() => handleSetEditingTask('new')} className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-30" title={t('header.addTask')}>
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
            onSave={handleSaveTask}
            task={editingTask === 'new' ? undefined : tasks.find(t => t.id === (typeof editingTask === 'object' && editingTask.id))}
            allTasks={tasks}
            activeWorkspace={activeWorkspace}
          />
        )}
        {focusTask && (
          <FocusView
            task={focusTask}
            onExit={() => setFocusTask(null)}
            onPomodoroComplete={handlePomodoroComplete}
            onLogTime={handleLogTime}
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
