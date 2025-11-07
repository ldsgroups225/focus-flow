
'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Plus, SlidersHorizontal, Orbit, Search, Sparkles, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TaskList } from './components/task-list';
import { TaskForm } from './components/task-form';
import { Filters } from './components/filters';
import { FocusView } from './components/focus-view';
import { AiReviewDialog } from './components/ai-review-dialog';
import type { Task, Priority, Workspace } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { useAuth } from './components/auth-provider';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { app } from '@/lib/firebase/config';
import { addTask, deleteTask, getTasks, updateTask } from '@/lib/firebase/firebase-services';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


function LoginScreen() {
    const { t } = useI18n();
    const handleLogin = () => {
        const auth = getAuth(app);
        const provider = new GoogleAuthProvider();
        signInWithPopup(auth, provider);
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen text-center">
            <Orbit className="w-16 h-16 text-primary mb-6" />
            <h1 className="text-4xl font-bold mb-2">{t('header.title')}</h1>
            <p className="text-lg text-muted-foreground mb-8">{t('login.tagline')}</p>
            <Button onClick={handleLogin} size="lg">
                <UserIcon className="mr-2 h-5 w-5" />
                {t('login.signInWithGoogle')}
            </Button>
        </div>
    )
}

export default function Home() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      const unsubscribe = getTasks(user.uid, (newTasks) => {
        setTasks(newTasks);
        setIsLoading(false);
      });
      return () => unsubscribe();
    } else {
      setTasks([]);
      setIsLoading(false);
    }
  }, [user]);

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

  const handleSaveTask = useCallback(async (taskToSave: Omit<Task, 'id' | 'completed' | 'completedPomodoros' | 'timeSpent' | 'completedDate'> & { id?: string }) => {
    if (!user) return;
    const workspace = taskToSave.workspace || activeWorkspace;

    if (taskToSave.id) {
        await updateTask(user.uid, taskToSave.id, { ...taskToSave, workspace });
    } else {
        await addTask(user.uid, { ...taskToSave, workspace });
    }
    setEditingTask(null);
  }, [user, activeWorkspace]);

  const handleToggleComplete = useCallback(async (taskId: string) => {
    if (!user) return;
    const task = tasks.find(t => t.id === taskId);
    if(task) {
        await updateTask(user.uid, taskId, { completed: !task.completed, completedDate: !task.completed ? new Date() : undefined });
    }
  }, [user, tasks]);

  const handleDeleteTask = useCallback(async (taskId: string) => {
    if(!user) return;
    
    const taskToDelete = tasks.find(t => t.id === taskId);
    if (!taskToDelete) return;
    
    const originalTasks = [...tasks];

    // Optimistic deletion
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));

    toast({
      title: t('toast.taskDeleted'),
      description: taskToDelete.title,
      action: (
        <Button variant="secondary" size="sm" onClick={async () => {
          setTasks(originalTasks);
          // If user undos, we need to re-add the task.
          // The simplest way is to just call addTask again as we don't have the original doc.
          await addTask(user.uid, {
            title: taskToDelete.title,
            description: taskToDelete.description,
            priority: taskToDelete.priority,
            tags: taskToDelete.tags,
            dueDate: taskToDelete.dueDate,
            pomodoros: taskToDelete.pomodoros,
            dependsOn: taskToDelete.dependsOn,
            workspace: taskToDelete.workspace,
            subTasks: taskToDelete.subTasks,
          });
        }}>
          {t('toast.undo')}
        </Button>
      ),
    });

    try {
        await deleteTask(user.uid, taskId);
    } catch(e) {
        console.error("Failed to delete task: ", e);
        setTasks(originalTasks); // Revert on error
        toast({
            variant: "destructive",
            title: t('toast.deleteError'),
            description: t('toast.deleteErrorDesc'),
        });
    }
    
    setSelectedTaskIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(taskId);
      return newSet;
    });
  }, [user, tasks, toast, t]);
  
  const handlePomodoroComplete = useCallback(async (taskId: string) => {
    if (!user) return;
    const task = tasks.find(t => t.id === taskId);
    if(task) {
      const newCount = task.completedPomodoros + 1;
      await updateTask(user.uid, taskId, { completedPomodoros: newCount });
      setFocusTask(prevTask => prevTask && prevTask.id === taskId ? { ...prevTask, completedPomodoros: newCount } : prevTask);
    }
  }, [user, tasks]);

  const handleLogTime = useCallback(async (taskId: string, seconds: number) => {
    if (!user) return;
    const task = tasks.find(t => t.id === taskId);
     if(task) {
      const newTime = task.timeSpent + seconds;
      await updateTask(user.uid, taskId, { timeSpent: newTime });
      setFocusTask(prevTask => prevTask && prevTask.id === taskId ? { ...prevTask, timeSpent: newTime } : prevTask);
    }
  }, [user, tasks]);

  const handleSubTaskToggle = useCallback(async (taskId: string, subTaskIndex: number) => {
    if (!user) return;
    const task = tasks.find(t => t.id === taskId);
     if (task && task.subTasks) {
        const newSubTasks = [...task.subTasks];
        newSubTasks[subTaskIndex] = {
            ...newSubTasks[subTaskIndex],
            completed: !newSubTasks[subTaskIndex].completed
        };
        await updateTask(user.uid, taskId, { subTasks: newSubTasks });
    }
  }, [user, tasks]);

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

  const handleSignOut = () => {
    const auth = getAuth(app);
    signOut(auth);
  }
  
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
  
  if (!user) {
    return <LoginScreen />;
  }

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

             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
                            <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
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
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
             ) : (
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
             )}
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
