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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { useProjects } from '@/lib/hooks/use-projects';
import { useAuth } from '@/components/providers/auth-provider';
import { useI18n } from '@/app/components/i18n-provider';
import type { Project } from '@/lib/types';

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
    form.reset();
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    form.reset(project);
  };

  return (
    <div className="container mx-auto max-w-5xl p-4 sm:p-6 md:p-8">
      <Link
        href="/"
        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        {t('projects.back')}
      </Link>
      <h1 className="text-2xl font-bold mb-6">{t('projects.title')}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <Card>
            <CardHeader>
              <CardTitle>
                {editingProject ? t('projects.create.editTitle') : t('projects.create.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('projects.create.name')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('projects.create.namePlaceholder')} {...field} />
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
                        <FormLabel>{t('projects.create.description')}</FormLabel>
                        <FormControl>
                          <Textarea placeholder={t('projects.create.descriptionPlaceholder')} {...field} />
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('projects.create.workspacePlaceholder')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="personal">{t('projects.create.personal')}</SelectItem>
                            <SelectItem value="work">{t('projects.create.work')}</SelectItem>
                            <SelectItem value="side-project">{t('projects.create.sideProject')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit">
                    {editingProject ? t('projects.create.saveButton') : t('projects.create.button')}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardHeader>
              <CardTitle>{t('projects.list.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {projects.map((project) => (
                  <li key={project.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{project.name}</p>
                      <p className="text-sm text-muted-foreground">{project.workspace}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(project)}>
                        {t('projects.list.edit')}
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => deleteProject(project.id)}>
                        {t('projects.list.delete')}
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
