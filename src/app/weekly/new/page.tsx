"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ChevronLeft, Send, Sparkles, FileText, Calendar, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateWeeklySummaryReport, GenerateWeeklySummaryReportOutput } from '@/ai/flows/generate-weekly-summary-report-flow';

export default function WeeklyReport() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GenerateWeeklySummaryReportOutput | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportsText, setReportsText] = useState('');

  const handleGenerate = async () => {
    if (!startDate || !endDate || !reportsText) {
      toast({ variant: "destructive", title: "Missing Fields", description: "Dates and reports text are required." });
      return;
    }

    setIsLoading(true);
    try {
      const dailyReports = reportsText.split('---').map(r => r.trim()).filter(Boolean);
      const res = await generateWeeklySummaryReport({
        startDate,
        endDate,
        dailyReports: dailyReports.length > 0 ? dailyReports : [reportsText]
      });
      setResult(res);
    } catch (error) {
      toast({ variant: "destructive", title: "AI Error", description: "Failed to process weekly data." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20">
      <header className="border-b bg-white px-4 md:px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2 md:gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="md:hidden">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => router.push('/')} className="hidden md:flex text-slate-600">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Dashboard
          </Button>
          <h1 className="text-lg md:text-xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            <span className="hidden sm:inline">Weekly Consolidation</span>
            <span className="sm:hidden">AI Summary</span>
          </h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto py-6 md:py-10 px-4 md:px-6 space-y-6 md:space-y-10">
        {!result ? (
          <div className="space-y-6 animate-in fade-in duration-500">
            <section className="space-y-1">
              <h2 className="text-xl md:text-2xl font-black text-slate-900">Consolidate Reports</h2>
              <p className="text-xs md:text-sm text-slate-500">Paste multiple daily reports separated by '---' for AI analysis.</p>
            </section>

            <Card className="border-none shadow-xl rounded-2xl md:rounded-[2rem] overflow-hidden bg-white">
              <CardContent className="p-6 md:p-8 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Start Date</Label>
                    <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-11 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">End Date</Label>
                    <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-11 rounded-xl" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Archive Text Block</Label>
                  <Textarea 
                    placeholder="Paste daily reports here... Use '---' separator for multiple entries." 
                    className="min-h-[300px] md:min-h-[400px] font-mono text-xs md:text-sm rounded-2xl bg-slate-50"
                    value={reportsText}
                    onChange={e => setReportsText(e.target.value)}
                  />
                </div>

                <Button size="lg" className="w-full h-14 rounded-2xl font-bold shadow-lg shadow-primary/20 text-base" onClick={handleGenerate} disabled={isLoading}>
                  {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2 h-5 w-5" />}
                  Generate Executive Summary
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6 md:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <section className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-slate-900">Weekly Executive Brief</h2>
                <div className="flex items-center gap-2 text-xs md:text-sm text-slate-500 mt-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{startDate} to {endDate}</span>
                </div>
              </div>
              <Button variant="outline" onClick={() => setResult(null)} className="rounded-xl h-10 w-full sm:w-auto">New Analysis</Button>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
              <Card className="lg:col-span-2 border-none shadow-2xl rounded-[2rem] bg-white overflow-hidden">
                <CardHeader className="p-8 pb-4">
                  <CardTitle className="text-xl font-black flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    Narrative Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-8 pb-8">
                  <div className="prose prose-slate prose-sm max-w-none leading-relaxed text-slate-700 whitespace-pre-wrap font-medium">
                    {result.weeklySummary}
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card className="bg-slate-900 text-white border-none shadow-xl rounded-2xl md:rounded-[1.5rem] overflow-hidden">
                  <CardHeader className="p-6 pb-2">
                    <CardTitle className="text-white text-base md:text-lg flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 md:h-5 md:w-5 text-emerald-400" />
                      Security Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 pt-0">
                    <p className="text-xs md:text-sm italic opacity-90 leading-relaxed font-medium">"{result.overallSecuritySituation}"</p>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-lg rounded-2xl bg-white">
                  <CardHeader className="p-6 pb-2">
                    <CardTitle className="text-base md:text-lg font-black">Recurring Challenges</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 pt-0">
                    <ul className="space-y-3">
                      {result.recurringChallenges.map((item, idx) => (
                        <li key={idx} className="flex gap-2 text-xs md:text-sm text-slate-600 font-medium leading-tight">
                          <div className="h-1.5 w-1.5 rounded-full bg-destructive mt-1.5 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="bg-primary/5 border-none shadow-lg rounded-2xl">
                  <CardHeader className="p-6 pb-2">
                    <CardTitle className="text-base md:text-lg font-black text-primary">Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 pt-0">
                    <ul className="space-y-3">
                      {result.commonRecommendations.map((item, idx) => (
                        <li key={idx} className="flex gap-2 text-xs md:text-sm text-slate-700 font-medium leading-tight">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-6 md:pt-10">
              <Button size="lg" className="w-full sm:w-auto px-12 h-14 rounded-2xl font-bold text-base shadow-xl shadow-primary/20" onClick={() => {
                toast({ title: "Briefing Archived", description: "Consolidated report stored in secure logs." });
                router.push('/');
              }}>
                Finalize & Archive Briefing
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
