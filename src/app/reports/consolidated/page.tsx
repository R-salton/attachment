"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore } from '@/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  Sparkles, 
  FileText, 
  ArrowLeft, 
  Download, 
  ShieldCheck, 
  Activity, 
  ListChecks, 
  AlertCircle, 
  Lightbulb,
  FileDown,
  CalendarDays,
  Target
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

  const handleGenerate = async () => {
    if (!db) return;
    setIsGenerating(true);
    setResult(null);

    try {
      // Fetch all reports ordered by creation date to establish an objective timeline
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

      // Determine the chronological sequence of operational days based on unique report dates
      const dateSequence: string[] = [];
      allReports.forEach(r => {
        if (r.reportDate && !dateSequence.includes(r.reportDate)) {
          dateSequence.push(r.reportDate);
        }
      });

      // Select the dates that constitute the requested operational span
      const targetDates = dateSequence.slice(0, targetDay);

      if (targetDates.length === 0) {
        toast({ 
          variant: "destructive", 
          title: "Timeline Error", 
          description: `Could not identify any reporting days in the registry timeline.` 
        });
        setIsGenerating(false);
        return;
      }

      // Filter all situational logs belonging to the identified chronological dates
      const filteredReports = allReports.filter(r => targetDates.includes(r.reportDate));
      const reportTexts = filteredReports.map(r => r.fullText).filter(Boolean);

      if (reportTexts.length === 0) {
        toast({ 
          variant: "destructive", 
          title: "Range Empty", 
          description: `No report content found for the first ${targetDay} reporting days.` 
        });
        setIsGenerating(false);
        return;
      }

      // Execute AI Synthesis via Gemini
      const consolidationResult = await generateConsolidatedReport({
        targetDay,
        reports: reportTexts
      });

      setResult(consolidationResult);
      toast({ title: "Analysis Complete", description: `Successfully synthesized data for ${targetDates.length} operational days.` });
    } catch (error) {
      console.error("Consolidation Error:", error);
      toast({ 
        variant: "destructive", 
        title: "Consolidation Failed", 
        description: "Gemini AI could not process the registry data. Please try again." 
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = async () => {
    if (!result) return;
    
    let fullText = `### EXECUTIVE SUMMARY\n${result.executiveSummary}\n\n`;
    fullText += `### KEY ACHIEVEMENTS\n${result.keyAchievements.map(a => `. ${a}`).join('\n')}\n\n`;
    fullText += `### OPERATIONAL TRENDS\n${result.operationalTrends.map(t => `. ${t}`).join('\n')}\n\n`;
    fullText += `### CRITICAL CHALLENGES\n${result.criticalChallenges.map(c => `. ${c}`).join('\n')}\n\n`;
    fullText += `### STRATEGIC RECOMMENDATIONS\n${result.strategicRecommendations.map(r => `. ${r}`).join('\n')}`;

    try {
      await exportReportToDocx({
        reportTitle: `CONSOLIDATED PROGRESS REPORT (FIRST ${targetDay} DAYS)`,
        reportDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).toUpperCase(),
        unit: 'OVERALL ATTACHMENT',
        fullText: fullText,
        reportingCommanderName: 'Gemini AI Operational System'
      });
      toast({ title: "Export Success", description: "Consolidated Briefing downloaded as DOCX." });
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
              <Target className="h-4 w-4 text-blue-600" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600">Strategic Synthesis</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-slate-900 leading-none uppercase">Cumulative Progress Briefing</h1>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto mt-10 px-4 md:px-10 space-y-10">
        <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white overflow-hidden">
          <CardHeader className="bg-slate-900 text-white p-8">
            <CardTitle className="text-xl font-black flex items-center gap-3">
              <CalendarDays className="h-6 w-6 text-primary" />
              Registry Synthesis Parameters
            </CardTitle>
            <CardDescription className="text-slate-400 font-medium">Select the target operational span. Gemini AI will aggregate data from Day 1 to the selected day based on chronological submission dates.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            <div className="max-w-md space-y-3">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Number of Operational Days (from Start)</Label>
              <div className="flex flex-col sm:flex-row gap-4">
                <input 
                  type="number" 
                  min={1} 
                  max={100} 
                  value={targetDay} 
                  onChange={e => setTargetDay(parseInt(e.target.value) || 1)}
                  className="flex h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-lg font-black ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <Button 
                  onClick={handleGenerate} 
                  disabled={isGenerating}
                  className="h-12 px-10 rounded-xl font-black shadow-xl shadow-blue-600/20 bg-blue-600 hover:bg-blue-700"
                >
                  {isGenerating ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : <Sparkles className="mr-2 h-5 w-5" />}
                  GENERATE WITH GEMINI
                </Button>
              </div>
            </div>

            {isGenerating && (
              <div className="py-24 flex flex-col items-center justify-center gap-6 animate-in fade-in zoom-in-95 duration-500">
                <Loader2 className="h-20 w-20 animate-spin text-blue-600" />
                <div className="text-center space-y-2">
                  <p className="text-2xl font-black text-slate-900 uppercase tracking-tighter">AI Operational Analysis in Progress</p>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Scanning SITREPs for patterns and achievements...</p>
                </div>
              </div>
            )}

            {result && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-8">
                  <div className="space-y-2">
                    <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Executive Briefing</h3>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-600 text-white border-none font-black text-[10px] uppercase">Timeline: Day 1 to {targetDay}</Badge>
                      <Badge variant="outline" className="border-slate-200 text-slate-500 font-bold text-[10px] uppercase">Source: Operational Registry</Badge>
                    </div>
                  </div>
                  <Button onClick={handleExport} className="rounded-xl h-12 px-8 font-black bg-slate-900 hover:bg-slate-800 shadow-xl shadow-slate-900/10">
                    <FileDown className="h-5 w-5 mr-2" />
                    EXPORT OFFICIAL DOCX
                  </Button>
                </div>

                <div className="bg-slate-50 p-8 md:p-12 rounded-[2.5rem] border border-slate-100 shadow-inner relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-6 opacity-5">
                    <Sparkles className="h-24 w-24 text-blue-600" />
                  </div>
                  <h4 className="text-xs font-black text-blue-600 uppercase tracking-[0.3em] mb-6">Strategic Narrative Summary</h4>
                  <div className="prose prose-slate prose-lg max-w-none text-slate-800 leading-relaxed font-bold">
                    {result.executiveSummary}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <Card className="rounded-[2.5rem] border-slate-100 shadow-2xl overflow-hidden hover:translate-y-[-4px] transition-transform duration-300">
                    <CardHeader className="bg-emerald-50 border-b border-emerald-100">
                      <CardTitle className="text-emerald-800 text-sm font-black uppercase flex items-center gap-3">
                        <ListChecks className="h-5 w-5" />
                        Key Achievements
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                      <ul className="space-y-5">
                        {result.keyAchievements.map((item, idx) => (
                          <li key={idx} className="flex gap-4 text-[15px] font-bold text-slate-700">
                            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 mt-1.5 shrink-0 shadow-sm shadow-emerald-200" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="rounded-[2.5rem] border-slate-100 shadow-2xl overflow-hidden hover:translate-y-[-4px] transition-transform duration-300">
                    <CardHeader className="bg-blue-50 border-b border-blue-100">
                      <CardTitle className="text-blue-800 text-sm font-black uppercase flex items-center gap-3">
                        <Activity className="h-5 w-5" />
                        Operational Trends
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                      <ul className="space-y-5">
                        {result.operationalTrends.map((item, idx) => (
                          <li key={idx} className="flex gap-4 text-[15px] font-bold text-slate-700">
                            <div className="h-2.5 w-2.5 rounded-full bg-blue-500 mt-1.5 shrink-0 shadow-sm shadow-blue-200" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="rounded-[2.5rem] border-slate-100 shadow-2xl overflow-hidden hover:translate-y-[-4px] transition-transform duration-300">
                    <CardHeader className="bg-red-50 border-b border-red-100">
                      <CardTitle className="text-red-800 text-sm font-black uppercase flex items-center gap-3">
                        <AlertCircle className="h-5 w-5" />
                        Critical Challenges
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                      <ul className="space-y-5">
                        {result.criticalChallenges.map((item, idx) => (
                          <li key={idx} className="flex gap-4 text-[15px] font-bold text-slate-700">
                            <div className="h-2.5 w-2.5 rounded-full bg-red-500 mt-1.5 shrink-0 shadow-sm shadow-red-200" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="rounded-[2.5rem] border-slate-100 shadow-2xl overflow-hidden hover:translate-y-[-4px] transition-transform duration-300">
                    <CardHeader className="bg-amber-50 border-b border-amber-100">
                      <CardTitle className="text-amber-800 text-sm font-black uppercase flex items-center gap-3">
                        <Lightbulb className="h-5 w-5" />
                        Strategic Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                      <ul className="space-y-5">
                        {result.strategicRecommendations.map((item, idx) => (
                          <li key={idx} className="flex gap-4 text-[15px] font-bold text-slate-700">
                            <div className="h-2.5 w-2.5 rounded-full bg-amber-500 mt-1.5 shrink-0 shadow-sm shadow-amber-200" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                <div className="bg-slate-900 rounded-[3rem] p-12 text-white flex flex-col lg:flex-row items-center justify-between gap-10 shadow-3xl">
                  <div className="space-y-3 text-center lg:text-left">
                    <div className="flex items-center justify-center lg:justify-start gap-2">
                      <ShieldCheck className="h-5 w-5 text-blue-400" />
                      <h4 className="text-2xl font-black uppercase tracking-tight">Finalize Briefing Archive</h4>
                    </div>
                    <p className="text-slate-400 font-bold max-w-xl leading-relaxed">Commit this Gemini-synthesized operational brief to the official Command Registry for end-of-period personnel review.</p>
                  </div>
                  <Button onClick={handleExport} size="lg" className="h-16 px-16 rounded-2xl font-black bg-blue-600 hover:bg-blue-700 shadow-2xl shadow-blue-600/40 text-lg">
                    <Download className="mr-3 h-6 w-6" />
                    DOWNLOAD DOCX
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
