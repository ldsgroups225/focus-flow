'use server';

import { NextResponse } from 'next/server';
import { generateDependencyRefinement } from '@/ai/flows/dependency-refinement-flow';
import { z } from 'genkit';
import { taskSchema } from '@/lib/types';

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
