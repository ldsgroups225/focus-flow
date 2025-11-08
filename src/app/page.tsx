
'use client';

import { useState, useMemo, useCallback, useEffect, useRef, useOptimistic, useTransition } from 'react';
import { Plus, SlidersHorizontal, Orbit, Search, Sparkles, User as UserIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { requestEmailOtp, verifyEmailOtp, signOut, getCurrentUser } from '@/lib/appwrite/auth-services';
import { addTask, deleteTask, getTasks, updateTask } from '@/lib/appwrite/task-services';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


function LoginScreen() {
    const { t } = useI18n();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [step, setStep] = useState<'email' | 'code'>('email');
    const [email, setEmail] = useState('');
    const [userId, setUserId] = useState<string | null>(null);
    const [code, setCode] = useState('');
    const [phrase, setPhrase] = useState<string | undefined>(undefined);
    
    useEffect(() => {
        // Check for error in URL params
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const error = params.get('error');
            if (error === 'auth_failed') {
                toast({
                    variant: 'destructive',
                    title: 'Authentication Failed',
                    description: 'Unable to sign in with Google. Please try again.',
                });
                // Clean up URL
                window.history.replaceState({}, '', '/');
            }
        }
    }, [toast]);
    
    const handleLogin = async () => {
        try {
            setIsLoading(true);
            const token = await requestEmailOtp(email, { phrase: true });
            setUserId(token.userId);
            setPhrase(token.phrase);
            setStep('code');
            setCode('');
            setIsLoading(false); // allow entering the code
        } catch (error) {
            console.error('Login error:', error);
            toast({
                variant: 'destructive',
                title: 'Sign In Error',
                description: 'Failed to send code. Verify your email and try again.',
            });
            setIsLoading(false);
        }
    };

    const handleVerify = async () => {
        if (!userId) return;
        try {
            setIsLoading(true);
            await verifyEmailOtp(userId, code);
            // Confirm session is active; if yes, reload to render the app
            const me = await getCurrentUser();
            if (me) {
                window.location.href = '/';
                return;
            }
        } catch (error) {
            console.error('Verify error:', error);
            toast({
                variant: 'destructive',
                title: 'Invalid code',
                description: 'Please check the 6-digit code and try again.',
            });
        } finally {
            // Ensure UI unlocks even if auth provider polling needs more time
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen text-center w-full px-4">
            <Orbit className="w-16 h-16 text-primary mb-6" />
            <h1 className="text-4xl font-bold mb-2">{t('header.title')}</h1>
            <p className="text-lg text-muted-foreground mb-8">Sign in with a one-time code sent to your email.</p>

            {step === 'email' && (
                <div className="w-full max-w-sm space-y-4">
                    <div className="text-left">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} />
                    </div>
                    <Button onClick={handleLogin} size="lg" className="w-full" disabled={isLoading || !email}>
                        {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <UserIcon className="mr-2 h-5 w-5" />}
                        Send code
                    </Button>
                </div>
            )}

            {step === 'code' && (
                <div className="w-full max-w-sm space-y-4">
                    {phrase && (
                        <p className="text-sm text-muted-foreground">Security phrase: <span className="font-medium">{phrase}</span></p>
                    )}
                    <div className="text-left">
                        <Label htmlFor="code">Enter 6-digit code</Label>
                        <Input id="code" inputMode="numeric" pattern="[0-9]*" maxLength={6} placeholder="123456" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0,6))} disabled={isLoading} />
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" className="w-1/3" onClick={() => { setStep('email'); setIsLoading(false); }} disabled={isLoading}>Back</Button>
                        <Button onClick={handleVerify} className="w-2/3" disabled={isLoading || code.length !== 6}>
                            {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <UserIcon className="mr-2 h-5 w-5" />}
                            Verify & Sign in
                        </Button>
                    </div>
                </div>
            )}
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
  const [isPending, startTransition] = useTransition();

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
  const prevUserRef = useRef(user);

  type OptimisticAction =
    | { type: 'add'; task: Task }
    | { type: 'update'; id: string; patch: Partial<Task> }
    | { type: 'delete'; id: string };

  const [optimisticTasks, addOptimistic] = useOptimistic(tasks, (current, action: OptimisticAction) => {
    switch (action.type) {
      case 'add':
        return [action.task, ...current];
      case 'update':
        return current.map(t => (t.id === action.id ? { ...t, ...action.patch } as Task : t));
      case 'delete':
        return current.filter(t => t.id !== action.id);
      default:
        return current;
    }
  });

  useEffect(() => {
    const prevUser = prevUserRef.current;
    prevUserRef.current = user;

    if (user) {
      getTasks(user.uid, (newTasks) => {
        setTasks(newTasks);
        setIsLoading(false);
      });
    } else if (prevUser && !user) {
      // User just logged out - reset via setTimeout to avoid setState in effect
      setTimeout(() => {
        setTasks([]);
        setIsLoading(false);
      }, 0);
    }
  }, [user]);

  const workspaceTasks = useMemo(() => {
    return optimisticTasks.filter(task => task.workspace === activeWorkspace);
  }, [optimisticTasks, activeWorkspace]);

  const uniqueTags = useMemo(() => {
    const allTags = workspaceTasks.flatMap(task => task.tags);
    return [...new Set(allTags)];
  }, [workspaceTasks]);
  
  const tasksWithStatus = useMemo(() => {
    const taskMap = new Map(optimisticTasks.map(t => [t.id, t]));
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
  }, [optimisticTasks, workspaceTasks]);

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
        const original = [...tasks];
        startTransition(async () => {
          addOptimistic({ type: 'update', id: taskToSave.id!, patch: { ...taskToSave, workspace } });
          try {
            await updateTask(user.uid, taskToSave.id!, { ...taskToSave, workspace });
            startTransition(() => {
              setTasks(prev => prev.map(t => (t.id === taskToSave.id ? { ...t, ...taskToSave, workspace } as Task : t)));
            });
          } catch (e) {
            startTransition(() => {
              setTasks(original);
            });
            toast({ variant: 'destructive', title: t('toast.updateError'), description: t('toast.updateErrorDesc') });
          }
        });
    } else {
        const tempId = `temp-${Date.now()}`;
        const tempTask: Task = {
          id: tempId,
          title: taskToSave.title,
          description: taskToSave.description,
          completed: false,
          priority: taskToSave.priority,
          tags: taskToSave.tags ?? [],
          dueDate: taskToSave.dueDate,
          pomodoros: taskToSave.pomodoros,
          completedPomodoros: 0,
          timeSpent: 0,
          dependsOn: taskToSave.dependsOn,
          workspace,
          subTasks: taskToSave.subTasks,
        } as Task;
        startTransition(async () => {
          addOptimistic({ type: 'add', task: tempTask });
          try {
            await addTask(user.uid, { ...taskToSave, workspace });
            // Refresh from server to get the real ID
            getTasks(user.uid, (newTasks) => {
              startTransition(() => setTasks(newTasks));
            });
          } catch (e) {
            startTransition(() => {
              setTasks(prev => prev.filter(t => t.id !== tempId));
            });
            toast({ variant: 'destructive', title: t('toast.createError'), description: t('toast.createErrorDesc') });
          }
        });
    }
    setEditingTask(null);
  }, [user, activeWorkspace, tasks, addOptimistic, toast, t]);

  const handleToggleComplete = useCallback(async (taskId: string) => {
    if (!user) return;
    const task = tasks.find(t => t.id === taskId);
    if(task) {
        const original = [...tasks];
        startTransition(async () => {
          addOptimistic({ type: 'update', id: taskId, patch: { completed: !task.completed, completedDate: !task.completed ? new Date() : undefined } });
          try {
            await updateTask(user.uid, taskId, { completed: !task.completed, completedDate: !task.completed ? new Date() : undefined });
            startTransition(() => {
              setTasks(prev => prev.map(t => (t.id === taskId ? { ...t, completed: !task.completed, completedDate: !task.completed ? new Date() : undefined } as Task : t)));
            });
          } catch (e) {
            startTransition(() => {
              setTasks(original);
            });
            toast({ variant: 'destructive', title: t('toast.updateError'), description: t('toast.updateErrorDesc') });
          }
        });
    }
  }, [user, tasks, addOptimistic, toast, t]);

  const handleDeleteTask = useCallback(async (taskId: string) => {
    if(!user) return;
    
    const taskToDelete = tasks.find(t => t.id === taskId);
    if (!taskToDelete) return;
    
    const originalTasks = [...tasks];

    // Optimistic deletion overlay
    startTransition(() => {
      addOptimistic({ type: 'delete', id: taskId });
      // Also update base state so it sticks on success
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    });

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
            // subTasks: taskToDelete.subTasks, not implemented in db for now
          });
        }}>
          {t('toast.undo')}
        </Button>
      ),
    });

    startTransition(async () => {
      try {
        await deleteTask(user.uid, taskId);
      } catch(e) {
        console.error("Failed to delete task: ", e);
        startTransition(() => {
          setTasks(originalTasks); // Revert on error
        });
        toast({
            variant: "destructive",
            title: t('toast.deleteError'),
            description: t('toast.deleteErrorDesc'),
        });
      }
    });
    
    setSelectedTaskIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(taskId);
      return newSet;
    });
  }, [user, tasks, toast, t, addOptimistic, startTransition]);
  
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
    // TODO: create subtask in db first

    // if (!user) return;
    // const task = tasks.find(t => t.id === taskId);
    //  if (task && task.subTasks) {
    //     const newSubTasks = [...task.subTasks];
    //     newSubTasks[subTaskIndex] = {
    //         ...newSubTasks[subTaskIndex],
    //         completed: !newSubTasks[subTaskIndex].completed
    //     };
    //     await updateTask(user.uid, taskId, { subTasks: newSubTasks });
    // }
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

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
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

    // Guard for SSR
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
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
