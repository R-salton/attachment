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
  ImageIcon
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/hooks/use-user-profile';
import { generateConsolidatedReport, GenerateConsolidatedReportOutput } from '@/ai/flows/generate-consolidated-report-flow';
import { exportReportToDocx } from '@/lib/export-docx';

export default function ConsolidatedReportPage() {
  const router = useRouter();
  const { toast } = useToast();
  const db = useFirestore();
  const { isAdmin, isCommander, isLoading: isAuthLoading } = useUserProfile();

  const [targetDay, setTargetDay] = useState<number>(3);
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
      const q = query(reportsRef, orderBy('createdAt', 'asc'));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        toast({ 
          variant: "destructive", 
          title: "Registry Empty", 
          description: "No situational reports exist in the official archive yet." 
        });
        setIsGenerating(false);
        return;
      }

      const allReports = snapshot.docs.map(doc => ({ 
        ...doc.data(), 
        id: doc.id 
      }) as any);

      // Unique date sequence to determine "Days"
      const dateSequence: string[] = [];
      allReports.forEach(r => {
        if (r.reportDate && !dateSequence.includes(r.reportDate)) {
          dateSequence.push(r.reportDate);
        }
      });

      const effectiveTargetDay = all ? dateSequence.length : Math.min(targetDay, dateSequence.length);
      const targetDates = dateSequence.slice(0, effectiveTargetDay);

      if (targetDates.length === 0) {
        toast({ 
          variant: "destructive", 
          title: "Timeline Error", 
          description: `No records found within the requested period.` 
        });
        setIsGenerating(false);
        return;
      }

      const filteredReports = allReports.filter(r => targetDates.includes(r.reportDate));
      
      // Extract clean text for the AI to process (stripping potential heavy tags if needed)
      const reportTexts = filteredReports.map(r => r.fullText).filter(Boolean);
      
      // Harvest all media evidence from the constituent reports
      const images: string[] = [];
      filteredReports.forEach(r => {
        if (r.images && Array.isArray(r.images)) {
          images.push(...r.images);
        }
      });
      setConsolidatedImages(images);

      if (reportTexts.length === 0) {
        toast({ 
          variant: "destructive", 
          title: "Range Empty", 
          description: `No textual content found for the selected reporting period.` 
        });
        setIsGenerating(false);
        return;
      }

      // Invoke the Gemini AI Strategic Synthesis
      const consolidationResult = await generateConsolidatedReport({
        targetDay: targetDates.length,
        reports: reportTexts
      });

      setResult(consolidationResult);
      if (all) setTargetDay(dateSequence.length);
      
      toast({ title: "Detailed Analysis Complete", description: `Successfully synthesized data for ${targetDates.length} operational days.` });
    } catch (error: any) {
      console.error("Consolidation Error:", error);
      toast({ 
        variant: "destructive", 
        title: "Synthesis Error", 
        description: error.message || "Gemini AI could not aggregate registry data. Try reducing the span." 
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = async () => {
    if (!result) return;
    
    let fullText = `### EXECUTIVE STRATEGIC BRIEFING\n${result.executiveSummary}\n\n`;
    
    fullText += `### TACTICAL TIMELINE (INCIDENTS & ACTIONS)\n`;
    result.incidentTimeline.forEach(day => {
      fullText += `*${day.dayLabel.toUpperCase()}*\n`;
      day.events.forEach(event => {
        fullText += `• ${event}\n`;
      });
      fullText += `\n`;
    });

    fullText += `### KEY ACHIEVEMENTS\n${result.keyAchievements.map(a => `• ${a}`).join('\n')}\n\n`;
    fullText += `### OPERATIONAL TRENDS\n${result.operationalTrends.map(t => `• ${t}`).join('\n')}\n\n`;
    fullText += `### CRITICAL CHALLENGES\n${result.criticalChallenges.map(c => `• ${c}`).join('\n')}\n\n`;
    fullText += `### STRATEGIC RECOMMENDATIONS\n${result.strategicRecommendations.map(r => `• ${r}`).join('\n')}`;

    try {
      await exportReportToDocx({
        reportTitle: `STRATEGIC CUMULATIVE BRIEFING (DAY 1 - ${targetDay})`,
        reportDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).toUpperCase(),
        unit: 'COMMAND REGISTRY CONSOLIDATION',
        fullText: fullText,
        reportingCommanderName: 'Gemini AI Operational Analyst',
        images: consolidatedImages
      });
      toast({ title: "Export Success", description: "Strategic Briefing downloaded as DOCX." });
    } catch (e) {
      toast({ variant: "destructive", title: "Export Failed", description: "Could not generate Word document." });
    }
  };

  if (isAuthLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin && !isCommander) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-black">Restricted Protocol</h2>
        <p className="text-slate-500 max-w-md mt-2 font-bold uppercase tracking-tight">Only Command oversight can generate consolidated briefings.</p>
        <Button onClick={() => router.push('/')} className="mt-6 rounded-xl h-12 px-10">Return Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#f8fafc] pb-24">
      <header className="border-b bg-white px-4 md:px-10 py-6 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-6">
          <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-100">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-blue-600" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600">Strategic Synthesis Engine</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-slate-900 leading-none uppercase">Cumulative Progress Briefing</h1>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto mt-10 px-4 md:px-10 space-y-10">
        <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white overflow-hidden">
          <CardHeader className="bg-slate-900 text-white p-8">
            <CardTitle className="text-xl font-black flex items-center gap-3">
              <Zap className="h-6 w-6 text-primary" />
              Detailed Operational Synthesis
            </CardTitle>
            <CardDescription className="text-slate-400 font-medium">Choose a specific operational span or synthesize the entire registry into a high-fidelity tactical briefing.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            <div className="flex flex-col md:flex-row items-end gap-6">
              <div className="w-full md:w-64 space-y-3">
                <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Target Days Span</Label>
                <input 
                  type="number" 
                  min={1} 
                  max={100} 
                  value={targetDay} 
                  onChange={e => setTargetDay(parseInt(e.target.value) || 1)}
                  className="flex h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-lg font-black ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <Button 
                  onClick={() => handleGenerate(false)} 
                  disabled={isGenerating}
                  className="h-12 px-8 rounded-xl font-black shadow-xl shadow-blue-600/20 bg-blue-600 hover:bg-blue-700"
                >
                  {isGenerating ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : <Sparkles className="mr-2 h-5 w-5" />}
                  SYNTHESIZE SPAN
                </Button>
                <Button 
                  onClick={() => handleGenerate(true)} 
                  disabled={isGenerating}
                  variant="outline"
                  className="h-12 px-8 rounded-xl font-black border-slate-200 bg-white hover:bg-slate-50 shadow-sm"
                >
                  {isGenerating ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : <Layers className="mr-2 h-5 w-5 text-blue-600" />}
                  CONSOLIDATE ENTIRE REGISTRY
                </Button>
              </div>
            </div>

            {isGenerating && (
              <div className="py-24 flex flex-col items-center justify-center gap-6 animate-in fade-in zoom-in-95 duration-500">
                <Loader2 className="h-20 w-20 animate-spin text-blue-600" />
                <div className="text-center space-y-2">
                  <p className="text-2xl font-black text-slate-900 uppercase tracking-tighter">AI Strategic Analysis in Progress</p>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Aggregating tactical SITREPs and operational media...</p>
                </div>
              </div>
            )}

            {result && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-8">
                  <div className="space-y-2">
                    <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Executive Briefing</h3>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-600 text-white border-none font-black text-[10px] uppercase px-3 py-1">Timeline: Day 1 to {targetDay}</Badge>
                      <Badge variant="outline" className="border-slate-200 text-slate-500 font-bold text-[10px] uppercase px-3 py-1">Source: Operational Registry</Badge>
                    </div>
                  </div>
                  <Button onClick={handleExport} className="rounded-xl h-12 px-8 font-black bg-slate-900 hover:bg-slate-800 shadow-xl shadow-slate-900/20">
                    <FileDown className="h-5 w-5 mr-2" />
                    DOWNLOAD STRATEGIC DOCX
                  </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                   <div className="lg:col-span-3 space-y-10">
                      <section className="bg-slate-50 p-8 md:p-12 rounded-[2.5rem] border border-slate-100 shadow-inner relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none">
                          <Zap className="h-48 w-48 text-blue-600" />
                        </div>
                        <h4 className="text-xs font-black text-blue-600 uppercase tracking-[0.4em] mb-6">Strategic Tactical Narrative</h4>
                        <div className="prose prose-slate prose-lg max-w-none text-slate-800 leading-relaxed font-bold">
                          {result.executiveSummary}
                        </div>
                      </section>

                      <section className="space-y-6">
                        <div className="flex items-center gap-3 px-2">
                          <Clock className="h-5 w-5 text-blue-600" />
                          <h4 className="text-lg font-black uppercase tracking-tighter text-slate-900">Tactical Chronology: Incidents & Actions</h4>
                        </div>
                        <div className="space-y-4">
                          {result.incidentTimeline.map((day, idx) => (
                            <Card key={idx} className="rounded-[1.5rem] border-slate-100 shadow-lg overflow-hidden transition-all hover:border-blue-200">
                              <div className="bg-slate-900 p-4 flex items-center justify-between">
                                <span className="text-xs font-black text-white uppercase tracking-widest">{day.dayLabel}</span>
                                <Badge variant="outline" className="text-[8px] border-white/20 text-white/60">Verified Registry Record</Badge>
                              </div>
                              <CardContent className="p-6">
                                <ul className="space-y-4">
                                  {day.events.map((event, eIdx) => (
                                    <li key={eIdx} className="flex gap-4 text-sm font-semibold text-slate-700 leading-relaxed group">
                                      <div className="h-5 w-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        <ChevronRight className="h-3 w-3" />
                                      </div>
                                      {event}
                                    </li>
                                  ))}
                                </ul>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </section>

                      {consolidatedImages.length > 0 && (
                        <section className="space-y-6 pt-6 border-t border-slate-100">
                          <div className="flex items-center gap-3 px-2">
                            <ImageIcon className="h-5 w-5 text-blue-600" />
                            <h4 className="text-lg font-black uppercase tracking-tighter text-slate-900">Consolidated Operational Media</h4>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {consolidatedImages.slice(0, 16).map((img, idx) => (
                              <div key={idx} className="aspect-video rounded-2xl overflow-hidden border border-slate-100 shadow-md group relative">
                                <img src={img} alt="Evidence" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <span className="text-[8px] font-black text-white uppercase tracking-widest border border-white/40 px-2 py-1 rounded">Archive Exhibit</span>
                                </div>
                              </div>
                            ))}
                          </div>
                          {consolidatedImages.length > 16 && (
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">Plus {consolidatedImages.length - 16} additional evidence photos archived in briefing document.</p>
                          )}
                        </section>
                      )}
                   </div>

                   <aside className="lg:col-span-1 space-y-6">
                      <Card className="rounded-[2rem] border-none shadow-2xl overflow-hidden bg-emerald-50">
                        <CardHeader className="border-b border-emerald-100 p-6">
                          <CardTitle className="text-emerald-800 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                            <ListChecks className="h-4 w-4" />
                            Achievements
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                          <ul className="space-y-4">
                            {result.keyAchievements.map((item, idx) => (
                              <li key={idx} className="text-[13px] font-bold text-slate-700 leading-tight">
                                • {item}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>

                      <Card className="rounded-[2rem] border-none shadow-2xl overflow-hidden bg-blue-50">
                        <CardHeader className="border-b border-blue-100 p-6">
                          <CardTitle className="text-blue-800 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                            <Activity className="h-4 w-4" />
                            Operational Trends
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                          <ul className="space-y-4">
                            {result.operationalTrends.map((item, idx) => (
                              <li key={idx} className="text-[13px] font-bold text-slate-700 leading-tight">
                                • {item}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>

                      <Card className="rounded-[2rem] border-none shadow-2xl overflow-hidden bg-red-50">
                        <CardHeader className="border-b border-red-100 p-6">
                          <CardTitle className="text-red-800 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            Registry Challenges
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                          <ul className="space-y-4">
                            {result.criticalChallenges.map((item, idx) => (
                              <li key={idx} className="text-[13px] font-bold text-slate-700 leading-tight">
                                • {item}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>

                      <Card className="rounded-[2rem] border-none shadow-2xl overflow-hidden bg-amber-50">
                        <CardHeader className="border-b border-amber-100 p-6">
                          <CardTitle className="text-amber-800 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                            <Lightbulb className="h-4 w-4" />
                            Strategic Guidance
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                          <ul className="space-y-4">
                            {result.strategicRecommendations.map((item, idx) => (
                              <li key={idx} className="text-[13px] font-bold text-slate-700 leading-tight">
                                • {item}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                   </aside>
                </div>

                <div className="bg-slate-900 rounded-[3rem] p-12 text-white flex flex-col lg:flex-row items-center justify-between gap-10 shadow-3xl">
                  <div className="space-y-3 text-center lg:text-left">
                    <div className="flex items-center justify-center lg:justify-start gap-2">
                      <ShieldCheck className="h-5 w-5 text-primary" />
                      <h4 className="text-2xl font-black uppercase tracking-tight">Finalize Command Briefing</h4>
                    </div>
                    <p className="text-slate-400 font-bold max-w-xl leading-relaxed">The resulting brief includes deep strategic insights and all harvested media evidence from the constituent situational reports.</p>
                  </div>
                  <Button onClick={handleExport} size="lg" className="h-16 px-12 rounded-2xl font-black bg-blue-600 hover:bg-blue-700 shadow-2xl shadow-blue-600/40 text-lg">
                    <Download className="mr-3 h-6 w-6" />
                    DOWNLOAD STRATEGIC DOCX
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
