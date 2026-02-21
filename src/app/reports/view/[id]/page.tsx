
"use client";

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  CheckCircle, 
  ShieldAlert, 
  Loader2,
  Building2,
  Edit3,
  Save,
  ArrowLeft,
  Shield,
  Printer,
  Copy,
  FileDown,
  X,
  Calendar
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/hooks/use-user-profile';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { exportReportToDocx } from '@/lib/export-docx';

const UNITS = ["Gasabo DPU", "Kicukiro DPU", "Nyarugenge DPU", "TRS", "SIF", "TFU", "ORDERLY REPORT"];

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
  const [editableDate, setEditableDate] = useState("");
  const [editableUnit, setEditableUnit] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const reportRef = useMemoFirebase(() => {
    if (!db || !id || !user) return null;
    return doc(db, 'reports', id);
  }, [db, id, user?.uid]);

  const { data: report, isLoading } = useDoc(reportRef);

  useEffect(() => {
    if (report) {
      setEditableText(report.fullText || "");
      setEditableDate(report.reportDate || "");
      setEditableUnit(report.unit || "");
    }
  }, [report]);

  const handleCopy = () => {
    if (report?.fullText) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = report.fullText;
      const text = tempDiv.innerText;
      
      navigator.clipboard.writeText(text);
      setIsCopied(true);
      toast({ title: "Copied", description: "Transcript text copied to clipboard." });
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleExport = async () => {
    if (!report) return;
    setIsExporting(true);
    try {
      await exportReportToDocx({
        reportTitle: report.reportTitle,
        reportDate: report.reportDate,
        unit: report.unit,
        fullText: report.fullText,
        reportingCommanderName: report.reportingCommanderName
      });
      toast({ title: "Export Complete", description: "Word document has been generated." });
    } catch (e) {
      toast({ variant: "destructive", title: "Export Failed", description: "Could not generate Word document." });
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!reportRef || !report) return;
    setIsSaving(true);
    try {
      // Logic to sync title based on new date/unit
      const isOverallReport = editableUnit === 'ORDERLY REPORT';
      const newTitle = isOverallReport 
        ? `OVERALL REPORT - ${editableDate}` 
        : `SITUATION REPORT - ${editableUnit} (${editableDate})`;

      await updateDoc(reportRef, { 
        fullText: editableText,
        reportDate: editableDate,
        unit: editableUnit,
        reportTitle: newTitle
      });
      
      setIsEditing(false);
      toast({ title: "Update Successful", description: "Operational log has been modified." });
    } catch (e) {
      toast({ variant: "destructive", title: "Update Failed", description: "Could not save changes." });
    } finally {
      setIsSaving(false);
    }
  };

  const renderContent = (content: string) => {
    if (!content) return null;
    const isHtml = content.trim().startsWith('<') || content.includes('class=') || content.includes('<p>');

    if (isHtml) {
      return (
        <div 
          dangerouslySetInnerHTML={{ __html: content }} 
          className="prose prose-slate prose-sm md:prose-lg max-w-none text-slate-900 dark:text-white"
        />
      );
    }

    return content.split('\n').map((line, i) => {
      if (line.trim() === '--- Operational Details Below ---') {
        return <div key={i} className="my-12 border-t-2 border-dashed border-slate-200 dark:border-slate-800" />;
      }
      if (line.startsWith('*') && line.endsWith('*')) {
        const text = line.replace(/\*/g, '');
        return <h3 key={i} className="text-xl md:text-2xl font-black text-slate-900 dark:text-white mt-10 mb-6 border-b-2 border-primary/20 pb-3 uppercase tracking-tight">{text}</h3>;
      }
      if (line.startsWith('.')) {
        return (
          <div key={i} className="flex gap-3 mb-3 ml-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2.5 shrink-0" />
            <p className="text-base md:text-lg text-slate-800 dark:text-slate-200 leading-relaxed font-semibold">
              {line.substring(1).trim()}
            </p>
          </div>
        );
      }
      return <p key={i} className="mb-4 text-base md:text-lg text-slate-900 dark:text-white leading-relaxed font-bold">{line}</p>;
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <Loader2 className="h-16 w-16 text-primary animate-spin" />
          <p className="text-muted-foreground font-black tracking-widest uppercase text-xs">Decrypting Transcript...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <ShieldAlert className="h-24 w-24 text-destructive/20 mb-8" />
        <h2 className="text-3xl md:text-5xl font-black text-foreground mb-4">Transcript Restricted</h2>
        <p className="text-muted-foreground mb-10 max-w-md text-sm md:text-lg font-bold uppercase tracking-tight">Access Prohibited.</p>
        <Button onClick={() => router.push('/')} size="lg" className="h-14 px-12 font-black rounded-2xl">
          Return to Dashboard
        </Button>
      </div>
    );
  }

  const canView = isAdmin || isCommander || isLeader || report.ownerId === user?.uid;
  if (!canView) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <ShieldAlert className="h-24 w-24 text-destructive/20 mb-8" />
        <h2 className="text-3xl font-black text-foreground mb-4">Access Denied</h2>
        <p className="text-muted-foreground mb-10 max-w-md text-sm font-bold uppercase">Classified Record.</p>
        <Button onClick={() => router.push('/')} size="lg" className="h-14 px-12 font-black rounded-2xl">Return Dashboard</Button>
      </div>
    );
  }

  const canEdit = isAdmin || report.ownerId === user?.uid;

  return (
    <div className="min-h-screen bg-background pb-24 selection:bg-primary/20">
      <header className="border-b bg-background/95 backdrop-blur-xl px-4 md:px-10 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm print:hidden">
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="hover:bg-accent text-muted-foreground rounded-xl px-1 md:px-4 font-bold h-9 md:h-10">
            <ArrowLeft className="h-5 w-5 md:mr-2 text-foreground" />
            <span className="hidden sm:inline uppercase tracking-widest text-[10px] text-foreground">Back</span>
          </Button>
          <div className="h-6 w-px bg-border hidden sm:block" />
          <div className="flex flex-col overflow-hidden">
            <h1 className="text-[10px] md:text-sm font-black text-foreground truncate max-w-[100px] sm:max-w-xl leading-none mb-0.5 uppercase tracking-tighter">
              {report.reportTitle}
            </h1>
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className="text-[7px] md:text-[8px] font-black uppercase tracking-widest h-3 px-1 border-primary/20 text-primary">{report.unit}</Badge>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 md:gap-2">
          {isEditing ? (
            <div className="flex items-center gap-1.5">
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="rounded-xl h-9 md:h-10 font-bold px-2 md:px-4 text-foreground text-xs">
                <span className="hidden sm:inline">Cancel</span>
                <X className="sm:hidden h-4 w-4" />
              </Button>
              <Button size="sm" onClick={handleSaveEdit} disabled={isSaving} className="rounded-xl font-black h-9 md:h-10 px-3 md:px-6 shadow-md shadow-primary/10 text-xs">
                {isSaving ? <Loader2 className="animate-spin h-4 w-4 mr-0 md:mr-2" /> : <Save className="h-4 w-4 mr-0 md:mr-2" />}
                <span className="hidden sm:inline">Save</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              {canEdit && (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="rounded-xl font-bold h-9 md:h-10 px-2 md:px-4 border-border text-foreground text-xs bg-white shadow-sm">
                  <Edit3 className="h-4 w-4 md:mr-2" />
                  <span className="hidden sm:inline">Edit</span>
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleCopy} className="rounded-xl font-bold h-9 md:h-10 px-2 md:px-4 border-border text-foreground text-xs bg-white shadow-sm">
                {isCopied ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 md:mr-2" />}
                <span className="hidden sm:inline">Copy</span>
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting} className="rounded-xl font-bold h-9 md:h-10 px-2 md:px-4 border-border text-foreground text-xs bg-white shadow-sm">
                {isExporting ? <Loader2 className="animate-spin h-4 w-4 md:mr-2" /> : <FileDown className="h-4 w-4 md:mr-2" />}
                <span className="hidden sm:inline">Word</span>
              </Button>
              <Button size="sm" onClick={() => window.print()} className="hidden md:flex rounded-xl font-black h-10 px-6 shadow-xl shadow-primary/20">
                <Printer className="h-3.5 w-3.5 mr-2" /> Print
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto mt-6 md:mt-12 px-4 md:px-10 space-y-6 md:space-y-10 print:mt-0 print:px-0">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
          <div className="space-y-3 md:space-y-4 flex-1">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="bg-primary p-2 rounded-xl shadow-lg shadow-primary/10">
                <Building2 className="h-5 w-5 md:h-6 md:w-6 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] leading-none mb-1">Command Registry</span>
                <span className="text-[8px] md:text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">Record Entry #{report.id.substring(0,8).toUpperCase()}</span>
              </div>
            </div>
            
            {isEditing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary tracking-widest">Revision Date</Label>
                  <Input 
                    value={editableDate} 
                    onChange={(e) => setEditableDate(e.target.value)}
                    className="h-12 rounded-xl bg-white border-slate-200 font-bold"
                    placeholder="e.g. 18 FEB 26"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary tracking-widest">Deployment Unit</Label>
                  <Select value={editableUnit} onValueChange={setEditableUnit}>
                    <SelectTrigger className="h-12 rounded-xl bg-white border-slate-200 font-bold">
                      <SelectValue placeholder="Select Unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-3xl md:text-6xl font-black tracking-tighter text-slate-900 dark:text-white leading-[1] md:leading-[0.9] uppercase">
                  {report.reportDate}
                </h2>
                <div className="flex flex-wrap items-center gap-2 md:gap-3 pt-2 md:pt-4">
                  <Badge className="bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-900 h-7 md:h-8 px-2 md:px-4 font-black rounded-lg text-[9px] md:text-[10px] uppercase tracking-widest border-none">
                    UNIT: {report.unit}
                  </Badge>
                  <Badge variant="outline" className="h-7 md:h-8 px-2 md:px-4 font-black rounded-lg border-2 text-[9px] md:text-[10px] uppercase tracking-widest border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-50">
                    OIC: {report.reportingCommanderName}
                  </Badge>
                </div>
              </>
            )}
          </div>
        </div>

        <Card className="shadow-2xl border border-slate-200 dark:border-slate-800 rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden bg-card print:shadow-none print:border-none print:rounded-none">
          <div className="h-1.5 md:h-2 bg-primary" />
          <CardContent className="p-6 md:p-16 relative bg-card">
            {isEditing ? (
              <div className="relative z-10 space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Transcript Revision (HTML Source)</Label>
                <Textarea 
                  value={editableText} 
                  onChange={(e) => setEditableText(e.target.value)}
                  className="min-h-[400px] md:min-h-[600px] font-mono text-xs md:text-sm leading-relaxed rounded-2xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-4 md:p-8"
                />
              </div>
            ) : (
              <div className="font-report text-base md:text-lg leading-relaxed text-slate-900 dark:text-white tracking-tight relative z-10 max-w-3xl mx-auto">
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center -z-10">
                   <Shield className="h-[200px] w-[200px] md:h-[400px] md:w-[400px] text-slate-900 dark:text-white" />
                </div>
                {renderContent(report.fullText)}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
