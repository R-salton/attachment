
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
  Calendar,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight
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
        <Button onClick={() => router.push('/')} size="lg" className="h-14 px-12 font-black rounded-2xl">Return Dashboard</Button>
      </div>
    );
  }

  const canEdit = isAdmin || report.ownerId === user?.uid;

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24 selection:bg-primary/20">
      <header className="border-b bg-white/95 backdrop-blur-xl px-4 md:px-10 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm print:hidden">
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="hover:bg-accent text-muted-foreground rounded-xl px-1 md:px-4 font-bold h-9 md:h-10" disabled={isEditing}>
            <ArrowLeft className="h-5 w-5 md:mr-2 text-foreground" />
            <span className="hidden sm:inline uppercase tracking-widest text-[10px] text-foreground">Back</span>
          </Button>
          <div className="flex flex-col overflow-hidden">
            <h1 className="text-[10px] md:text-sm font-black text-foreground truncate max-w-[100px] sm:max-w-xl leading-none mb-0.5 uppercase tracking-tighter">
              {isEditing ? "Revising Operational Log" : report.reportTitle}
            </h1>
            <Badge variant="outline" className="text-[7px] md:text-[8px] font-black uppercase tracking-widest h-3 px-1 border-primary/20 text-primary w-fit">{report.unit}</Badge>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 md:gap-2">
          {!isEditing && (
            <div className="flex items-center gap-1.5">
              {canEdit && (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="rounded-xl font-bold h-9 md:h-10 px-2 md:px-4 border-slate-200 text-slate-900 text-xs bg-white shadow-sm hover:bg-slate-50">
                  <Edit3 className="h-4 w-4 md:mr-2" />
                  <span className="hidden sm:inline">Edit</span>
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleCopy} className="rounded-xl font-bold h-9 md:h-10 px-2 md:px-4 border-slate-200 text-slate-900 text-xs bg-white shadow-sm hover:bg-slate-50">
                {isCopied ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 md:mr-2" />}
                <span className="hidden sm:inline">Copy</span>
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto mt-6 md:mt-12 px-4 md:px-10 space-y-6 md:space-y-10 print:mt-0 print:px-0">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="bg-slate-900 p-2.5 rounded-2xl shadow-lg">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] leading-none mb-1">Command Registry</span>
              <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Entry #{report.id.substring(0,8).toUpperCase()}</span>
            </div>
          </div>
          
          {isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-primary tracking-widest">Revision Date</Label>
                <Input value={editableDate} onChange={(e) => setEditableDate(e.target.value)} className="h-12 rounded-xl bg-white border-slate-200 font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-primary tracking-widest">Deployment Unit</Label>
                <Select value={editableUnit} onValueChange={setEditableUnit}>
                  <SelectTrigger className="h-12 rounded-xl bg-white border-slate-200 font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <h2 className="text-4xl md:text-7xl font-black tracking-tighter text-slate-900 leading-none uppercase">
                  {report.reportDate}
                </h2>
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <Badge className="bg-slate-900 text-white h-8 px-4 font-black rounded-lg text-[10px] uppercase tracking-widest border-none">
                    UNIT: {report.unit}
                  </Badge>
                  <Badge variant="outline" className="h-8 px-4 font-black rounded-lg border-2 text-[10px] uppercase tracking-widest border-slate-200 text-slate-900">
                    OIC: {report.reportingCommanderName}
                  </Badge>
                </div>
              </div>

              {/* Responsive Download and Action Section */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 print:hidden">
                <Button 
                  onClick={handleExport} 
                  disabled={isExporting} 
                  className="h-14 sm:h-12 flex-1 sm:flex-initial rounded-2xl font-black bg-slate-900 hover:bg-slate-800 shadow-xl shadow-slate-900/10 transition-all active:scale-95"
                >
                  {isExporting ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : <FileDown className="mr-2 h-5 w-5" />}
                  DOWNLOAD DOCX
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.print()} 
                  className="h-14 sm:h-12 flex-1 sm:flex-initial rounded-2xl font-black border-slate-200 bg-white hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
                >
                  <Printer className="mr-2 h-5 w-5 text-slate-900" />
                  PRINT TRANSCRIPT
                </Button>
              </div>
            </>
          )}
        </div>

        <Card className="shadow-2xl border-none rounded-[2rem] md:rounded-[3rem] overflow-hidden bg-white print:shadow-none print:border-none print:rounded-none">
          <div className="h-2 bg-slate-900" />
          <CardContent className="p-8 md:p-16 relative">
            {isEditing ? (
              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Transcript Revision (HTML)</Label>
                <Textarea 
                  value={editableText} 
                  onChange={(e) => setEditableText(e.target.value)}
                  className="min-h-[600px] font-mono text-sm leading-relaxed rounded-2xl bg-slate-50 border-slate-200 p-8"
                />
              </div>
            ) : (
              <div className="space-y-12">
                <div className="font-report text-base md:text-lg leading-relaxed text-slate-900 relative z-10 max-w-3xl mx-auto">
                  <div dangerouslySetInnerHTML={{ __html: report.fullText }} className="prose prose-slate prose-lg max-w-none prose-p:font-bold prose-strong:font-black" />
                </div>

                {report.images && report.images.length > 0 && (
                  <div className="pt-12 border-t border-slate-100">
                    <div className="flex items-center gap-3 mb-8">
                      <ImageIcon className="h-5 w-5 text-primary" />
                      <h4 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Tactical Media Evidence</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {report.images.map((img, idx) => (
                        <div key={idx} className="group relative rounded-3xl overflow-hidden border border-slate-100 shadow-lg hover:shadow-2xl transition-all cursor-zoom-in">
                          <img src={img} alt="Evidence" className="w-full h-auto object-cover aspect-video group-hover:scale-105 transition-transform duration-700" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                            <span className="text-white text-[10px] font-black uppercase tracking-widest">Exhibit {idx + 1}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {isEditing && (
          <div className="flex flex-col sm:flex-row justify-end items-center gap-4 pt-6">
            <Button variant="ghost" onClick={() => setIsEditing(false)} className="w-full sm:w-auto rounded-xl h-12 px-8 font-bold text-slate-500 hover:bg-slate-100" disabled={isSaving}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={isSaving} className="w-full sm:w-auto rounded-xl h-12 px-12 font-black shadow-xl shadow-primary/20 bg-slate-900 hover:bg-slate-800 text-white">
              {isSaving ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Commit Revision
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
