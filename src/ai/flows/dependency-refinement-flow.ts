'use server';
/**
 * @fileoverview A flow that analyzes tasks and suggests improvements to dependencies, due dates, tags, and project structure.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Define schemas using genkit's z for compatibility
const genkitTaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  completed: z.boolean(),
  priority: z.enum(['low', 'medium', 'high']),
  type: z.enum(['task', 'milestone', 'subtask']),
  tags: z.array(z.string()),
  dueDate: z.string().optional(),
  pomodoros: z.number(),
  completedPomodoros: z.number(),
  timeSpent: z.number(),
  dependsOn: z.array(z.string()).optional(),
  workspace: z.enum(['personal', 'work', 'side-project']),
  completedDate: z.string().optional(),
  startDate: z.string().optional(),
  duration: z.number().optional(),
  projectId: z.string().optional(),
});

const dependencyRefinementInputSchema = z.object({
  tasks: z.array(genkitTaskSchema).describe('The list of all tasks to analyze.'),
  locale: z.enum(['en', 'fr']).describe('The language for the generated suggestions.'),
});

type DependencyRefinementInput = z.infer<typeof dependencyRefinementInputSchema>;

const dependencyRefinementOutputSchema = z.string().describe('A markdown-formatted analysis with suggestions for task dependencies, due dates, tags, and project structure.');

type DependencyRefinementOutput = z.infer<typeof dependencyRefinementOutputSchema>;

const prompt = ai.definePrompt({
  name: 'dependencyRefinementPrompt',
  input: { schema: dependencyRefinementInputSchema },
  output: {
    schema: dependencyRefinementOutputSchema,
    format: 'text'
  },
  system: `You are an expert productivity consultant specializing in task management optimization for FocusFlow, a focus-oriented task management application.

<role>
Your expertise includes:
- Workflow optimization and dependency mapping
- Time management and realistic deadline setting
- Project organization and taxonomy design
- Priority alignment with business objectives
</role>

<constraints>
- NEVER expose internal task IDs (e.g., "690f92860032ed45305e")
- ALWAYS reference tasks by their exact title in quotes
- Keep analysis actionable and specific
- Adapt language based on locale parameter
- Focus on high-impact improvements first
</constraints>`,
  prompt: `<task>
Analyze the provided task list and generate a comprehensive optimization report.
</task>

<context>
- Application: FocusFlow (productivity-focused task manager)
- Output Language: {{locale}}
</context>

<analysis_framework>
Evaluate each task considering:
1. Dependency relationships (explicit and implicit)
2. Timeline feasibility based on task complexity
3. Tag consistency and discoverability
4. Project grouping opportunities
5. Priority-deadline alignment
</analysis_framework>

<output_format>
Generate a Markdown report with these 6 sections. ALL content must be in {{locale}} language:

1. 🔗 Dependency Analysis - Missing dependencies, circular conflicts, recommended execution order
2. 📅 Due Date Optimization - Unrealistic dates, missing dates, timeline adjustments
3. 🏷️ Tag Recommendations - Inconsistent patterns, missing tags, consolidation opportunities
4. 📁 Project Structure - Grouping opportunities, hierarchy improvements
5. ⚡ Priority Alignment - Priority/deadline mismatches, recommended adjustments
6. ✅ Quick Wins - 3-5 specific, actionable changes to make right now

Use French section headers if locale is "fr", English if locale is "en".
</output_format>

<guidelines>
- If the task list is well-organized, acknowledge strengths before suggesting improvements
- Prioritize suggestions by impact (high-impact first)
- Be specific: instead of "add a tag", say "add tag 'frontend' to task 'Build login page'"
- Consider task types (task, milestone, subtask) when analyzing structure
</guidelines>

<input_data>
{{{json tasks}}}
</input_data>`,
});

const dependencyRefinementFlow = ai.defineFlow(
  {
    name: 'dependencyRefinementFlow',
    inputSchema: dependencyRefinementInputSchema,
    outputSchema: dependencyRefinementOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    // Ensure we return a string
    if (typeof output === 'string') {
      return output;
    }
    return '';
  }
);

export async function generateDependencyRefinement(
  input: DependencyRefinementInput
): Promise<DependencyRefinementOutput> {
  return dependencyRefinementFlow(input);
}
