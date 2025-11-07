'use client';

import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Minus, Trash2, Edit, Crosshair } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Task, Priority } from '@/lib/types';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

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

const PriorityIcon = ({ priority }: { priority: Priority }) => {
  const iconMap = {
    high: <ArrowUp className="h-4 w-4 text-red-500" />,
    medium: <Minus className="h-4 w-4 text-yellow-500" />,
    low: <ArrowDown className="h-4 w-4 text-green-500" />,
  };
  return <span className="mr-2">{iconMap[priority]}</span>;
};

export function TaskItem({ task, isDragging, onDragStart, onDragOver, onDragEnd, onEdit, onDelete, onToggle, onFocus }: TaskItemProps) {
  const [dueDateText, setDueDateText] = useState('');

  useEffect(() => {
    if (task.dueDate) {
      setDueDateText(formatDistanceToNow(task.dueDate, { addSuffix: true }));
    } else {
        setDueDateText('');
    }
  }, [task.dueDate]);

  return (
    <Card 
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      className={cn(
        "group cursor-grab transition-shadow duration-200 hover:shadow-lg",
        isDragging ? 'opacity-50 shadow-2xl' : 'opacity-100',
        task.completed ? 'bg-gray-50' : 'bg-card'
      )}
    >
      <CardContent className="p-4 flex items-start gap-4">
        <Checkbox
          id={`task-${task.id}`}
          checked={task.completed}
          onCheckedChange={() => onToggle(task.id)}
          className="mt-1"
          aria-label={`Mark task ${task.title} as ${task.completed ? 'incomplete' : 'complete'}`}
        />
        <div className="flex-grow">
          <label
            htmlFor={`task-${task.id}`}
            className={cn(
              "font-medium transition-colors",
              task.completed ? 'line-through text-muted-foreground' : 'text-foreground'
            )}
          >
            {task.title}
          </label>
          {task.description && (
            <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
          )}
          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
            <PriorityIcon priority={task.priority} />
            {task.dueDate && dueDateText && (
              <span>Due {dueDateText}</span>
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {task.tags.map(tag => (
              <Badge key={tag} variant="secondary" className="font-normal">{tag}</Badge>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" onClick={() => onFocus(task)} title="Focus Mode">
            <Crosshair className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onEdit(task)} title="Edit Task">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(task.id)} className="text-destructive hover:text-destructive" title="Delete Task">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
