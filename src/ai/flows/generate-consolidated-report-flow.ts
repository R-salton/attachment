
'use server';
/**
 * @fileOverview A Genkit flow for generating a consolidated report across a period of attachment days.
 * 
 * - generateConsolidatedReport - Synthesizes multiple SITREPs into a high-level briefing.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateConsolidatedReportInputSchema = z.object({
  targetDay: z.number().describe('The chronological day number up to which the reports are consolidated.'),
  reports: z.array(z.string()).describe('An array of raw SITREP transcripts (HTML or plain text).'),
});

export type GenerateConsolidatedReportInput = z.infer<typeof GenerateConsolidatedReportInputSchema>;

const GenerateConsolidatedReportOutputSchema = z.object({
  executiveSummary: z.string().describe('A high-level narrative overview of progress and operational status for the period.'),
  keyAchievements: z.array(z.string()).describe('Specific major milestones, duties completed, or operational successes.'),
  operationalTrends: z.array(z.string()).describe('Observed patterns in performance, security stability, or personnel discipline.'),
  criticalChallenges: z.array(z.string()).describe('Significant or persistent obstacles that impacted operations or morale.'),
  strategicRecommendations: z.array(z.string()).describe('Actionable guidance for optimizing performance in the subsequent phase.'),
});

export type GenerateConsolidatedReportOutput = z.infer<typeof GenerateConsolidatedReportOutputSchema>;

export async function generateConsolidatedReport(input: GenerateConsolidatedReportInput): Promise<GenerateConsolidatedReportOutput> {
  return generateConsolidatedReportFlow(input);
}

const consolidatedPrompt = ai.definePrompt({
  name: 'generateConsolidatedReportPrompt',
  input: { schema: GenerateConsolidatedReportInputSchema },
  output: { schema: GenerateConsolidatedReportOutputSchema },
  prompt: `You are an AI Operational Strategic Analyst for a Command Registry. You have been provided with all SITUATION REPORTS (SITREPs) spanning Day 1 to Day {{{targetDay}}} of a Cadet attachment.

Analyze the following transcripts carefully, looking for patterns, growth, and recurring issues:

{{#each reports}}
--- START OF REPORT ---
{{{this}}}
--- END OF REPORT ---
{{/each}}

Your task is to synthesize this raw data into a comprehensive CUMULATIVE PROGRESS BRIEFING.
1. **Executive Summary**: Narrate the overall trajectory and maturity of the attachment up to Day {{{targetDay}}}. Focus on operational evolution.
2. **Key Achievements**: List significant duties performed and operational goals successfully met.
3. **Operational Trends**: Identify evolving patterns in performance, security stability, and cadet discipline.
4. **Critical Challenges**: Highlight persistent or structural issues that require senior Command attention.
5. **Strategic Recommendations**: Provide actionable, high-level advice for optimizing performance in the remainder of the attachment.

Ensure the tone is authoritative, formal, and suitable for high-level Command oversight. Strip any HTML tags from your analysis, providing clean, professional text.`,
});

const generateConsolidatedReportFlow = ai.defineFlow(
  {
    name: 'generateConsolidatedReportFlow',
    inputSchema: GenerateConsolidatedReportInputSchema,
    outputSchema: GenerateConsolidatedReportOutputSchema,
  },
  async (input) => {
    const { output } = await consolidatedPrompt(input);
    if (!output) throw new Error("AI failed to generate synthesis.");
    return output;
  }
);
