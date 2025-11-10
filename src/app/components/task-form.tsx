'use client';

import { useEffect, useState } from 'react';
import { useForm, useFieldArray, Control, UseFormRegister, type SubmitHandler, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { CalendarIcon, BrainCircuit, Link, Sparkles, LoaderCircle, Trash2, FileText } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { Task, Workspace } from '@/lib/types';
import { useI18n } from './i18n-provider';
import { suggestTags, suggestDueDate, breakdownTask } from '@/ai/flows/features-flow';
import { TemplateService } from '@/lib/services/template-service';
import { useAuth } from './auth-provider';

// Simple subtask for form (before saving to DB)
const formSubTaskSchema = z.object({
  title: z.string(),
  completed: z.boolean().optional(),
  order: z.number().optional(),
  parentSubTaskId: z.string().optional(),
});

interface SubTaskInputProps {
  control: Control<TaskFormValues>;
  register: UseFormRegister<TaskFormValues>;
  name: string;
  level?: number;
}

const SubTaskInput = ({ control, register, level = 0 }: SubTaskInputProps) => {
  const { t } = useI18n();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'subTasks',
  });

  return (
    <div style={{ marginLeft: `${level * 20}px` }}>
      {fields.map((item, index) => (
        <div key={item.id} className="flex items-center gap-2 mt-2">
          <Input {...register(`subTasks.${index}.title` as const)} className="h-8 text-sm" placeholder={t('taskForm.subTaskTitle')} />
          <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => append({ title: '', completed: false, order: fields.length })}>
        {t('taskForm.addSubTask')}
      </Button>
    </div>
  );
};

const taskSchema = (t: (key: string) => string) => z.object({
  id: z.string().optional(),
  title: z.string().min(1, t('taskForm.titleRequired')),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']),
  type: z.enum(['task', 'milestone', 'subtask']),
  tags: z.string().optional(),
  dueDate: z.date().optional(),
  startDate: z.date().optional(),
  duration: z.number().int().min(0).optional(),
  pomodoros: z.number().int().min(0, t('taskForm.pomodorosPositive')),
  dependsOn: z.array(z.string()).optional(),
  workspace: z.enum(['personal', 'work', 'side-project']),
  subTasks: z.array(formSubTaskSchema).optional(),
  projectId: z.string().optional(),
});

type TaskFormValues = z.infer<ReturnType<typeof taskSchema>>;

import { Project } from '@/lib/types';

import type { TaskWithSubTasks } from '@/lib/types';
import { Label } from '@/components/ui/label';

type TaskFormProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Task, 'completed' | 'completedPomodoros' | 'id' | 'timeSpent' | 'completedDate'> & { id?: string; subTasks?: { title: string; completed?: boolean; order?: number }[] }) => void;
  task?: TaskWithSubTasks;
  allTasks: TaskWithSubTasks[];
  activeWorkspace: Workspace;
  projects: Project[];
};

