
'use client';

import { useState, useMemo, useCallback } from 'react';
import { Plus, SlidersHorizontal, Orbit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TaskList } from './components/task-list';
import { TaskForm } from './components/task-form';
import { Filters } from './components/filters';
import { FocusView } from './components/focus-view';
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


export default function Home() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [editingTask, setEditingTask] = useState<Task | 'new' | null>(null);
  const [focusTask, setFocusTask] = useState<Task | null>(null);

  const [priorityFilter, setPriorityFilter] = useState<Priority[]>([]);
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace>('personal');
  
  const { t } = useI18n();

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
      return priorityMatch && tagMatch;
    });
  }, [tasksWithStatus, priorityFilter, tagFilter]);

  const handleSaveTask = useCallback((taskToSave: Omit<Task, 'id' | 'completed' | 'completedPomodoros' | 'timeSpent'> & { id?: string }) => {
    setTasks(prevTasks => {
      const allTasks = [...prevTasks];
      const dependsOn = taskToSave.dependsOn?.filter(depId => allTasks.some(t => t.id === depId)) || [];
      const workspace = taskToSave.workspace || activeWorkspace;

      if (taskToSave.id) {
        return allTasks.map(task => 
          task.id === taskToSave.id 
            ? { ...task, ...taskToSave, dependsOn, workspace } 
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
        };
        return [newTask, ...allTasks];
      }
    });
    setEditingTask(null);
  }, [activeWorkspace]);

  const handleToggleComplete = useCallback((taskId: string) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  }, []);

  const handleDeleteTask = useCallback((taskId: string) => {
    setTasks(prevTasks => {
        // First, remove the task itself
        const newTasks = prevTasks.filter(task => task.id !== taskId);
        // Then, remove this taskId from any other task's dependsOn array
        return newTasks.map(task => ({
            ...task,
            dependsOn: task.dependsOn?.filter(depId => depId !== taskId)
        }));
    });
  }, []);
  
  const handlePomodoroComplete = useCallback((taskId: string) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId
          ? { ...task, completedPomodoros: task.completedPomodoros + 1 }
          : task
      )
    );
    // Also update focus task if it's the one being worked on
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
     // Also update focus task if it's the one being worked on
     setFocusTask(prevTask => prevTask && prevTask.id === taskId ? { ...prevTask, timeSpent: prevTask.timeSpent + seconds } : prevTask);
  }, []);
  
  const handleSetEditingTask = (task: Task | 'new' | null) => {
    if (task === 'new') {
        // Clear filters when adding a new task to avoid confusion
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
            <LanguageSwitcher />
            <ThemeToggle />
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
             <div className="sticky top-8">
                <h2 className="text-lg font-semibold mb-4">{t('header.filters')}</h2>
                <Filters
                    priorityFilter={priorityFilter}
                    setPriorityFilter={setPriorityFilter}
                    tagFilter={tagFilter}
                    setTagFilter={setTagFilter}
                    uniqueTags={uniqueTags}
                />
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
            />
          </div>
        </div>

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
      </main>
    </div>
  );
}
