'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const IncidentEventSchema = z.object({
  dayLabel: z.string().describe('The day identifier (e.g., "Day 1", "Day 2", or the specific date).'),
  events: z.array(z.string()).describe('A list of specific incidents and actions taken on that day.'),
});

const GenerateConsolidatedReportInputSchema = z.object({
  targetDay: z.number().describe('The chronological day number up to which the reports are consolidated.'),
  reports: z.array(z.string()).describe('An array of raw SITREP transcripts (HTML or plain text).'),
});

export type GenerateConsolidatedReportInput = z.infer<typeof GenerateConsolidatedReportInputSchema>;

const GenerateConsolidatedReportOutputSchema = z.object({
  executiveSummary: z.string().describe('A deep, narrative-driven executive overview of progress and operational status.'),
  keyAchievements: z.array(z.string()).describe('Specific major milestones, duties completed, or operational successes.'),
  operationalTrends: z.array(z.string()).describe('Observed patterns in performance, security stability, or personnel discipline.'),
  criticalChallenges: z.array(z.string()).describe('Significant or persistent obstacles that impacted operations or morale.'),
  strategicRecommendations: z.array(z.string()).describe('Actionable, high-level guidance for optimizing performance in the subsequent phase.'),
  incidentTimeline: z.array(IncidentEventSchema).describe('A day-by-day detailed breakdown specifically mapping incidents to actions taken.'),
});

export type GenerateConsolidatedReportOutput = z.infer<typeof GenerateConsolidatedReportOutputSchema>;

/**
 * Consolidates multiple operational reports into a strategic briefing.
 */
export async function generateConsolidatedReport(input: GenerateConsolidatedReportInput): Promise<GenerateConsolidatedReportOutput> {
  return generateConsolidatedReportFlow(input);
}

const consolidatedPrompt = ai.definePrompt({
  name: 'generateConsolidatedReportPrompt',
  input: { schema: GenerateConsolidatedReportInputSchema },
  output: { schema: GenerateConsolidatedReportOutputSchema },
  prompt: `You are an AI Operational Strategic Analyst for a Command Registry. You are synthesizing multiple SITUATION REPORTS (SITREPs) into a CUMULATIVE PROGRESS BRIEFING.

Analyze the following transcripts meticulously:

{{#each reports}}
--- REPORT START ---
{{{this}}}
--- REPORT END ---
{{/each}}

Your task is to provide a much more detailed synthesis than a standard summary. 

1. **Executive Summary**: Provide a high-fidelity narrative of the overall operational trajectory. Do not just summarize; analyze progress.
2. **Key Achievements**: List significant duties and milestones met.
3. **Operational Trends**: Identify patterns in security, stability, and discipline.
4. **Critical Challenges**: Highlight persistent structural or situational obstacles.
5. **Strategic Recommendations**: Provide actionable, professional guidance for Command.
6. **Detailed Incident Timeline**: For every single report provided, create an entry in the timeline. Extract the incidents logged AND the specific actions taken in response. Ensure the 'dayLabel' identifies the date or chronological day clearly.

Ensure the tone is authoritative, professional, and tactical. Strip all HTML tags from your analysis, providing only clean, strategic text. Your response MUST strictly follow the JSON schema provided.`,
});

const generateConsolidatedReportFlow = ai.defineFlow(
  {
    name: 'generateConsolidatedReportFlow',
    inputSchema: GenerateConsolidatedReportInputSchema,
    outputSchema: GenerateConsolidatedReportOutputSchema,
  },
  async (input) => {
    // Basic validation to prevent empty input crashes
    if (!input.reports || input.reports.length === 0) {
      throw new Error("No reports provided for synthesis.");
    }

    try {
      const { output } = await consolidatedPrompt(input);
      if (!output) throw new Error("AI failed to generate a valid synthesis object.");
      return output;
    } catch (error: any) {
      console.error("AI Synthesis Error:", error);
      throw new Error(`Strategic analysis failed: ${error.message}`);
    }
  }
);
