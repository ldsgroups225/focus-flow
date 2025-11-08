'use client';

import { useMemo, memo } from 'react';
import { ArrowDown, ArrowUp, Minus, Trash2, Edit, Crosshair, BrainCircuit, CheckCircle2, Circle, Link, Clock, GripVertical } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Task, Priority } from '@/lib/types';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';
import { useI18n } from './i18n-provider';

type ExtendedTask = Task & {
  isBlocked?: boolean;
  blockingTasks?: string[];
};

type TaskItemProps = {
  task: ExtendedTask;
  isDragging: boolean;
  isSelected: boolean;
  onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onToggle: (taskId: string) => void;
  onFocus: (task: Task) => void;
  onSelect: (taskId: string) => void;
  onSubTaskToggle: (taskId: string, subTaskIndex: number) => void;
};

const PriorityIcon = ({ priority, t }: { priority: Priority, t: (key: string) => string }) => {
    const priorityName = t(`filters.${priority}`);
    const iconMap = {
      high: <ArrowUp className="h-4 w-4 text-red-500" />,
      medium: <Minus className="h-4 w-4 text-yellow-500" />,
      low: <ArrowDown className="h-4 w-4 text-green-500" />,
    };
    return <span className="mr-2 shrink-0" title={t('taskItem.priority').replace('{priority}', priorityName)}>{iconMap[priority]}</span>;
};

const formatTimeSpent = (seconds: number) => {
    if (seconds < 60) return "0m";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    let result = '';
    if (hours > 0) result += `${hours}h `;
    if (minutes > 0 || hours === 0) result += `${minutes}m`;
    return result.trim();
};

const TaskItem = memo(function TaskItem({ task, isDragging, isSelected, onDragStart, onDragOver, onDragEnd, onEdit, onDelete, onToggle, onFocus, onSelect, onSubTaskToggle }: TaskItemProps) {
    const { t, locale } = useI18n();
    const dateLocale = locale === 'fr' ? fr : enUS;
    
    const { isBlocked, blockingTasks = [] } = task;

    // Calculate due date text directly using useMemo instead of useEffect
    const dueDateText = useMemo(() => {
      if (task.dueDate) {
        return formatDistanceToNow(new Date(task.dueDate), { addSuffix: true, locale: dateLocale });
      }
      return '';
    }, [task.dueDate, dateLocale]);

  const pomodoroProgress = task.pomodoros > 0 ? (task.completedPomodoros / task.pomodoros) * 100 : 0;
  const subTaskProgress = task.subTasks && task.subTasks.length > 0 
    ? (task.subTasks.filter(st => st.completed).length / task.subTasks.length) * 100 
    : 0;

  return (
    <Card 
      data-selected={isSelected}
      className={cn(
        "group transition-all duration-200 hover:shadow-lg hover:border-primary/50 data-[selected=true]:border-primary data-[selected=true]:shadow-md",
        isBlocked ? "bg-card/50 border-dashed" : "",
        isDragging ? 'opacity-30 shadow-2xl scale-105' : 'opacity-100',
        task.completed ? 'bg-card/60' : 'bg-card'
      )}
    >
      <CardContent className="p-4 flex items-start gap-3 sm:gap-4">
        <div className="flex flex-col items-center gap-4 mt-1">
             <Checkbox
              id={`complete-${task.id}`}
              checked={task.completed}
              onCheckedChange={() => onToggle(task.id)}
              aria-label={t(task.completed ? 'taskItem.markIncomplete' : 'taskItem.markComplete').replace('{taskTitle}', task.title)}
              disabled={isBlocked}
            />
        </div>
        <div 
          className={cn("grow space-y-3", isBlocked ? "cursor-not-allowed" : "cursor-pointer")}
          onClick={(e) => {
            // Prevent selection when clicking on links or buttons inside
            if ((e.target as HTMLElement).closest('a, button')) return;
            onSelect(task.id)
          }}
        >
          <span
            className={cn(
              "font-medium transition-colors",
              task.completed ? 'line-through text-muted-foreground' : 'text-foreground'
            )}
          >
            {task.title}
          </span>
          {task.description && (
            <p className={cn("text-sm", isBlocked ? "text-muted-foreground/70" : "text-muted-foreground")}>
              {task.description}
            </p>
          )}
          {task.subTasks && task.subTasks.length > 0 && (
            <div className="space-y-2 pt-2">
                <div className='flex items-center gap-2'>
                    <Progress value={subTaskProgress} className="h-1 w-24" />
                    <span className='text-xs text-muted-foreground'>
                        {task.subTasks.filter(st => st.completed).length}/{task.subTasks.length}
                    </span>
                </div>
              <ul className="text-sm text-muted-foreground space-y-1.5">
                {task.subTasks.map((sub, index) => (
                  <li key={index} className="flex items-center gap-2 group/subtask" onClick={(e) => {
                    e.stopPropagation();
                    if (!task.completed) onSubTaskToggle(task.id, index)
                  }}>
                     <div className={cn("flex items-center gap-2", task.completed ? "cursor-default" : "cursor-pointer")}>
                        {sub.completed ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Circle className="w-4 h-4 group-hover/subtask:text-primary" />}
                        <span className={cn(sub.completed && "line-through")}>{sub.title}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <div className="flex items-center">
              <PriorityIcon priority={task.priority} t={t} />
              <span className="capitalize">{t(`filters.${task.priority}`)}</span>
            </div>
            {dueDateText && (
              <span>{t('taskItem.due')} {dueDateText}</span>
            )}
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
                            <p>{t('taskItem.pomodorosCompleted').replace('{completed}', task.completedPomodoros.toString()).replace('{total}', task.pomodoros.toString())}</p>
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
          {task.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {task.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="font-normal">{tag}</Badge>
              ))}
            </div>
          )}
           {task.pomodoros > 0 && !task.completed && (
             <Progress value={pomodoroProgress} className="h-1 mt-3" />
           )}
        </div>
        <div className="flex flex-col items-center">
            <div 
              draggable={!isBlocked}
              onDragStart={isBlocked ? undefined : onDragStart}
              onDragOver={onDragOver}
              onDragEnd={onDragEnd}
              className={cn("cursor-grab text-muted-foreground/50 transition-opacity", isBlocked ? "cursor-not-allowed" : "hover:text-muted-foreground", isDragging ? 'opacity-30' : 'opacity-100')}
            >
              <GripVertical className="h-5 w-5" />
            </div>
            <div className="grow" />
            <div className="flex flex-col sm:flex-row items-center gap-0 sm:gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 -mr-2 -my-2 sm:m-0">
              <Button variant="ghost" size="icon" onClick={() => onFocus(task)} title={t('taskItem.focusMode')} disabled={isBlocked}>
                <Crosshair className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onEdit(task)} title={t('taskItem.editTask')} disabled={isBlocked}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onDelete(task.id)} className="text-destructive hover:text-destructive" title={t('taskItem.deleteTask')} disabled={isBlocked}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
        </div>
      </CardContent>
    </Card>
  );
});

TaskItem.displayName = 'TaskItem';

export { TaskItem };
