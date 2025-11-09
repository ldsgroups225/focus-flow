import { z } from 'genkit';

export type Priority = "low" | "medium" | "high";
export type Workspace = "personal" | "work" | "side-project";

export const subTaskSchema = z.object({
  title: z.string(),
  completed: z.boolean(),
});
export type SubTask = z.infer<typeof subTaskSchema>;

export const taskSchema = z.object({
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
  subTasks: z.array(subTaskSchema).optional(),
  startDate: z.coerce.date().optional(),
  duration: z.number().optional(), // Duration in days
}).describe('A task object');

export type Task = z.infer<typeof taskSchema>;

// AI Flow Schemas

export const reviewFlowInputSchema = z.object({
  tasks: z.array(taskSchema).describe('The list of tasks completed in the given period.'),
  locale: z.enum(['en', 'fr']).describe('The language for the generated review.'),
  period: z.enum(['Daily', 'Weekly']).describe('The review period.'),
});
export type ReviewFlowInput = z.infer<typeof reviewFlowInputSchema>;

export const reviewFlowOutputSchema = z.string().describe('A markdown-formatted review of the tasks.');
export type ReviewFlowOutput = z.infer<typeof reviewFlowOutputSchema>;


export const suggestTagsInputSchema = z.object({
  title: z.string(),
  description: z.string(),
});
export type SuggestTagsInput = z.infer<typeof suggestTagsInputSchema>;
export const suggestTagsOutputSchema = z.array(z.string());
export type SuggestTagsOutput = z.infer<typeof suggestTagsOutputSchema>;

export const suggestDueDateInputSchema = z.object({
  title: z.string(),
  description: z.string(),
});
export type SuggestDueDateInput = z.infer<typeof suggestDueDateInputSchema>;
export const suggestDueDateOutputSchema = z.string().optional();
export type SuggestDueDateOutput = z.infer<typeof suggestDueDateOutputSchema>;

export const breakdownTaskInputSchema = z.object({
  title: z.string(),
  description: z.string(),
});
export type BreakdownTaskInput = z.infer<typeof breakdownTaskInputSchema>;
export const breakdownTaskOutputSchema = z.array(subTaskSchema);
export type BreakdownTaskOutput = z.infer<typeof breakdownTaskOutputSchema>;

export const focusAssistantInputSchema = z.object({
  taskTitle: z.string(),
  taskDescription: z.string(),
  history: z.array(z.object({ role: z.enum(['user', 'model']), content: z.string() })),
  currentUserInput: z.string(),
});
export type FocusAssistantInput = z.infer<typeof focusAssistantInputSchema>;
export const focusAssistantOutputSchema = z.string();
export type FocusAssistantOutput = z.infer<typeof focusAssistantOutputSchema>;
