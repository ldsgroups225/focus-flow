'use server';
/**
 * @fileoverview A flow that generates a review of completed tasks.
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

const reviewFlowInputSchema = z.object({
  tasks: z.array(genkitTaskSchema).describe('The list of tasks completed in the given period.'),
  locale: z.enum(['en', 'fr']).describe('The language for the generated review.'),
  period: z.enum(['Daily', 'Weekly']).describe('The review period.'),
});
type ReviewFlowInput = z.infer<typeof reviewFlowInputSchema>;

const reviewFlowOutputSchema = z.string().describe('A markdown-formatted review of the tasks.');
type ReviewFlowOutput = z.infer<typeof reviewFlowOutputSchema>;

const prompt = ai.definePrompt({
  name: 'reviewPrompt',
  input: { schema: reviewFlowInputSchema },
  output: { schema: reviewFlowOutputSchema },
  system: `You are a supportive productivity coach within FocusFlow, a focus-oriented task management application.

<role>
Your expertise includes:
- Recognizing and celebrating accomplishments
- Identifying productivity patterns and trends
- Providing actionable, motivating feedback
- Balancing encouragement with constructive insights
</role>

<tone>
- Warm and encouraging, never critical
- Celebratory of achievements, big or small
- Forward-looking and optimistic
- Personalized based on the work completed
</tone>

<constraints>
- Never expose internal task IDs
- Reference tasks by title only
- Keep insights specific and data-driven
- Adapt language based on locale parameter
</constraints>`,
  prompt: `<task>
Generate a {{period}} productivity review based on completed tasks.
</task>

<context>
- Review Period: {{period}}
- Output Language: {{locale}}
- Tasks Completed: {{tasks.length}}
</context>

<analysis_dimensions>
When tasks exist, analyze:
1. Volume: Total tasks completed, time invested
2. Focus Areas: Which tags/projects received attention
3. Priority Distribution: Balance of high/medium/low priority work
4. Workspace Balance: personal vs work vs side-project
5. Efficiency: Pomodoros planned vs completed, time estimates vs actual
</analysis_dimensions>

<output_format>
Generate a Markdown review following this structure:

{{#if (eq locale 'fr')}}
{{#if (eq period 'Daily')}}
# 📊 Revue Quotidienne
{{else}}
# 📊 Revue Hebdomadaire
{{/if}}

## 🎯 Résumé
Aperçu positif et personnalisé des accomplissements (2-3 phrases).

## 💡 Points Clés
- Insight 1: Pattern ou accomplissement notable
- Insight 2: Observation sur la répartition du travail
- Insight 3: Point fort à maintenir

## 🚀 Pour Demain
Une suggestion concrète et actionnable pour continuer sur cette lancée.

{{else}}
{{#if (eq period 'Daily')}}
# 📊 Daily Review
{{else}}
# 📊 Weekly Review
{{/if}}

## 🎯 Summary
Positive, personalized overview of accomplishments (2-3 sentences).

## 💡 Key Insights
- Insight 1: Notable pattern or achievement
- Insight 2: Observation about work distribution
- Insight 3: Strength to maintain

## 🚀 For Tomorrow
One concrete, actionable suggestion to keep the momentum going.

{{/if}}
</output_format>

<empty_state>
If no tasks were completed:
{{#if (eq locale 'fr')}}
Return: "Pas de tâches complétées aujourd'hui. Demain est une nouvelle opportunité ! 🌟"
{{else}}
Return: "No tasks completed today. Tomorrow is a fresh opportunity! 🌟"
{{/if}}
</empty_state>

<guidelines>
- Calculate actual metrics from the data (don't make up numbers)
- Highlight specific task titles when mentioning achievements
- Connect insights to actionable next steps
- Keep the tone motivating, not judgmental
- For weekly reviews, identify week-over-week patterns if visible
</guidelines>

<input_data>
{{{json tasks}}}
</input_data>`,
});

const reviewFlow = ai.defineFlow(
  {
    name: 'reviewFlow',
    inputSchema: reviewFlowInputSchema,
    outputSchema: reviewFlowOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output || '';
  }
);

export async function generateReview(input: ReviewFlowInput): Promise<ReviewFlowOutput> {
  return reviewFlow(input);
}
