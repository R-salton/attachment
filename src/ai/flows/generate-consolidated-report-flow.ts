'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const DailyBriefingSchema = z.object({
  dayLabel: z.string().describe('The date or day number (e.g., "Day 1 - 18 FEB 26").'),
  summary: z.string().describe('A comprehensive narrative summary of all unit activities and the overall situation for this specific day.'),
  keyIncidents: z.array(z.string()).describe('Major incidents and the specific unit actions taken in response on this day.'),
});

const GenerateConsolidatedReportInputSchema = z.object({
  targetDay: z.number().describe('The chronological day number up to which the reports are consolidated.'),
  reports: z.array(z.string()).describe('An array of raw SITREP transcripts (HTML or plain text).'),
});

export type GenerateConsolidatedReportInput = z.infer<typeof GenerateConsolidatedReportInputSchema>;

const GenerateConsolidatedReportOutputSchema = z.object({
  executiveSummary: z.string().describe('A high-level, narrative-driven executive overview of progress and operational status for the entire period.'),
  dailyBriefings: z.array(DailyBriefingSchema).describe('A day-by-day detailed breakdown synthesizing all unit reports into a single daily command narrative.'),
  forceWideAchievements: z.array(z.string()).describe('Specific major milestones, duties completed, or operational successes across all units.'),
  operationalTrends: z.array(z.string()).describe('Observed patterns in performance, security stability, or personnel discipline.'),
  criticalChallenges: z.array(z.string()).describe('Significant or persistent obstacles that impacted operations or morale.'),
  strategicRecommendations: z.array(z.string()).describe('Actionable, professional guidance for Command based on the consolidated data.'),
});

export type GenerateConsolidatedReportOutput = z.infer<typeof GenerateConsolidatedReportOutputSchema>;

/**
 * Consolidates multiple operational reports into a detailed "Overall Report".
 */
export async function generateConsolidatedReport(input: GenerateConsolidatedReportInput): Promise<GenerateConsolidatedReportOutput> {
  return generateConsolidatedReportFlow(input);
}

const consolidatedPrompt = ai.definePrompt({
  name: 'generateConsolidatedReportPrompt',
  input: { schema: GenerateConsolidatedReportInputSchema },
  output: { schema: GenerateConsolidatedReportOutputSchema },
  prompt: `You are an AI Senior Operational Analyst for a Police/Military Command Registry. Your mission is to synthesize multiple individual UNIT SITUATION REPORTS (SITREPs) into a single, high-fidelity OVERALL REPORT.

Analyze the following transcripts meticulously:

{{#each reports}}
--- UNIT REPORT START ---
{{{this}}}
--- UNIT REPORT END ---
{{/each}}

### CORE INSTRUCTIONS:
1. **Aggregation Logic**: You must group information by DATE/DAY. If multiple units (e.g., Gasabo DPU and TRS) reported on the same day, merge their activities into one "Daily Briefing".
2. **Executive Summary**: Provide a strategic narrative of the overall operational trajectory. Analyze how units performed collectively.
3. **Daily Briefings**: For every unique day found in the transcripts, create a detailed entry. Summarize what all units did, list all major incidents across those units, and detail the actions taken.
4. **Force-Wide Achievements**: List significant milestones met by the attachment as a whole.
5. **Operational Trends**: Identify patterns in security, stability, and discipline across units.
6. **Critical Challenges**: Highlight persistent structural or situational obstacles.
7. **Strategic Recommendations**: Provide actionable, professional guidance for senior Command.

Ensure the tone is authoritative, formal, and tactical. Strip all HTML tags from your analysis. Your response MUST strictly follow the JSON schema provided.`,
});

const generateConsolidatedReportFlow = ai.defineFlow(
  {
    name: 'generateConsolidatedReportFlow',
    inputSchema: GenerateConsolidatedReportInputSchema,
    outputSchema: GenerateConsolidatedReportOutputSchema,
  },
  async (input) => {
    if (!input.reports || input.reports.length === 0) {
      throw new Error("No operational records provided for synthesis.");
    }

    try {
      const { output } = await consolidatedPrompt(input);
      if (!output) throw new Error("AI failed to generate a valid overall report object.");
      return output;
    } catch (error: any) {
      console.error("AI Overall Report Error:", error);
      throw new Error(`Strategic synthesis failed: ${error.message}`);
    }
  }
);
