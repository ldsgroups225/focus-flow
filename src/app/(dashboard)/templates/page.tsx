'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ArrowLeft, FileText, Plus, Edit2, Trash2, Tag, Clock } from 'lucide-react';
import { useI18n } from '@/app/components/i18n-provider';
import { useAuth } from '@/components/providers/auth-provider';
import { TemplateService, type Template } from '@/lib/services/template-service';

export default function TemplatesPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    title: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    tags: '',
    pomodoros: 2,
    workspace: 'personal' as 'personal' | 'work' | 'side-project',
  });

  const loadTemplates = useCallback(() => {
    if (!user?.uid) return;
    const userTemplates = TemplateService.getAll(user.uid);
    setTemplates(userTemplates);
  }, [user]);

  useEffect(() => {
    if (user?.uid) {
      Promise.resolve().then(() => loadTemplates());
    }
  }, [user?.uid, loadTemplates]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;

    const tagsArray = formData.tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    const templateData = {
      name: formData.name,
      description: formData.description,
      title: formData.title,
      priority: formData.priority,
      tags: tagsArray,
      pomodoros: formData.pomodoros,
      workspace: formData.workspace,
      subTasks: [],
      userId: user.uid,
    };

    if (editingTemplate) {
      TemplateService.update(editingTemplate.id, user.uid, templateData);
    } else {
      TemplateService.save(templateData);
    }

    loadTemplates();
    resetForm();
    setIsCreateOpen(false);
    setEditingTemplate(null);
  };

  const handleEdit = (template: Template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      title: template.title,
      priority: template.priority,
      tags: template.tags.join(', '),
      pomodoros: template.pomodoros,
      workspace: template.workspace,
    });
    setIsCreateOpen(true);
  };

  const handleDelete = (template: Template) => {
    if (!user?.uid) return;
    if (confirm(t('templates.list.delete') + ' "' + template.name + '"?')) {
      TemplateService.delete(template.id, user.uid);
      loadTemplates();
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      title: '',
      priority: 'medium',
      tags: '',
      pomodoros: 2,
      workspace: 'personal',
    });
  };

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto max-w-5xl p-4 sm:p-6 md:p-8">
        <header className="flex items-center gap-3 mb-6 md:mb-8">
          <Button variant="ghost" size="icon" asChild className="shrink-0">
            <Link href="/">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">{t('navigation.back')}</span>
            </Link>
          </Button>
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <FileText className="w-6 h-6 md:w-8 md:h-8 text-primary shrink-0" />
            <div className="min-w-0">
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold truncate">
                {t('templates.title')}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t('templates.description')}
              </p>
            </div>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={(open) => {
            setIsCreateOpen(open);
            if (!open) {
              setEditingTemplate(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="mr-2 h-4 w-4" />
                {t('templates.create.save')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>
                    {editingTemplate ? t('templates.create.edit') || 'Edit Template' : t('templates.create.title')}
                  </DialogTitle>
                  <DialogDescription>
                    {t('templates.description')}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      {t('templates.create.name')}
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="col-span-3"
                      placeholder={t('templates.create.namePlaceholder')}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right">
                      {t('templates.create.description')}
                    </Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="col-span-3"
                      placeholder={t('templates.create.descriptionPlaceholder')}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="title" className="text-right">
                      Title
                    </Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="priority" className="text-right">
                      Priority
                    </Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value: 'low' | 'medium' | 'high') =>
                        setFormData({ ...formData, priority: value })
                      }
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">{t('taskForm.low')}</SelectItem>
                        <SelectItem value="medium">{t('taskForm.medium')}</SelectItem>
                        <SelectItem value="high">{t('taskForm.high')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="tags" className="text-right">
                      Tags
                    </Label>
                    <Input
                      id="tags"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      className="col-span-3"
                      placeholder="design, development"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="pomodoros" className="text-right">
                      Pomodoros
                    </Label>
                    <Select
                      value={formData.pomodoros.toString()}
                      onValueChange={(value) => setFormData({ ...formData, pomodoros: parseInt(value) })}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3</SelectItem>
                        <SelectItem value="4">4</SelectItem>
                        <SelectItem value="5">5</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="workspace" className="text-right">
                      Workspace
                    </Label>
                    <Select
                      value={formData.workspace}
                      onValueChange={(value: 'personal' | 'work' | 'side-project') =>
                        setFormData({ ...formData, workspace: value })
                      }
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="personal">{t('workspace.personal')}</SelectItem>
                        <SelectItem value="work">{t('workspace.work')}</SelectItem>
                        <SelectItem value="side-project">{t('workspace.sideProject')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                    {t('taskForm.cancel')}
                  </Button>
                  <Button type="submit">
                    {t('templates.create.save')}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </header>

        <div className="mb-6">
          <Input
            placeholder={t('templates.select.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>

        {filteredTemplates.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <CardTitle className="mb-2">{t('templates.list.title')}</CardTitle>
              <CardDescription className="text-center mb-6 max-w-md">
                {t('templates.list.noTemplates')}
              </CardDescription>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                {t('templates.create.save')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      {template.description && (
                        <CardDescription className="mt-1">
                          {template.description}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Title</p>
                      <p className="text-sm">{template.title}</p>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        <span className="capitalize">{template.priority}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{template.pomodoros}</span>
                      </div>
                    </div>
                    {template.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {template.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleEdit(template)}
                      >
                        <Edit2 className="mr-2 h-3 w-3" />
                        {t('templates.list.edit')}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(template)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
