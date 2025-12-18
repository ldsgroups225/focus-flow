'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Input schema for daily planning
const dailyPlanningInputSchema = z.object({
  tasks: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high']),
    dueDate: z.string().optional(),
    pomodoros: z.number(),
    completedPomodoros: z.number(),
    completed: z.boolean(),
    dependsOn: z.array(z.string()).optional(),
    tags: z.array(z.string()),
    workspace: z.string(),
  })),
  availableHours: z.number().describe('Hours available for work today'),
  currentTime: z.string().describe('Current time in ISO format'),
  preferences: z.object({
    preferMornings: z.boolean().optional(),
    breakBetweenTasks: z.number().optional().describe('Minutes between tasks'),
    focusOnDeadlines: z.boolean().optional(),
  }).optional(),
});
type DailyPlanningInput = z.infer<typeof dailyPlanningInputSchema>;

// Output schema for daily planning
const dailyPlanningOutputSchema = z.object({
  plannedTasks: z.array(z.object({
    taskId: z.string(),
    suggestedOrder: z.number(),
    estimatedStartTime: z.string().optional(),
    estimatedDuration: z.number().describe('Estimated duration in minutes'),
    reasoning: z.string().describe('Why this task is scheduled at this time'),
    energyLevel: z.enum(['high', 'medium', 'low']).describe('Recommended energy level for this task'),
  })),
  summary: z.string().describe('A brief summary of the planned day'),
  tips: z.array(z.string()).describe('Productivity tips for the day'),
  warnings: z.array(z.string()).optional().describe('Potential issues or conflicts'),
});
type DailyPlanningOutput = z.infer<typeof dailyPlanningOutputSchema>;

// Smart prioritization input
const smartPriorityInputSchema = z.object({
  tasks: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high']),
    dueDate: z.string().optional(),
    pomodoros: z.number(),
    completedPomodoros: z.number(),
    completed: z.boolean(),
    dependsOn: z.array(z.string()).optional(),
    tags: z.array(z.string()),
    timeSpent: z.number().describe('Time spent in seconds'),
    createdAt: z.string().optional(),
  })),
  currentDate: z.string(),
});
type SmartPriorityInput = z.infer<typeof smartPriorityInputSchema>;

// Smart prioritization output
const smartPriorityOutputSchema = z.array(z.object({
  taskId: z.string(),
  currentPriority: z.enum(['low', 'medium', 'high']),
  suggestedPriority: z.enum(['low', 'medium', 'high']),
  urgencyScore: z.number().min(0).max(100),
  reasoning: z.string(),
  factors: z.array(z.string()).describe('Factors that influenced this suggestion'),
}));
type SmartPriorityOutput = z.infer<typeof smartPriorityOutputSchema>;

// Daily Planning Prompt
const dailyPlanningPrompt = ai.definePrompt({
  name: 'dailyPlanningPrompt',
  input: { schema: dailyPlanningInputSchema },
  output: {
    schema: dailyPlanningOutputSchema,
    format: 'json'
  },
  system: `You are an expert productivity coach and daily planning assistant for FocusFlow. Your role is to help users optimize their workday by intelligently scheduling tasks based on priority, deadlines, dependencies, and energy levels.

<core_principles>
1. High-priority tasks should generally be scheduled during peak energy times (typically morning)
2. Deep work tasks should be batched together with minimal context-switching
3. Quick wins can be scheduled as transitions between deep work blocks
4. Tasks with dependencies must be ordered correctly
5. Include breaks and buffer time for unexpected issues
6. Balance workload across available hours
</core_principles>

<energy_management>
- High energy tasks: Complex problem-solving, creative work, important meetings
- Medium energy tasks: Administrative work, code reviews, documentation
- Low energy tasks: Email, routine updates, simple fixes
</energy_management>`,
  prompt: `<context>
Current Time: {{currentTime}}
Available Hours: {{availableHours}} hours
{{#if preferences}}
Preferences:
- Prefer mornings for important work: {{preferences.preferMornings}}
- Break between tasks: {{preferences.breakBetweenTasks}} minutes
- Focus on deadlines: {{preferences.focusOnDeadlines}}
{{/if}}
</context>

<tasks>
{{#each tasks}}
- ID: {{id}}
  Title: {{title}}
  Priority: {{priority}}
  {{#if dueDate}}Due: {{dueDate}}{{/if}}
  Pomodoros: {{completedPomodoros}}/{{pomodoros}} completed
  {{#if dependsOn.length}}Depends on: {{dependsOn}}{{/if}}
  Tags: {{tags}}
{{/each}}
</tasks>

<instructions>
1. Analyze all incomplete tasks
2. Consider dependencies - blocked tasks cannot be scheduled before their dependencies
3. Prioritize by: deadline urgency > explicit priority > dependency order
4. Estimate realistic durations (1 pomodoro = 25 minutes)
5. Add buffer time between tasks
6. Provide a motivating summary and actionable tips
7. Warn about any potential conflicts or overcommitment
</instructions>

<output_format>
Return the result as a JSON object matching the following structure:
{
  "plannedTasks": [
    {
      "taskId": "string",
      "suggestedOrder": number,
      "estimatedDuration": number,
      "reasoning": "string",
      "energyLevel": "high" | "medium" | "low"
    }
  ],
  "summary": "string",
  "tips": ["string"],
  "warnings": ["string"]
}
</output_format>

Create an optimized daily plan:`,
});

