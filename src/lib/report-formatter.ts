
/**
 * @fileOverview Utility to format report data into the standardized SITUATION REPORT format (HTML).
 */

export interface Incident {
  time: string;
  description: string;
}

export interface SituationReportInput {
  reportDate: string;
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
  recommendations: string[];
  overallSummary: string;
  commanderName: string;
  orderlyOfficerReport?: string;
}

export function formatDailyReport(input: SituationReportInput): string {
  const {
    reportDate,
    unitName,
    dayNumber,
    operationalSummary,
    securitySituation,
    incidents,
    actionTaken,
    dutiesConducted,
    forceDiscipline,
    challenges,
    recommendations,
    overallSummary,
    commanderName,
    orderlyOfficerReport,
  } = input;

  let html = `<div class="report-container font-report">`;
  
  // If there is an Orderly Officer report, it defines the entire document as an Overall Report
  if (orderlyOfficerReport) {
    html += `<h1 class="text-2xl md:text-3xl font-black text-primary uppercase border-l-4 border-primary pl-4 mb-8">OVERALL REPORT AS ON ${reportDate}</h1>`;
    html += `<div class="orderly-narrative mb-10 prose prose-slate max-w-none">${orderlyOfficerReport}</div>`;
    html += `<hr class="my-10 border-t-2 border-dashed border-slate-200" />`;
    html += `<h2 class="text-xl font-black text-slate-500 uppercase tracking-widest mb-6">Operational Details</h2>`;
  } else {
    // Standard Unit Situation Report
    html += `<h1 class="text-2xl font-black text-slate-900 uppercase border-b-2 border-primary pb-4 mb-8">SITUATION REPORT AS ON ${reportDate}</h1>`;
    html += `<h3 class="text-lg font-black text-primary mb-6">UNIT: ${unitName}</h3>`;
  }
  
  html += `<p class="mb-6"><strong>1.</strong> On Day <strong>${dayNumber}</strong> of the attachment, cadets within <strong>${unitName}</strong> ${operationalSummary}</p>`;
  
  html += `<p class="mb-6"><strong>2.</strong> The general security situation remained <strong>${securitySituation}</strong>. Handled professionally:</p>`;
  
  if (incidents && incidents.length > 0) {
    html += `<div class="incidents-section mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">`;
    html += `<p class="text-xs font-black uppercase text-slate-400 mb-2 tracking-widest">Incident Log:</p>`;
    html += `<ul class="list-none space-y-2">`;
    incidents.forEach(inc => {
      html += `<li class="text-sm"><strong>At ${inc.time}:</strong> ${inc.description}</li>`;
    });
    html += `</ul></div>`;
  }

  if (actionTaken) {
    html += `<p class="mb-6"><strong>3. Action Taken:</strong> ${actionTaken}</p>`;
  }

  if (dutiesConducted && dutiesConducted.length > 0) {
    html += `<div class="mb-6"><strong>4. Duties Conducted:</strong>`;
    html += `<ul class="list-disc ml-6 mt-2 space-y-1">`;
    dutiesConducted.forEach(duty => {
      html += `<li>${duty}</li>`;
    });
    html += `</ul></div>`;
  }

  html += `<div class="mb-6"><strong>5. Force Discipline:</strong>`;
  html += `<ul class="list-disc ml-6 mt-2 space-y-1">`;
  html += `<li>${forceDiscipline.casualties || 'No casualties'}</li>`;
  html += `<li>${forceDiscipline.disciplinaryCases || 'No disciplinary cases'}</li>`;
  html += `</ul></div>`;

  if (challenges && challenges.length > 0) {
    html += `<p class="mb-6"><strong>6. Challenges:</strong> ${challenges.join(' and ')}</p>`;
  }

  if (recommendations && recommendations.length > 0) {
    html += `<p class="mb-6"><strong>7. Recommendations:</strong> ${recommendations.join(' and ')}</p>`;
  }

  html += `<div class="overall-summary mb-10">`;
  html += `<p class="font-black uppercase text-primary mb-2 text-xs tracking-widest">Overall Assessment:</p>`;
  html += `<p class="font-bold border-l-2 border-primary pl-4">${overallSummary}</p>`;
  html += `</div>`;

  html += `<p class="mb-10 text-slate-600 italic">Cadets continued to improve operational skills and professionalism. The security situation remains stable.</p>`;

  html += `<div class="signature-block border-t border-slate-200 pt-6">`;
  html += `<p class="font-black uppercase text-slate-900">OC ${unitName}: OC ${commanderName}</p>`;
  html += `<p class="text-xs text-slate-400 uppercase tracking-widest mt-1">Respectfully Signed</p>`;
  html += `</div></div>`;

  return html;
}
