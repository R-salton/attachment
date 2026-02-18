'use server';
/**
 * @fileOverview A Genkit flow for generating comprehensive daily reports based on structured input data.
 *
 * - generateDailyReport - A function that handles the daily report generation process.
 * - GenerateDailyReportInput - The input type for the generateDailyReport function.
 * - GenerateDailyReportOutput - The return type for the generateDailyReport function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const CaseDetailSchema = z.object({
  caseType: z.string().describe('The type of case (e.g., Theft, Street vending).'),
  count: z.number().int().min(0).describe('The number of cases of this type.'),
});

const GenerateDailyReportInputSchema = z.object({
  reportDate: z.string().describe('The date of the report (e.g., "16 FEB 26").'),
  cadetsIntake: z.string().describe('The cadets intake number (e.g., "14/2025-2026").'),
  commanderName: z.string().describe('The name of the cadet commander.'),

  // Gasabo DPU
  gasaboSecuritySituation: z.string().optional().describe('Security situation in Gasabo DPU.'),
  gasaboActivities: z.array(z.string()).optional().describe('List of activities in Gasabo DPU.'),
  gasaboSentryDuties: z.boolean().optional().describe('Whether sentry duties were undertaken in Gasabo DPU.'),

  // Kicukiro DPU
  kicukiroSecuritySituation: z.string().optional().describe('Security situation in Kicukiro DPU.'),
  kicukiroOperationTime: z.string().optional().describe('Operation time in Kicukiro DPU (e.g., "0600hrs to 1900hrs").'),
  kicukiroOperationFocus: z.string().optional().describe('Focus of operations in Kicukiro DPU.'),
  kicukiroIntroductionBy: z.string().optional().describe('Person who conducted the introduction in Kicukiro DPU.'),
  kicukiroEmphasizedPoints: z.array(z.string()).optional().describe('List of emphasized points in Kicukiro DPU.'),
  kicukiroSentryDuties: z.boolean().optional().describe('Whether sentry duties were undertaken in Kicukiro DPU.'),

  // Nyarugenge DPU
  nyarugengeSecuritySituation: z.string().optional().describe('Security situation in Nyarugenge DPU.'),
  nyarugengeNyabugogoCases: z.array(CaseDetailSchema).optional().describe('Cases reported at Nyabugogo Post.'),
  nyarugengeInkundamahoroCases: z.array(CaseDetailSchema).optional().describe('Cases reported at Inkundamahoro Post.'),
  nyarugengeKimisagaraCases: z.array(CaseDetailSchema).optional().describe('Cases reported at Kimisagara Post.'),
  nyarugengeKimisagaraNotes: z.string().optional().describe('Additional notes for Kimisagara Post.'),

  // Special Intervention Force (SIF)
  sifOperationTime: z.string().optional().describe('Operation time for SIF (e.g., "1400hrs to 2000hrs").'),
  sifCompany: z.string().optional().describe('Company involved in SIF operations (e.g., "Delta Company").'),
  sifAreaOfOperation: z.array(z.string()).optional().describe('Areas of SIF operation.'),
  sifSecuritySituation: z.string().optional().describe('Security situation in SIF area of operation.'),
  sifOperationFocus: z.string().optional().describe('Focus of SIF operations.'),
  sifIntroductionBy: z.string().optional().describe('Person who conducted the introduction for SIF.'),
  sifEmphasizedPoints: z.array(z.string()).optional().describe('List of emphasized points for SIF.'),
  sifPatrolOperations: z.string().optional().describe('Description of SIF patrol operations.'),
  sifPatrolIncidentsFree: z.boolean().optional().describe('Whether SIF patrol operations were incident-free.'),

  // Traffic and Road Safety (TRS)
  trsCompany: z.string().optional().describe('Company involved in TRS operations (e.g., "Echo company").'),
  trsInductionTraining: z.array(z.string()).optional().describe('List of topics covered in TRS induction training.'),
  trsRemarksBy: z.string().optional().describe('Persons who delivered remarks in TRS.'),
  trsRemarksTime: z.string().optional().describe('Timeframe for remarks in TRS (e.g., "0700hrs to 1130hrs").'),
  trsDeploymentTime: z.string().optional().describe('Timeframe for deployment in TRS (e.g., "1400hrs to 2000hrs").'),
  trsDeploymentLocations: z.array(z.string()).optional().describe('Locations for deployment in TRS.'),

  // FOX Unit
  foxSecuritySituation: z.string().optional().describe('Overall security situation for FOX Unit.'),
  foxShiftDuration: z.string().optional().describe('Duration of the shift for FOX Unit (e.g., "8-hour morning shift").'),
  foxCompany: z.string().optional().describe('Company involved in FOX Unit operations.'),
  foxBriefingBy: z.string().optional().describe('Person who conducted the briefing for FOX Unit.'),
  foxInductionTrainingLocation: z.string().optional().describe('Location for FOX Unit induction training.'),
  foxCasesReportedCount: z.number().int().min(0).optional().describe('Total number of cases reported for FOX Unit.'),
  foxCasesReportedDistrict: z.string().optional().describe('District where FOX Unit cases were reported.'),
  foxCasesReportedDetails: z.array(CaseDetailSchema).optional().describe('Details of cases reported for FOX Unit.'),
  foxFootPatrols: z.string().optional().describe('Description of FOX Unit foot patrols and community policing efforts.'),
  foxNightShiftsScheduled: z.string().optional().describe('Information about FOX Unit night shifts.'),

  // General Challenges, Recommendations, Other Activities
  challenges: z.array(z.string()).optional().describe('List of challenges encountered.'),
  recommendations: z.array(z.string()).optional().describe('List of recommendations.'),
  otherActivities: z.array(z.string()).optional().describe('List of other activities.'),
});

export type GenerateDailyReportInput = z.infer<typeof GenerateDailyReportInputSchema>;

const GenerateDailyReportOutputSchema = z.object({
  reportContent: z.string().describe('The full generated daily report formatted as a string.'),
});

export type GenerateDailyReportOutput = z.infer<typeof GenerateDailyReportOutputSchema>;

export async function generateDailyReport(input: GenerateDailyReportInput): Promise<GenerateDailyReportOutput> {
  return generateDailyReportFlow(input);
}

const reportPrompt = ai.definePrompt({
  name: 'generateDailyReportPrompt',
  input: { schema: GenerateDailyReportInputSchema },
  output: { schema: GenerateDailyReportOutputSchema },
  prompt: `Good Morning Sir,

Sir

*This is the General daily report for cadets intake {{cadetsIntake}} Attachments operations as of {{reportDate}}*

{{#if gasaboSecuritySituation}}
*GASABO DPU DAY ONE REPORT*

1. Alpha Company have conducted their operations in Gasabo DPU and the security situation remained {{gasaboSecuritySituation}}.
{{#if gasaboActivities}}
2. Activities, They underwent focused on introduction to JOC planning and OC Station duties and responsibilities, emphasizing:
{{#each gasaboActivities}}
   {{@index}}. {{{this}}}
{{/each}}
{{/if}}
{{#if gasaboSentryDuties}}
3. Also Activities varied by station and were conducted at DPU HQs and designated stations. Sentry duties were subsequently undertaken at DPU HQs and various stations.
{{/if}}
{{/if}}

{{#if kicukiroSecuritySituation}}
*REPORT FOR DPU KICUKIRO*

1. Today, Charlie Company conducted their operations in KICUKIRO DPU, from {{kicukiroOperationTime}}, the security situation remained {{kicukiroSecuritySituation}}.

{{#if kicukiroOperationFocus}}
2. Today operations focused on {{kicukiroOperationFocus}}.
{{/if}}

{{#if kicukiroIntroductionBy}}
3. The introduction was conducted by the {{kicukiroIntroductionBy}}, emphasizing:
{{#each kicukiroEmphasizedPoints}}
   ({{lookup @root (add @index 97)}}) {{{this}}}
{{/each}}
{{/if}}

{{#if kicukiroSentryDuties}}
4. Operations proceeded with sentry duties at various posts across all Police Stations.
{{/if}}
{{/if}}

{{#if nyarugengeSecuritySituation}}
*DPU NYARUGENGE REPORT*

1. The security situation in Nyarugenge District was reported {{nyarugengeSecuritySituation}}.

{{#if nyarugengeNyabugogoCases}}
2. A total of {{add (sum nyarugengeNyabugogoCases 'count') (sum nyarugengeInkundamahoroCases 'count') (sum nyarugengeKimisagaraCases 'count')}} cases were received distributed as follows:

   a)Nyabugogo Post: {{sum nyarugengeNyabugogoCases 'count'}} cases
{{#each nyarugengeNyabugogoCases}}
   * {{caseType}}: {{count}}
{{/each}}
{{/if}}

{{#if nyarugengeInkundamahoroCases}}
   b)Inkundamahoro Post: {{sum nyarugengeInkundamahoroCases 'count'}} cases
{{#each nyarugengeInkundamahoroCases}}
   * {{caseType}}: {{count}}
{{/each}}
{{/if}}

{{#if nyarugengeKimisagaraCases}}
c) Kimisagara Post: {{sum nyarugengeKimisagaraCases 'count'}} cases
{{#each nyarugengeKimisagaraCases}}
   * {{caseType}}: {{count}}
{{/each}}
{{#if nyarugengeKimisagaraNotes}}
   {{{nyarugengeKimisagaraNotes}}}
{{/if}}
{{/if}}
{{/if}}

{{#if sifSecuritySituation}}
*REPORT FOR SPECIAL INTERVENTION FORCE (SIF)*

1. Today, from {{sifOperationTime}}, {{sifCompany}} conducted their operations in SIF, the security situation in our area of operation namely; {{#each sifAreaOfOperation}}{{this}}{{#unless @last}}, {{/unless}}{{/each}} remained {{sifSecuritySituation}}.

{{#if sifOperationFocus}}
2. The first day of operations focused on {{sifOperationFocus}}.
{{/if}}

{{#if sifIntroductionBy}}
3. The introduction was conducted by the {{sifIntroductionBy}}, emphasizing:
{{#each sifEmphasizedPoints}}
   ({{lookup @root (add @index 97)}}) {{{this}}}
{{/each}}
{{/if}}

{{#if sifPatrolOperations}}
4. Patrol operations ({{sifPatrolOperations}}) were conducted well with incidents {{#if sifPatrolIncidentsFree}}free{{else}}reported{{/if}}.
{{/if}}
{{/if}}

{{#if trsCompany}}
*TRAFFIC AND ROAD SAFETY DAY ONE REPORT*

1. {{trsCompany}} was deployed in TRS, They underwent the different activities

{{#if trsInductionTraining}}
2. Induction training was conducted covering {{#each trsInductionTraining}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}.
{{/if}}

{{#if trsRemarksBy}}
3. Remarks were delivered by {{trsRemarksBy}} from {{trsRemarksTime}}.
{{/if}}

{{#if trsDeploymentLocations}}
4. Deployment from {{trsDeploymentTime}} was as follows; {{#each trsDeploymentLocations}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}.
{{/if}}
{{/if}}

{{#if foxSecuritySituation}}
*REPORT FOR FOX UNIT*

1. The overall security situation across all areas of operation for TFU remained {{foxSecuritySituation}} during the {{foxShiftDuration}}. {{foxCompany}} actively conducted its assigned activities within TFU during this period.

{{#if foxBriefingBy}}
2. Operations commenced with a briefing by the {{foxBriefingBy}}, outlining the concept of operations. Personnel were subsequently organized into six companies.
{{/if}}

{{#if foxInductionTrainingLocation}}
3. A portion of the officers proceeded to {{foxInductionTrainingLocation}} for induction training to enhance operational knowledge and performance.
{{/if}}

{{#if foxCasesReportedCount}}
4. A total of {{foxCasesReportedCount}} cases were reported during the shift in {{foxCasesReportedDistrict}}:
{{#each foxCasesReportedDetails}}
   * {{caseType}}: {{count}}
{{/each}}
{{/if}}

{{#if foxFootPatrols}}
5. {{foxFootPatrols}}
{{/if}}

{{#if foxNightShiftsScheduled}}
6. {{foxNightShiftsScheduled}}
{{/if}}

7. Maintaining safety, security, and adherence to the rule of law remains the primary objective in accomplishing the missi
{{/if}}

{{#if challenges}}
*CHALLENGES*
{{#each challenges}}
{{@index}}. {{{this}}}
{{/each}}
{{/if}}

{{#if recommendations}}
*RECOMMENDATIONS*
{{@index}}. {{#each recommendations}}
{{@index}}. {{{this}}}
{{/each}}
{{/if}}

{{#if otherActivities}}
*Other activities*
{{#each otherActivities}}
{{add @index 1}}. {{{this}}}
{{/each}}
{{/if}}


Respectfully 

Oc {{commanderName}}
Cadet Commander`,
  helpers: {
    add: (a: number, b: number) => a + b,
    sum: (arr: { count: number }[], field: string) => arr.reduce((acc, curr) => acc + curr[field as keyof typeof curr], 0),
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
    return output!;
  }
);
