'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CalendarIcon, BrainCircuit, Link } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { Task, Workspace } from '@/lib/types';
import { useI18n } from './i18n-provider';

const taskSchema = (t: (key: string) => string) => z.object({
  id: z.string().optional(),
  title: z.string().min(1, t('taskForm.titleRequired')),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']),
  tags: z.string().optional(),
  dueDate: z.date().optional(),
  pomodoros: z.coerce.number().int().min(0, t('taskForm.pomodorosPositive')).default(1),
  dependsOn: z.array(z.string()).optional(),
  workspace: z.enum(['personal', 'work', 'side-project']),
});

type TaskFormValues = z.infer<ReturnType<typeof taskSchema>>;

type TaskFormProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Task, 'completed'|'completedPomodoros' | 'id' | 'timeSpent' | 'completedDate'> & {id?: string}) => void;
  task?: Task;
  allTasks: Task[];
  activeWorkspace: Workspace;
};

export function TaskForm({ isOpen, onClose, onSave, task, allTasks, activeWorkspace }: TaskFormProps) {
  const { t } = useI18n();
  const currentTaskSchema = taskSchema(t);

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(currentTaskSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'medium',
      tags: '',
      dueDate: undefined,
      pomodoros: 1,
      dependsOn: [],
      workspace: activeWorkspace,
    },
  });
  
  const potentialDependencies = allTasks.filter(t => t.id !== task?.id && t.workspace === activeWorkspace);

  useEffect(() => {
    if (isOpen) {
      if (task) {
        form.reset({
          id: task.id,
          title: task.title,
          description: task.description || '',
          priority: task.priority,
          tags: task.tags.join(', '),
          dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
          pomodoros: task.pomodoros,
          dependsOn: task.dependsOn || [],
          workspace: task.workspace,
        });
      } else {
        form.reset({
          title: '',
          description: '',
          priority: 'medium',
          tags: '',
          dueDate: undefined,
          pomodoros: 1,
          dependsOn: [],
          workspace: activeWorkspace,
        });
      }
    }
  }, [task, form, isOpen, activeWorkspace]);

  const onSubmit = (data: TaskFormValues) => {
    const tagsArray = data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];
    onSave({ ...data, tags: tagsArray });
    onClose();
  };

  const selectedDependencies = form.watch('dependsOn') || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{task ? t('taskForm.editTask') : t('taskForm.addTask')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('taskForm.title')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('taskForm.titlePlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('taskForm.description')}</FormLabel>
                  <FormControl>
                    <Textarea placeholder={t('taskForm.descriptionPlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <div className="grid grid-cols-2 gap-4">
               <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('taskForm.priority')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('taskForm.selectPriority')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">{t('taskForm.low')}</SelectItem>
                        <SelectItem value="medium">{t('taskForm.medium')}</SelectItem>
                        <SelectItem value="high">{t('taskForm.high')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col pt-2">
                    <FormLabel className='mb-[6px]'>{t('taskForm.dueDate')}</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>{t('taskForm.pickDate')}</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date(new Date().setHours(0,0,0,0)) }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
             </div>
             <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('taskForm.tags')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('taskForm.tagsPlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                  control={form.control}
                  name="pomodoros"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='flex items-center'>{t('taskForm.pomodoros')} <BrainCircuit className="w-3 h-3 ml-1 text-primary/80" /></FormLabel>
                      <FormControl>
                        <Input type="number" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
             </div>
             <FormField
                control={form.control}
                name="dependsOn"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="flex items-center">{t('taskForm.dependencies')} <Link className="w-3 h-3 ml-1 text-primary/80" /></FormLabel>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="w-full justify-start text-left font-normal">
                                  {selectedDependencies.length > 0 
                                    ? `${selectedDependencies.length} ${t('filters.selected')}` 
                                    : t('taskForm.selectDependencies')
                                  }
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="start">
                                <DropdownMenuLabel>{t('taskForm.dependencies')}</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {potentialDependencies.length > 0 ? (
                                  potentialDependencies.map(dep => (
                                    <DropdownMenuCheckboxItem
                                      key={dep.id}
                                      checked={field.value?.includes(dep.id)}
                                      onCheckedChange={(checked) => {
                                        const newValue = checked
                                          ? [...(field.value || []), dep.id]
                                          : (field.value || []).filter(id => id !== dep.id);
                                        field.onChange(newValue);
                                      }}
                                    >
                                      {dep.title}
                                    </DropdownMenuCheckboxItem>
                                  ))
                                ) : (
                                  <div className="px-2 py-1.5 text-sm text-muted-foreground">{t('taskForm.noOtherTasks')}</div>
                                )}
                                {selectedDependencies.length > 0 && (
                                    <>
                                        <DropdownMenuSeparator />
                                        <Button variant="ghost" className="w-full h-8 text-sm" onClick={() => field.onChange([])}>{t('taskForm.clear')}</Button>
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </FormItem>
                )}
             />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose}>
                {t('taskForm.cancel')}
              </Button>
              <Button type="submit">{t('taskForm.saveTask')}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
