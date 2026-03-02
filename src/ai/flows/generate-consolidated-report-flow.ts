'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const DailyBriefingSchema = z.object({
  dayLabel: z.string().describe('The date or day number (e.g., "Day 1 - 18 FEB 26").'),
  summary: z.string().describe('A comprehensive narrative summary of all unit activities and the overall situation for this specific day. DO NOT use markdown headers like ###.'),
  keyIncidents: z.array(z.string()).describe('Major incidents and the specific unit actions taken in response on this day.'),
  incidentCount: z.number().describe('Total number of incidents tracked on this specific day.'),
});

const UnitActivitySchema = z.object({
  unitName: z.string(),
  reportCount: z.number(),
});

const GenerateConsolidatedReportInputSchema = z.object({
  targetDay: z.number().describe('The chronological day number up to which the reports are consolidated.'),
  reports: z.array(z.string()).describe('An array of raw SITREP transcripts.'),
});

export type GenerateConsolidatedReportInput = z.infer<typeof GenerateConsolidatedReportInputSchema>;

const GenerateConsolidatedReportOutputSchema = z.object({
  executiveSummary: z.string().describe('A high-level, narrative-driven executive overview of progress and operational status. DO NOT use markdown headers like ###.'),
  dailyBriefings: z.array(DailyBriefingSchema).describe('A day-by-day detailed breakdown synthesizing all unit reports into a single daily command narrative.'),
  forceWideAchievements: z.array(z.string()).describe('Specific major milestones or operational successes.'),
  operationalTrends: z.array(z.string()).describe('Observed patterns in performance, security stability, or personnel discipline.'),
  criticalChallenges: z.array(z.string()).describe('Significant or persistent obstacles.'),
  strategicRecommendations: z.array(z.string()).describe('Actionable guidance for Command.'),
  unitBreakdown: z.array(UnitActivitySchema).describe('Statistics on which units contributed the most records for the period.'),
});

export type GenerateConsolidatedReportOutput = z.infer<typeof GenerateConsolidatedReportOutputSchema>;

export async function generateConsolidatedReport(input: GenerateConsolidatedReportInput): Promise<GenerateConsolidatedReportOutput> {
  return generateConsolidatedReportFlow(input);
}

const consolidatedPrompt = ai.definePrompt({
  name: 'generateConsolidatedReportPrompt',
  input: { schema: GenerateConsolidatedReportInputSchema },
  output: { schema: GenerateConsolidatedReportOutputSchema },
  prompt: `You are a Senior Strategic Analyst for a Police Command Registry. Synthesize multiple UNIT SITUATION REPORTS (SITREPs) into a single high-fidelity OVERALL COMMAND REPORT.

Analyze the following transcripts:

{{#each reports}}
--- UNIT REPORT START ---
{{{this}}}
--- UNIT REPORT END ---
{{/each}}

### CORE INSTRUCTIONS:
1. **Aggregation Logic**: Group info by DATE/DAY. Merge overlapping unit reports into one "Daily Briefing".
2. **Executive Summary**: Provide a strategic narrative of the operational trajectory. 
3. **Daily Briefings**: Detail every day. List incidents and actions. Count the number of incidents mentioned per day.
4. **Data Analytics**: Count how many reports each unit submitted based on the [UNIT: ...] tags in the text.
5. **Tone**: Authoritative, formal, tactical. 
6. **Formatting**: STRIP ALL MARKDOWN HEADERS (###) and HTML tags from the summary text. Return pure narrative strings. DO NOT USE ANY MARKDOWN FOR HEADERS.

Your response MUST strictly follow the JSON schema provided.`,
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
      
      // Secondary sanitization to ensure no ### exist in the strings
      const sanitize = (text: string) => text.replace(/###/g, '').replace(/\*/g, '').trim();
      
      return {
        ...output,
        executiveSummary: sanitize(output.executiveSummary),
        dailyBriefings: output.dailyBriefings.map(d => ({
          ...d,
          summary: sanitize(d.summary)
        }))
      };
    } catch (error: any) {
      console.error("AI Overall Report Error:", error);
      // Return a plain error message to the client to avoid serialization issues
      throw new Error(`Strategic synthesis failed: ${error.message || 'Unknown AI error'}`);
    }
  }
);
