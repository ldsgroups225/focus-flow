'use server';
/**
 * @fileoverview A flow that analyzes tasks and suggests improvements to dependencies, due dates, tags, and project structure.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { taskSchema } from '@/lib/types';

const dependencyRefinementInputSchema = z.object({
  tasks: z.array(taskSchema).describe('The list of all tasks to analyze.'),
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
  prompt: `You are a productivity assistant integrated into a task management app called FocusFlow. Your goal is to help users optimize their task structure by analyzing dependencies, due dates, tags, and project organization.

The user has provided their complete task list. Analyze these tasks and provide actionable suggestions in {{locale}} language.

IMPORTANT FORMATTING RULES:
- NEVER include task IDs in your response (like "690f92860032ed45305e" or "6911a184002be3fc76e8")
- ONLY reference tasks by their TITLE in quotes (e.g., "Main task MOD" or "Test")
- Use task descriptions for your internal analysis but DO NOT quote them in the output
- Keep your response concise and easy to read
- Focus on actionable recommendations

Your analysis MUST be in Markdown and include the following sections:

1. **Analyse des Dépendances** (if locale is 'fr') or **Dependency Analysis** (if locale is 'en')
   - Identify tasks that should depend on others but don't have dependencies set
   - Highlight circular dependencies or dependency conflicts
   - Suggest logical task ordering based on dependencies
   - Reference tasks ONLY by their title

2. **Optimisation des Dates d'Échéance** (if locale is 'fr') or **Due Date Optimization** (if locale is 'en')
   - Flag tasks with unrealistic due dates based on their dependencies
   - Suggest due date adjustments to create a more realistic timeline
   - Identify tasks missing due dates that should have them
   - Reference tasks ONLY by their title

3. **Recommandations de Tags** (if locale is 'fr') or **Tag Recommendations** (if locale is 'en')
   - Suggest consistent tagging patterns across similar tasks
   - Identify missing tags that would help with organization
   - Recommend tag consolidation where there's redundancy
   - Reference tasks ONLY by their title

4. **Structure de Projet** (if locale is 'fr') or **Project Structure** (if locale is 'en')
   - Suggest grouping related tasks into projects
   - Identify tasks that belong to the same project but aren't grouped
   - Recommend project hierarchy improvements
   - Reference tasks ONLY by their title

5. **Alignement des Priorités** (if locale is 'fr') or **Priority Alignment** (if locale is 'en')
   - Check if task priorities align with due dates and dependencies
   - Suggest priority adjustments for better workflow
   - Reference tasks ONLY by their title

6. **Actions Rapides** (if locale is 'fr') or **Quick Wins** (if locale is 'en')
   - List 3-5 specific, actionable changes the user can make right now
   - Reference tasks ONLY by their title
   - Be specific about what to change (dates, priorities, tags, etc.)

Keep suggestions practical and specific. If the task list is well-organized, acknowledge what's working well before suggesting improvements.

Tasks to analyze:
{{{json tasks}}}
`,
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
