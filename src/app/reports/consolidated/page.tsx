"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore } from '@/firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
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
  FileDown,
  CalendarDays,
  ChevronRight,
  Zap,
  Layers,
  ImageIcon,
  TrendingUp,
  FileSearch,
  BookOpen,
  PieChart,
  BarChart3,
  ListChecks,
  AlertCircle,
  Lightbulb,
  FileText
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/hooks/use-user-profile';
import { generateConsolidatedReport, GenerateConsolidatedReportOutput } from '@/ai/flows/generate-consolidated-report-flow';
import { exportReportToDocx } from '@/lib/export-docx';
import { 
  Bar, 
  BarChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell,
  Pie,
  PieChart as RechartsPieChart,
  Legend
} from "recharts";

const CHART_COLORS = ["#2563eb", "#16a34a", "#d97706", "#dc2626", "#7c3aed", "#0891b2", "#475569"];

export default function OverallReportPage() {
  const router = useRouter();
  const { toast } = useToast();
  const db = useFirestore();
  const { isAdmin, isCommander, isLeader, isLoading: isAuthLoading } = useUserProfile();

  const [targetDaySpan, setTargetDaySpan] = useState<number>(30);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GenerateConsolidatedReportOutput | null>(null);
  const [reportMode, setReportMode] = useState<'CHRONOLOGICAL' | 'OPERATION_SUMMARY'>('CHRONOLOGICAL');
  const [dateToImagesMap, setDateToImagesMap] = useState<Map<string, string[]>>(new Map());

  const handleGenerate = async (all = false, mode: 'CHRONOLOGICAL' | 'OPERATION_SUMMARY' = 'CHRONOLOGICAL') => {
    if (!db) return;
    setIsGenerating(true);
    setResult(null);
    setReportMode(mode);
    setDateToImagesMap(new Map());

    try {
      const reportsRef = collection(db, 'reports');
      const q = query(reportsRef, orderBy('createdAt', 'desc'), limit(150));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        toast({ variant: "destructive", title: "Registry Empty", description: "No situational reports found." });
        setIsGenerating(false);
        return;
      }

      const allReports = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as any).sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        return timeA - timeB;
      });

      const imgMap = new Map<string, string[]>();
      allReports.forEach(r => {
        if (r.reportDate && r.images && Array.isArray(r.images)) {
          const dateKey = r.reportDate.toUpperCase().trim();
          const existing = imgMap.get(dateKey) || [];
          imgMap.set(dateKey, [...existing, ...r.images]);
        }
      });
      setDateToImagesMap(imgMap);

      const uniqueDatesMap = new Map<string, Date>();
      allReports.forEach(r => {
        if (r.reportDate) {
          try {
            uniqueDatesMap.set(r.reportDate, r.createdAt?.toDate() || new Date());
          } catch(e) {
            uniqueDatesMap.set(r.reportDate, new Date());
          }
        }
      });

      const uniqueDates = Array.from(uniqueDatesMap.keys()).sort((a, b) => {
        const dateA = uniqueDatesMap.get(a)!;
        const dateB = uniqueDatesMap.get(b)!;
        return dateA.getTime() - dateB.getTime();
      });

      const spanCount = all ? uniqueDates.length : Math.min(targetDaySpan, uniqueDates.length);
      const selectedDates = all ? uniqueDates : uniqueDates.slice(-spanCount);

      const filteredReports = allReports.filter(r => selectedDates.includes(r.reportDate));
      const pruneLimit = filteredReports.length > 50 ? 400 : 800;

      const reportTexts = filteredReports.map(r => {
        const cleanedText = (r.fullText || "").replace(/<[^>]+>/g, ' ').substring(0, pruneLimit);
        return `[UNIT: ${r.unit}] [DATE: ${r.reportDate}]\n${cleanedText}`;
      }).filter(text => text.length > 20);
      
      if (reportTexts.length === 0) throw new Error("No textual SITREPs found.");

      const synthesis = await generateConsolidatedReport({
        targetDay: spanCount,
        reports: reportTexts,
        reportMode: mode
      });

      setResult(synthesis);
      if (all) setTargetDaySpan(uniqueDates.length);
      
      toast({ 
        title: mode === 'OPERATION_SUMMARY' ? "Operation Report Ready" : "Chronological Report Ready", 
        description: `Synthesized ${filteredReports.length} unit records.` 
      });
    } catch (error: any) {
      console.error("Overall Report Error:", error);
      toast({ variant: "destructive", title: "Synthesis Error", description: error.message || "Protocol failed. Try fewer records." });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = async () => {
    if (!result) return;
    
    try {
      await exportReportToDocx({
        reportTitle: reportMode === 'OPERATION_SUMMARY' 
          ? `FULL OPERATIONAL REPORT FOR OFFICER CADETS INTAKE 14/25-26 FIELD TRAINING EXERCISE`
          : `OVERALL CHRONOLOGICAL COMMAND REPORT - DAY 1 TO ${targetDaySpan}`,
        reportDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).toUpperCase(),
        unit: 'FIELD TRAINING EXERCISE COMMAND REGISTRY',
        reportingCommanderName: 'OFFICER CADET INTAKE 14/25-26',
        executiveSummary: result.executiveSummary,
        operationalNarrative: result.operationalNarrative,
        consolidatedIncidents: result.consolidatedIncidents,
        consolidatedActions: result.consolidatedActions,
        dailyBriefings: result.dailyBriefings?.map(day => {
          const dateParts = day.dayLabel.split('-');
          const rawDate = dateParts.length > 1 ? dateParts[1].trim().toUpperCase() : day.dayLabel.trim().toUpperCase();
          return { ...day, images: dateToImagesMap.get(rawDate) || [] };
        }),
        forceWideAchievements: result.forceWideAchievements,
        operationalTrends: result.operationalTrends,
        criticalChallenges: result.criticalChallenges,
        strategicRecommendations: result.strategicRecommendations
      });
      toast({ title: "Report Exported", description: "Professional DOCX downloaded successfully." });
    } catch (e) {
      toast({ variant: "destructive", title: "Export Failed", description: "Could not generate DOCX." });
    }
  };

  if (isAuthLoading) return <div className="flex-1 flex items-center justify-center bg-slate-50"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;

  if (!isAdmin && !isCommander && !isLeader) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 p-10 text-center">
        <ShieldCheck className="h-20 w-20 text-slate-200 mb-6" />
        <h2 className="text-3xl font-black uppercase">Unauthorized Access</h2>
        <Button onClick={() => router.push('/')} className="mt-8 rounded-2xl h-14 px-12 font-black shadow-xl">Return Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#f1f5f9] pb-32">
      <header className="border-b bg-white/95 backdrop-blur-md px-4 md:px-12 py-6 md:py-8 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-4 md:gap-8">
          <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="h-10 w-10 md:h-14 md:w-14 rounded-xl md:rounded-2xl bg-slate-50 border border-slate-200 hover:bg-white shadow-sm transition-all">
            <ArrowLeft className="h-5 w-5 md:h-6 md:w-6" />
          </Button>
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-0.5 md:mb-1">
              <Zap className="h-3 w-3 text-blue-600 animate-pulse" />
              <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em] text-blue-600">Command Intelligence</span>
            </div>
            <h1 className="text-xl md:text-4xl font-black tracking-tighter text-slate-900 leading-none uppercase">Overall Report</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto mt-6 md:mt-12 px-4 md:px-12 space-y-8 md:space-y-12">
        <Card className="border-none shadow-3xl rounded-[1.5rem] md:rounded-[3rem] bg-white overflow-hidden ring-1 ring-slate-100">
          <CardHeader className="bg-slate-900 text-white p-6 md:p-10">
            <div className="flex items-center gap-3 md:gap-4 mb-2">
              <FileSearch className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-primary">Consolidation Terminal</span>
            </div>
            <CardTitle className="text-xl md:text-2xl font-black">Strategic Archive Generator</CardTitle>
            <CardDescription className="text-slate-400 font-bold max-w-2xl text-xs md:text-base">Synthesize all situational data into a high-level command transcript.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 md:p-10 space-y-8 md:space-y-10">
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 bg-slate-50 p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100">
              <div className="space-y-4">
                <Label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Reporting Window</Label>
                <div className="relative">
                  <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input 
                    type="number" 
                    min={1} 
                    value={targetDaySpan} 
                    onChange={e => setTargetDaySpan(parseInt(e.target.value) || 1)}
                    className="flex h-12 md:h-14 w-full rounded-xl md:rounded-2xl border border-slate-200 bg-white px-12 py-2 text-lg md:text-xl font-black focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-3 justify-end">
                <Button 
                  onClick={() => handleGenerate(false, 'CHRONOLOGICAL')} 
                  disabled={isGenerating}
                  className="h-12 md:h-14 rounded-xl md:rounded-2xl font-black shadow-xl shadow-blue-600/20 bg-blue-600 hover:bg-blue-700"
                >
                  {isGenerating ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : <Layers className="mr-2 h-5 w-5" />}
                  DAILY BREAKDOWN REPORT
                </Button>
                <Button 
                  onClick={() => handleGenerate(true, 'OPERATION_SUMMARY')} 
                  disabled={isGenerating}
                  variant="outline"
                  className="h-12 md:h-14 rounded-xl md:rounded-2xl font-black border-slate-200 bg-white hover:bg-slate-50 shadow-sm"
                >
                  {isGenerating ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : <Sparkles className="mr-2 h-5 w-5 text-blue-600" />}
                  FULL OPERATION REPORT
                </Button>
              </div>
            </div>

            {isGenerating && (
              <div className="py-20 md:py-32 flex flex-col items-center justify-center gap-6 md:gap-8 animate-in fade-in zoom-in-95 duration-700">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-600/20 blur-3xl rounded-full" />
                  <Loader2 className="h-16 w-16 md:h-24 md:w-24 animate-spin text-blue-600 relative z-10" />
                </div>
                <div className="text-center space-y-2 px-4">
                  <p className="text-xl md:text-3xl font-black text-slate-900 uppercase tracking-tighter">Strategic Synthesis Active</p>
                  <p className="text-[10px] md:text-sm font-bold text-slate-400 uppercase tracking-widest animate-pulse">Analyzing force-wide SITREPs into narrative intelligence...</p>
                </div>
              </div>
            )}

            {result && (
              <div className="space-y-12 md:space-y-16 animate-in fade-in slide-in-from-bottom-12 duration-1000">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-8 md:pb-12">
                  <div className="space-y-2 md:space-y-3">
                    <h3 className="text-2xl md:text-5xl font-black text-slate-900 uppercase tracking-tighter">Strategic Analysis</h3>
                    <div className="flex items-center gap-2 md:gap-3">
                      <Badge className="bg-blue-600 text-white border-none font-black text-[8px] md:text-xs uppercase px-2 md:px-4 py-1 rounded-lg shadow-lg">
                        {reportMode === 'OPERATION_SUMMARY' ? 'Mode: Full Operation Summary' : `Mode: Chronological (${targetDaySpan} Days)`}
                      </Badge>
                    </div>
                  </div>
                  <Button onClick={handleExport} className="rounded-xl md:rounded-2xl h-12 md:h-16 px-6 md:px-10 font-black bg-slate-900 hover:bg-slate-800 shadow-xl text-sm md:text-lg">
                    <FileDown className="h-5 w-5 md:h-6 md:w-6 mr-2 md:mr-3" />
                    DOWNLOAD DOCX
                  </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 md:gap-12">
                   <div className="lg:col-span-3 space-y-12 md:space-y-16">
                      
                      <section className="bg-slate-50 p-6 md:p-16 rounded-[1.5rem] md:rounded-[3rem] border border-slate-100 shadow-inner relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none transition-transform duration-1000 group-hover:scale-125">
                          <TrendingUp className="h-32 w-32 md:h-64 md:w-64 text-blue-600" />
                        </div>
                        <h4 className="text-[10px] md:text-xs font-black text-blue-600 uppercase tracking-[0.5em] mb-6 md:mb-10 flex items-center gap-3">
                          <div className="w-4 md:w-8 h-[2px] bg-blue-600" /> Executive Operational Narrative
                        </h4>
                        <div className="prose prose-slate prose-sm md:prose-xl max-w-none text-slate-800 leading-relaxed font-bold">
                          {result.operationalNarrative || result.executiveSummary}
                        </div>
                      </section>

                      {reportMode === 'OPERATION_SUMMARY' ? (
                        <section className="space-y-10">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="rounded-[2rem] p-8 bg-white border-slate-100 shadow-xl space-y-6">
                              <h4 className="text-sm font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                                <AlertCircle className="h-4 w-4" /> Consolidated Incident Log
                              </h4>
                              <ul className="space-y-4">
                                {result.consolidatedIncidents.map((inc, i) => (
                                  <li key={i} className="text-sm font-bold text-slate-700 leading-relaxed flex gap-3">
                                    <div className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0 mt-2" />
                                    {inc}
                                  </li>
                                ))}
                              </ul>
                            </Card>
                            <Card className="rounded-[2rem] p-8 bg-white border-slate-100 shadow-xl space-y-6">
                              <h4 className="text-sm font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4" /> Tactical Actions Taken
                              </h4>
                              <ul className="space-y-4">
                                {result.consolidatedActions.map((act, i) => (
                                  <li key={i} className="text-sm font-bold text-slate-700 leading-relaxed flex gap-3">
                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0 mt-2" />
                                    {act}
                                  </li>
                                ))}
                              </ul>
                            </Card>
                          </div>
                        </section>
                      ) : (
                        <section className="space-y-8 md:space-y-10">
                          <div className="flex items-center gap-3 md:gap-4 px-2">
                            <BookOpen className="h-6 w-6 md:h-7 md:w-7 text-blue-600" />
                            <h4 className="text-xl md:text-2xl font-black uppercase tracking-tighter text-slate-900">Chronological Daily Summaries</h4>
                          </div>
                          <div className="space-y-6 md:space-y-8">
                            {result.dailyBriefings?.map((day, idx) => {
                              const rawDate = day.dayLabel.split('-').length > 1 ? day.dayLabel.split('-')[1].trim().toUpperCase() : day.dayLabel.trim().toUpperCase();
                              const dayImages = dateToImagesMap.get(rawDate) || [];

                              return (
                                <Card key={idx} className="rounded-[1.5rem] md:rounded-[2.5rem] border-slate-100 shadow-xl overflow-hidden transition-all hover:border-blue-400 duration-300 bg-white">
                                  <div className="bg-slate-900 px-6 md:px-8 py-4 md:py-5 flex items-center justify-between">
                                    <div className="flex items-center gap-2 md:gap-3">
                                      <CalendarDays className="h-3.5 w-3.5 text-primary" />
                                      <span className="text-xs md:text-sm font-black text-white uppercase tracking-widest">{day.dayLabel}</span>
                                    </div>
                                    <Badge variant="outline" className="text-[8px] border-primary/20 text-primary uppercase font-black">SITREP</Badge>
                                  </div>
                                  <CardContent className="p-6 md:p-10 space-y-6">
                                    <div className="text-sm md:text-lg font-bold text-slate-700 leading-relaxed italic border-l-4 border-blue-100 pl-4">
                                      {day.summary}
                                    </div>
                                    {day.keyIncidents.length > 0 && (
                                      <ul className="space-y-3">
                                        {day.keyIncidents.map((incident, eIdx) => (
                                          <li key={eIdx} className="flex gap-3 text-sm md:text-base font-bold text-slate-700 group">
                                            <div className="h-6 w-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                              <ChevronRight className="h-3.5 w-3.5" />
                                            </div>
                                            <span>{incident}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                    {dayImages.length > 0 && (
                                      <div className="pt-6 border-t border-slate-50">
                                        <p className="text-[10px] font-black uppercase text-slate-400 mb-4 flex items-center gap-2"><ImageIcon className="h-3 w-3" /> Evidence ({dayImages.length})</p>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                          {dayImages.map((img, iIdx) => (
                                            <div key={iIdx} className="aspect-video rounded-xl overflow-hidden border shadow-sm group relative">
                                              <img src={img} alt="Evidence" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>
                        </section>
                      )}

                      <section className="space-y-8 md:space-y-10 pt-8 border-t border-slate-100">
                        <div className="flex items-center gap-3 md:gap-4 px-2">
                          <PieChart className="h-6 w-6 md:h-7 md:w-7 text-blue-600" />
                          <h4 className="text-xl md:text-2xl font-black uppercase tracking-tighter text-slate-900">Operational Breakdown</h4>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                          <Card className="rounded-[1.5rem] p-6 bg-white border border-slate-100 shadow-xl">
                            <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5" /> Unit Activity Share</h5>
                            <div className="h-[250px] w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <RechartsPieChart>
                                  <Pie data={result.unitBreakdown} dataKey="reportCount" nameKey="unitName" cx="50%" cy="50%" outerRadius={80} label={({ unitName }) => unitName}>
                                    {result.unitBreakdown.map((entry, index) => <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                                  </Pie>
                                  <Tooltip /><Legend />
                                </RechartsPieChart>
                              </ResponsiveContainer>
                            </div>
                          </Card>
                          <Card className="rounded-[1.5rem] p-6 bg-white border border-slate-100 shadow-xl">
                            <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2"><BarChart3 className="h-3.5 w-3.5" /> Incident Frequency</h5>
                            <div className="h-[250px] w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={result.dailyBriefings?.map(d => ({ day: d.dayLabel.split('-')[0].trim(), count: d.incidentCount })) || []}>
                                  <XAxis dataKey="day" fontSize={10} fontWeight="bold" /><YAxis fontSize={10} fontWeight="bold" /><Tooltip /><Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </Card>
                        </div>
                      </section>
                   </div>

                   <aside className="lg:col-span-1 space-y-6 md:space-y-8">
                      <Card className="rounded-[1.5rem] md:rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-emerald-50 ring-1 ring-emerald-100/50">
                        <CardHeader className="border-b border-emerald-100 p-6 md:p-8">
                          <CardTitle className="text-emerald-800 text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2 md:gap-3">
                            <ListChecks className="h-4 w-4 md:h-5 md:w-5" /> Successes
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 md:p-8">
                          <ul className="space-y-4">
                            {result.forceWideAchievements.map((item, idx) => (
                              <li key={idx} className="text-xs md:text-sm font-bold text-slate-700 leading-tight flex gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" /> {item}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>

                      <Card className="rounded-[1.5rem] md:rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-blue-50 ring-1 ring-blue-100/50">
                        <CardHeader className="border-b border-blue-100 p-6 md:p-8">
                          <CardTitle className="text-blue-800 text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2 md:gap-3">
                            <TrendingUp className="h-4 w-4 md:h-5 md:w-5" /> Trends
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 md:p-8">
                          <ul className="space-y-4">
                            {result.operationalTrends.map((item, idx) => (
                              <li key={idx} className="text-xs md:text-sm font-bold text-slate-700 leading-tight flex gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" /> {item}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>

                      <Card className="rounded-[1.5rem] md:rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-red-50 ring-1 ring-red-100/50">
                        <CardHeader className="border-b border-red-100 p-6 md:p-8">
                          <CardTitle className="text-red-800 text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2 md:gap-3">
                            <AlertCircle className="h-4 w-4 md:h-5 md:w-5" /> Challenges
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 md:p-8">
                          <ul className="space-y-4">
                            {result.criticalChallenges.map((item, idx) => (
                              <li key={idx} className="text-xs md:text-sm font-bold text-slate-700 leading-tight flex gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 mt-1.5" /> {item}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>

                      <Card className="rounded-[1.5rem] md:rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-amber-50 ring-1 ring-amber-100/50">
                        <CardHeader className="border-b border-amber-100 p-6 md:p-8">
                          <CardTitle className="text-amber-800 text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2 md:gap-3">
                            <Lightbulb className="h-4 w-4 md:h-5 md:w-5" /> Suggestions
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 md:p-8">
                          <ul className="space-y-4">
                            {result.strategicRecommendations.map((item, idx) => (
                              <li key={idx} className="text-xs md:text-sm font-bold text-slate-700 leading-tight flex gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" /> {item}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                   </aside>
                </div>

                <div className="bg-slate-900 rounded-[2rem] p-8 md:p-16 text-white flex flex-col lg:flex-row items-center justify-between gap-8 shadow-3xl relative overflow-hidden group">
                  <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  <div className="space-y-3 text-center lg:text-left relative z-10">
                    <div className="flex items-center justify-center lg:justify-start gap-2">
                      <ShieldCheck className="h-6 w-6 text-primary" />
                      <h4 className="text-xl md:text-3xl font-black uppercase tracking-tight">Authorize Command Memo</h4>
                    </div>
                    <p className="text-slate-400 font-bold max-w-xl text-sm md:text-lg leading-relaxed">Download this high-fidelity strategic analysis for the official registry.</p>
                  </div>
                  <Button onClick={handleExport} size="lg" className="h-14 md:h-20 w-full lg:w-auto px-8 md:px-16 rounded-xl md:rounded-[2rem] font-black bg-blue-600 hover:bg-blue-700 shadow-2xl relative z-10">
                    <Download className="mr-3 h-5 w-5 md:h-7 md:w-7" />
                    EXPORT DOCX MEMO
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
