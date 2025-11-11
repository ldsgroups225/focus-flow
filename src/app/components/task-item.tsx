'use client';

import { useMemo, memo } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Minus,
  Trash2,
  Edit,
  Crosshair,
  BrainCircuit,
  CheckCircle2,
  Circle,
  Link,
  Clock,
  GripVertical
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useI18n } from './i18n-provider';
import type { Priority, TaskWithSubTasks, SubTask } from '@/lib/types';

// Types
type ExtendedTask = TaskWithSubTasks & {
  isBlocked?: number;
  blockingTasks?: string[];
};

type TaskItemProps = {
  task: ExtendedTask;
  isDragging: boolean;
  isSelected: boolean;
  onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
  onEdit: (task: TaskWithSubTasks) => void;
  onDelete: (taskId: string) => void;
  onToggle: (taskId: string) => void;
  onFocus: (task: TaskWithSubTasks) => void;
  onSelect: (taskId: string) => void;
  onSubTaskToggle: (subTaskId: string) => void;
};

// Utility Functions
const formatTimeSpent = (seconds: number): string => {
  if (seconds < 60) return '0m';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  return `${minutes}m`;
};

const getIndentClass = (blockLevel?: number): string => {
  if (!blockLevel || blockLevel === 0) return 'ml-0';
  const indents = ['ml-0', 'ml-4', 'ml-8', 'ml-12', 'ml-16', 'ml-20'];
  return indents[Math.min(blockLevel, 5)];
};

// Sub-components
const PriorityIcon = memo(({ priority, t }: { priority: Priority; t: (key: string) => string }) => {
  const priorityName = t(`filters.${priority}`);
  const icons = {
    high: <ArrowUp className="h-4 w-4 text-red-500" />,
    medium: <Minus className="h-4 w-4 text-yellow-500" />,
    low: <ArrowDown className="h-4 w-4 text-green-500" />
  };
  
  return (
    <span className="mr-2 shrink-0" title={t('taskItem.priority').replace('{priority}', priorityName)}>
      {icons[priority]}
    </span>
  );
});

PriorityIcon.displayName = 'PriorityIcon';

const SubTaskItem = memo(({
  subTask,
  level = 0,
  onSubTaskToggle,
  isTaskCompleted
}: {
  subTask: SubTask;
  level?: number;
  onSubTaskToggle: (subTaskId: string) => void;
  isTaskCompleted: boolean;
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isTaskCompleted) {
      onSubTaskToggle(subTask.id);
    }
  };

  return (
    <div style={{ marginLeft: `${level * 20}px` }}>
      <div
        className={cn(
          'flex items-center gap-2 group/subtask',
          isTaskCompleted ? 'cursor-default' : 'cursor-pointer'
        )}
        onClick={handleClick}
      >
        {subTask.completed ? (
          <CheckCircle2 className="w-4 h-4 text-green-500" />
        ) : (
          <Circle className="w-4 h-4 group-hover/subtask:text-primary" />
        )}
        <span className={cn(subTask.completed && 'line-through')}>{subTask.title}</span>
      </div>
    </div>
  );
});

SubTaskItem.displayName = 'SubTaskItem';

const SubTaskList = memo(({
  subTasks,
  onSubTaskToggle,
  isTaskCompleted
}: {
  subTasks: SubTask[];
  onSubTaskToggle: (subTaskId: string) => void;
  isTaskCompleted: boolean;
}) => {
  const completedCount = subTasks.filter(st => st.completed).length;
  const progress = (completedCount / subTasks.length) * 100;

  return (
    <div className="space-y-2 pt-2">
      <div className="flex items-center gap-2">
        <Progress value={progress} className="h-1 w-24" />
        <span className="text-xs text-muted-foreground">
          {completedCount}/{subTasks.length}
        </span>
      </div>
      <ul className="text-sm text-muted-foreground space-y-1.5">
        {subTasks.map(subTask => (
          <SubTaskItem
            key={subTask.id}
            subTask={subTask}
            onSubTaskToggle={onSubTaskToggle}
            isTaskCompleted={isTaskCompleted}
          />
        ))}
      </ul>
    </div>
  );
});

SubTaskList.displayName = 'SubTaskList';

const TaskMetadata = memo(({
  task,
  dueDateText,
  isBlocked,
  blockingTasks,
  t
}: {
  task: ExtendedTask;
  dueDateText: string;
  isBlocked?: number;
  blockingTasks: string[];
  t: (key: string) => string;
}) => (
  <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
    <div className="flex items-center">
      <PriorityIcon priority={task.priority} t={t} />
      <span className="capitalize">{t(`filters.${task.priority}`)}</span>
    </div>

    {dueDateText && <span>{dueDateText}</span>}

    {isBlocked && (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
              <Link className="w-4 h-4" />
              <span>{t('taskItem.blocked')}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('taskItem.blockedBy').replace('{tasks}', blockingTasks.join(', '))}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )}

    {task.pomodoros > 0 && (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1">
              <BrainCircuit className="w-4 h-4 text-primary/80" />
              <span>{task.completedPomodoros}/{task.pomodoros}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {t('taskItem.pomodorosCompleted')
                .replace('{completed}', task.completedPomodoros.toString())
                .replace('{total}', task.pomodoros.toString())}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )}

    {task.timeSpent > 0 && (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-primary/80" />
              <span>{formatTimeSpent(task.timeSpent)}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('taskItem.timeSpent').replace('{time}', formatTimeSpent(task.timeSpent))}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )}
  </div>
));

