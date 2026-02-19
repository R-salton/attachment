
"use client";

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { 
  ChevronLeft, 
  User, 
  Copy, 
  Printer, 
  CheckCircle, 
  ShieldAlert, 
  Loader2,
  Building2,
  BadgeCheck,
  Edit3,
  Save
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/hooks/use-user-profile';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

export default function ReportDetail({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const { user } = useUser();
  const { isAdmin, isCommander, isLeader } = useUserProfile();
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
      toast({ title: "Copied", description: "Transcript copied to clipboard." });
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
          <h3 key={i} className="text-xl font-black text-slate-900 dark:text-white mt-12 mb-6 border-b-2 border-slate-200 dark:border-slate-800 pb-3 uppercase tracking-tight leading-none">
            {line.replace(/\*/g, '')}
          </h3>
        );
      }
      return <p key={i} className="mb-4 text-base text-slate-800 dark:text-slate-100 leading-relaxed font-medium">{line}</p>;
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <Loader2 className="h-16 w-16 text-primary animate-spin" />
          <p className="text-muted-foreground font-black tracking-widest uppercase text-xs animate-pulse">Decrypting Registry...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <ShieldAlert className="h-24 w-24 text-destructive/20 mb-8" />
        <h2 className="text-3xl md:text-5xl font-black text-foreground mb-4">Transcript Unreachable</h2>
        <p className="text-muted-foreground mb-10 max-w-md text-sm md:text-lg font-bold">This operational log is restricted or does not exist in the current command vault.</p>
        <Button onClick={() => router.push('/reports')} size="lg" className="h-14 px-12 font-black rounded-2xl">
          Return to Registry
        </Button>
      </div>
    );
  }

  const canEdit = isAdmin || isCommander || isLeader || report.ownerId === user?.uid;

  return (
    <div className="min-h-screen bg-background pb-24 selection:bg-primary/20">
      <header className="border-b bg-background/95 backdrop-blur-xl px-4 md:px-10 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm print:hidden">
        <div className="flex items-center gap-2 md:gap-8">
          <Button variant="ghost" size="sm" onClick={() => router.push('/reports')} className="hover:bg-accent text-muted-foreground rounded-xl px-2 md:px-4 font-bold">
            <ChevronLeft className="h-6 w-6 md:mr-2" />
            <span className="hidden sm:inline uppercase tracking-widest text-[10px]">Archives</span>
          </Button>
          <div className="h-8 w-px bg-border hidden sm:block" />
          <div className="flex flex-col overflow-hidden">
            <h1 className="text-sm md:text-base font-black text-slate-900 dark:text-white truncate max-w-[140px] md:max-w-xl leading-none mb-1">
              {report.reportTitle}
            </h1>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest h-4 px-1 border-primary/20 text-primary">{report.unit}</Badge>
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{report.status}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="rounded-xl h-10 font-bold px-4">
                Cancel
              </Button>
              <Button size="sm" onClick={handleSaveEdit} disabled={isSaving} className="rounded-xl font-black h-10 px-6">
                {isSaving ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save Changes
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="hidden lg:flex items-center gap-2">
                {canEdit && (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="rounded-xl font-bold h-11 border-border">
                    <Edit3 className="h-4 w-4 mr-2" /> Edit
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={handleCopy} className="rounded-xl font-bold h-11 border-border">
                  {isCopied ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 mr-2" />}
                  Copy
                </Button>
              </div>
              <Button size="sm" onClick={() => window.print()} className="hidden md:flex rounded-xl font-black h-11 px-6 shadow-lg shadow-primary/20">
                <Printer className="h-4 w-4 mr-2" /> Print PDF
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto mt-16 px-4 md:px-10 space-y-16 print:mt-0 print:px-0">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
          <div className="space-y-6 flex-1">
            <div className="flex items-center gap-3">
              <div className="bg-primary p-3 rounded-2xl shadow-xl shadow-primary/10">
                <Building2 className="h-7 w-7 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black text-primary uppercase tracking-[0.3em] leading-none mb-1">Command Registry</span>
                <span className="text-xs font-black text-muted-foreground uppercase tracking-widest leading-none">Security Protocol Active</span>
              </div>
            </div>
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-slate-900 dark:text-white leading-[0.9]">
              {report.reportDate}
            </h2>
            <div className="flex flex-wrap items-center gap-8 pt-6">
              <div className="flex items-center gap-3 bg-card px-5 py-3 rounded-2xl border border-border shadow-sm">
                <BadgeCheck className="h-5 w-5 text-primary" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Station</span>
                  <span className="text-sm font-black text-foreground uppercase">{report.unit}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-card px-5 py-3 rounded-2xl border border-border shadow-sm">
                <User className="h-5 w-5 text-primary" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">In Charge</span>
                  <span className="text-sm font-black text-foreground uppercase">{report.reportingCommanderName}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Card className="shadow-3xl border-none rounded-[3rem] overflow-hidden bg-card print:shadow-none print:border-none print:rounded-none">
          <div className="h-3 bg-primary" />
          <CardContent className="p-8 md:p-20 relative">
            {isEditing ? (
              <div className="relative z-10 space-y-6">
                <Label className="text-xs font-black uppercase tracking-[0.2em] text-primary">Operational Log Revision</Label>
                <Textarea 
                  value={editableText} 
                  onChange={(e) => setEditableText(e.target.value)}
                  className="min-h-[700px] font-report text-lg leading-relaxed rounded-2xl bg-slate-50 dark:bg-slate-900 border-border focus:ring-primary/20 p-8 text-slate-900 dark:text-white"
                />
              </div>
            ) : (
              <div className="font-report text-lg leading-relaxed text-slate-900 dark:text-slate-100 tracking-tight relative z-10 max-w-4xl mx-auto">
                {formatContent(report.fullText)}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
