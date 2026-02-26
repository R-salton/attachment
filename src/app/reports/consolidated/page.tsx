"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore } from '@/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  Sparkles, 
  ArrowLeft, 
  Download, 
  ShieldCheck, 
  Activity, 
  ListChecks, 
  AlertCircle, 
  Lightbulb,
  FileDown,
  CalendarDays,
  Target,
  Clock,
  ChevronRight,
  Zap,
  Layers,
  ImageIcon,
  TrendingUp,
  FileText
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/hooks/use-user-profile';
import { generateConsolidatedReport, GenerateConsolidatedReportOutput } from '@/ai/flows/generate-consolidated-report-flow';
import { exportReportToDocx } from '@/lib/export-docx';
import { cn } from '@/lib/utils';

export default function ConsolidatedReportPage() {
  const router = useRouter();
  const { toast } = useToast();
  const db = useFirestore();
  const { isAdmin, isCommander, isLeader, isLoading: isAuthLoading } = useUserProfile();

  const [targetDaySpan, setTargetDaySpan] = useState<number>(7);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GenerateConsolidatedReportOutput | null>(null);
  const [consolidatedImages, setConsolidatedImages] = useState<string[]>([]);

  const handleGenerate = async (all = false) => {
    if (!db) return;
    setIsGenerating(true);
    setResult(null);
    setConsolidatedImages([]);

    try {
      const reportsRef = collection(db, 'reports');
      // Fetch everything to determine the timeline
      const q = query(reportsRef, orderBy('createdAt', 'asc'));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        toast({ 
          variant: "destructive", 
          title: "Registry Empty", 
          description: "No situational reports found in the official command archive." 
        });
        setIsGenerating(false);
        return;
      }

      const allReports = snapshot.docs.map(doc => ({ 
        ...doc.data(), 
        id: doc.id 
      }) as any);

      // Determine unique chronological sequence based on reportDate strings
      // Note: In a production app, these should be Date objects, but we use the unique sequence of filed reports.
      const uniqueDates: string[] = [];
      allReports.forEach(r => {
        if (r.reportDate && !uniqueDates.includes(r.reportDate)) {
          uniqueDates.push(r.reportDate);
        }
      });

      const spanCount = all ? uniqueDates.length : Math.min(targetDaySpan, uniqueDates.length);
      const selectedDates = uniqueDates.slice(0, spanCount);

      const filteredReports = allReports.filter(r => selectedDates.includes(r.reportDate));
      
      // Clean texts for AI processing
      const reportTexts = filteredReports.map(r => {
        // Strip HTML if present for cleaner AI input
        const div = document.createElement('div');
        div.innerHTML = r.fullText || "";
        return div.innerText || div.textContent || "";
      }).filter(Boolean);
      
      // Harvest all media evidence
      const images: string[] = [];
      filteredReports.forEach(r => {
        if (r.images && Array.isArray(r.images)) {
          images.push(...r.images);
        }
      });
      setConsolidatedImages(images);

      if (reportTexts.length === 0) {
        throw new Error("No textual SITREPs found in the selected range.");
      }

      // Strategic AI Synthesis
      const synthesis = await generateConsolidatedReport({
        targetDay: spanCount,
        reports: reportTexts
      });

      setResult(synthesis);
      if (all) setTargetDaySpan(uniqueDates.length);
      
      toast({ 
        title: "Strategic Briefing Complete", 
        description: `Successfully synthesized ${filteredReports.length} records across ${spanCount} operational days.` 
      });
    } catch (error: any) {
      console.error("Consolidation Error:", error);
      toast({ 
        variant: "destructive", 
        title: "Synthesis Error", 
        description: error.message || "The Command AI encountered a timeout. Try a smaller range." 
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = async () => {
    if (!result) return;
    
    // Prepare a structured text for the DOCX export
    let docContent = `### EXECUTIVE STRATEGIC ANALYSIS\n${result.executiveSummary}\n\n`;
    
    docContent += `### TACTICAL TIMELINE (INCIDENTS & ACTIONS)\n`;
    result.incidentTimeline.forEach(day => {
      docContent += `*${day.dayLabel.toUpperCase()}*\n`;
      day.events.forEach(event => {
        docContent += `• ${event}\n`;
      });
      docContent += `\n`;
    });

    docContent += `### MAJOR OPERATIONAL ACHIEVEMENTS\n${result.keyAchievements.map(a => `• ${a}`).join('\n')}\n\n`;
    docContent += `### OBSERVED OPERATIONAL TRENDS\n${result.operationalTrends.map(t => `• ${t}`).join('\n')}\n\n`;
    docContent += `### CRITICAL CHALLENGES ENCOUNTERED\n${result.criticalChallenges.map(c => `• ${c}`).join('\n')}\n\n`;
    docContent += `### STRATEGIC COMMAND RECOMMENDATIONS\n${result.strategicRecommendations.map(r => `• ${r}`).join('\n')}`;

    try {
      await exportReportToDocx({
        reportTitle: `CUMULATIVE STRATEGIC BRIEFING - DAY 1 TO ${targetDaySpan}`,
        reportDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).toUpperCase(),
        unit: 'COMMAND REGISTRY OVERALL ANALYSIS',
        fullText: docContent,
        reportingCommanderName: 'Strategic AI Command Analyst',
        images: consolidatedImages
      });
      toast({ title: "Briefing Exported", description: "Strategic Document has been downloaded." });
    } catch (e) {
      toast({ variant: "destructive", title: "Export Failed", description: "Could not generate DOCX file." });
    }
  };

  if (isAuthLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin && !isCommander && !isLeader) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 p-10 text-center">
        <ShieldAlert className="h-20 w-20 text-destructive mb-6" />
        <h2 className="text-3xl font-black uppercase tracking-tighter">Access Unauthorized</h2>
        <p className="text-slate-500 max-w-md mt-2 font-bold uppercase tracking-tight">Only Command personnel may authorize cumulative briefings.</p>
        <Button onClick={() => router.push('/')} className="mt-8 rounded-2xl h-14 px-12 font-black shadow-xl">Return Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#f1f5f9] pb-32">
      <header className="border-b bg-white/95 backdrop-blur-md px-6 md:px-12 py-8 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-8">
          <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="h-14 w-14 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-white shadow-sm">
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600">Strategic Intelligence</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900 leading-none uppercase">Cumulative Progress Briefing</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto mt-12 px-6 md:px-12 space-y-12">
        <Card className="border-none shadow-3xl rounded-[3rem] bg-white overflow-hidden ring-1 ring-slate-100">
          <CardHeader className="bg-slate-900 text-white p-10">
            <div className="flex items-center gap-4 mb-2">
              <Zap className="h-6 w-6 text-primary" />
              <span className="text-xs font-black uppercase tracking-widest text-primary">Operational Synthesis Engine</span>
            </div>
            <CardTitle className="text-2xl font-black">Generate Tactical Briefing</CardTitle>
            <CardDescription className="text-slate-400 font-bold max-w-2xl text-base">Select a specific operational span or synthesize the entire registry to extract trends, challenges, and detailed incident timelines.</CardDescription>
          </CardHeader>
          <CardContent className="p-10 space-y-10">
            <div className="flex flex-col md:flex-row items-end gap-8 bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
              <div className="w-full md:w-72 space-y-3">
                <Label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Analysis Period (Days)</Label>
                <div className="relative">
                  <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input 
                    type="number" 
                    min={1} 
                    value={targetDaySpan} 
                    onChange={e => setTargetDaySpan(parseInt(e.target.value) || 1)}
                    className="flex h-14 w-full rounded-2xl border border-slate-200 bg-white px-12 py-2 text-xl font-black ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                <Button 
                  onClick={() => handleGenerate(false)} 
                  disabled={isGenerating}
                  className="h-14 px-10 rounded-2xl font-black shadow-2xl shadow-blue-600/30 bg-blue-600 hover:bg-blue-700 text-base"
                >
                  {isGenerating ? <Loader2 className="animate-spin mr-3 h-6 w-6" /> : <Sparkles className="mr-3 h-6 w-6" />}
                  SYNTHESIZE PERIOD
                </Button>
                <Button 
                  onClick={() => handleGenerate(true)} 
                  disabled={isGenerating}
                  variant="outline"
                  className="h-14 px-10 rounded-2xl font-black border-slate-200 bg-white hover:bg-slate-50 shadow-sm text-base"
                >
                  {isGenerating ? <Loader2 className="animate-spin mr-3 h-6 w-6" /> : <Layers className="mr-3 h-6 w-6 text-blue-600" />}
                  CONSOLIDATE FULL REGISTRY
                </Button>
              </div>
            </div>

            {isGenerating && (
              <div className="py-32 flex flex-col items-center justify-center gap-8 animate-in fade-in zoom-in-95 duration-700">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-600/20 blur-3xl rounded-full" />
                  <Loader2 className="h-24 w-24 animate-spin text-blue-600 relative z-10" />
                </div>
                <div className="text-center space-y-3">
                  <p className="text-3xl font-black text-slate-900 uppercase tracking-tighter">AI Command Synthesis Active</p>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest animate-pulse">Analyzing tactical records and operational media artifacts...</p>
                </div>
              </div>
            )}

            {result && (
              <div className="space-y-16 animate-in fade-in slide-in-from-bottom-12 duration-1000">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-slate-100 pb-12">
                  <div className="space-y-3">
                    <h3 className="text-4xl md:text-5xl font-black text-slate-900 uppercase tracking-tighter">Strategic Analysis</h3>
                    <div className="flex items-center gap-3">
                      <Badge className="bg-blue-600 text-white border-none font-black text-xs uppercase px-4 py-1.5 rounded-lg shadow-lg shadow-blue-600/20">
                        Operational Span: Day 1 to {targetDaySpan}
                      </Badge>
                      <Badge variant="outline" className="border-slate-200 text-slate-400 font-bold text-xs uppercase px-4 py-1.5 rounded-lg">
                        Source: Command Archive
                      </Badge>
                    </div>
                  </div>
                  <Button onClick={handleExport} className="rounded-2xl h-16 px-10 font-black bg-slate-900 hover:bg-slate-800 shadow-3xl shadow-slate-900/20 text-lg transition-all active:scale-95">
                    <FileDown className="h-6 w-6 mr-3" />
                    DOWNLOAD STRATEGIC DOCX
                  </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                   <div className="lg:col-span-3 space-y-16">
                      <section className="bg-slate-50 p-10 md:p-16 rounded-[3rem] border border-slate-100 shadow-inner relative overflow-hidden group min-h-[400px]">
                        <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none transition-transform duration-1000 group-hover:scale-125">
                          <TrendingUp className="h-64 w-64 text-blue-600" />
                        </div>
                        <h4 className="text-xs font-black text-blue-600 uppercase tracking-[0.5em] mb-10 flex items-center gap-3">
                          <div className="w-8 h-[2px] bg-blue-600" /> Executive Tactical Narrative
                        </h4>
                        <div className="prose prose-slate prose-xl max-w-none text-slate-800 leading-relaxed font-bold selection:bg-blue-100">
                          {result.executiveSummary}
                        </div>
                      </section>

                      <section className="space-y-10">
                        <div className="flex items-center gap-4 px-2">
                          <Clock className="h-7 w-7 text-blue-600" />
                          <h4 className="text-2xl font-black uppercase tracking-tighter text-slate-900">Tactical Chronology: Events & Responses</h4>
                        </div>
                        <div className="space-y-6">
                          {result.incidentTimeline.map((day, idx) => (
                            <Card key={idx} className="rounded-[2.5rem] border-slate-100 shadow-2xl overflow-hidden transition-all hover:border-blue-400 hover:translate-x-2 duration-300">
                              <div className="bg-slate-900 px-8 py-5 flex items-center justify-between border-b border-white/5">
                                <div className="flex items-center gap-3">
                                  <CalendarDays className="h-4 w-4 text-primary" />
                                  <span className="text-sm font-black text-white uppercase tracking-widest">{day.dayLabel}</span>
                                </div>
                                <Badge variant="outline" className="text-[10px] border-primary/20 text-primary uppercase font-black px-3">Verified Log</Badge>
                              </div>
                              <CardContent className="p-10 bg-white">
                                <ul className="space-y-6">
                                  {day.events.map((event, eIdx) => (
                                    <li key={eIdx} className="flex gap-6 text-base font-bold text-slate-700 leading-relaxed group">
                                      <div className="h-7 w-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-1 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                        <ChevronRight className="h-4 w-4" />
                                      </div>
                                      <span className="group-hover:text-slate-900 transition-colors">{event}</span>
                                    </li>
                                  ))}
                                </ul>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </section>

                      {consolidatedImages.length > 0 && (
                        <section className="space-y-10 pt-10 border-t border-slate-100">
                          <div className="flex items-center gap-4 px-2">
                            <ImageIcon className="h-7 w-7 text-blue-600" />
                            <h4 className="text-2xl font-black uppercase tracking-tighter text-slate-900">Consolidated Operational Media</h4>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {consolidatedImages.slice(0, 20).map((img, idx) => (
                              <div key={idx} className="aspect-square rounded-[1.5rem] overflow-hidden border border-slate-100 shadow-xl group relative">
                                <img src={img} alt="Operational Evidence" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-125" />
                                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
                                  <div className="border border-white/40 px-3 py-1.5 rounded-lg">
                                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Exhibit {idx + 1}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          {consolidatedImages.length > 20 && (
                            <div className="text-center p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                              <p className="text-xs text-slate-400 font-black uppercase tracking-widest">
                                Plus {consolidatedImages.length - 20} additional tactical photos archived in the briefing document.
                              </p>
                            </div>
                          )}
                        </section>
                      )}
                   </div>

                   <aside className="lg:col-span-1 space-y-8">
                      <Card className="rounded-[2.5rem] border-none shadow-3xl overflow-hidden bg-emerald-50 ring-1 ring-emerald-100/50">
                        <CardHeader className="border-b border-emerald-100 p-8">
                          <CardTitle className="text-emerald-800 text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-3">
                            <ListChecks className="h-5 w-5" />
                            Achievements
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8">
                          <ul className="space-y-5">
                            {result.keyAchievements.map((item, idx) => (
                              <li key={idx} className="text-sm font-bold text-slate-700 leading-tight flex gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>

                      <Card className="rounded-[2.5rem] border-none shadow-3xl overflow-hidden bg-blue-50 ring-1 ring-blue-100/50">
                        <CardHeader className="border-b border-blue-100 p-8">
                          <CardTitle className="text-blue-800 text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-3">
                            <Activity className="h-5 w-5" />
                            Registry Trends
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8">
                          <ul className="space-y-5">
                            {result.operationalTrends.map((item, idx) => (
                              <li key={idx} className="text-sm font-bold text-slate-700 leading-tight flex gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>

                      <Card className="rounded-[2.5rem] border-none shadow-3xl overflow-hidden bg-red-50 ring-1 ring-red-100/50">
                        <CardHeader className="border-b border-red-100 p-8">
                          <CardTitle className="text-red-800 text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-3">
                            <AlertCircle className="h-5 w-5" />
                            Critical Challenges
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8">
                          <ul className="space-y-5">
                            {result.criticalChallenges.map((item, idx) => (
                              <li key={idx} className="text-sm font-bold text-slate-700 leading-tight flex gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 mt-1.5" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>

                      <Card className="rounded-[2.5rem] border-none shadow-3xl overflow-hidden bg-amber-50 ring-1 ring-amber-100/50">
                        <CardHeader className="border-b border-amber-100 p-8">
                          <CardTitle className="text-amber-800 text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-3">
                            <Lightbulb className="h-5 w-5" />
                            Strategic Guidance
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8">
                          <ul className="space-y-5">
                            {result.strategicRecommendations.map((item, idx) => (
                              <li key={idx} className="text-sm font-bold text-slate-700 leading-tight flex gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                   </aside>
                </div>

                <div className="bg-slate-900 rounded-[4rem] p-16 text-white flex flex-col lg:flex-row items-center justify-between gap-12 shadow-3xl relative overflow-hidden group">
                  <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  <div className="space-y-4 text-center lg:text-left relative z-10">
                    <div className="flex items-center justify-center lg:justify-start gap-3">
                      <ShieldCheck className="h-7 w-7 text-primary" />
                      <h4 className="text-3xl font-black uppercase tracking-tight">Authorize Strategic Export</h4>
                    </div>
                    <p className="text-slate-400 font-bold max-w-xl text-lg leading-relaxed">Commit this high-fidelity synthesis to the official document archive, including all tactical analysis and operational media artifacts.</p>
                  </div>
                  <Button onClick={handleExport} size="lg" className="h-20 px-16 rounded-[2rem] font-black bg-blue-600 hover:bg-blue-700 shadow-2xl shadow-blue-600/40 text-xl transition-all active:scale-95 relative z-10">
                    <Download className="mr-4 h-7 w-7" />
                    EXPORT STRATEGIC BRIEFING
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
