'use client';

import { useState } from 'react';
import { TaskList } from '@/app/components/task-list';
import { useDashboard } from '@/contexts/dashboard-context';
import { useI18n } from '@/app/components/i18n-provider';
import { Input } from '@/components/ui/input';
import { Search, FolderOpen, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function TasksTabContent() {
  const { t } = useI18n();
  const {
    filteredTasks,
    isLoadingTasks,
    toggleComplete,
    deleteTask,
    toggleSubTask,
    priorityFilter,
    setPriorityFilter,
    tagFilter,
    setTagFilter,
    searchQuery,
    setSearchQuery,
    projects,
    setSelectedProjectId,
    selectedProjectId,
  } = useDashboard();

  // const [editingTask, setEditingTask] = useState<TaskWithSubTasks | null>(null);
  // const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  // const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());

  // const handleEdit = (task: TaskWithSubTasks) => {
  //   setEditingTask(task);
  //   setIsTaskFormOpen(true);
  // };

  // const handleTaskFormClose = () => {
  //   setIsTaskFormOpen(false);
  //   setEditingTask(null);
  // };

  const handleSelectTask = (taskId: string) => {
    const newSelected = new Set(selectedTaskIds);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTaskIds(newSelected);
  };

  if (isLoadingTasks) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">{t('loading.data')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('taskList.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        {/* <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <SidebarContent
                priorityFilter={priorityFilter}
                setPriorityFilter={setPriorityFilter}
                tagFilter={tagFilter}
                setTagFilter={setTagFilter}
                uniqueTags={uniqueTags}
                projects={projects}
                setSelectedProjectId={setSelectedProjectId}
              />
            </div>
          </SheetContent>
        </Sheet> */}
      </div>

      {/* Active Filters Display */}
      {(priorityFilter.length > 0 || tagFilter.length > 0 || selectedProjectId) && (
        <div className="flex flex-wrap gap-2">
          {selectedProjectId && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <FolderOpen className="h-3 w-3" />
              {projects.find(p => p.id === selectedProjectId)?.name}
              <button
                onClick={() => setSelectedProjectId(undefined)}
                className="ml-1 hover:text-destructive"
              >
                ×
              </button>
            </Badge>
          )}
          {priorityFilter.map(priority => (
            <Badge key={priority} variant="outline" className="capitalize">
              {priority}
              <button
                onClick={() => setPriorityFilter(priorityFilter.filter(p => p !== priority))}
                className="ml-1 hover:text-destructive"
              >
                ×
              </button>
            </Badge>
          ))}
          {tagFilter.map(tag => (
            <Badge key={tag} variant="outline" className="flex items-center gap-1">
              <Tag className="h-3 w-3" />
              {tag}
              <button
                onClick={() => setTagFilter(tagFilter.filter(t => t !== tag))}
                className="ml-1 hover:text-destructive"
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <Search className="h-6 w-6" />
          </div>
          <p className="text-lg font-medium mb-2">No tasks found</p>
          <p className="text-sm">
            {searchQuery || priorityFilter.length > 0 || tagFilter.length > 0
              ? 'Try adjusting your filters'
              : 'Create your first task to get started'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <TaskList
            tasks={filteredTasks}
            setTasks={() => {}}
            onEdit={() => {}}
            // onEdit={handleEdit}
            onDelete={deleteTask}
            onToggle={toggleComplete}
            onFocus={() => {}}
            selectedTaskIds={selectedTaskIds}
            onSelectTask={handleSelectTask}
            onSubTaskToggle={toggleSubTask}
          />
        </div>
      )}
    </div>
  );
}
