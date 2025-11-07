'use server';
/**
 * @fileoverview A flow that generates a review of completed tasks.
 */
import { ai } from '@/ai/genkit';
import {
  ReviewFlowInputSchema,
  type ReviewFlowInput,
  ReviewFlowOutputSchema,
  type ReviewFlowOutput,
} from '@/lib/types';

const prompt = ai.definePrompt({
  name: 'reviewPrompt',
  input: { schema: ReviewFlowInputSchema },
  output: { schema: ReviewFlowOutputSchema },
  prompt: `You are a productivity assistant integrated into a task management app called FocusFlow. Your goal is to provide a helpful and encouraging review of the tasks the user has completed.

The user has requested a {{period}} review. The tasks they completed are provided below in a JSON object.
Analyze the tasks and generate a review in {{locale}} language.

The review MUST be in Markdown and have the following structure:
- A title (e.g., "Daily Review" or "Revue Hebdomadaire").
- A "Summary" section that gives a brief, positive overview of what was accomplished.
- A "Key Insights" section with 2-3 bullet points highlighting patterns, such as focus on certain projects (tags), task priorities, or work/life balance.
- A "Suggestion for Tomorrow" section with a single, actionable suggestion to help the user prepare for their next day.

If the tasks array is empty, simply return a message like "No tasks completed today. Let's make tomorrow a productive one!" in the correct language.

Completed Tasks:
{{{json tasks}}}
`,
});

const reviewFlow = ai.defineFlow(
  {
    name: 'reviewFlow',
    inputSchema: ReviewFlowInputSchema,
    outputSchema: ReviewFlowOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output || '';
  }
);

export async function generateReview(input: ReviewFlowInput): Promise<ReviewFlowOutput> {
  return reviewFlow(input);
}