export function TaskForm({ isOpen, onClose, onSave, task, allTasks, activeWorkspace, projects }: TaskFormProps) {
  const { t } = useI18n();
  const { user } = useAuth();
  const currentTaskSchema = taskSchema(t);
  const [isAiLoading, setIsAiLoading] = useState<Record<string, boolean>>({});
  const [isSaveTemplateOpen, setIsSaveTemplateOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');

  const [dateInputMode, setDateInputMode] = useState<'dueDate' | 'duration'>('dueDate');

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(currentTaskSchema) as Resolver<TaskFormValues>,
    defaultValues: {
      title: '',
      description: '',
      priority: 'medium' as const,
      type: 'task',
      tags: '',
      dueDate: undefined,
      startDate: undefined,
      duration: 0,
      pomodoros: 1,
      dependsOn: [],
      workspace: activeWorkspace,
      subTasks: [],
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
          type: task.type || 'task',
          tags: task.tags.join(', '),
          dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
          startDate: task.startDate ? new Date(task.startDate) : undefined,
          duration: task.duration || 0,
          pomodoros: task.pomodoros,
          dependsOn: task.dependsOn || [],
          workspace: task.workspace,
          subTasks: task.subTasks || [],
        });
        // Set date input mode based on existing data
        if (task.duration && task.duration > 0 && task.startDate) {
          setDateInputMode('duration');
        }
      } else {
        form.reset({
          title: '',
          description: '',
          priority: 'medium',
          type: 'task',
          tags: '',
          dueDate: undefined,
          startDate: undefined,
          duration: 0,
          pomodoros: 1,
          dependsOn: [],
          workspace: activeWorkspace,
          subTasks: [],
        });
        setDateInputMode('dueDate');
      }
    }
  }, [task, form, isOpen, activeWorkspace]);

  const handleAiFeature = async (feature: 'tags' | 'dueDate' | 'subTasks') => {
    const { title, description } = form.getValues();
    if (!title) {
      form.setError('title', { message: t('taskForm.titleRequiredForAi') });
      return;
    }
    setIsAiLoading(prev => ({ ...prev, [feature]: true }));
    try {
      if (feature === 'tags') {
        const tags = await suggestTags({ title, description: description || '' });
        form.setValue('tags', tags.join(', '));
      } else if (feature === 'dueDate') {
        const dateStr = await suggestDueDate({ title, description: description || '' });
        if (dateStr) {
          const [year, month, day] = dateStr.split('-').map(Number);
          if (year && month && day) {
            const suggestedDate = new Date(year, month - 1, day);
            form.setValue('dueDate', suggestedDate);
          }
        }
      } else if (feature === 'subTasks') {
        const subTasks = await breakdownTask({ title, description: description || '' });
        form.setValue('subTasks', subTasks);
      }
    } catch (error) {
      console.error(`AI feature '${feature}' failed:`, error);
    } finally {
      setIsAiLoading(prev => ({ ...prev, [feature]: false }));
    }
  };

  // Watch for changes and auto-calculate duration/dueDate
  const taskType = form.watch('type');
  const startDate = form.watch('startDate');
  const duration = form.watch('duration');
  const dueDate = form.watch('dueDate');
  const hasDependencies = (form.watch('dependsOn') ?? []).length > 0;

  // Auto-switch to duration mode when dependencies are added
  useEffect(() => {
    if (hasDependencies && dateInputMode === 'dueDate' && !task) {
      setDateInputMode('duration');
    }
  }, [hasDependencies, dateInputMode, task]);

  // Calculate dueDate from startDate + duration
  useEffect(() => {
    if (dateInputMode === 'duration' && startDate && duration && duration > 0) {
      const calculated = new Date(startDate);
      calculated.setDate(calculated.getDate() + duration);
      form.setValue('dueDate', calculated, { shouldValidate: false });
    }
  }, [startDate, duration, dateInputMode, form]);

  // Calculate duration from dueDate - startDate
  useEffect(() => {
    if (dateInputMode === 'dueDate' && startDate && dueDate) {
      const days = Math.ceil((dueDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      form.setValue('duration', Math.max(0, days), { shouldValidate: false });
    }
  }, [startDate, dueDate, dateInputMode, form]);

  // Lock duration to 0 for milestones
  useEffect(() => {
    if (taskType === 'milestone') {
      form.setValue('duration', 0, { shouldValidate: false });
    }
  }, [taskType, form]);

  const onSubmit: SubmitHandler<TaskFormValues> = (data) => {
    // Validate milestone duration
    if (data.type === 'milestone' && data.duration && data.duration !== 0) {
      form.setError('duration', { message: t('taskForm.milestoneZeroDuration') });
      return;
    }

    const tagsArray = data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];
    onSave({ ...data, tags: tagsArray });
    onClose();
  };

  const handleSaveTemplate = () => {
    if (!user?.uid) return;

    const data = form.getValues();
    const tagsArray = data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];

    const templateData = {
      name: templateName || data.title,
      description: templateDescription,
      title: data.title,
      priority: data.priority,
      tags: tagsArray,
      pomodoros: data.pomodoros,
      workspace: data.workspace,
      subTasks: data.subTasks || [],
      userId: user.uid,
    };

    TemplateService.save(templateData);
    setIsSaveTemplateOpen(false);
    setTemplateName('');
    setTemplateDescription('');
  };

  const selectedDependencies = form.watch('dependsOn') || [];

  const AITriggerButton = ({ feature, className }: { feature: 'tags' | 'dueDate' | 'subTasks', className?: string }) => (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={() => handleAiFeature(feature)}
      disabled={isAiLoading[feature]}
      className={cn("h-7 w-7 text-primary/70 hover:text-primary", className)}
      title={t(`taskForm.ai.${feature}`)}
    >
      {isAiLoading[feature] ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>{task ? t('taskForm.editTask') : t('taskForm.addTask')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
            <div className="space-y-3 py-3 overflow-y-auto flex-1 scrollbar-hide px-1">
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
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('taskForm.type')}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="task">📋 {t('taskForm.taskType')}</SelectItem>
                          <SelectItem value="milestone">💎 {t('taskForm.milestoneType')}</SelectItem>
                          <SelectItem value="subtask">📝 {t('taskForm.subtaskType')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              </div>
              {taskType !== 'milestone' && (
                <div className="mb-2">
                  <ToggleGroup
                    type="single"
                    value={dateInputMode}
                    onValueChange={(value) => value && setDateInputMode(value as 'dueDate' | 'duration')}
                    size="xs"
                    spacing={0}
                    variant="outline"
                  >
                    <ToggleGroupItem value="dueDate" aria-label="Due date mode">
                      {t('taskForm.dueDateMode')}
                    </ToggleGroupItem>
                    <ToggleGroupItem value="duration" aria-label="Duration mode">
                      {t('taskForm.durationMode')}
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
              )}
              {taskType === 'milestone' ? (
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className='flex items-center'>
                        {t('taskForm.dueDate')}
                        <AITriggerButton feature="dueDate" className="w-3 h-3 ml-4" />
                      </FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
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
                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : dateInputMode === 'dueDate' ? (
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className='flex items-center'>
                        {t('taskForm.dueDate')}
                        <AITriggerButton feature="dueDate" className="w-3 h-3 ml-4" />
                      </FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
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
                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>{t('taskForm.startDate')}</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
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
                              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('taskForm.duration')}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            placeholder={t('taskForm.durationPlaceholder')}
                            {...field}
                            onChange={(e) => {
                              const v = e.target.value;
                              const n = v === '' ? 0 : Number(v);
                              field.onChange(Number.isNaN(n) ? 0 : n);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem className='relative'>
                      <FormLabel className='flex items-center'>{t('taskForm.tags')} <AITriggerButton feature="tags" className="w-3 h-3 ml-4" /></FormLabel>
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
                        <Input
                          type="number"
                          min="0"
                          {...field}
                          onChange={(e) => {
                            const v = e.target.value;
                            const n = v === '' ? 0 : Number(v);
                            field.onChange(Number.isNaN(n) ? 0 : n);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('taskForm.project')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('taskForm.selectProject')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {projects.filter(p => p.workspace === activeWorkspace).map((project) => (
                          <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FormLabel>{t('taskForm.subTasks')}</FormLabel>
                  <AITriggerButton feature="subTasks" className="h-6 w-6" />
                </div>
                <SubTaskInput control={form.control} register={form.register} name="subTasks" />
              </div>
            </div>
            <DialogFooter className="shrink-0 pt-4 border-t mt-4">
              <Button type="button" variant="ghost" onClick={onClose}>
                {t('taskForm.cancel')}
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsSaveTemplateOpen(true)}
                  disabled={!form.getValues('title')}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  {t('templates.form.saveAsTemplate')}
                </Button>
                <Button type="submit">{t('taskForm.saveTask')}</Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>

      <Dialog open={isSaveTemplateOpen} onOpenChange={setIsSaveTemplateOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('templates.create.title')}</DialogTitle>
            <DialogDescription>
              {t('templates.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="template-name" className="text-right">
                {t('templates.create.name')}
              </Label>
              <Input
                id="template-name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="col-span-3"
                placeholder={t('templates.create.namePlaceholder')}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="template-description" className="text-right">
                {t('templates.create.description')}
              </Label>
              <Textarea
                id="template-description"
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                className="col-span-3"
                placeholder={t('templates.create.descriptionPlaceholder')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsSaveTemplateOpen(false)}>
              {t('taskForm.cancel')}
            </Button>
            <Button type="button" onClick={handleSaveTemplate}>
              {t('templates.create.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
