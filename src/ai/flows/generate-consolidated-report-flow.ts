
'use server';
/**
 * @fileOverview A Genkit flow for generating a consolidated report across a period of attachment days.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateConsolidatedReportInputSchema = z.object({
  targetDay: z.number().describe('The day number up to which the reports are consolidated.'),
  reports: z.array(z.string()).describe('An array of raw SITREP contents as strings.'),
});

export type GenerateConsolidatedReportInput = z.infer<typeof GenerateConsolidatedReportInputSchema>;

const GenerateConsolidatedReportOutputSchema = z.object({
  executiveSummary: z.string().describe('A high-level overview of progress and status up to the target day.'),
  keyAchievements: z.array(z.string()).describe('Major milestones or duties completed successfully.'),
  operationalTrends: z.array(z.string()).describe('Observed patterns in security, discipline, or efficiency.'),
  criticalChallenges: z.array(z.string()).describe('Persistent obstacles encountered across the period.'),
  strategicRecommendations: z.array(z.string()).describe('Actionable advice for the remainder of the attachment.'),
});

export type GenerateConsolidatedReportOutput = z.infer<typeof GenerateConsolidatedReportOutputSchema>;

export async function generateConsolidatedReport(input: GenerateConsolidatedReportInput): Promise<GenerateConsolidatedReportOutput> {
  return generateConsolidatedReportFlow(input);
}

const consolidatedPrompt = ai.definePrompt({
  name: 'generateConsolidatedReportPrompt',
  input: { schema: GenerateConsolidatedReportInputSchema },
  output: { schema: GenerateConsolidatedReportOutputSchema },
  prompt: `You are an AI Operational Analyst. You have been provided with all SITUATION REPORTS from Day 1 to Day {{{targetDay}}} of a Cadet attachment.

Analyze the following reports:
{{#each reports}}
---
{{{this}}}
---
{{/each}}

Your task is to synthesize this data into a comprehensive CUMULATIVE PROGRESS REPORT.
1. **Executive Summary**: Narrate the overall trajectory of the attachment up to Day {{{targetDay}}}.
2. **Key Achievements**: List significant duties performed and operational goals met.
3. **Operational Trends**: Identify evolving patterns in performance, security, and discipline.
4. **Critical Challenges**: Highlight persistent issues that need Command attention.
5. **Strategic Recommendations**: Provide guidance for optimizing performance in the coming days.

Ensure the tone is formal, professional, and suitable for Command oversight.`,
});

const generateConsolidatedReportFlow = ai.defineFlow(
  {
    name: 'generateConsolidatedReportFlow',
    inputSchema: GenerateConsolidatedReportInputSchema,
    outputSchema: GenerateConsolidatedReportOutputSchema,
  },
  async (input) => {
    const { output } = await consolidatedPrompt(input);
    return output!;
  }
);
