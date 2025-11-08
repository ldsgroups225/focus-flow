'use server';

import { ai } from '@/ai/genkit';
import {
  suggestTagsInputSchema,
  suggestTagsOutputSchema,
  suggestDueDateInputSchema,
  suggestDueDateOutputSchema,
  breakdownTaskInputSchema,
  breakdownTaskOutputSchema,
  focusAssistantInputSchema,
  focusAssistantOutputSchema,
  SuggestTagsInput,
  SuggestDueDateInput,
  BreakdownTaskInput,
  FocusAssistantInput,
  SuggestTagsOutput,
  SuggestDueDateOutput,
  BreakdownTaskOutput,
  FocusAssistantOutput,
} from '@/lib/types';

// 1. AI Flow for Auto-Tag Generation
const suggestTagsPrompt = ai.definePrompt({
  name: 'suggestTagsPrompt',
  input: { schema: suggestTagsInputSchema },
  output: { schema: suggestTagsOutputSchema },
  prompt: `Based on the task title '{{title}}' and description '{{description}}', generate a list of 2-4 relevant, concise, lowercase tags. The tags should categorize the task's domain or required skills (e.g., 'marketing', 'development', 'bugfix', 'css').`,
});

const suggestTagsFlow = ai.defineFlow(
  {
    name: 'suggestTagsFlow',
    inputSchema: suggestTagsInputSchema,
    outputSchema: suggestTagsOutputSchema,
  },
  async (input) => {
    const { output } = await suggestTagsPrompt(input);
    return output || [];
  }
);
export async function suggestTags(input: SuggestTagsInput): Promise<SuggestTagsOutput> {
  return suggestTagsFlow(input);
}


// 2. AI Flow for Smart Due Date Suggestions
const suggestDueDatePrompt = ai.definePrompt({
  name: 'suggestDueDatePrompt',
  input: { schema: suggestDueDateInputSchema },
  output: { schema: suggestDueDateOutputSchema },
  prompt: `Analyze the complexity of the following task and suggest a realistic due date. Current date is ${new Date().toISOString().split('T')[0]}.
Task Title: '{{title}}'.
Description: '{{description}}'.
Consider factors like research, development, or coordination mentioned. A simple task might take 1-2 days, a medium one 3-5 days, and a complex one over a week.
Return only the suggested due date in YYYY-MM-DD format.`
});

const suggestDueDateFlow = ai.defineFlow(
  {
    name: 'suggestDueDateFlow',
    inputSchema: suggestDueDateInputSchema,
    outputSchema: suggestDueDateOutputSchema,
  },
  async (input) => {
    const { output } = await suggestDueDatePrompt(input);
    return output || '';
  }
);

export async function suggestDueDate(input: SuggestDueDateInput): Promise<SuggestDueDateOutput> {
  return suggestDueDateFlow(input);
}


// 3. AI Flow for Task Breakdown into Sub-tasks
const breakdownTaskPrompt = ai.definePrompt({
  name: 'breakdownTaskPrompt',
  input: { schema: breakdownTaskInputSchema },
  output: { schema: breakdownTaskOutputSchema },
  prompt: `Given a task titled '{{title}}' with the description '{{description}}', break it down into a list of smaller, actionable sub-tasks. If the task is simple and cannot be broken down, return an empty array.`
});

const breakdownTaskFlow = ai.defineFlow(
  {
    name: 'breakdownTaskFlow',
    inputSchema: breakdownTaskInputSchema,
    outputSchema: breakdownTaskOutputSchema,
  },
  async (input) => {
    const { output } = await breakdownTaskPrompt(input);
    return output || [];
  }
);

export async function breakdownTask(input: BreakdownTaskInput): Promise<BreakdownTaskOutput> {
  return breakdownTaskFlow(input);
}


// 4. AI Flow for the Context-Aware Focus Assistant
const focusAssistantPrompt = ai.definePrompt({
  name: 'focusAssistantPrompt',
  input: { schema: focusAssistantInputSchema },
  output: { schema: focusAssistantOutputSchema },
  system: `You are a helpful and encouraging focus assistant. The user is currently working on the following task:
Title: '{{taskTitle}}'
Description: '{{taskDescription}}'
Your goal is to help them stay on track, answer questions related to the task, and provide motivation. Keep your responses concise and directly related to the user's task.`,
  prompt: `{{#each history}}
{{#if (eq role 'user')}}User: {{content}}
{{else}}Assistant: {{content}}
{{/if}}
{{/each}}
User: {{currentUserInput}}`,
});


const focusAssistantFlow = ai.defineFlow(
  {
    name: 'focusAssistantFlow',
    inputSchema: focusAssistantInputSchema,
    outputSchema: focusAssistantOutputSchema,
  },
  async (input) => {
    const { output } = await focusAssistantPrompt(input);
    return output || "Sorry, I'm having trouble connecting right now.";
  }
);

export async function getFocusAssistantResponse(input: FocusAssistantInput): Promise<FocusAssistantOutput> {
  return focusAssistantFlow(input);
}
