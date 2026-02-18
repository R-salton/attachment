/**
 * @fileOverview Utility to format report data into a standardized text format locally.
 */

import { GenerateDailyReportInput } from '@/ai/flows/generate-daily-report-flow';

export function formatDailyReport(input: GenerateDailyReportInput): string {
  const {
    reportDate,
    cadetsIntake,
    commanderName,
    gasaboSecuritySituation,
    gasaboActivities,
    gasaboSentryDuties,
    kicukiroSecuritySituation,
    kicukiroOperationTime,
    kicukiroOperationFocus,
    kicukiroIntroductionBy,
    kicukiroEmphasizedPoints,
    kicukiroSentryDuties,
    nyarugengeSecuritySituation,
    nyarugengeNyabugogoCases,
    nyarugengeInkundamahoroCases,
    nyarugengeKimisagaraCases,
    nyarugengeKimisagaraNotes,
    sifOperationTime,
    sifCompany,
    sifAreaOfOperation,
    sifSecuritySituation,
    sifOperationFocus,
    sifIntroductionBy,
    sifEmphasizedPoints,
    sifPatrolOperations,
    sifPatrolIncidentsFree,
    trsCompany,
    trsInductionTraining,
    trsRemarksBy,
    trsRemarksTime,
    trsDeploymentTime,
    trsDeploymentLocations,
    foxSecuritySituation,
    foxShiftDuration,
    foxCompany,
    foxBriefingBy,
    foxInductionTrainingLocation,
    foxCasesReportedCount,
    foxCasesReportedDistrict,
    foxCasesReportedDetails,
    foxFootPatrols,
    foxNightShiftsScheduled,
    challenges,
    recommendations,
    otherActivities
  } = input;

  let report = `Good Morning Sir,

Sir

*This is the General daily report for cadets intake ${cadetsIntake} Attachments operations as of ${reportDate}*

`;

  if (gasaboSecuritySituation) {
    report += `*GASABO DPU DAY ONE REPORT*\n\n`;
    report += `1. Alpha Company have conducted their operations in Gasabo DPU and the security situation remained ${gasaboSecuritySituation}.\n`;
    if (gasaboActivities && gasaboActivities.length > 0) {
      report += `2. Activities, They underwent focused on introduction to JOC planning and OC Station duties and responsibilities, emphasizing:\n`;
      gasaboActivities.forEach((act, idx) => {
        report += `   ${idx + 1}. ${act}\n`;
      });
    }
    if (gasaboSentryDuties) {
      report += `3. Also Activities varied by station and were conducted at DPU HQs and designated stations. Sentry duties were subsequently undertaken at DPU HQs and various stations.\n`;
    }
    report += `\n`;
  }

  if (kicukiroSecuritySituation) {
    report += `*REPORT FOR DPU KICUKIRO*\n\n`;
    report += `1. Today, Charlie Company conducted their operations in KICUKIRO DPU, from ${kicukiroOperationTime}, the security situation remained ${kicukiroSecuritySituation}.\n\n`;
    if (kicukiroOperationFocus) {
      report += `2. Today operations focused on ${kicukiroOperationFocus}.\n\n`;
    }
    if (kicukiroIntroductionBy) {
      report += `3. The introduction was conducted by the ${kicukiroIntroductionBy}, emphasizing:\n`;
      kicukiroEmphasizedPoints?.forEach((point, idx) => {
        const char = String.fromCharCode(97 + idx);
        report += `   (${char}) ${point}\n`;
      });
      report += `\n`;
    }
    if (kicukiroSentryDuties) {
      report += `4. Operations proceeded with sentry duties at various posts across all Police Stations.\n\n`;
    }
  }

  if (nyarugengeSecuritySituation) {
    report += `*DPU NYARUGENGE REPORT*\n\n`;
    report += `1. The security situation in Nyarugenge District was reported ${nyarugengeSecuritySituation}.\n\n`;
    
    const sum = (arr?: any[]) => arr?.reduce((acc, curr) => acc + (curr.count || 0), 0) || 0;
    const total = sum(nyarugengeNyabugogoCases) + sum(nyarugengeInkundamahoroCases) + sum(nyarugengeKimisagaraCases);

    report += `2. A total of ${total} cases were received distributed as follows:\n\n`;
    
    if (nyarugengeNyabugogoCases && nyarugengeNyabugogoCases.length > 0) {
      report += `   a)Nyabugogo Post: ${sum(nyarugengeNyabugogoCases)} cases\n`;
      nyarugengeNyabugogoCases.forEach(c => report += `   * ${c.caseType}: ${c.count}\n`);
    }

    if (nyarugengeInkundamahoroCases && nyarugengeInkundamahoroCases.length > 0) {
      report += `   b)Inkundamahoro Post: ${sum(nyarugengeInkundamahoroCases)} cases\n`;
      nyarugengeInkundamahoroCases.forEach(c => report += `   * ${c.caseType}: ${c.count}\n`);
    }

    if (nyarugengeKimisagaraCases && nyarugengeKimisagaraCases.length > 0) {
      report += `   c) Kimisagara Post: ${sum(nyarugengeKimisagaraCases)} cases\n`;
      nyarugengeKimisagaraCases.forEach(c => report += `   * ${c.caseType}: ${c.count}\n`);
      if (nyarugengeKimisagaraNotes) report += `   ${nyarugengeKimisagaraNotes}\n`;
    }
    report += `\n`;
  }

  if (sifSecuritySituation) {
    report += `*REPORT FOR SPECIAL INTERVENTION FORCE (SIF)*\n\n`;
    report += `1. Today, from ${sifOperationTime}, ${sifCompany} conducted their operations in SIF, the security situation in our area of operation namely; ${sifAreaOfOperation?.join(', ')} remained ${sifSecuritySituation}.\n\n`;
    if (sifOperationFocus) {
      report += `2. The first day of operations focused on ${sifOperationFocus}.\n\n`;
    }
    if (sifIntroductionBy) {
      report += `3. The introduction was conducted by the ${sifIntroductionBy}, emphasizing:\n`;
      sifEmphasizedPoints?.forEach((point, idx) => {
        const char = String.fromCharCode(97 + idx);
        report += `   (${char}) ${point}\n`;
      });
      report += `\n`;
    }
    if (sifPatrolOperations) {
      report += `4. Patrol operations (${sifPatrolOperations}) were conducted well with incidents ${sifPatrolIncidentsFree ? 'free' : 'reported'}.\n\n`;
    }
  }

  if (trsCompany) {
    report += `*TRAFFIC AND ROAD SAFETY DAY ONE REPORT*\n\n`;
    report += `1. ${trsCompany} was deployed in TRS, They underwent the different activities\n\n`;
    if (trsInductionTraining && trsInductionTraining.length > 0) {
      report += `2. Induction training was conducted covering ${trsInductionTraining.join(', ')}.\n\n`;
    }
    if (trsRemarksBy) {
      report += `3. Remarks were delivered by ${trsRemarksBy} from ${trsRemarksTime}.\n\n`;
    }
    if (trsDeploymentLocations && trsDeploymentLocations.length > 0) {
      report += `4. Deployment from ${trsDeploymentTime} was as follows; ${trsDeploymentLocations.join(', ')}.\n\n`;
    }
  }

  if (foxSecuritySituation) {
    report += `*REPORT FOR FOX UNIT*\n\n`;
    report += `1. The overall security situation across all areas of operation for TFU remained ${foxSecuritySituation} during the ${foxShiftDuration}. ${foxCompany} actively conducted its assigned activities within TFU during this period.\n\n`;
    if (foxBriefingBy) {
      report += `2. Operations commenced with a briefing by the ${foxBriefingBy}, outlining the concept of operations. Personnel were subsequently organized into six companies.\n\n`;
    }
    if (foxInductionTrainingLocation) {
      report += `3. A portion of the officers proceeded to ${foxInductionTrainingLocation} for induction training to enhance operational knowledge and performance.\n\n`;
    }
    if (foxCasesReportedDetails && foxCasesReportedDetails.length > 0) {
      report += `4. A total of ${foxCasesReportedCount} cases were reported during the shift in ${foxCasesReportedDistrict}:\n`;
      foxCasesReportedDetails.forEach(c => report += `   * ${c.caseType}: ${c.count}\n`);
      report += `\n`;
    }
    if (foxFootPatrols) report += `5. ${foxFootPatrols}\n\n`;
    if (foxNightShiftsScheduled) report += `6. ${foxNightShiftsScheduled}\n\n`;
    report += `7. Maintaining safety, security, and adherence to the rule of law remains the primary objective in accomplishing the mission.\n\n`;
  }

  if (challenges && challenges.length > 0) {
    report += `*CHALLENGES*\n`;
    challenges.forEach((c, idx) => report += `${idx + 1}. ${c}\n`);
    report += `\n`;
  }

  if (recommendations && recommendations.length > 0) {
    report += `*RECOMMENDATIONS*\n`;
    recommendations.forEach((r, idx) => report += `${idx + 1}. ${r}\n`);
    report += `\n`;
  }

  if (otherActivities && otherActivities.length > 0) {
    report += `*Other activities*\n`;
    otherActivities.forEach((a, idx) => report += `${idx + 1}. ${a}\n`);
    report += `\n`;
  }

  report += `Respectfully \n\nOc ${commanderName}\nCadet Commander`;

  return report;
}
