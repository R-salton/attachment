
"use client";

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
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
  BadgeCheck,
  Edit3,
  Save,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';

export default function ReportDetail({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const { user } = useUser();
  const { toast } = useToast();
  const db = useFirestore();
  const [isCopied, setIsCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editableText, setEditableText] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const reportRef = useMemoFirebase(() => {
    if (!db || !id || !user) return null;
    return doc(db, 'reports', id);
  }, [db, id, user?.uid]);

  const { data: report, isLoading } = useDoc(reportRef);

  useEffect(() => {
    if (report?.fullText) {
      setEditableText(report.fullText);
    }
  }, [report?.fullText]);

  const handleCopy = () => {
    if (report?.fullText) {
      navigator.clipboard.writeText(report.fullText);
      setIsCopied(true);
      toast({ title: "Copied", description: "Standardized report content copied to clipboard." });
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleSaveEdit = async () => {
    if (!reportRef) return;
    setIsSaving(true);
    try {
      await updateDoc(reportRef, { fullText: editableText });
      setIsEditing(false);
      toast({ title: "Update Successful", description: "Operational log has been modified." });
    } catch (e) {
      toast({ variant: "destructive", title: "Update Failed", description: "Could not save changes." });
    } finally {
      setIsSaving(false);
    }
  };

  const formatContent = (text: string) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
      if (line.startsWith('*') && line.endsWith('*')) {
        return (
          <h3 key={i} className="text-base md:text-lg font-black text-slate-900 mt-6 md:mt-8 mb-3 md:mb-4 border-b-2 border-slate-100 pb-2 uppercase tracking-tight">
            {line.replace(/\*/g, '')}
          </h3>
        );
      }
      return <p key={i} className="mb-2 md:mb-3 text-sm md:text-[15px]">{line}</p>;
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 md:gap-6">
          <div className="relative">
            <Loader2 className="h-12 w-12 md:h-16 md:w-16 text-primary animate-spin" />
            <FileCheck className="h-6 w-6 md:h-8 md:w-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-slate-500 font-bold tracking-widest uppercase text-[10px] md:text-xs animate-pulse">Authenticating Records...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 text-center">
        <div className="p-6 md:p-8 bg-white rounded-full shadow-lg mb-6 md:mb-8 border border-slate-100">
          <ShieldAlert className="h-12 w-12 md:h-20 md:w-20 text-destructive/80" />
        </div>
        <h2 className="text-2xl md:text-4xl font-black text-slate-900 mb-3 md:mb-4 tracking-tight">Record Unreachable</h2>
        <p className="text-slate-500 mb-8 md:mb-10 max-w-md text-sm md:text-lg leading-relaxed">This operational log is restricted or does not exist in the current unit vault.</p>
        <Button onClick={() => router.push('/reports')} size="lg" className="px-8 md:px-10 font-bold rounded-2xl shadow-xl shadow-primary/20">
          Return to Archive
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f7fa] pb-16 md:pb-24 selection:bg-primary/20">
      <header className="border-b bg-white/80 backdrop-blur-md px-4 md:px-8 py-3 md:py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm print:hidden">
        <div className="flex items-center gap-2 md:gap-6">
          <Button variant="ghost" size="sm" onClick={() => router.push('/reports')} className="hover:bg-slate-100 text-slate-600 rounded-xl px-2 md:px-4">
            <ChevronLeft className="h-5 w-5 md:mr-2" />
            <span className="hidden sm:inline">Archive</span>
          </Button>
          <div className="h-6 md:h-8 w-px bg-slate-200 hidden sm:block" />
          <div className="flex flex-col overflow-hidden">
            <h1 className="text-xs md:text-sm font-black text-slate-900 truncate max-w-[120px] md:max-w-md leading-none mb-0.5 md:mb-1">
              {report.reportTitle}
            </h1>
            <span className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">{report.unit} Unit</span>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          {isEditing ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="rounded-xl h-8 md:h-10">
                <X className="h-4 w-4 mr-2" /> Cancel
              </Button>
              <Button size="sm" onClick={handleSaveEdit} disabled={isSaving} className="rounded-xl font-bold h-8 md:h-10">
                {isSaving ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="rounded-xl font-bold bg-white h-8 md:h-10">
                <Edit3 className="h-3.5 w-3.5 sm:mr-2" />
                <span className="hidden sm:inline">Edit</span>
              </Button>
              <Button variant="outline" size="sm" onClick={handleCopy} className="rounded-xl font-bold bg-white h-8 md:h-10">
                {isCopied ? <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 sm:mr-2" />}
                <span className="hidden sm:inline">Copy</span>
              </Button>
              <Button size="sm" onClick={() => window.print()} className="rounded-xl font-bold h-8 md:h-10">
                <Printer className="h-3.5 w-3.5 sm:mr-2" />
                <span className="hidden sm:inline">PDF</span>
              </Button>
            </>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto mt-6 md:mt-12 px-4 md:px-8 space-y-8 md:space-y-10 print:mt-0 print:px-0">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-8 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="space-y-3 md:space-y-4">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-1.5 md:p-2 rounded-lg">
                <Building2 className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              </div>
              <span className="text-[9px] md:text-[11px] font-black text-primary uppercase tracking-[0.2em] md:tracking-[0.4em]">Official Command Report</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-slate-900 leading-none">
              {report.reportDate}
            </h2>
            <div className="flex flex-wrap items-center gap-x-4 md:gap-x-8 gap-y-2 md:gap-y-3 text-[11px] md:text-[13px] font-bold text-slate-500 mt-4 md:mt-6 bg-white p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-100 shadow-sm">
              <span className="flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 md:h-5 md:w-5 text-primary/60" />
                Unit: <span className="text-slate-900">{report.unit}</span>
              </span>
              <span className="flex items-center gap-2">
                <User className="h-4 w-4 md:h-5 md:w-5 text-primary/60" />
                OC: <span className="text-slate-900">{report.reportingCommanderName}</span>
              </span>
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4 md:h-5 md:w-5 text-primary/60" />
                Filed: <span className="text-slate-900">{new Date(report.creationDateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3 bg-emerald-50 text-emerald-700 px-4 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl border border-emerald-100 self-start md:self-end shadow-sm">
            <CheckCircle className="h-4 w-4 md:h-5 md:w-5" />
            <span className="text-[9px] md:text-xs font-black uppercase tracking-[0.2em]">{report.status}</span>
          </div>
        </div>

        <Card className="shadow-2xl document-shadow border-none rounded-[1.5rem] md:rounded-[2rem] overflow-hidden bg-white print:shadow-none print:border-none print:rounded-none animate-in fade-in zoom-in-95 duration-1000 delay-200">
          <div className="h-2 md:h-3 bg-primary" />
          <CardContent className="p-8 md:p-20 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none overflow-hidden">
              <Building2 className="h-[300px] w-[300px] md:h-[400px] md:w-[400px]" />
            </div>

            {isEditing ? (
              <div className="relative z-10 space-y-4">
                <Label className="text-xs font-black uppercase tracking-widest text-primary">Modify Transcript</Label>
                <Textarea 
                  value={editableText} 
                  onChange={(e) => setEditableText(e.target.value)}
                  className="min-h-[600px] font-report text-[14px] md:text-[15px] leading-relaxed rounded-xl bg-slate-50 border-slate-200 focus:ring-primary/20"
                />
              </div>
            ) : (
              <div className="font-report text-[14px] md:text-[15px] leading-relaxed text-slate-800 tracking-normal document-content relative z-10 overflow-x-auto">
                {formatContent(report.fullText)}
              </div>
            )}
            
            <div className="mt-12 md:mt-20 pt-8 md:pt-10 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
              <div className="space-y-1">
                <p className="text-[8px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest">Electronic Signature</p>
                <p className="font-report font-bold text-slate-900 text-sm md:text-base">{report.reportingCommanderName}</p>
                <p className="text-[10px] md:text-xs text-slate-500 font-medium">Cadet Commander</p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-[8px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest">Ref ID</p>
                <p className="text-[8px] md:text-[10px] font-mono text-slate-300 break-all">{report.id}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col items-center gap-4 md:gap-6 pt-10 md:pt-16 pb-12 print:hidden">
          <div className="flex items-center gap-3 w-full">
            <div className="h-px bg-slate-200 flex-1" />
            <p className="text-[9px] md:text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] md:tracking-[0.5em]">End of Transcript</p>
            <div className="h-px bg-slate-200 flex-1" />
          </div>
          <Button variant="ghost" onClick={() => router.push('/reports')} className="text-slate-500 font-bold hover:text-primary transition-colors text-xs md:text-sm">
            Return to Operational Archives
          </Button>
        </div>
      </main>
    </div>
  );
}
