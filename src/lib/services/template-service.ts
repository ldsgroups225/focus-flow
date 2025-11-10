import { z } from 'zod';
import type { Priority, Workspace } from '@/lib/types';

export const templateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  title: z.string(),
  priority: z.enum(['low', 'medium', 'high']),
  tags: z.array(z.string()),
  pomodoros: z.number(),
  workspace: z.enum(['personal', 'work', 'side-project']),
  subTasks: z.array(
    z.object({
      title: z.string(),
      completed: z.boolean().optional(),
    })
  ).optional(),
  userId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Template = z.infer<typeof templateSchema>;

const STORAGE_KEY = 'focusflow-templates';

export class TemplateService {
  static getAll(userId: string): Template[] {
    if (typeof window === 'undefined') return [];

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];

      const templates = JSON.parse(stored);
      return templates.filter((t: Template) => t.userId === userId);
    } catch (error) {
      console.error('Failed to load templates:', error);
      return [];
    }
  }

  static save(template: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>): Template {
    if (typeof window === 'undefined') {
      throw new Error('Templates can only be saved in the browser');
    }

    const newTemplate: Template = {
      ...template,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const templates = this.getAll(template.userId);
    templates.push(newTemplate);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));

    return newTemplate;
  }

  static update(id: string, userId: string, updates: Partial<Omit<Template, 'id' | 'userId' | 'createdAt'>>): Template | null {
    if (typeof window === 'undefined') return null;

    const templates = this.getAll(userId);
    const index = templates.findIndex(t => t.id === id && t.userId === userId);

    if (index === -1) return null;

    templates[index] = {
      ...templates[index],
      ...updates,
      updatedAt: new Date(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
    return templates[index];
  }

  static delete(id: string, userId: string): boolean {
    if (typeof window === 'undefined') return false;

    const templates = this.getAll(userId);
    const filtered = templates.filter(t => !(t.id === id && t.userId === userId));

    if (filtered.length === templates.length) return false;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  }

  static getById(id: string, userId: string): Template | null {
    if (typeof window === 'undefined') return null;

    const templates = this.getAll(userId);
    return templates.find(t => t.id === id) || null;
  }
}

export const createTemplateFromTask = (
  task: {
    title: string;
    description?: string;
    priority: Priority;
    tags: string[];
    pomodoros: number;
    workspace: Workspace;
    subTasks?: { title: string; completed?: boolean }[];
  },
  userId: string,
  name: string,
  description?: string
): Omit<Template, 'id' | 'createdAt' | 'updatedAt'> => {
  return {
    name,
    description,
    title: task.title,
    priority: task.priority,
    tags: task.tags || [],
    pomodoros: task.pomodoros,
    workspace: task.workspace,
    subTasks: task.subTasks || [],
    userId,
  };
};
