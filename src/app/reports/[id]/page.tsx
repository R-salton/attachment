"use client";

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ChevronLeft, Calendar, User, Download, Copy, Printer, CheckCircle, ShieldAlert, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ReportDetail({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const { user } = useUser();
  const { toast } = useToast();
  const db = useFirestore();

  const reportRef = useMemoFirebase(() => {
    if (!db || !id || !user) return null;
    return doc(db, 'reports', id);
  }, [db, id, user?.uid]);

  const { data: report, isLoading } = useDoc(reportRef);

  const handleCopy = () => {
    if (report?.fullText) {
      navigator.clipboard.writeText(report.fullText);
      toast({ title: "Copied", description: "Standardized report content copied to clipboard." });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
          <p className="text-slate-500 font-bold tracking-widest uppercase text-xs animate-pulse">Decrypting Operational Log...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 text-center">
        <div className="p-6 bg-white rounded-full shadow-sm mb-6">
          <ShieldAlert className="h-16 w-16 text-destructive" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Access Denied</h2>
        <p className="text-slate-500 mb-8 max-w-md">This report could not be retrieved. It may not exist, or your current credentials do not grant access to this log.</p>
        <Button onClick={() => router.push('/reports')} className="h-12 px-8 font-bold rounded-xl">Return to Records</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20">
      <header className="border-b bg-white px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/reports')}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Records
          </Button>
          <div className="h-6 w-px bg-slate-200 hidden md:block" />
          <h1 className="text-sm font-extrabold text-slate-900 truncate max-w-[200px] md:max-w-md">
            {report.reportTitle}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy} className="rounded-lg font-bold">
            <Copy className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Copy</span>
          </Button>
          <Button size="sm" onClick={() => window.print()} className="rounded-lg font-bold">
            <Printer className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Print / PDF</span>
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto mt-10 px-6 space-y-8 print:mt-0 print:px-0">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <span className="text-[10px] font-extrabold text-primary uppercase tracking-[0.3em] mb-2 block">Operational Entry</span>
            <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 leading-none">{report.reportDate}</h2>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-bold text-slate-500 mt-4">
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-400" />
                Cadet Intake: {report.cadetIntake}
              </span>
              <span className="flex items-center gap-2">
                <User className="h-4 w-4 text-slate-400" />
                Filing Commander: {report.reportingCommanderName}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl border border-emerald-100 self-start md:self-end">
            <CheckCircle className="h-4 w-4" />
            <span className="text-xs font-extrabold uppercase tracking-widest">{report.status}</span>
          </div>
        </div>

        <Card className="shadow-2xl border-none rounded-2xl print:shadow-none print:border-slate-200 print:rounded-none">
          <CardContent className="p-10 md:p-16">
            <div className="prose prose-slate max-w-none font-mono text-sm whitespace-pre-wrap leading-loose text-slate-800 tracking-tight">
              {report.fullText}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col items-center gap-4 pt-12 print:hidden">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">End of Operational Record</p>
          <Button variant="ghost" onClick={() => router.push('/reports')} className="text-slate-500 font-bold">
            Return to Report History
          </Button>
        </div>
      </main>
    </div>
  );
}