TaskMetadata.displayName = 'TaskMetadata';

const TaskActions = memo(({
  task,
  isBlocked,
  onFocus,
  onEdit,
  onDelete,
  t
}: {
  task: ExtendedTask;
  isBlocked?: number;
  onFocus: (task: TaskWithSubTasks) => void;
  onEdit: (task: TaskWithSubTasks) => void;
  onDelete: (taskId: string) => void;
  t: (key: string) => string;
}) => (
  <div className="flex flex-col sm:flex-row items-center gap-0 sm:gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 -mr-2 -my-2 sm:m-0">
    <Button
      variant="ghost"
      size="icon"
      onClick={() => onFocus(task)}
      title={t('taskItem.focusMode')}
      disabled={!!isBlocked}
    >
      <Crosshair className="h-4 w-4" />
    </Button>
    <Button
      variant="ghost"
      size="icon"
      onClick={() => onEdit(task)}
      title={t('taskItem.editTask')}
    >
      <Edit className="h-4 w-4" />
    </Button>
    <Button
      variant="ghost"
      size="icon"
      onClick={() => onDelete(task.id)}
      className="text-destructive hover:text-destructive"
      title={t('taskItem.deleteTask')}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  </div>
));

TaskActions.displayName = 'TaskActions';

// Main Component
export const TaskItem = memo(function TaskItem({
  task,
  isDragging,
  isSelected,
  onDragStart,
  onDragOver,
  onDragEnd,
  onEdit,
  onDelete,
  onToggle,
  onFocus,
  onSelect,
  onSubTaskToggle
}: TaskItemProps) {
  const { t, locale } = useI18n();
  const dateLocale = locale === 'fr' ? fr : enUS;

  const { isBlocked, blockingTasks = [] } = task;
  const isTaskBlocked = !!isBlocked && isBlocked > 0;

  const dueDateText = useMemo(() => {
    if (!task.dueDate) return '';
    return formatDistanceToNow(new Date(task.dueDate), {
      addSuffix: true,
      locale: dateLocale
    });
  }, [task.dueDate, dateLocale]);

  const pomodoroProgress = useMemo(() => {
    return task.pomodoros > 0 ? (task.completedPomodoros / task.pomodoros) * 100 : 0;
  }, [task.pomodoros, task.completedPomodoros]);

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('a, button')) return;
    onSelect(task.id);
  };

  return (
    <Card
      data-selected={isSelected}
      className={cn(
        'group transition-all duration-200 hover:shadow-lg hover:border-primary/50',
        'data-[selected=true]:border-primary data-[selected=true]:shadow-[0_0_20px_4px_var(--border)]/80',
        'data-[selected=true]:ring-1 data-[selected=true]:ring-primary/30',
        isBlocked && `${getIndentClass(isBlocked)} bg-card/50 border-dashed`,
        isDragging && 'opacity-30 shadow-2xl scale-105',
        task.completed ? 'bg-card/60' : 'bg-card'
      )}
    >
      <CardContent className="p-4 flex items-start gap-3 sm:gap-4">
        <div className="flex flex-col items-center gap-4 mt-1">
          <Checkbox
            id={`complete-${task.id}`}
            checked={task.completed}
            onCheckedChange={() => onToggle(task.id)}
            aria-label={t(task.completed ? 'taskItem.markIncomplete' : 'taskItem.markComplete')
              .replace('{taskTitle}', task.title)}
            disabled={isTaskBlocked}
          />
        </div>

        <div
          className={cn(
            'grow space-y-3',
            isTaskBlocked ? 'cursor-not-allowed' : 'cursor-pointer'
          )}
          onClick={handleCardClick}
        >
          <span
            className={cn(
              'font-medium transition-colors',
              task.completed ? 'line-through text-muted-foreground' : 'text-foreground'
            )}
          >
            {task.title}
          </span>

          {task.description && (
            <p className={cn('text-sm', isBlocked ? 'text-muted-foreground/70' : 'text-muted-foreground')}>
              {task.description}
            </p>
          )}

          {task.subTasks && task.subTasks.length > 0 && (
            <SubTaskList
              subTasks={task.subTasks}
              onSubTaskToggle={onSubTaskToggle}
              isTaskCompleted={task.completed}
            />
          )}

          <TaskMetadata
            task={task}
            dueDateText={dueDateText}
            isBlocked={isBlocked}
            blockingTasks={blockingTasks}
            t={t}
          />

          {task.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {task.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="font-normal">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {task.pomodoros > 0 && !task.completed && (
            <Progress value={pomodoroProgress} className="h-1 mt-3" />
          )}
        </div>

        <div className="flex flex-col items-center">
          <div
            draggable={!isTaskBlocked}
            onDragStart={isTaskBlocked ? undefined : onDragStart}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
            className={cn(
              'cursor-grab text-muted-foreground/50 transition-opacity',
              isTaskBlocked ? 'cursor-not-allowed' : 'hover:text-muted-foreground',
              isDragging && 'opacity-30'
            )}
          >
            <GripVertical className="h-5 w-5" />
          </div>
          <div className="grow" />
          <TaskActions
            task={task}
            isBlocked={isBlocked}
            onFocus={onFocus}
            onEdit={onEdit}
            onDelete={onDelete}
            t={t}
          />
        </div>
      </CardContent>
    </Card>
  );
});

TaskItem.displayName = 'TaskItem';
