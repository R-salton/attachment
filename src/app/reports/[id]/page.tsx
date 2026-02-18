"use client";

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ChevronLeft, Calendar, User, Download, Copy, Printer, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ReportDetail({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const { toast } = useToast();
  const db = useFirestore();

  const reportRef = useMemoFirebase(() => {
    if (!db || !id) return null;
    return doc(db, 'reports', id);
  }, [db, id]);

  const { data: report, isLoading } = useDoc(reportRef);

  const handleCopy = () => {
    if (report?.fullText) {
      navigator.clipboard.writeText(report.fullText);
      toast({ title: "Copied", description: "Report content copied to clipboard" });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground animate-pulse">Loading report details...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold mb-2">Report Not Found</h2>
        <p className="text-muted-foreground mb-6">The report you are looking for does not exist or you don't have permission to view it.</p>
        <Button onClick={() => router.push('/reports')}>Return to List</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      <header className="border-b bg-white px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/reports')}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            All Reports
          </Button>
          <div className="h-6 w-px bg-border hidden md:block" />
          <h1 className="text-sm font-semibold text-primary truncate max-w-[200px] md:max-w-md">
            {report.reportTitle}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            <Copy className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Copy</span>
          </Button>
          <Button size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Print / PDF</span>
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto mt-8 px-6 space-y-6 print:mt-0 print:px-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight">{report.reportDate}</h2>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                Intake: {report.cadetIntake}
              </span>
              <span className="flex items-center gap-1.5">
                <User className="h-4 w-4" />
                Commander: {report.reportingCommanderName}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full border border-green-100 self-start md:self-center">
            <CheckCircle className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider">{report.status}</span>
          </div>
        </div>

        <Card className="shadow-lg print:shadow-none print:border-none">
          <CardContent className="p-8 md:p-12">
            <div className="prose prose-sm max-w-none font-mono text-sm whitespace-pre-wrap leading-relaxed">
              {report.fullText}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center pt-8 print:hidden">
          <Button variant="ghost" onClick={() => router.push('/reports')}>
            Return to Report History
          </Button>
        </div>
      </main>
    </div>
  );
}
