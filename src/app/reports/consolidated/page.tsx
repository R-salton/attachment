
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore } from '@/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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
  CalendarDays
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
      // Fetch all reports ordered by creation date to establish a timeline
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

      // Determine the chronological "Days" based on unique report dates found in the registry
      const uniqueDates: string[] = [];
      allReports.forEach(r => {
        if (r.reportDate && !uniqueDates.includes(r.reportDate)) {
          uniqueDates.push(r.reportDate);
        }
      });

      // Select the dates that fall within the "First X Days" requested
      const targetDates = uniqueDates.slice(0, targetDay);

      if (targetDates.length === 0) {
        toast({ 
          variant: "destructive", 
          title: "No Data", 
          description: `Could not identify any reporting days in the registry.` 
        });
        setIsGenerating(false);
        return;
      }

      // Filter reports that belong to the identified chronological dates
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

      const consolidationResult = await generateConsolidatedReport({
        targetDay,
        reports: reportTexts
      });

      setResult(consolidationResult);
      toast({ title: "Analysis Complete", description: `Generated synthesis for ${targetDates.length} operational days.` });
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Consolidation Failed", description: "Could not aggregate registry data." });
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
        reportingCommanderName: 'AI Operational System'
      });
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
        <p className="text-slate-500 max-w-md mt-2">Only Command oversight can generate consolidated attachment reports.</p>
        <Button onClick={() => router.push('/')} className="mt-6">Return Dashboard</Button>
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
              <Sparkles className="h-4 w-4 text-blue-600" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600">Strategic Consolidation</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-slate-900 leading-none uppercase">Cumulative Progress Report</h1>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto mt-10 px-4 md:px-10 space-y-10">
        <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white overflow-hidden">
          <CardHeader className="bg-slate-900 text-white p-8">
            <CardTitle className="text-xl font-black flex items-center gap-3">
              <CalendarDays className="h-6 w-6 text-primary" />
              Consolidation Timeline
            </CardTitle>
            <CardDescription className="text-slate-400">Select how many reporting days to aggregate from the registry start date.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            <div className="max-w-xs space-y-3">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Number of Days (from Start)</Label>
              <div className="flex gap-4">
                <Input 
                  type="number" 
                  min={1} 
                  max={100} 
                  value={targetDay} 
                  onChange={e => setTargetDay(parseInt(e.target.value) || 1)}
                  className="h-12 rounded-xl text-lg font-bold bg-slate-50"
                />
                <Button 
                  onClick={handleGenerate} 
                  disabled={isGenerating}
                  className="h-12 px-8 rounded-xl font-black shadow-lg shadow-blue-600/20 bg-blue-600 hover:bg-blue-700"
                >
                  {isGenerating ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : <Sparkles className="mr-2 h-5 w-5" />}
                  ANALYZE
                </Button>
              </div>
            </div>

            {isGenerating && (
              <div className="py-20 flex flex-col items-center justify-center gap-6 animate-in fade-in zoom-in-95 duration-500">
                <Loader2 className="h-16 w-16 animate-spin text-blue-600" />
                <div className="text-center">
                  <p className="text-lg font-black text-slate-900 uppercase">Synthesizing Registry Timeline</p>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Cross-referencing reports by date sequence...</p>
                </div>
              </div>
            )}

            {result && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                  <div className="space-y-1">
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Executive Summary</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Chronological Day 1 to {targetDay} Assessment</p>
                  </div>
                  <Button onClick={handleExport} variant="outline" className="rounded-xl h-11 px-6 font-bold border-slate-200">
                    <FileDown className="h-4 w-4 mr-2" />
                    EXPORT DOCX
                  </Button>
                </div>

                <div className="prose prose-slate max-w-none text-slate-800 leading-relaxed font-medium bg-slate-50 p-8 rounded-[2rem] border border-slate-100 shadow-inner">
                  {result.executiveSummary}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <Card className="rounded-[2rem] border-slate-100 shadow-xl overflow-hidden">
                    <CardHeader className="bg-emerald-50 border-b border-emerald-100">
                      <CardTitle className="text-emerald-800 text-sm font-black uppercase flex items-center gap-2">
                        <ListChecks className="h-4 w-4" />
                        Key Achievements
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <ul className="space-y-4">
                        {result.keyAchievements.map((item, idx) => (
                          <li key={idx} className="flex gap-3 text-sm font-bold text-slate-700">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="rounded-[2rem] border-slate-100 shadow-xl overflow-hidden">
                    <CardHeader className="bg-blue-50 border-b border-blue-100">
                      <CardTitle className="text-blue-800 text-sm font-black uppercase flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Operational Trends
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <ul className="space-y-4">
                        {result.operationalTrends.map((item, idx) => (
                          <li key={idx} className="flex gap-3 text-sm font-bold text-slate-700">
                            <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="rounded-[2rem] border-slate-100 shadow-xl overflow-hidden">
                    <CardHeader className="bg-red-50 border-b border-red-100">
                      <CardTitle className="text-red-800 text-sm font-black uppercase flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Critical Challenges
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <ul className="space-y-4">
                        {result.criticalChallenges.map((item, idx) => (
                          <li key={idx} className="flex gap-3 text-sm font-bold text-slate-700">
                            <div className="h-2 w-2 rounded-full bg-red-500 mt-1.5 shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="rounded-[2rem] border-slate-100 shadow-xl overflow-hidden">
                    <CardHeader className="bg-amber-50 border-b border-amber-100">
                      <CardTitle className="text-amber-800 text-sm font-black uppercase flex items-center gap-2">
                        <Lightbulb className="h-4 w-4" />
                        Strategic Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <ul className="space-y-4">
                        {result.strategicRecommendations.map((item, idx) => (
                          <li key={idx} className="flex gap-3 text-sm font-bold text-slate-700">
                            <div className="h-2 w-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="space-y-2 text-center md:text-left">
                    <h4 className="text-2xl font-black uppercase tracking-tight">Finalize Cumulative Brief</h4>
                    <p className="text-sm text-slate-400 font-bold max-w-md">Commit this analysis to the Command Registry for official end-of-period review.</p>
                  </div>
                  <Button onClick={handleExport} className="h-14 px-12 rounded-2xl font-black bg-blue-600 hover:bg-blue-700 shadow-2xl shadow-blue-600/40">
                    <Download className="mr-2 h-5 w-5" />
                    DOWNLOAD OFFICIAL DOCX
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
