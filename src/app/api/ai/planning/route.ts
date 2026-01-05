import { generateDailyPlan, suggestSmartPriorities } from '@/ai/flows/planning-flow';
import { getCurrentUser } from '@/lib/appwrite/auth-services';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Priority } from '@/lib/priority';

export const runtime = 'nodejs';

const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  priority: z.enum(Priority),
  dueDate: z.string().optional(),
  pomodoros: z.number(),
  completedPomodoros: z.number(),
  completed: z.boolean(),
  dependsOn: z.array(z.string()).optional(),
  tags: z.array(z.string()),
  workspace: z.string().optional(),
  timeSpent: z.number().optional(),
});

const dailyPlanRequestSchema = z.object({
  type: z.literal('daily-plan'),
  tasks: z.array(taskSchema),
  availableHours: z.number().min(1).max(24).optional(),
  currentTime: z.string().optional(),
  preferences: z.object({
    preferMornings: z.boolean().optional(),
    breakBetweenTasks: z.number().optional(),
    focusOnDeadlines: z.boolean().optional(),
  }).optional(),
});

const smartPriorityRequestSchema = z.object({
  type: z.literal('smart-priority'),
  tasks: z.array(taskSchema),
  currentDate: z.string().optional(),
});

const planningRequestSchema = z.discriminatedUnion('type', [
  dailyPlanRequestSchema,
  smartPriorityRequestSchema,
]);

export async function POST(req: NextRequest) {
  try {
    // Authentication check
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parsed = planningRequestSchema.safeParse(body);

    if (!parsed.success) {
      console.error('Invalid planning request payload', parsed.error);
      return NextResponse.json(
        { error: 'Invalid request payload' },
        { status: 400 }
      );
    }

    const data = parsed.data;

    if (data.type === 'daily-plan') {
      const result = await generateDailyPlan({
        tasks: data.tasks.map(t => ({
          ...t,
          workspace: t.workspace || 'personal',
        })),
        availableHours: data.availableHours || 8,
        currentTime: data.currentTime || new Date().toISOString(),
        preferences: data.preferences,
      });
      return NextResponse.json(result);
    } else {
      const result = await suggestSmartPriorities({
        tasks: data.tasks.map(t => ({
          ...t,
          timeSpent: t.timeSpent || 0,
        })),
        currentDate: data.currentDate || new Date().toISOString().split('T')[0],
      });
      return NextResponse.json(result);
    }
  } catch (error) {
    console.error('Planning API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate plan' },
      { status: 500 }
    );
  }
}
