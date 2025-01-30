import { fireworks } from '@ai-sdk/fireworks';
import { streamText, smoothStream } from 'ai';

export const maxDuration = 300;

export async function POST(req: Request) {
  const { messages } = await req.json();
  
  const result = streamText({
    model: fireworks('accounts/fireworks/models/deepseek-v3'),
    system: "You are a helpful assistant that takes in the web for information and replies to the user with correct answer. Use simple english.",
    messages,
    experimental_transform: smoothStream({
      delayInMs: 20,
      chunking: 'word',
    }),
  });

  return result.toDataStreamResponse({ sendReasoning: true });
}