// Smart Priority Prompt
const smartPriorityPrompt = ai.definePrompt({
  name: 'smartPriorityPrompt',
  input: { schema: smartPriorityInputSchema },
  output: {
    schema: smartPriorityOutputSchema,
    format: 'json'
  },
  system: `You are a smart task prioritization assistant for FocusFlow. Analyze tasks and suggest priority adjustments based on multiple factors.

<prioritization_factors>
1. Deadline proximity (most important)
   - Overdue: Emergency priority
   - Due within 24h: Very high urgency
   - Due within 3 days: High urgency
   - Due within a week: Medium urgency
   
2. Time investment ratio
   - If significant time already spent, consider increasing priority to complete it
   - Avoid sunk cost fallacy for poorly scoped tasks
   
3. Dependency chains
   - Tasks that block others should be prioritized
   - Consider the total value unlocked
   
4. Task aging
   - Old tasks might need reprioritization or removal
   
5. Completion momentum
   - Tasks close to completion should get a boost
</prioritization_factors>

<scoring_guidelines>
- 90-100: Critical, do immediately
- 70-89: High priority, today
- 50-69: Medium priority, this week
- 30-49: Low priority, good to have
- 0-29: Consider deferring or removing
</scoring_guidelines>`,
  prompt: `<context>
Current Date: {{currentDate}}
</context>

<tasks>
{{#each tasks}}
- ID: {{id}}
  Title: {{title}}
  Current Priority: {{priority}}
  {{#if dueDate}}Due: {{dueDate}}{{/if}}
  Progress: {{completedPomodoros}}/{{pomodoros}} pomodoros
  Time Spent: {{timeSpent}} seconds
  {{#if dependsOn.length}}Depends on: {{dependsOn}}{{/if}}
  Completed: {{completed}}
{{/each}}
</tasks>

<instructions>
1. Analyze each incomplete task
2. Calculate an urgency score (0-100)
3. Suggest priority adjustments where current priority differs from optimal
4. Provide clear reasoning for each suggestion
5. Only include tasks that would benefit from priority changes
</instructions>

<output_format>
Return the result as a JSON array matching the following structure:
[
  {
    "taskId": "string",
    "currentPriority": "low" | "medium" | "high",
    "suggestedPriority": "low" | "medium" | "high",
    "urgencyScore": number,
    "reasoning": "string",
    "factors": ["string"]
  }
]
</output_format>

Analyze and suggest priority adjustments:`,
});

// Define flows
const dailyPlanningFlow = ai.defineFlow(
  {
    name: 'dailyPlanningFlow',
    inputSchema: dailyPlanningInputSchema,
    outputSchema: dailyPlanningOutputSchema,
  },
  async (input) => {
    try {
      // Filter to only incomplete tasks
      const incompleteTasks = input.tasks.filter(t => !t.completed);

      if (incompleteTasks.length === 0) {
        return {
          plannedTasks: [],
          summary: "No pending tasks to plan! You're all caught up. 🎉",
          tips: ["Consider reviewing your goals and adding new tasks", "Use this free time for learning or personal projects"],
          warnings: [],
        };
      }

      const { output } = await dailyPlanningPrompt({ ...input, tasks: incompleteTasks });
      return output || {
        plannedTasks: [],
        summary: "Unable to generate plan",
        tips: [],
        warnings: ["Planning failed. Please try again."],
      };
    } catch (error) {
      console.error('Daily planning error:', error);
      throw error;
    }
  }
);

const smartPriorityFlow = ai.defineFlow(
  {
    name: 'smartPriorityFlow',
    inputSchema: smartPriorityInputSchema,
    outputSchema: smartPriorityOutputSchema,
  },
  async (input) => {
    try {
      // Filter to only incomplete tasks
      const incompleteTasks = input.tasks.filter(t => !t.completed);

      if (incompleteTasks.length === 0) {
        return [];
      }

      const { output } = await smartPriorityPrompt({ ...input, tasks: incompleteTasks });
      return output || [];
    } catch (error) {
      console.error('Smart priority error:', error);
      throw error;
    }
  }
);

// Export functions
export async function generateDailyPlan(input: DailyPlanningInput): Promise<DailyPlanningOutput> {
  return dailyPlanningFlow(input);
}

export async function suggestSmartPriorities(input: SmartPriorityInput): Promise<SmartPriorityOutput> {
  return smartPriorityFlow(input);
}
