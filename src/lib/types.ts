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
  dueDate: z.coerce.date().optional(),
  pomodoros: z.number(),
  completedPomodoros: z.number(),
  timeSpent: z.number(),
  dependsOn: z.array(z.string()).optional(),
  workspace: z.enum(['personal', 'work', 'side-project']),
  completedDate: z.coerce.date().optional(),
}).describe('A task object');

export type Task = z.infer<typeof TaskSchema>;

export const ReviewFlowInputSchema = z.object({
  tasks: z.array(TaskSchema).describe('The list of tasks completed in the given period.'),
  locale: z.enum(['en', 'fr']).describe('The language for the generated review.'),
  period: z.enum(['Daily', 'Weekly']).describe('The review period.'),
});
export type ReviewFlowInput = z.infer<typeof ReviewFlowInputSchema>;

export const ReviewFlowOutputSchema = z.string().describe('A markdown-formatted review of the tasks.');
export type ReviewFlowOutput = z.infer<typeof ReviewFlowOutputSchema>;
