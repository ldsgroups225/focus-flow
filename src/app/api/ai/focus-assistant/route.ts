import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const dynamic = 'force-dynamic';

const focusAssistantInputSchema = z.object({
  taskTitle: z.string(),
  taskDescription: z.string(),
  history: z.array(z.object({ role: z.enum(['user', 'model']), content: z.string() })),
  currentUserInput: z.string(),
});

export async function POST(request: Request) {
  try {
    const input = await request.json();
    const parsed = focusAssistantInputSchema.safeParse(input);

    if (!parsed.success) {
      return new Response('Invalid request payload', { status: 400 });
    }

    const { taskTitle, taskDescription, history, currentUserInput } = parsed.data;

    const systemPrompt = `You are a supportive focus coach within FocusFlow, helping users maintain concentration and momentum on their current task.

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
</boundaries>`;

    const userPrompt = `<current_task>
Title: ${taskTitle}
Description: ${taskDescription}
</current_task>

<conversation_history>
${history.map(m => `[${m.role}]: ${m.content}`).join('\n')}
</conversation_history>

<current_message>
[user]: ${currentUserInput}
</current_message>

Respond helpfully while keeping the user focused on their task: "${taskTitle}"`;

    const { stream } = ai.generateStream({
      system: systemPrompt,
      prompt: userPrompt,
    });

    const encoder = new TextEncoder();

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            // Get text from chunk.content[0].text (delta) or fallback to extracting from accumulated text
            const text = chunk.content?.[0]?.text || '';
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    console.error('Focus assistant streaming error:', error);
    return new Response('Failed to generate response', { status: 500 });
  }
}
