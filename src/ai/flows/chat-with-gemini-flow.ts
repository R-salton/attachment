'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const MessageSchema = z.object({
  role: z.enum(['user', 'model', 'system']),
  content: z.string(),
});

const ChatWithGeminiInputSchema = z.object({
  history: z.array(MessageSchema),
  message: z.string(),
});

export type ChatWithGeminiInput = z.infer<typeof ChatWithGeminiInputSchema>;

const ChatWithGeminiOutputSchema = z.object({
  text: z.string(),
});

export type ChatWithGeminiOutput = z.infer<typeof ChatWithGeminiOutputSchema>;

export async function chatWithGemini(input: ChatWithGeminiInput): Promise<ChatWithGeminiOutput> {
  return chatWithGeminiFlow(input);
}

const chatWithGeminiFlow = ai.defineFlow(
  {
    name: 'chatWithGeminiFlow',
    inputSchema: ChatWithGeminiInputSchema,
    outputSchema: ChatWithGeminiOutputSchema,
  },
  async (input) => {
    const response = await ai.generate({
      system: 'You are the "Report Master Command AI", a professional and authoritative assistant integrated into an operational reporting system for cadets and commanders. Your goal is to help users draft, refine, and analyze SITUATION REPORTS (SITREPs). Use a formal, tactical, and helpful tone. Avoid jargon that isn\'t related to military or police reporting protocols.',
      prompt: [
        ...input.history.map(m => ({ role: m.role, content: [{ text: m.content }] })),
        { role: 'user', content: [{ text: input.message }] }
      ],
    });

    return {
      text: response.text,
    };
  }
);
