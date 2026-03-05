'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const maxDuration = 120; // Increase timeout for heavy consolidation

const DailyBriefingSchema = z.object({
  dayLabel: z.string().describe('The date or day number (e.g., "Day 1 - 18 FEB 26").'),
  summary: z.string().describe('A comprehensive narrative summary of all unit activities and the overall situation for this specific day. DO NOT use markdown headers like ###.'),
  keyIncidents: z.array(z.string()).describe('Major incidents and the specific unit actions taken in response on this day.'),
  incidentCount: z.number().describe('Total number of incidents tracked on this specific day.'),
});

const TacticalLogEntrySchema = z.object({
  caseType: z.string().describe('The specific category of the case (e.g., "Theft", "Assault", "Illegal Kanyanga Production").'),
  occurrences: z.string().describe('Specific details of where and what happened across units. Avoid generic counts like "39 cases".'),
  actionTaken: z.string().describe('The specific tactical actions and resolutions implemented for these cases.'),
});

const UnitActivitySchema = z.object({
  unitName: z.string(),
  reportCount: z.number(),
});

const GenerateConsolidatedReportInputSchema = z.object({
  targetDay: z.number().describe('The chronological day number up to which the reports are consolidated.'),
  reports: z.array(z.string()).describe('An array of structured unit transcripts grouped by date.'),
  reportMode: z.enum(['CHRONOLOGICAL', 'OPERATION_SUMMARY']).default('CHRONOLOGICAL').describe('Whether to group by day or synthesize into a single operation-wide narrative.'),
});

export type GenerateConsolidatedReportInput = z.infer<typeof GenerateConsolidatedReportInputSchema>;

const GenerateConsolidatedReportOutputSchema = z.object({
  executiveSummary: z.string().describe('A high-level, narrative-driven executive overview of progress and operational status. DO NOT use markdown headers like ###.'),
  dailyBriefings: z.array(DailyBriefingSchema).optional().describe('A day-by-day detailed breakdown synthesizing all unit reports into a single daily command narrative.'),
  operationalNarrative: z.string().describe('A detailed, cohesive narrative of the entire attachment period, focusing on skills, objectives, and progress. No mention of specific days in headers. DO NOT use markdown headers like ###.'),
  tacticalLog: z.array(TacticalLogEntrySchema).describe('A merged list of specific tactical cases paired with their specific resolutions across the entire operation.'),
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
  prompt: `You are a Senior Strategic Analyst for a Police Command Registry. Synthesize multiple UNIT SITUATION REPORTS (SITREPs) into a single high-fidelity COMMAND REPORT for the "Officer Cadet Intake 14/25-26 Field Training Exercise".

Analyze the following transcripts:

{{#each reports}}
--- REGISTRY DATA START ---
{{{this}}}
--- REGISTRY DATA END ---
{{/each}}

### CURRENT MODE: {{{reportMode}}}

### CORE INSTRUCTIONS FOR TACTICAL LOG:
1. **SPECIFICITY & PAIRING**: DO NOT use generic summaries like "39 cases recorded" or "unspecified traffic incidents". For every case type (e.g., Theft, Abortion, Assault, Kanyanga Production, Public Disturbance), you MUST pair it with the specific Tactical Action Taken to resolve it.
2. **CATEGORY GROUPING**: Group multiple reports of the same case type into one entry but detail the specific outcomes and actions for each occurrence.
3. **EXCLUSIONS**: DO NOT include administrative tasks (Briefings, JOC planning, Station duties, Inductions, Sentry duties) as incidents. These belong in the "Operational Narrative" or "Executive Summary".

### CORE INSTRUCTIONS FOR NARRATIVE:
1. **Executive Summary**: Provide a high-level strategic narrative of the operational trajectory.
2. **Operational Narrative**: Create a comprehensive, formal story of the entire attachment. Focus on skills acquired, training objectives met, and general situational awareness. Include administrative duties here.
3. **Formatting**: STRIP ALL MARKDOWN HEADERS (###) and bolding symbols (*). Return pure narrative strings. DO NOT USE ANY MARKDOWN FOR HEADERS.

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
      
      const sanitize = (text: string) => text.replace(/###/g, '').replace(/\*/g, '').trim();
      
      return {
        ...output,
        executiveSummary: sanitize(output.executiveSummary),
        operationalNarrative: sanitize(output.operationalNarrative),
        dailyBriefings: output.dailyBriefings?.map(d => ({
          ...d,
          summary: sanitize(d.summary)
        }))
      };
    } catch (error: any) {
      console.error("AI Overall Report Error:", error);
      throw new Error(`Strategic synthesis failed: ${error.message || 'Unknown AI error'}`);
    }
  }
);
