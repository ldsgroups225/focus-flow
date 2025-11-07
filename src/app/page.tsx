'use client';

import { useState, useMemo, useCallback } from 'react';
import { Plus, SlidersHorizontal, Orbit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TaskList } from './components/task-list';
import { TaskForm } from './components/task-form';
import { Filters } from './components/filters';
import { FocusView } from './components/focus-view';
import type { Task, Priority } from '@/lib/types';
import { initialTasks } from '@/lib/initial-tasks';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from './components/theme-toggle';


export default function Home() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [editingTask, setEditingTask] = useState<Task | 'new' | null>(null);
  const [focusTask, setFocusTask] = useState<Task | null>(null);

  const [priorityFilter, setPriorityFilter] = useState<Priority[]>([]);
  const [tagFilter, setTagFilter] = useState<string[]>([]);

  const uniqueTags = useMemo(() => {
    const allTags = tasks.flatMap(task => task.tags);
    return [...new Set(allTags)];
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const priorityMatch = priorityFilter.length === 0 || priorityFilter.includes(task.priority);
      const tagMatch = tagFilter.length === 0 || task.tags.some(tag => tagFilter.includes(tag));
      return priorityMatch && tagMatch;
    });
  }, [tasks, priorityFilter, tagFilter]);

  const handleSaveTask = useCallback((taskToSave: Omit<Task, 'id' | 'completed' | 'completedPomodoros'> & { id?: string }) => {
    if (taskToSave.id) {
      setTasks(prevTasks => prevTasks.map(task => task.id === taskToSave.id ? { ...task, ...taskToSave } : task));
    } else {
      const newTask: Task = {
        ...taskToSave,
        id: Date.now().toString(),
        completed: false,
        completedPomodoros: 0,
      };
      setTasks(prevTasks => [newTask, ...prevTasks]);
    }
    setEditingTask(null);
  }, []);

  const handleToggleComplete = useCallback((taskId: string) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  }, []);

  const handleDeleteTask = useCallback((taskId: string) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto max-w-5xl p-4 md:p-8">
        <header className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Orbit className="w-8 h-8 text-primary" />
            FocusFlow
          </h1>
          <div className="flex items-center gap-2">
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

            <Button onClick={() => setEditingTask('new')}>
              <Plus className="mr-2 h-4 w-4" />
              Add Task
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <aside className="hidden md:block md:col-span-1">
             <div className="sticky top-8">
                <h2 className="text-lg font-semibold mb-4">Filters</h2>
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
              onEdit={setEditingTask}
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
          />
        )}
        {focusTask && (
          <FocusView
            task={focusTask}
            onExit={() => setFocusTask(null)}
            onPomodoroComplete={handlePomodoroComplete}
          />
        )}
      </main>
    </div>
  );
}
