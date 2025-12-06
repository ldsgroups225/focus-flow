import { NextResponse } from 'next/server';
import { generateDependencyRefinement } from '@/ai/flows/dependency-refinement-flow';
import { z } from 'zod';

const taskSchema = z.object({
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
  tasks: z.array(taskSchema),
  locale: z.enum(['en', 'fr']),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = dependencyRefinementInputSchema.safeParse(json);

    if (!parsed.success) {
      console.error('Invalid dependency refinement request payload', parsed.error);
      return NextResponse.json({ message: 'Invalid request payload' }, { status: 400 });
    }

    const suggestions = await generateDependencyRefinement(parsed.data);
    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Failed to generate dependency suggestions', error);
    return NextResponse.json({ message: 'Failed to generate dependency suggestions' }, { status: 500 });
  }
}
