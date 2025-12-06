import { NextResponse } from 'next/server';
import { generateReview } from '@/ai/flows/review-flow';
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

const reviewFlowInputSchema = z.object({
  tasks: z.array(taskSchema),
  locale: z.enum(['en', 'fr']),
  period: z.enum(['Daily', 'Weekly']),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = reviewFlowInputSchema.safeParse(json);

    if (!parsed.success) {
      console.error('Invalid review request payload', parsed.error);
      return NextResponse.json({ message: 'Invalid request payload' }, { status: 400 });
    }

    const review = await generateReview(parsed.data);
    return NextResponse.json({ review });
  } catch (error) {
    console.error('Failed to generate review', error);
    return NextResponse.json({ message: 'Failed to generate review' }, { status: 500 });
  }
}
