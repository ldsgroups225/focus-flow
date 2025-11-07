import { z } from 'zod';

export type Priority = "low" | "medium" | "high";
export type Workspace = "personal" | "work" | "side-project";

export const TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  completed: z.boolean(),
  priority: z.enum(['low', 'medium', 'high']),
  tags: z.array(z.string()),
  dueDate: z.date().optional(),
  pomodoros: z.number(),
  completedPomodoros: z.number(),
  timeSpent: z.number(),
  dependsOn: z.array(z.string()).optional(),
  workspace: z.enum(['personal', 'work', 'side-project']),
  completedDate: z.date().optional(),
}).describe('A task object');

export type Task = z.infer<typeof TaskSchema>;
