'use server';

import { NextResponse } from 'next/server';
import { generateReview } from '@/ai/flows/review-flow';
import { reviewFlowInputSchema } from '@/lib/types';

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
