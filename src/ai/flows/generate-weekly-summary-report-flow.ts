'use server';
/**
 * @fileOverview A Genkit flow for generating a consolidated weekly report from daily reports.
 *
 * - generateWeeklySummaryReport - A function that handles the weekly report generation process.
 * - GenerateWeeklySummaryReportInput - The input type for the generateWeeklySummaryReport function.
 * - GenerateWeeklySummaryReportOutput - The return type for the generateWeeklySummaryReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateWeeklySummaryReportInputSchema = z.object({
  startDate: z.string().describe('The start date of the reporting week in YYYY-MM-DD format.'),
  endDate: z.string().describe('The end date of the reporting week in YYYY-MM-DD format.'),
  dailyReports: z.array(z.string()).describe('An array of raw daily operational reports as strings.'),
});
export type GenerateWeeklySummaryReportInput = z.infer<typeof GenerateWeeklySummaryReportInputSchema>;

const GenerateWeeklySummaryReportOutputSchema = z.object({
  overallSecuritySituation: z.string().describe('A general statement summarizing the security status across all reported areas for the entire week.'),
  recurringChallenges: z.array(z.string()).describe('A list of challenges that appeared repeatedly across multiple daily reports.'),
  commonRecommendations: z.array(z.string()).describe('A list of recommendations that were mentioned frequently or are universally applicable based on the reports.'),
  weeklySummary: z.string().describe('A comprehensive narrative summary of the week\'s activities, key findings, and overall tone, incorporating the overall security situation, recurring challenges, and common recommendations.'),
});
export type GenerateWeeklySummaryReportOutput = z.infer<typeof GenerateWeeklySummaryReportOutputSchema>;

export async function generateWeeklySummaryReport(input: GenerateWeeklySummaryReportInput): Promise<GenerateWeeklySummaryReportOutput> {
  return generateWeeklySummaryReportFlow(input);
}

const generateWeeklySummaryReportPrompt = ai.definePrompt({
  name: 'generateWeeklySummaryReportPrompt',
  input: {schema: GenerateWeeklySummaryReportInputSchema},
  output: {schema: GenerateWeeklySummaryReportOutputSchema},
  prompt: `You are an AI assistant tasked with compiling weekly reports from a collection of daily operational reports. Your goal is to provide a concise, consolidated overview for a given week, highlighting key operational aspects.\n\nGiven the following daily reports from {{{startDate}}} to {{{endDate}}}:\n\n{{#each dailyReports}}\n---\nDaily Report:\n{{{this}}}\n---\n{{/each}}\n\nAnalyze the provided daily reports and extract the following:\n1.  **Overall Security Situation**: A general statement summarizing the security status across all reported areas for the entire week.\n2.  **Recurring Challenges**: Identify any challenges that appeared repeatedly across multiple daily reports. List them as bullet points.\n3.  **Common Recommendations**: Identify any recommendations that were mentioned frequently or are universally applicable based on the reports. List them as bullet points.\n4.  **Weekly Summary**: A comprehensive narrative summary of the week\'s activities, key findings, and overall tone, incorporating the overall security situation, recurring challenges, and common recommendations.\n\nEnsure your output is structured clearly as requested by the output schema, converting bullet points to array elements.`,
});

const generateWeeklySummaryReportFlow = ai.defineFlow(
  {
    name: 'generateWeeklySummaryReportFlow',
    inputSchema: GenerateWeeklySummaryReportInputSchema,
    outputSchema: GenerateWeeklySummaryReportOutputSchema,
  },
  async (input) => {
    const {output} = await generateWeeklySummaryReportPrompt(input);
    return output!;
  }
);
