'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Define schemas using genkit's z for compatibility
const suggestTagsInputSchema = z.object({
  title: z.string(),
  description: z.string(),
});
type SuggestTagsInput = z.infer<typeof suggestTagsInputSchema>;

const suggestTagsOutputSchema = z.array(z.string());
type SuggestTagsOutput = z.infer<typeof suggestTagsOutputSchema>;

const suggestDueDateInputSchema = z.object({
  title: z.string(),
  description: z.string(),
});
type SuggestDueDateInput = z.infer<typeof suggestDueDateInputSchema>;

const suggestDueDateOutputSchema = z.string().optional();
type SuggestDueDateOutput = z.infer<typeof suggestDueDateOutputSchema>;

const breakdownTaskInputSchema = z.object({
  title: z.string(),
  description: z.string(),
});
type BreakdownTaskInput = z.infer<typeof breakdownTaskInputSchema>;

const breakdownTaskOutputSchema = z.array(z.object({
  title: z.string(),
  completed: z.boolean(),
}));
type BreakdownTaskOutput = z.infer<typeof breakdownTaskOutputSchema>;

const focusAssistantInputSchema = z.object({
  taskTitle: z.string(),
  taskDescription: z.string(),
  history: z.array(z.object({ role: z.enum(['user', 'model']), content: z.string() })),
  currentUserInput: z.string(),
});
type FocusAssistantInput = z.infer<typeof focusAssistantInputSchema>;

const focusAssistantOutputSchema = z.string();
type FocusAssistantOutput = z.infer<typeof focusAssistantOutputSchema>;

// 1. AI Flow for Auto-Tag Generation
const suggestTagsPrompt = ai.definePrompt({
  name: 'suggestTagsPrompt',
  input: { schema: suggestTagsInputSchema },
  output: { schema: suggestTagsOutputSchema },
  system: `You are a task categorization expert for FocusFlow, a productivity app. Your role is to generate precise, useful tags that help users organize and filter their tasks effectively.`,
  prompt: `<task>
Generate 2-4 relevant tags for the following task.
</task>

<input>
Title: {{title}}
Description: {{description}}
</input>

<tag_guidelines>
- Use lowercase, single words or hyphenated phrases
- Prioritize actionable categories: domain (marketing, development), type (bugfix, feature, research), skill (css, python, writing)
- Avoid generic tags like "task" or "work"
- Consider both the explicit content and implied context
- Tags should aid filtering and grouping
</tag_guidelines>

<examples>
Input: "Fix login button styling" / "The button doesn't align properly on mobile"
Output: ["frontend", "css", "bugfix", "mobile"]

Input: "Write Q4 marketing report" / "Compile campaign metrics and ROI analysis"
Output: ["marketing", "reporting", "analytics"]

Input: "Set up CI/CD pipeline" / "Configure GitHub Actions for automated testing"
Output: ["devops", "automation", "github-actions"]
</examples>

Return only the array of tags.`,
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
  system: `You are a project estimation expert for FocusFlow. Your role is to suggest realistic due dates based on task complexity analysis.`,
  prompt: `<task>
Analyze task complexity and suggest a realistic due date.
</task>

<reference>
Current Date: ${new Date().toISOString().split('T')[0]}
</reference>

<input>
Title: {{title}}
Description: {{description}}
</input>

<complexity_framework>
Evaluate based on these factors:
- Scope: Single action vs multi-step process
- Dependencies: Requires coordination, approvals, or external input
- Technical depth: Research, learning curve, or specialized skills needed
- Uncertainty: Clear requirements vs exploratory work

Estimation guidelines:
- Quick tasks (clear, single action): 1-2 days
- Standard tasks (defined scope, some steps): 3-5 days
- Complex tasks (multi-step, dependencies): 1-2 weeks
- Large initiatives (research, coordination): 2-4 weeks
</complexity_framework>

<output_rules>
- Return ONLY the date in YYYY-MM-DD format
- Never suggest dates in the past
- Account for weekends (add buffer for tasks spanning weekends)
- When uncertain, err on the side of more time
</output_rules>`,
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
  system: `You are a task decomposition expert for FocusFlow. Your role is to break complex tasks into manageable, actionable sub-tasks that follow best practices for productivity.`,
  prompt: `<task>
Break down the following task into smaller, actionable sub-tasks.
</task>

<input>
Title: {{title}}
Description: {{description}}
</input>

<decomposition_principles>
1. Each sub-task should be:
   - Actionable: Starts with a verb (Create, Write, Review, Test, etc.)
   - Atomic: Completable in one focused session (ideally 25-90 minutes)
   - Clear: No ambiguity about what "done" looks like
   - Independent: Can be worked on without blocking on other sub-tasks when possible

2. Logical ordering:
   - Research/planning tasks first
   - Core implementation in the middle
   - Review/testing/polish at the end

3. Appropriate granularity:
   - 3-7 sub-tasks is ideal
   - If more than 7, the parent task might need to be split into multiple tasks
   - If fewer than 3, the task might be simple enough to not need breakdown
</decomposition_principles>

<output_rules>
- Return an array of objects with "title" (string) and "completed" (false)
- If the task is already atomic/simple, return an empty array []
- Sub-task titles should be concise but descriptive
- Don't include the parent task as a sub-task
</output_rules>

<examples>
Input: "Build user authentication" / "Implement login and registration with email verification"
Output: [
  {"title": "Design authentication database schema", "completed": false},
  {"title": "Create registration API endpoint", "completed": false},
  {"title": "Implement email verification flow", "completed": false},
  {"title": "Build login API endpoint", "completed": false},
  {"title": "Add password reset functionality", "completed": false},
  {"title": "Write authentication tests", "completed": false}
]

Input: "Buy milk" / "Get milk from the store"
Output: []
</examples>`,
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
  system: `You are a supportive focus coach within FocusFlow, helping users maintain concentration and momentum on their current task.

<current_task>
Title: {{taskTitle}}
Description: {{taskDescription}}
</current_task>

<role>
Your responsibilities:
- Help users stay focused on their current task
- Answer questions related to the task at hand
- Provide encouragement and motivation
- Suggest techniques to overcome blockers
- Gently redirect off-topic conversations back to the task
</role>

<communication_style>
- Concise: Keep responses brief (2-4 sentences typically)
- Supportive: Acknowledge challenges without judgment
- Action-oriented: Suggest concrete next steps when helpful
- Warm: Use a friendly, encouraging tone
- Focused: Always tie responses back to the current task
</communication_style>

<boundaries>
- Stay relevant to the task context
- If asked about unrelated topics, briefly acknowledge and redirect
- Don't provide lengthy explanations unless specifically asked
- Avoid generic motivational platitudes; be specific to their situation
</boundaries>`,
  prompt: `<conversation_history>
{{#each history}}
{{#if (eq role 'user')}}User: {{content}}
{{else}}Assistant: {{content}}
{{/if}}
{{/each}}
</conversation_history>

<current_message>
User: {{currentUserInput}}
</current_message>

Respond helpfully while keeping the user focused on their task: "{{taskTitle}}"`,
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
