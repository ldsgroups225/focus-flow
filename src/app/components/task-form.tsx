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
import { CalendarIcon, BrainCircuit, Link, Sparkles, LoaderCircle, Trash2, FileText, Plus, RotateCcw } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';
import type { Task, Workspace } from '@/lib/types';
import { useI18n } from './i18n-provider';
import { suggestTags, suggestDueDate, breakdownTask } from '@/ai/flows/features-flow';
import { TemplateService } from '@/lib/services/template-service';
import { useAuth } from '@/components/providers/auth-provider';
import { Project } from '@/lib/types';
import { Template } from '@/lib/services/template-service';
import { TaskWithSubTasks } from '@/lib/types';
import { Label } from '@/components/ui/label';

// Simple subtask for form (before saving to DB)
import { motion } from 'framer-motion';
import { containerStagger, slideUp } from '@/lib/animations';

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
    <div style={{ marginLeft: `${level * 20}px` }} className="space-y-3">
      {fields.map((item, index) => (
        <div key={item.id} className="flex items-center gap-2 group">
          <div className="mt-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
          </div>
          <Input
            {...register(`subTasks.${index}.title` as const)}
            className="h-9 text-sm bg-background/50 focus:bg-background transition-colors"
            placeholder={t('taskForm.subTaskTitle')}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => remove(index)}
            className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => append({ title: '', completed: false, order: fields.length })}
        className="w-full border-dashed text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all"
      >
        <Plus className="h-3.5 w-3.5 mr-2" />
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

type TaskFormProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Task, 'completed' | 'completedPomodoros' | 'id' | 'timeSpent' | 'completedDate'> & { id?: string; subTasks?: { title: string; completed?: boolean; order?: number }[] }) => void;
  task?: TaskWithSubTasks;
  allTasks: TaskWithSubTasks[];
  activeWorkspace: Workspace;
  projects: Project[];
  templates: Template[];
};

const TASK_FORM_STORAGE_KEY = 'focusflow-task-form-draft';

