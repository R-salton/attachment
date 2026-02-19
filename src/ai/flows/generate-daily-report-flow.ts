'use server';
/**
 * @fileOverview A Genkit flow for generating standardized Situation Reports.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const IncidentSchema = z.object({
  time: z.string().describe('The DTG/Time of the incident (e.g., "181020B FEB 26").'),
  description: z.string().describe('A detailed description of the incident.'),
});

const GenerateDailyReportInputSchema = z.object({
  reportDate: z.string().describe('The date of the report (e.g., "18 Feb 26").'),
  companyName: z.string().describe('The name of the company (e.g., "ALPHA COMPANY").'),
  unitName: z.string().describe('The name of the unit (e.g., "TRS").'),
  dayNumber: z.string().describe('The day number of the attachment.'),
  operationalSummary: z.string().describe('Description of core activities (starts with: "continued performing...").'),
  securitySituation: z.string().describe('The general security status (e.g., "calm and stable").'),
  incidents: z.array(IncidentSchema).optional().describe('List of specific incidents.'),
  actionTaken: z.string().optional().describe('Actions taken in response to incidents.'),
  dutiesConducted: z.array(z.string()).describe('List of specific duties performed.'),
  forceDiscipline: z.object({
    casualties: z.string(),
    disciplinaryCases: z.string(),
  }),
  challenges: z.array(z.string()).describe('List of challenges encountered.'),
  overallSummary: z.string().describe('Narrative overall status.'),
  commanderName: z.string().describe('The name of the signing officer.'),
});

export type GenerateDailyReportInput = z.infer<typeof GenerateDailyReportInputSchema>;

const GenerateDailyReportOutputSchema = z.object({
  reportContent: z.string().describe('The full generated Situation Report formatted as a string.'),
});

export type GenerateDailyReportOutput = z.infer<typeof GenerateDailyReportOutputSchema>;

export async function generateDailyReport(input: GenerateDailyReportInput): Promise<GenerateDailyReportOutput> {
  return generateDailyReportFlow(input);
}

const reportPrompt = ai.definePrompt({
  name: 'generateDailyReportPrompt',
  input: { schema: GenerateDailyReportInputSchema },
  output: { schema: GenerateDailyReportOutputSchema },
  prompt: `Good evening Sir

*SITUATION REPORT AS ON {{{reportDate}}}*

*{{{companyName}}} WITHIN {{{unitName}}}*

1. On Day {{{dayNumber}}} of the attachment, {{{companyName}}} cadets within {{{unitName}}} {{{operationalSummary}}}

2. The general security situation remained {{{securitySituation}}}. Handled professionally:

{{#if incidents}}
insidents: 
{{#each incidents}}
At {{{time}}}, {{{description}}}
{{/each}}
{{/if}}

{{#if actionTaken}}
*3. Action Taken*: {{{actionTaken}}}
{{/if}}

*4. Traffic Duties Conducted*

{{#each dutiesConducted}}
. {{{this}}}
{{/each}}

*5. Force Discipline*

. {{{forceDiscipline.casualties}}}
. {{{forceDiscipline.disciplinaryCases}}}

*6. Challenges* : {{#each challenges}}{{{this}}}{{#unless @last}} and {{/unless}}{{/each}}

*Overall*

. {{{overallSummary}}}

. Cadets continued to improve operational skills and professionalism. The security situation remains stable.

OC {{companyNamePrefix companyName}}: OC {{{commanderName}}}

Respectfully.`,
  helpers: {
    companyNamePrefix: (name: string) => name.split(' ')[0],
  },
});

const generateDailyReportFlow = ai.defineFlow(
  {
    name: 'generateDailyReportFlow',
    inputSchema: GenerateDailyReportInputSchema,
    outputSchema: GenerateDailyReportOutputSchema,
  },
  async (input) => {
    const { output } = await reportPrompt(input);
    return {
      reportContent: output!.reportContent
    };
  }
);
