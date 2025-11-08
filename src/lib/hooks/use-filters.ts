'use client';

import { useState, useMemo, useCallback } from 'react';
import type { Task, Priority, Workspace } from '@/lib/types';
import { TaskService } from '@/lib/services/task-service';

export function useFilters(tasks: Task[], activeWorkspace: Workspace) {
  const [priorityFilter, setPriorityFilter] = useState<Priority[]>([]);
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Get tasks for the active workspace
  const workspaceTasks = useMemo(() => {
    return TaskService.filterTasksByWorkspace(tasks, activeWorkspace);
  }, [tasks, activeWorkspace]);

  // Get unique tags from workspace tasks
  const uniqueTags = useMemo(() => {
    return TaskService.getUniqueTags(workspaceTasks);
  }, [workspaceTasks]);

  // Add task blocking status
  const tasksWithStatus = useMemo(() => {
    return TaskService.addTaskBlockingStatus(workspaceTasks);
  }, [workspaceTasks]);

  // Apply filters
  const filteredTasks = useMemo(() => {
    return TaskService.filterTasks(tasksWithStatus, {
      priorityFilter,
      tagFilter,
      searchQuery,
    });
  }, [tasksWithStatus, priorityFilter, tagFilter, searchQuery]);

  // Helper functions
  const clearFilters = useCallback(() => {
    setPriorityFilter([]);
    setTagFilter([]);
    setSearchQuery('');
  }, [setPriorityFilter, setTagFilter]);

  const togglePriorityFilter = useCallback((priority: Priority) => {
    setPriorityFilter(prev =>
      prev.includes(priority)
        ? prev.filter(p => p !== priority)
        : [...prev, priority]
    );
  }, [setPriorityFilter]);

  const toggleTagFilter = useCallback((tag: string) => {
    setTagFilter(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  }, [setTagFilter]);

  return {
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
  };
}
