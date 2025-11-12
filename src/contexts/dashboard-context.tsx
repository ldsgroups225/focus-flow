'use client';

import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import type { Task, TaskWithSubTasks, Priority, Workspace, Project } from '@/lib/types';
import { useTasks } from '@/lib/hooks/use-tasks';
import { useFilters } from '@/lib/hooks/use-filters';
import { useProjects } from '@/lib/hooks/use-projects';
import { useAuth } from '@/components/providers/auth-provider';
import { User } from '@/lib/appwrite/auth-services';

type DashboardContextType = {
  // Tasks data
  tasks: TaskWithSubTasks[];
  isLoadingTasks: boolean;
  isPending: boolean;
  saveTask: (task: TaskWithSubTasks, activeWorkspace: Workspace) => Promise<void>;
  toggleComplete: (taskId: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  updatePomodoro: (taskId: string) => Promise<void>;
  logTime: (taskId: string, seconds: number) => Promise<void>;
  toggleSubTask: (subTaskId: string) => Promise<void>;
  fetchTasks: () => void;

  // Filter state
  priorityFilter: Priority[];
  setPriorityFilter: (priorities: Priority[]) => void;
  tagFilter: string[];
  setTagFilter: (tags: string[]) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  uniqueTags: string[];
  filteredTasks: Task[];
  clearFilters: () => void;
  togglePriorityFilter: (priority: Priority) => void;
  toggleTagFilter: (tag: string) => void;

  // Projects
  projects: Project[];
  isLoadingProjects: boolean;
  saveProject: (projectData: Omit<Project, 'id'>) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  updateProject: (projectId: string, projectData: Partial<Project>) => Promise<void>;
  fetchProjects: () => void;

  // UI State
  activeWorkspace: Workspace;
  setActiveWorkspace: (workspace: Workspace) => void;
  selectedProjectId: string | undefined;
  setSelectedProjectId: (projectId: string | undefined) => void;

  // User
  user: User | null;
};

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  // Workspace state
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace>('personal');
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(undefined);

  // Tasks
  const {
    tasks,
    isLoading: isLoadingTasks,
    isPending,
    saveTask,
    toggleComplete,
    deleteTask,
    updatePomodoro,
    logTime,
    toggleSubTask,
    fetchTasks,
  } = useTasks(user?.uid ?? null);

  // Filters
  const {
    priorityFilter,
    setPriorityFilter,
    tagFilter,
    setTagFilter,
    searchQuery,
    setSearchQuery,
    uniqueTags,
    filteredTasks,
    clearFilters,
    togglePriorityFilter,
    toggleTagFilter,
  } = useFilters(tasks, activeWorkspace, selectedProjectId);

  // Projects
  const {
    projects,
    isLoading: isLoadingProjects,
    saveProject,
    deleteProject,
    updateProject,
    fetchProjects,
  } = useProjects(user?.uid ?? null);

  // Fetch data when user changes
  useEffect(() => {
    if (user?.uid) {
      fetchTasks();
      fetchProjects();
    }
  }, [user?.uid, fetchTasks, fetchProjects]);

  const value: DashboardContextType = {
    // Tasks
    tasks,
    isLoadingTasks,
    isPending,
    saveTask,
    toggleComplete,
    deleteTask,
    updatePomodoro,
    logTime,
    toggleSubTask,
    fetchTasks,

    // Filters
    priorityFilter,
    setPriorityFilter,
    tagFilter,
    setTagFilter,
    searchQuery,
    setSearchQuery,
    uniqueTags,
    filteredTasks,
    clearFilters,
    togglePriorityFilter,
    toggleTagFilter,

    // Projects
    projects,
    isLoadingProjects,
    saveProject,
    deleteProject,
    updateProject,
    fetchProjects,

    // UI State
    activeWorkspace,
    setActiveWorkspace,
    selectedProjectId,
    setSelectedProjectId,

    // User
    user,
  };

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}
