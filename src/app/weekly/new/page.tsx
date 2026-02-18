"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ChevronLeft, Send, Sparkles, FileText, Calendar } from 'lucide-react';
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
      toast({ variant: "destructive", title: "Missing Fields", description: "Please fill in the date range and provide daily reports text." });
      return;
    }

    setIsLoading(true);
    try {
      // Split by a delimiter or just treat as one big blob if they follow the format
      const dailyReports = reportsText.split('---').map(r => r.trim()).filter(Boolean);
      const res = await generateWeeklySummaryReport({
        startDate,
        endDate,
        dailyReports: dailyReports.length > 0 ? dailyReports : [reportsText]
      });
      setResult(res);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to generate weekly summary." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/')}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <h1 className="text-xl font-bold text-primary flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            Weekly Consolidation
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-10 px-6 space-y-8">
        {!result ? (
          <div className="space-y-6">
            <section className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">Generate Summary</h2>
              <p className="text-muted-foreground">Paste multiple daily reports below separated by '---' to create a high-level weekly overview.</p>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Week Start Date</Label>
                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Week End Date</Label>
                <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Daily Reports Text</Label>
              <Textarea 
                placeholder="Paste daily reports here... Use '---' to separate days if possible." 
                className="min-h-[400px] font-mono text-sm"
                value={reportsText}
                onChange={e => setReportsText(e.target.value)}
              />
            </div>

            <Button size="lg" className="w-full" onClick={handleGenerate} disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2 h-4 w-4 text-accent" />}
              Generate Weekly Summary
            </Button>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <section className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold">Weekly Executive Summary</h2>
                <p className="text-muted-foreground">{startDate} to {endDate}</p>
              </div>
              <Button variant="outline" onClick={() => setResult(null)}>Create New</Button>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-2 shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Narrative Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm max-w-none leading-relaxed text-foreground">
                  {result.weeklySummary}
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card className="bg-primary text-white">
                  <CardHeader>
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Security Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm italic opacity-90">{result.overallSecuritySituation}</p>
                  </CardContent>
                </Card>

                <Card className="border-accent/20">
                  <CardHeader>
                    <CardTitle className="text-lg">Recurring Challenges</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                      {result.recurringChallenges.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="bg-accent/5 border-accent/20">
                  <CardHeader>
                    <CardTitle className="text-lg text-accent">Key Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc list-inside space-y-2 text-sm">
                      {result.commonRecommendations.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="flex justify-center pt-8">
              <Button size="lg" className="w-full md:w-auto px-12" onClick={() => {
                toast({ title: "Summary Exported", description: "Report has been archived for management review." });
                router.push('/');
              }}>
                Finalize and Archive Summary
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}