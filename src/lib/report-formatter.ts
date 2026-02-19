/**
 * @fileOverview Utility to format report data into the standardized SITUATION REPORT format.
 */

export interface Incident {
  time: string;
  description: string;
}

export interface SituationReportInput {
  reportDate: string;
  companyName: string;
  unitName: string;
  dayNumber: string;
  operationalSummary: string;
  securitySituation: string;
  incidents: Incident[];
  actionTaken: string;
  dutiesConducted: string[];
  forceDiscipline: {
    casualties: string;
    disciplinaryCases: string;
  };
  challenges: string[];
  overallSummary: string;
  commanderName: string;
}

export function formatDailyReport(input: SituationReportInput): string {
  const {
    reportDate,
    companyName,
    unitName,
    dayNumber,
    operationalSummary,
    securitySituation,
    incidents,
    actionTaken,
    dutiesConducted,
    forceDiscipline,
    challenges,
    overallSummary,
    commanderName,
  } = input;

  let report = `Good evening Sir\n\n`;
  report += `*SITUATION REPORT AS ON ${reportDate}*\n\n`;
  report += `*${companyName} WITHIN ${unitName}*\n\n`;
  
  report += `1. On Day ${dayNumber} of the attachment, ${companyName} cadets within ${unitName} ${operationalSummary}\n\n`;
  
  report += `2. The general security situation remained ${securitySituation}. Handled professionally:\n\n`;
  
  if (incidents && incidents.length > 0) {
    report += `insidents: \n`;
    incidents.forEach(inc => {
      report += `At ${inc.time}, ${inc.description}\n`;
    });
    report += `\n`;
  }

  if (actionTaken) {
    report += `*3. Action Taken*: ${actionTaken}\n\n`;
  }

  if (dutiesConducted && dutiesConducted.length > 0) {
    report += `*4. Duties Conducted*\n\n`;
    dutiesConducted.forEach(duty => {
      report += `. ${duty}\n`;
    });
    report += `\n`;
  }

  report += `*5. Force Discipline*\n\n`;
  report += `. ${forceDiscipline.casualties || 'No casualties'}\n`;
  report += `. ${forceDiscipline.disciplinaryCases || 'No disciplinary cases'}\n\n`;

  if (challenges && challenges.length > 0) {
    report += `*6. Challenges* : ${challenges.join(' and ')}\n\n`;
  }

  report += `*Overall*\n\n`;
  report += `. ${overallSummary}\n\n`;
  report += `. Cadets continued to improve operational skills and professionalism. The security situation remains stable.\n\n`;

  report += `OC ${companyName.split(' ')[0]}: OC ${commanderName}\n\n`;
  report += `Respectfully.`;

  return report;
}
