'use client';

import { useState, useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';

export function useTaskSelection() {
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());

  const selectTask = useCallback((taskId: string) => {
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

  const selectAllTasks = useCallback((taskIds: string[]) => {
    setSelectedTaskIds(new Set(taskIds));
  }, []);

  const deselectAll = useCallback(() => {
    setSelectedTaskIds(new Set());
  }, []);

  const replaceSelectedTaskIds = useCallback<Dispatch<SetStateAction<Set<string>>>>((next) => {
    setSelectedTaskIds(prev => {
      const resolved = typeof next === 'function' ? next(prev) : next;
      return resolved instanceof Set ? new Set(resolved) : new Set(resolved);
    });
  }, []);

  const isSelected = useCallback((taskId: string) => {
    return selectedTaskIds.has(taskId);
  }, [selectedTaskIds]);

  const toggleSelection = useCallback((taskId: string) => {
    selectTask(taskId);
  }, [selectTask]);

  const selectedCount = selectedTaskIds.size;

  return {
    selectedTaskIds,
    selectedCount,
    selectTask,
    selectAllTasks,
    deselectAll,
    isSelected,
    toggleSelection,
    setSelectedTaskIds: replaceSelectedTaskIds,
  };
}
