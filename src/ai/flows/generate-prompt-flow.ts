'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { Task } from '@/lib/types';

// Define schemas
const generatePromptInputSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  priority: z.string(),
  tags: z.array(z.string()),
  project: z.string().optional(),
});

export type GeneratePromptInput = z.infer<typeof generatePromptInputSchema>;

const generatePromptOutputSchema = z.string();

export type GeneratePromptOutput = z.infer<typeof generatePromptOutputSchema>;

// AI Prompt for generating engineering prompts
const generateEngineeringPromptPrompt = ai.definePrompt({
  name: 'generateEngineeringPromptPrompt',
  input: { schema: generatePromptInputSchema },
  output: { format: 'text' },
  system: `You are an Engineering Manager and Technical Architect expert. Your goal is to take a high-level task description and convert it into a "Strong Engineering Prompt" that can be used by an AI coding agent or a developer to implement the feature.`,
  prompt: `<task_details>
Title: {{title}}
Description: {{description}}
Priority: {{priority}}
Tags: {{tags}}
Project: {{project}}
</task_details>

<instructions>
Analyze the task details and generate a comprehensive, structured prompt.
The output should be a single string formatted as a prompt for an LLM/Agent.

Structure of the output prompt:
1. **Context & Goal**: Clear statement of what needs to be achieved.
2. **Requirements**: Functional and non-functional requirements inferred from the description and tags.
3. **Implementation Plan**: Suggested steps or architecture.
4. **Constraints**: Any specific constraints based on the project or priority.
5. **Verification**: How to verify the implementation.

Tone: Professional, precise, technical.
</instructions>

Generate the prompt now.`,
});

export const generatePromptFlow = ai.defineFlow(
  {
    name: 'generatePromptFlow',
    inputSchema: generatePromptInputSchema,
    outputSchema: generatePromptOutputSchema,
  },
  async (input) => {
    try {
      const { text } = await generateEngineeringPromptPrompt(input);
      return text || "Failed to generate prompt.";
    } catch (error) {
      console.error('Generate prompt error:', error);
      return "Error generating prompt.";
    }
  }
);

export async function generatePrompt(input: GeneratePromptInput): Promise<GeneratePromptOutput> {
  return generatePromptFlow(input);
}
