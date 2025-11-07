import { z } from 'zod';

export type Priority = "low" | "medium" | "high";
export type Workspace = "personal" | "work" | "side-project";

export const SubTaskSchema = z.object({
  title: z.string(),
  completed: z.boolean(),
});
export type SubTask = z.infer<typeof SubTaskSchema>;

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
  subTasks: z.array(SubTaskSchema).optional(),
}).describe('A task object');

export type Task = z.infer<typeof TaskSchema>;

// AI Flow Schemas

export const ReviewFlowInputSchema = z.object({
  tasks: z.array(TaskSchema).describe('The list of tasks completed in the given period.'),
  locale: z.enum(['en', 'fr']).describe('The language for the generated review.'),
  period: z.enum(['Daily', 'Weekly']).describe('The review period.'),
});
export type ReviewFlowInput = z.infer<typeof ReviewFlowInputSchema>;

export const ReviewFlowOutputSchema = z.string().describe('A markdown-formatted review of the tasks.');
export type ReviewFlowOutput = z.infer<typeof ReviewFlowOutputSchema>;


export const SuggestTagsInputSchema = z.object({
    title: z.string(),
    description: z.string(),
});
export type SuggestTagsInput = z.infer<typeof SuggestTagsInputSchema>;
export const SuggestTagsOutputSchema = z.array(z.string());
export type SuggestTagsOutput = z.infer<typeof SuggestTagsOutputSchema>;

export const SuggestDueDateInputSchema = z.object({
    title: z.string(),
    description: z.string(),
});
export type SuggestDueDateInput = z.infer<typeof SuggestDueDateInputSchema>;
export const SuggestDueDateOutputSchema = z.string().optional();
export type SuggestDueDateOutput = z.infer<typeof SuggestDueDateOutputSchema>;

export const BreakdownTaskInputSchema = z.object({
    title: z.string(),
    description: z.string(),
});
export type BreakdownTaskInput = z.infer<typeof BreakdownTaskInputSchema>;
export const BreakdownTaskOutputSchema = z.array(SubTaskSchema);
export type BreakdownTaskOutput = z.infer<typeof BreakdownTaskOutputSchema>;

export const FocusAssistantInputSchema = z.object({
    taskTitle: z.string(),
    taskDescription: z.string(),
    history: z.array(z.object({role: z.enum(['user', 'model']), content: z.string()})),
    currentUserInput: z.string(),
});
export type FocusAssistantInput = z.infer<typeof FocusAssistantInputSchema>;
export const FocusAssistantOutputSchema = z.string();
export type FocusAssistantOutput = z.infer<typeof FocusAssistantOutputSchema>;
