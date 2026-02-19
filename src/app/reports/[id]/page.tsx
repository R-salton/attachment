"use client";

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ChevronLeft, 
  Calendar, 
  User, 
  Copy, 
  Printer, 
  CheckCircle, 
  ShieldAlert, 
  Loader2,
  FileCheck,
  Building2,
  BadgeCheck
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function ReportDetail({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const { user } = useUser();
  const { toast } = useToast();
  const db = useFirestore();
  const [isCopied, setIsCopied] = useState(false);

  const reportRef = useMemoFirebase(() => {
    if (!db || !id || !user) return null;
    return doc(db, 'reports', id);
  }, [db, id, user?.uid]);

  const { data: report, isLoading } = useDoc(reportRef);

  const handleCopy = () => {
    if (report?.fullText) {
      navigator.clipboard.writeText(report.fullText);
      setIsCopied(true);
      toast({ title: "Copied", description: "Standardized report content copied to clipboard." });
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  // Helper to highlight bold sections (marked with * in raw text)
  const formatContent = (text: string) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
      // Check if line is a header (starts with *)
      if (line.startsWith('*') && line.endsWith('*')) {
        return (
          <h3 key={i} className="text-lg font-black text-slate-900 mt-8 mb-4 border-b-2 border-slate-100 pb-2 uppercase tracking-tight">
            {line.replace(/\*/g, '')}
          </h3>
        );
      }
      return <p key={i} className="mb-3">{line}</p>;
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <Loader2 className="h-16 w-16 text-primary animate-spin" />
            <FileCheck className="h-8 w-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-slate-500 font-bold tracking-widest uppercase text-xs animate-pulse">Authenticating Records...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 text-center">
        <div className="p-8 bg-white rounded-full shadow-lg mb-8 border border-slate-100">
          <ShieldAlert className="h-20 w-20 text-destructive/80" />
        </div>
        <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Record Unreachable</h2>
        <p className="text-slate-500 mb-10 max-w-md text-lg leading-relaxed">This operational log is restricted or does not exist in the current secure database.</p>
        <Button onClick={() => router.push('/reports')} size="lg" className="px-10 font-bold rounded-2xl shadow-xl shadow-primary/20">
          Return to Archive
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f7fa] pb-24 selection:bg-primary/20">
      <header className="border-b bg-white/80 backdrop-blur-md px-8 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm print:hidden">
        <div className="flex items-center gap-6">
          <Button variant="ghost" size="sm" onClick={() => router.push('/reports')} className="hover:bg-slate-100 text-slate-600 rounded-xl px-4">
            <ChevronLeft className="h-5 w-5 mr-2" />
            Archive
          </Button>
          <div className="h-8 w-px bg-slate-200 hidden md:block" />
          <div className="flex flex-col">
            <h1 className="text-sm font-black text-slate-900 truncate max-w-[180px] md:max-w-md leading-none mb-1">
              {report.reportTitle}
            </h1>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Digital Command Log</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleCopy} className="rounded-xl font-bold bg-white border-slate-200">
            {isCopied ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 mr-2" />}
            <span className="hidden md:inline">{isCopied ? 'Copied' : 'Copy Text'}</span>
          </Button>
          <Button size="sm" onClick={() => window.print()} className="rounded-xl font-bold shadow-lg shadow-primary/20">
            <Printer className="h-4 w-4 mr-2" />
            <span className="hidden md:inline">Generate PDF</span>
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto mt-12 px-8 space-y-10 print:mt-0 print:px-0">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <span className="text-[11px] font-black text-primary uppercase tracking-[0.4em]">Official Command Report</span>
            </div>
            <h2 className="text-5xl font-black tracking-tighter text-slate-900 leading-none">
              {report.reportDate}
            </h2>
            <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-[13px] font-bold text-slate-500 mt-6 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <span className="flex items-center gap-2.5">
                <BadgeCheck className="h-5 w-5 text-primary/60" />
                Intake: <span className="text-slate-900">{report.cadetIntake}</span>
              </span>
              <span className="flex items-center gap-2.5">
                <User className="h-5 w-5 text-primary/60" />
                OC: <span className="text-slate-900">{report.reportingCommanderName}</span>
              </span>
              <span className="flex items-center gap-2.5">
                <Calendar className="h-5 w-5 text-primary/60" />
                Filed: <span className="text-slate-900">{new Date(report.creationDateTime).toLocaleTimeString()}</span>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-emerald-50 text-emerald-700 px-6 py-3 rounded-2xl border border-emerald-100 self-start md:self-end shadow-sm">
            <CheckCircle className="h-5 w-5" />
            <span className="text-xs font-black uppercase tracking-[0.2em]">{report.status}</span>
          </div>
        </div>

        <Card className="shadow-2xl document-shadow border-none rounded-[2rem] overflow-hidden bg-white print:shadow-none print:border-none print:rounded-none animate-in fade-in zoom-in-95 duration-1000 delay-200">
          <div className="h-3 bg-primary" />
          <CardContent className="p-12 md:p-20 relative">
            {/* Watermark/Logo overlay for "Stunning" effect */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none">
              <Building2 className="h-[400px] w-[400px]" />
            </div>

            <div className="font-report text-[15px] leading-relaxed text-slate-800 tracking-normal document-content">
              {formatContent(report.fullText)}
            </div>
            
            <div className="mt-20 pt-10 border-t border-slate-100 flex justify-between items-end">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Electronic Signature</p>
                <p className="font-report font-bold text-slate-900">{report.reportingCommanderName}</p>
                <p className="text-xs text-slate-500">Cadet Commander</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Ref ID</p>
                <p className="text-[10px] font-mono text-slate-300">{report.id}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col items-center gap-6 pt-16 print:hidden">
          <div className="flex items-center gap-4 w-full">
            <div className="h-px bg-slate-200 flex-1" />
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em]">End of Transcript</p>
            <div className="h-px bg-slate-200 flex-1" />
          </div>
          <Button variant="ghost" onClick={() => router.push('/reports')} className="text-slate-500 font-bold hover:text-primary transition-colors">
            Return to Operational Archives
          </Button>
        </div>
      </main>
    </div>
  );
}
