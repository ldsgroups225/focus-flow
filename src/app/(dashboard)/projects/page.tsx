'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, FolderPlus, Folder, Briefcase, User, Layers, Trash2, Edit2 } from 'lucide-react';
import { useProjects } from '@/lib/hooks/use-projects';
import { useAuth } from '@/components/providers/auth-provider';
import { useI18n } from '@/app/components/i18n-provider';
import type { Project } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

const projectSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'projects.create.nameRequired'),
  description: z.string().optional(),
  workspace: z.enum(['personal', 'work', 'side-project']),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

export default function ProjectsPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { projects, saveProject, deleteProject, updateProject } = useProjects(user?.uid ?? null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      description: '',
      workspace: 'personal',
    },
  });

  const onSubmit = async (data: ProjectFormValues) => {
    if (!user) return;
    if (editingProject) {
      await updateProject(editingProject.id, data);
      setEditingProject(null);
    } else {
      await saveProject({ ...data, userId: user.uid });
    }
    form.reset({
      name: '',
      description: '',
      workspace: 'personal',
    });
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    form.reset(project);
  };

  const handleCancelEdit = () => {
    setEditingProject(null);
    form.reset({
      name: '',
      description: '',
      workspace: 'personal',
    });
  };

  const getWorkspaceIcon = (workspace: string) => {
    switch (workspace) {
      case 'work': return <Briefcase className="h-4 w-4" />;
      case 'side-project': return <Layers className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto max-w-6xl p-4 sm:p-6 md:p-8">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8"
      >
        <Link
          href="/"
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-6 group"
        >
          <ArrowLeft className="mr-1 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          {t('projects.back')}
        </Link>
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold tracking-tight bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent w-fit">
            {t('projects.title')}
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Manage your projects and organize your tasks efficiently across different workspaces.
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="lg:col-span-5"
        >
          <Card className="border-border/50 shadow-lg bg-card/50 backdrop-blur-sm sticky top-24">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  {editingProject ? <Edit2 className="h-5 w-5" /> : <FolderPlus className="h-5 w-5" />}
                </div>
                <div>
                  <CardTitle>
                    {editingProject ? t('projects.create.editTitle') : t('projects.create.title')}
                  </CardTitle>
                  <CardDescription>
                    {editingProject ? 'Update project details below' : 'Create a new project to start tracking tasks'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('projects.create.name')}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input placeholder={t('projects.create.namePlaceholder')} {...field} className="pl-9 bg-background/50" />
                            <Folder className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="workspace"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('projects.create.workspace')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-background/50">
                              <SelectValue placeholder={t('projects.create.workspacePlaceholder')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="personal">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-primary" />
                                {t('projects.create.personal')}
                              </div>
                            </SelectItem>
                            <SelectItem value="work">
                              <div className="flex items-center gap-2">
                                <Briefcase className="h-4 w-4 text-orange-500" />
                                {t('projects.create.work')}
                              </div>
                            </SelectItem>
                            <SelectItem value="side-project">
                              <div className="flex items-center gap-2">
                                <Layers className="h-4 w-4 text-purple-500" />
                                {t('projects.create.sideProject')}
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('projects.create.description')}</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={t('projects.create.descriptionPlaceholder')}
                            {...field}
                            className="bg-background/50 min-h-[100px] resize-none"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-3 pt-2">
                    <Button type="submit" className="flex-1 shadow-md hover:shadow-lg transition-all">
                      {editingProject ? 'Update Project' : t('projects.create.button')}
                    </Button>
                    {editingProject && (
                      <Button type="button" variant="outline" onClick={handleCancelEdit}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </motion.div>

        {/* List Section */}
        <div className="lg:col-span-7 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Folder className="h-5 w-5 text-primary" />
                {t('projects.list.title')}
                <Badge variant="secondary" className="ml-2 rounded-full px-2.5">
                  {projects.length}
                </Badge>
              </h2>
            </div>

            <div className="space-y-4">
              <AnimatePresence>
                {projects.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12 rounded-xl border border-dashed border-border"
                  >
                    <FolderPlus className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium">No projects yet</h3>
                    <p className="text-muted-foreground">Create your first project to get started.</p>
                  </motion.div>
                ) : (
                  projects.map((project, index) => (
                    <motion.div
                      key={project.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="group hover:border-primary/50 transition-all duration-300 hover:shadow-md bg-card/60 backdrop-blur-xs">
                        <CardContent className="p-5 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg truncate pr-2 group-hover:text-primary transition-colors">
                                {project.name}
                              </h3>
                              <Badge variant="outline" className="flex items-center gap-1.5 text-xs font-normal bg-background/50">
                                {getWorkspaceIcon(project.workspace)}
                                <span className="capitalize">{project.workspace.replace('-', ' ')}</span>
                              </Badge>
                            </div>
                            {project.description && (
                              <p className="text-muted-foreground text-sm line-clamp-2 pr-4">
                                {project.description}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(project)}
                              className="h-9 w-9 text-muted-foreground hover:text-foreground opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity"
                              title={t('projects.list.edit')}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteProject(project.id)}
                              className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity"
                              title={t('projects.list.delete')}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
