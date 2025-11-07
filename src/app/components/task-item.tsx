'use client';

import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Minus, Trash2, Edit, Crosshair, BrainCircuit } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from "@/components/ui/progress";
import type { Task, Priority } from '@/lib/types';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';
import { useI18n } from './i18n-provider';

type TaskItemProps = {
  task: Task;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onToggle: (taskId: string) => void;
  onFocus: (task: Task) => void;
};

const PriorityIcon = ({ priority, t }: { priority: Priority, t: (key: string) => string }) => {
    const priorityName = t(`filters.${priority}`);
    const iconMap = {
      high: <ArrowUp className="h-4 w-4 text-red-500" />,
      medium: <Minus className="h-4 w-4 text-yellow-500" />,
      low: <ArrowDown className="h-4 w-4 text-green-500" />,
    };
    return <span className="mr-2 flex-shrink-0" title={t('taskItem.priority').replace('{priority}', priorityName)}>{iconMap[priority]}</span>;
};

export function TaskItem({ task, isDragging, onDragStart, onDragOver, onDragEnd, onEdit, onDelete, onToggle, onFocus }: TaskItemProps) {
    const { t, locale } = useI18n();
    const [dueDateText, setDueDateText] = useState('');
    const dateLocale = locale === 'fr' ? fr : enUS;

    useEffect(() => {
      if (task.dueDate) {
        setDueDateText(formatDistanceToNow(new Date(task.dueDate), { addSuffix: true, locale: dateLocale }));
      } else {
          setDueDateText('');
      }
    }, [task.dueDate, locale, dateLocale]);

  const pomodoroProgress = task.pomodoros > 0 ? (task.completedPomodoros / task.pomodoros) * 100 : 0;

  return (
    <Card 
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      className={cn(
        "group cursor-grab transition-all duration-200 hover:shadow-lg hover:border-primary/50",
        isDragging ? 'opacity-30 shadow-2xl scale-105' : 'opacity-100',
        task.completed ? 'bg-card/60 border-dashed' : 'bg-card'
      )}
    >
      <CardContent className="p-4 flex items-start gap-4">
        <Checkbox
          id={`task-${task.id}`}
          checked={task.completed}
          onCheckedChange={() => onToggle(task.id)}
          className="mt-1"
          aria-label={t(task.completed ? 'taskItem.markIncomplete' : 'taskItem.markComplete').replace('{taskTitle}', task.title)}
        />
        <div className="flex-grow space-y-3">
          <label
            htmlFor={`task-${task.id}`}
            className={cn(
              "font-medium transition-colors cursor-pointer",
              task.completed ? 'line-through text-muted-foreground' : 'text-foreground'
            )}
          >
            {task.title}
          </label>
          {task.description && (
            <p className="text-sm text-muted-foreground">{task.description}</p>
          )}
          <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <div className="flex items-center">
              <PriorityIcon priority={task.priority} t={t} />
              <span className="capitalize">{t(`filters.${task.priority}`)}</span>
            </div>
            {dueDateText && (
              <span>{t('taskItem.due')} {dueDateText}</span>
            )}
             {task.pomodoros > 0 && (
                <div className="flex items-center gap-1" title={t('taskItem.pomodorosCompleted').replace('{completed}', task.completedPomodoros.toString()).replace('{total}', task.pomodoros.toString())}>
                    <BrainCircuit className="w-4 h-4 text-primary/80" />
                    <span>{task.completedPomodoros}/{task.pomodoros}</span>
                </div>
            )}
          </div>
          {task.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {task.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="font-normal">{tag}</Badge>
              ))}
            </div>
          )}
           {task.pomodoros > 0 && !task.completed && (
             <Progress value={pomodoroProgress} className="h-1 mt-3" />
           )}
        </div>
        <div className="flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -mr-2 -my-2">
          <Button variant="ghost" size="icon" onClick={() => onFocus(task)} title={t('taskItem.focusMode')}>
            <Crosshair className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onEdit(task)} title={t('taskItem.editTask')}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(task.id)} className="text-destructive hover:text-destructive" title={t('taskItem.deleteTask')}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
