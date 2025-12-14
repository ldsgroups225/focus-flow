'use client';

import { useMemo, memo } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Minus,
  Trash2,
  Edit,
  Copy,
  Crosshair,
  BrainCircuit,
  CheckCircle2,
  Circle,
  Link,
  Clock,
  GripVertical
} from 'lucide-react';
import { isToday, isTomorrow, isYesterday, format, isPast, differenceInDays } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useI18n } from './i18n-provider';
import { useToast } from '@/hooks/use-toast';
import type { Priority, TaskWithSubTasks, SubTask } from '@/lib/types';
import { motion } from 'framer-motion';

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

const getIndentClass = (blockLevel?: number): string => {
  if (!blockLevel || blockLevel === 0) return 'ml-0';
  const indents = ['ml-0', 'ml-4', 'ml-8', 'ml-12', 'ml-16', 'ml-20'];
  return indents[Math.min(blockLevel, 5)];
};

// Sub-components
const PriorityIcon = memo(({ priority, t }: { priority: Priority; t: (key: string) => string }) => {
  const priorityName = t(`filters.${priority}`);
  const icons = {
    high: <ArrowUp className="h-3.5 w-3.5 text-red-500" />,
    medium: <Minus className="h-3.5 w-3.5 text-orange-500" />,
    low: <ArrowDown className="h-3.5 w-3.5 text-green-500" />
  };

  return (
    <span className="shrink-0" title={t('taskItem.priority').replace('{priority}', priorityName)}>
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
          'flex items-center gap-2 group/subtask p-1 rounded-sm hover:bg-muted/50 transition-colors',
          isTaskCompleted ? 'cursor-default' : 'cursor-pointer'
        )}
        onClick={handleClick}
      >
        {subTask.completed ? (
          <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
        ) : (
          <Circle className="w-3.5 h-3.5 text-muted-foreground group-hover/subtask:text-primary transition-colors" />
        )}
        <span className={cn("text-xs", subTask.completed && 'line-through text-muted-foreground')}>{subTask.title}</span>
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
    <div className="space-y-1 pt-1.5 border-t border-border/40 mt-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
        <span>Subtasks</span>
        <span>{completedCount}/{subTasks.length}</span>
      </div>
      <Progress value={progress} className="h-1 mb-2 bg-muted/40" />
      <ul className="text-sm text-muted-foreground space-y-0.5">
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
  <div className="flex items-center flex-wrap gap-x-3 gap-y-1.5 text-xs text-muted-foreground mt-1">
    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-muted/30 border border-border/30">
      <PriorityIcon priority={task.priority} t={t} />
      <span className="capitalize font-medium">{t(`filters.${task.priority}`)}</span>
    </div>

    {dueDateText && (
      <div className={cn("flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-border/30", isPast(new Date(task.dueDate || '')) && !task.completed ? "bg-red-500/10 text-red-600 border-red-200" : "bg-muted/30")}>
        <Clock className="w-3 H-3" />
        <span>{dueDateText}</span>
      </div>
    )}

    {isBlocked && isBlocked > 0 && (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400 px-2 py-0.5 rounded-full bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900/50">
              <Link className="w-3 h-3" />
              <span>{t('taskItem.blocked')}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">{t('taskItem.blockedBy').replace('{tasks}', blockingTasks.join(', '))}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )}

    {task.pomodoros > 0 && (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/5 border border-primary/10">
              <BrainCircuit className="w-3 h-3 text-primary" />
              <span className="text-primary/80 font-medium">{task.completedPomodoros}/{task.pomodoros}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">
              {t('taskItem.pomodorosCompleted')
                .replace('{completed}', task.completedPomodoros.toString())
                .replace('{total}', task.pomodoros.toString())}
            </p>
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
}) => {
  const { toast } = useToast();

  const handleCopy = () => {
    const textToCopy = `${task.title}\n${task.description || ''}`.trim();
    navigator.clipboard.writeText(textToCopy).then(() => {
      toast({
        title: t('taskItem.copiedToClipboard'),
        description: t('taskItem.copiedToClipboardDescription'),
        duration: 2000,
      });
    }).catch(() => {
      // Fail silently or maybe show an error toast if needed, but simple return is often enough for UX if permission denied
    });
  };

  return (
    <div className="flex flex-col gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 static">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 shadow-sm hover:shadow-md bg-background/80 backdrop-blur-sm"
              onClick={() => onFocus(task)}
              disabled={!!isBlocked}
            >
              <Crosshair className="h-4 w-4 text-primary" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left"><p className="text-xs">{t('taskItem.focusMode')}</p></TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <div className="flex flex-col gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 hover:bg-muted"
          onClick={() => onEdit(task)}
          title={t('taskItem.editTask')}
        >
          <Edit className="h-4 w-4 text-muted-foreground" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 hover:bg-muted"
          onClick={handleCopy}
          title={t('taskItem.copyTask')}
          aria-label={t('taskItem.copyTask')}
        >
          <Copy className="h-4 w-4 text-muted-foreground" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 hover:bg-destructive/10"
          onClick={() => onDelete(task.id)}
          title={t('taskItem.deleteTask')}
        >
          <Trash2 className="h-4 w-4 text-destructive/80" />
        </Button>
      </div>
    </div>
  );
});

TaskActions.displayName = 'TaskActions';

// Main Component
// Create MotionCard for animation support
const MotionCard = motion.create(Card);

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

    const dueDate = new Date(task.dueDate);
    const isFr = locale === 'fr';

    if (isToday(dueDate)) {
      return isFr ? "Aujourd'hui" : 'Today';
    }

    if (isTomorrow(dueDate)) {
      return isFr ? 'Demain' : 'Tomorrow';
    }

    if (isYesterday(dueDate)) {
      const label = isFr ? 'Hier' : 'Yesterday';
      return `${label}`;
    }

    // For dates in the past (overdue)
    if (isPast(dueDate)) {
      const daysAgo = Math.abs(differenceInDays(dueDate, new Date()));
      if (daysAgo <= 7) {
        return isFr ? `Il y a ${daysAgo}j` : `${daysAgo}d ago`;
      }
      return format(dueDate, isFr ? 'd MMM' : 'MMM d', { locale: dateLocale });
    }

    // For future dates
    const daysUntil = differenceInDays(dueDate, new Date());
    if (daysUntil <= 7) {
      return format(dueDate, 'EEEE', { locale: dateLocale });
    }

    return format(dueDate, isFr ? 'd MMM' : 'MMM d', { locale: dateLocale });
  }, [task.dueDate, dateLocale, locale]);

  const pomodoroProgress = useMemo(() => {
    return task.pomodoros > 0 ? (task.completedPomodoros / task.pomodoros) * 100 : 0;
  }, [task.pomodoros, task.completedPomodoros]);

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('a, button, [role="checkbox"]')) return;
    onSelect(task.id);
  };

  return (
    <MotionCard
      layout
      whileHover={{ scale: 1.005, backgroundColor: "var(--accent-hover)" }}
      whileTap={{ scale: 0.995 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      data-selected={isSelected}
      className={cn(
        'group relative border-border/40 hover:border-primary/30',
        'data-[selected=true]:border-primary data-[selected=true]:shadow-[0_4px_20px_-4px_rgba(var(--primary-rgb),0.3)]',
        'data-[selected=true]:ring-1 data-[selected=true]:ring-primary/20',
        isBlocked && `${getIndentClass(isBlocked)} bg-muted/10 border-dashed border-yellow-200 dark:border-yellow-900/30`,
        isDragging && 'opacity-40 scale-105 rotate-1 shadow-2xl cursor-grabbing',
        task.completed ? 'opacity-70 bg-muted/20 hover:opacity-100' : 'bg-card hover:shadow-lg'
      )}
    >
      {/* Selection/Status Indicator Bar */}
      <motion.div
        layoutId={`indicator-${task.id}`}
        className={cn(
          "absolute left-0 top-0 bottom-0 w-1 rounded-l-lg transition-colors",
          isSelected ? "bg-primary" : "bg-transparent group-hover:bg-primary/30",
          task.priority === 'high' && !task.completed && !isSelected && "bg-red-500/50"
        )}
      />

      <CardContent className="p-3 sm:p-4 flex items-start gap-3 sm:gap-4">
        <div className="flex flex-col items-center gap-4 mt-0.5 pl-1.5">
          <Checkbox
            id={`complete-${task.id}`}
            checked={task.completed}
            onCheckedChange={() => onToggle(task.id)}
            aria-label={t(task.completed ? 'taskItem.markIncomplete' : 'taskItem.markComplete')
              .replace('{taskTitle}', task.title)}
            disabled={isTaskBlocked}
            className="w-5 h-5 rounded-full data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500 transition-all duration-300"
          />
        </div>

        <div
          className={cn(
            'grow space-y-2 min-w-0 pb-1',
            isTaskBlocked ? 'cursor-not-allowed' : 'cursor-pointer'
          )}
          onClick={handleCardClick}
        >
          <div className="flex items-start justify-between gap-4">
            <span
              className={cn(
                'font-medium transition-colors text-base leading-tight',
                task.completed ? 'line-through text-muted-foreground' : 'text-foreground group-hover:text-primary/90'
              )}
            >
              {task.title}
            </span>
          </div>

          {task.description && (
            <p className={cn('text-xs sm:text-sm text-muted-foreground line-clamp-2', isBlocked && 'text-muted-foreground/70')}>
              {task.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <TaskMetadata
              task={task}
              dueDateText={dueDateText}
              isBlocked={isBlocked}
              blockingTasks={blockingTasks}
              t={t}
            />
            {task.tags.length > 0 && task.tags.map(tag => (
              <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0 h-5 font-normal border-primary/20 text-primary/80 bg-primary/5">
                #{tag}
              </Badge>
            ))}
          </div>

          {task.subTasks && task.subTasks.length > 0 && (
            <SubTaskList
              subTasks={task.subTasks}
              onSubTaskToggle={onSubTaskToggle}
              isTaskCompleted={task.completed}
            />
          )}

          {task.pomodoros > 0 && !task.completed && (
            <div className="relative pt-1">
              <Progress value={pomodoroProgress} className="h-1 bg-muted" indicatorClassName="bg-primary/60" />
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          <div
            draggable={!isTaskBlocked}
            onDragStart={isTaskBlocked ? undefined : onDragStart}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
            className={cn(
              'cursor-grab text-muted-foreground/30 transition-colors p-1 rounded hover:bg-muted',
              isTaskBlocked ? 'cursor-not-allowed opacity-50' : 'hover:text-foreground',
              isDragging && 'cursor-grabbing'
            )}
          >
            <GripVertical className="h-4 w-4" />
          </div>
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
    </MotionCard>
  );
});

TaskItem.displayName = 'TaskItem';