export function TaskForm({ isOpen, onClose, onSave, task, allTasks, activeWorkspace, projects, templates }: TaskFormProps) {
  const { t, locale } = useI18n();
  const dateLocale = locale === 'fr' ? fr : enUS;
  const { user } = useAuth();
  const currentTaskSchema = taskSchema(t);
  const [isAiLoading, setIsAiLoading] = useState<Record<string, boolean>>({});
  const [isSaveTemplateOpen, setIsSaveTemplateOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');

  const [dateInputMode, setDateInputMode] = useState<'dueDate' | 'duration'>('dueDate');
  const [dueDateOpen, setDueDateOpen] = useState(false);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);

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

  const potentialDependencies = allTasks.filter(t => t.id !== task?.id && t.workspace === activeWorkspace && !t.completed);

  // Load draft from localStorage for new tasks
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
          projectId: task.projectId || '',
        });
        // Set date input mode based on existing data
        if (task.duration && task.duration > 0 && task.startDate) {
          setDateInputMode('duration');
        }
        setHasDraft(false);
      } else {
        // Try to restore draft from localStorage
        try {
          const savedDraft = localStorage.getItem(TASK_FORM_STORAGE_KEY);
          if (savedDraft) {
            const draft = JSON.parse(savedDraft);
            form.reset({
              ...draft,
              dueDate: draft.dueDate ? new Date(draft.dueDate) : undefined,
              startDate: draft.startDate ? new Date(draft.startDate) : undefined,
              workspace: activeWorkspace,
            });
            if (draft.dateInputMode) {
              setDateInputMode(draft.dateInputMode);
            }
            setHasDraft(true);
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
            setHasDraft(false);
          }
        } catch {
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
          setHasDraft(false);
        }
      }
    }
  }, [task, form, isOpen, activeWorkspace]);

  // Auto-save draft to localStorage for new tasks
  const formValues = form.watch();
  useEffect(() => {
    if (isOpen && !task) {
      const hasContent = formValues.title || formValues.description || formValues.tags ||
        (formValues.subTasks && formValues.subTasks.length > 0);
      if (hasContent) {
        const draft = {
          ...formValues,
          dueDate: formValues.dueDate?.toISOString(),
          startDate: formValues.startDate?.toISOString(),
          dateInputMode,
        };
        localStorage.setItem(TASK_FORM_STORAGE_KEY, JSON.stringify(draft));
        setHasDraft(true);
      }
    }
  }, [formValues, isOpen, task, dateInputMode]);

  // Clear draft from localStorage
  const clearDraft = () => {
    localStorage.removeItem(TASK_FORM_STORAGE_KEY);
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
    setHasDraft(false);
  };

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

  const handleTemplateSelect = (templateId: string) => {
    if (!user?.uid || !templateId) return;
    const template = TemplateService.getById(templateId, user.uid);
    if (template) {
      form.reset({
        ...form.getValues(),
        title: template.title,
        description: template.description || '',
        priority: template.priority,
        tags: template.tags.join(', '),
        pomodoros: template.pomodoros,
        subTasks: template.subTasks || [],
      });
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
    // Clear draft on successful save
    localStorage.removeItem(TASK_FORM_STORAGE_KEY);
    setHasDraft(false);
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
      className={cn("h-7 w-7 text-primary/70 hover:text-primary transition-colors", className)}
      title={t(`taskForm.ai.${feature}`)}
    >
      {isAiLoading[feature] ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent hideCloseButton className="w-[95vw] sm:w-full sm:max-w-[550px] max-h-[80vh] flex flex-col p-0 gap-0 border-border/60 bg-background/95 backdrop-blur-xl shadow-2xl rounded-xl overflow-hidden">
        <motion.div
          variants={containerStagger}
          initial="hidden"
          animate="show"
          className="flex flex-col h-full w-full overflow-hidden"
        >
          <motion.div variants={slideUp} className="shrink-0">
            <DialogHeader className="p-6 pb-2 border-b/0">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-xl font-semibold tracking-tight">
                  {task ? t('taskForm.editTask') : t('taskForm.addTask')}
                </DialogTitle>
                {!task && hasDraft && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={clearDraft}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    title={t('taskForm.clearDraft')}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <DialogDescription>
                {task ? 'Edit the details of your task.' : 'Create a new task to track your progress.'}
              </DialogDescription>
            </DialogHeader>
          </motion.div>

          <motion.div variants={slideUp} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
                <div className="space-y-6 py-4 overflow-y-auto overflow-x-hidden flex-1 px-6 scrollbar-thin">
                  {!task && templates.length > 0 && (
                    <FormItem>
                      <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1.5 block">
                        {t('templates.title')}
                      </FormLabel>
                      <Select onValueChange={handleTemplateSelect}>
                        <FormControl>
                          <SelectTrigger className="bg-muted/50 border-transparent hover:bg-muted/80 transition-colors">
                            <SelectValue placeholder={t('templates.select.title')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {templates.map(template => (
                            <SelectItem key={template.id} value={template.id}>{template.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}

                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="sr-only">{t('taskForm.title')}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t('taskForm.titlePlaceholder')}
                              {...field}
                              className="text-lg font-medium border-0 border-b border-input rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary bg-transparent placeholder:text-muted-foreground/60"
                            />
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
                          <FormLabel className="sr-only">{t('taskForm.description')}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t('taskForm.descriptionPlaceholder')}
                              {...field}
                              className="min-h-[100px] resize-none bg-muted/30 border-transparent hover:bg-muted/50 focus:bg-background transition-colors rounded-lg"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold text-muted-foreground">
                            {t('taskForm.priority')}
                          </FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-background/50 h-9">
                                <SelectValue placeholder={t('taskForm.selectPriority')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">
                                <span className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-green-500" />
                                  {t('taskForm.low')}
                                </span>
                              </SelectItem>
                              <SelectItem value="medium">
                                <span className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-yellow-500" />
                                  {t('taskForm.medium')}
                                </span>
                              </SelectItem>
                              <SelectItem value="high">
                                <span className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-red-500" />
                                  {t('taskForm.high')}
                                </span>
                              </SelectItem>
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
                          <FormLabel className="text-xs font-semibold text-muted-foreground">
                            {t('taskForm.type')}
                          </FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-background/50 h-9">
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
                    <div className="flex justify-center py-1">
                      <ToggleGroup
                        type="single"
                        value={dateInputMode}
                        onValueChange={(value) => value && setDateInputMode(value as 'dueDate' | 'duration')}
                        size="sm"
                        className="bg-muted/30 p-1 rounded-lg"
                      >
                        <ToggleGroupItem value="dueDate" aria-label="Due date mode" className="rounded-md data-[state=on]:bg-background data-[state=on]:shadow-sm">
                          {t('taskForm.dueDateMode')}
                        </ToggleGroupItem>
                        <ToggleGroupItem value="duration" aria-label="Duration mode" className="rounded-md data-[state=on]:bg-background data-[state=on]:shadow-sm">
                          {t('taskForm.durationMode')}
                        </ToggleGroupItem>
                      </ToggleGroup>
                    </div>
                  )}

                  {/* Date Fields */}
                  <div className="bg-muted/20 p-4 rounded-lg space-y-4">
                    {taskType === 'milestone' ? (
                      <FormField
                        control={form.control}
                        name="dueDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel className='flex items-center text-xs font-semibold text-muted-foreground mb-1'>
                              {t('taskForm.dueDate')}
                              <AITriggerButton feature="dueDate" className="w-3.5 h-3.5 ml-2" />
                            </FormLabel>
                            <Popover open={dueDateOpen} onOpenChange={setDueDateOpen}>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-full pl-3 text-left font-normal h-9 bg-background/50",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP", { locale: dateLocale })
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
                                  locale={dateLocale}
                                  selected={field.value}
                                  onSelect={(date) => {
                                    field.onChange(date);
                                    setDueDateOpen(false);
                                  }}
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
                            <FormLabel className='flex items-center text-xs font-semibold text-muted-foreground mb-1'>
                              {t('taskForm.dueDate')}
                              <AITriggerButton feature="dueDate" className="w-3.5 h-3.5 ml-2" />
                            </FormLabel>
                            <Popover open={dueDateOpen} onOpenChange={setDueDateOpen}>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-full pl-3 text-left font-normal h-9 bg-background/50",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP", { locale: dateLocale })
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
                                  locale={dateLocale}
                                  selected={field.value}
                                  onSelect={(date) => {
                                    field.onChange(date);
                                    setDueDateOpen(false);
                                  }}
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
                              <FormLabel className="text-xs font-semibold text-muted-foreground mb-1">{t('taskForm.startDate')}</FormLabel>
                              <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant={"outline"}
                                      className={cn(
                                        "w-full pl-3 text-left font-normal h-9 bg-background/50",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {field.value ? (
                                        format(field.value, "PPP", { locale: dateLocale })
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
                                    locale={dateLocale}
                                    selected={field.value}
                                    onSelect={(date) => {
                                      field.onChange(date);
                                      setStartDateOpen(false);
                                    }}
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
                              <FormLabel className="text-xs font-semibold text-muted-foreground mb-1">{t('taskForm.duration')}</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="0"
                                  placeholder={t('taskForm.durationPlaceholder')}
                                  {...field}
                                  className="h-9 bg-background/50"
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
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="tags"
                      render={({ field }) => (
                        <FormItem className='relative'>
                          <FormLabel className='flex items-center text-xs font-semibold text-muted-foreground mb-1'>{t('taskForm.tags')} <AITriggerButton feature="tags" className="w-3.5 h-3.5 ml-2" /></FormLabel>
                          <FormControl>
                            <Input placeholder={t('taskForm.tagsPlaceholder')} {...field} className="h-9 bg-background/50" />
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
                          <FormLabel className='flex items-center text-xs font-semibold text-muted-foreground mb-1'>{t('taskForm.pomodoros')} <BrainCircuit className="w-3.5 h-3.5 ml-1 text-primary/80" /></FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              {...field}
                              className="h-9 bg-background/50"
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

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="projectId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold text-muted-foreground mb-1">{t('taskForm.project')}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-9 bg-background/50">
                                <SelectValue placeholder={t('taskForm.selectProject')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {projects
                                .filter(p => p.workspace === activeWorkspace)
                                .map((project) => (
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
                          <FormLabel className="flex items-center text-xs font-semibold text-muted-foreground mb-1">{t('taskForm.dependencies')} <Link className="w-3.5 h-3.5 ml-1 text-primary/80" /></FormLabel>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" className="w-full justify-start text-left font-normal h-9 bg-background/50 px-3">
                                {selectedDependencies.length > 0
                                  ? <span className="truncate">{selectedDependencies.length} {t('filters.selected')}</span>
                                  : <span className="text-muted-foreground">{t('taskForm.selectDependencies')}</span>
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
                  </div>

                  <div className="bg-muted/10 p-3 rounded-lg border border-border/50">
                    <div className="flex items-center gap-2 mb-3">
                      <FormLabel className="text-sm font-semibold">{t('taskForm.subTasks')}</FormLabel>
                      <AITriggerButton feature="subTasks" className="h-6 w-6" />
                    </div>
                    <SubTaskInput control={form.control} register={form.register} name="subTasks" />
                  </div>
                </div>

                <DialogFooter className="shrink-0 p-4 border-t bg-muted/20 flex flex-row justify-between items-center">
                  <Button type="button" variant="ghost" onClick={onClose} className="hover:bg-background/80">
                    {t('taskForm.cancel')}
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsSaveTemplateOpen(true)}
                      disabled={!form.getValues('title')}
                      className="hidden sm:flex"
                    >
                      <FileText className="mr-2 h-3.5 w-3.5" />
                      {t('templates.form.saveAsTemplate')}
                    </Button>
                    <Button type="submit" className="px-6 shadow-md shadow-primary/20">{t('taskForm.saveTask')}</Button>
                  </div>
                </DialogFooter>
              </form>
            </Form>
          </motion.div>
        </motion.div>
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
