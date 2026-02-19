"use client";

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { 
  ChevronLeft, 
  Calendar, 
  User, 
  Copy, 
  Printer, 
  CheckCircle, 
  ShieldAlert, 
  ShieldCheck,
  Loader2,
  FileCheck,
  Building2,
  BadgeCheck,
  Edit3,
  Save,
  X,
  Trash2,
  FileDown,
  Clock,
  ExternalLink,
  MoreVertical
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/hooks/use-user-profile';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

export default function ReportDetail({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const { user } = useUser();
  const { isLeader } = useUserProfile();
  const { toast } = useToast();
  const db = useFirestore();
  const [isCopied, setIsCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editableText, setEditableText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleExportWord = async () => {
    if (!report?.fullText) return;
    
    setIsSaving(true);
    try {
      const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx');
      const { saveAs } = await import('file-saver');

      const paragraphs = report.fullText.split('\n').map((line: string) => {
        const isHeader = line.startsWith('*') && line.endsWith('*');
        return new Paragraph({
          heading: isHeader ? HeadingLevel.HEADING_3 : undefined,
          spacing: { after: 120, before: isHeader ? 240 : 0 },
          children: [
            new TextRun({
              text: isHeader ? line.replace(/\*/g, '') : line,
              bold: isHeader,
              size: isHeader ? 28 : 22,
              font: "Calibri"
            }),
          ],
        });
      });

      const docObj = new Document({
        sections: [{
          properties: {},
          children: paragraphs,
        }],
      });

      const blob = await Packer.toBlob(docObj);
      saveAs(blob, `${report.reportTitle.replace(/[/\\?%*:|"<>]/g, '-')}.docx`);
      toast({ title: "Export Successful", description: "Word document has been generated." });
    } catch (error) {
      toast({ variant: "destructive", title: "Export Failed", description: "Could not generate Word document." });
    } finally {
      setIsSaving(false);
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

  const handleDelete = async () => {
    if (!reportRef) return;
    setIsDeleting(true);
    try {
      await deleteDoc(reportRef);
      toast({ title: "Record Deleted", description: "Operational log has been removed from the archive." });
      router.push('/reports');
    } catch (e) {
      toast({ variant: "destructive", title: "Deletion Failed", description: "Could not remove report." });
      setIsDeleting(false);
    }
  };

  const formatContent = (text: string) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
      if (line.startsWith('*') && line.endsWith('*')) {
        return (
          <h3 key={i} className="text-base md:text-xl font-black text-slate-900 mt-8 md:mt-12 mb-4 md:mb-6 border-b-2 border-slate-100 pb-3 uppercase tracking-tight leading-none">
            {line.replace(/\*/g, '')}
          </h3>
        );
      }
      return <p key={i} className="mb-3 md:mb-4 text-sm md:text-base text-slate-700 leading-relaxed">{line}</p>;
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <Loader2 className="h-16 w-16 text-primary animate-spin" />
          <p className="text-slate-400 font-black tracking-widest uppercase text-xs animate-pulse">Decrypting Registry...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 text-center">
        <ShieldAlert className="h-24 w-24 text-destructive/20 mb-8" />
        <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-4">Transcript Unreachable</h2>
        <p className="text-slate-500 mb-10 max-w-md text-sm md:text-lg font-bold">This operational log is restricted or does not exist in the current command vault.</p>
        <Button onClick={() => router.push('/reports')} size="lg" className="h-14 px-12 font-black rounded-2xl shadow-xl shadow-primary/20">
          Return to Registry
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f7fa] pb-24 selection:bg-primary/20">
      <header className="border-b bg-white/95 backdrop-blur-xl px-4 md:px-10 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm print:hidden">
        <div className="flex items-center gap-2 md:gap-8">
          <Button variant="ghost" size="sm" onClick={() => router.push('/reports')} className="hover:bg-slate-50 text-slate-600 rounded-xl px-2 md:px-4 font-bold">
            <ChevronLeft className="h-6 w-6 md:mr-2" />
            <span className="hidden sm:inline uppercase tracking-widest text-[10px]">Archives</span>
          </Button>
          <div className="h-8 w-px bg-slate-200 hidden sm:block" />
          <div className="flex flex-col overflow-hidden">
            <h1 className="text-sm md:text-base font-black text-slate-900 truncate max-w-[140px] md:max-w-xl leading-none mb-1">
              {report.reportTitle}
            </h1>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest h-4 px-1 border-primary/20 text-primary">{report.unit}</Badge>
              <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{report.status}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="rounded-xl h-10 font-bold px-4">
                <X className="h-4 w-4 mr-2" /> Cancel
              </Button>
              <Button size="sm" onClick={handleSaveEdit} disabled={isSaving} className="rounded-xl font-black h-10 px-6 shadow-lg shadow-primary/20">
                {isSaving ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="hidden lg:flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="rounded-xl font-bold bg-white h-11 border-slate-200">
                  <Edit3 className="h-4 w-4 mr-2" /> Edit
                </Button>
                <Button variant="outline" size="sm" onClick={handleCopy} className="rounded-xl font-bold bg-white h-11 border-slate-200">
                  {isCopied ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 mr-2" />}
                  Copy
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportWord} disabled={isSaving} className="rounded-xl font-bold bg-white h-11 border-slate-200">
                  {isSaving ? <Loader2 className="animate-spin h-4 w-4" /> : <FileDown className="h-4 w-4 mr-2" />}
                  Word
                </Button>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild className="lg:hidden">
                  <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-xl p-2">
                  <DropdownMenuItem onClick={() => setIsEditing(true)} className="rounded-lg font-bold">
                    <Edit3 className="h-4 w-4 mr-2" /> Edit Log
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleCopy} className="rounded-lg font-bold">
                    <Copy className="h-4 w-4 mr-2" /> Copy Text
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportWord} className="rounded-lg font-bold">
                    <FileDown className="h-4 w-4 mr-2" /> Export Word
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.print()} className="rounded-lg font-bold">
                    <Printer className="h-4 w-4 mr-2" /> Print PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button size="sm" onClick={() => window.print()} className="hidden md:flex rounded-xl font-black h-11 px-6 shadow-lg shadow-primary/20">
                <Printer className="h-4 w-4 mr-2" /> Print Transcript
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto mt-6 md:mt-16 px-4 md:px-10 space-y-10 md:space-y-16 print:mt-0 print:px-0">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="space-y-6 flex-1">
            <div className="flex items-center gap-3">
              <div className="bg-slate-900 p-2 md:p-3 rounded-2xl shadow-xl shadow-slate-900/10">
                <Building2 className="h-5 w-5 md:h-7 md:w-7 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] md:text-xs font-black text-primary uppercase tracking-[0.3em] leading-none mb-1">Command Registry</span>
                <span className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest leading-none">Security Protocol 04-A</span>
              </div>
            </div>
            <h2 className="text-4xl md:text-7xl font-black tracking-tighter text-slate-900 leading-[0.9]">
              {report.reportDate}
            </h2>
            <div className="flex flex-wrap items-center gap-4 md:gap-8 pt-6">
              <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm min-w-[140px]">
                <BadgeCheck className="h-5 w-5 text-primary" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Station</span>
                  <span className="text-sm font-black text-slate-900 uppercase">{report.unit}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm min-w-[140px]">
                <User className="h-5 w-5 text-primary" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">In Charge</span>
                  <span className="text-sm font-black text-slate-900 uppercase">{report.reportingCommanderName}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm min-w-[140px]">
                <Clock className="h-5 w-5 text-primary" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Registry Time</span>
                  <span className="text-sm font-black text-slate-900 uppercase">{new Date(report.creationDateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-4 self-start md:self-end">
            <div className="bg-emerald-50 text-emerald-700 px-6 py-3 rounded-2xl border border-emerald-100 shadow-sm flex items-center gap-3">
              <CheckCircle className="h-5 w-5" />
              <span className="text-xs font-black uppercase tracking-widest">{report.status}</span>
            </div>
          </div>
        </div>

        <Card className="shadow-3xl document-shadow border-none rounded-[2rem] md:rounded-[3rem] overflow-hidden bg-white print:shadow-none print:border-none print:rounded-none animate-in fade-in zoom-in-95 duration-1000 delay-200">
          <div className="h-3 bg-slate-900" />
          <CardContent className="p-8 md:p-24 relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.02] pointer-events-none">
              <ShieldCheck className="h-[300px] w-[300px] md:h-[600px] md:w-[600px]" />
            </div>

            {isEditing ? (
              <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-black uppercase tracking-[0.2em] text-primary">Operational Log Revision</Label>
                  <Badge variant="outline" className="text-[8px] font-black">EDIT MODE</Badge>
                </div>
                <Textarea 
                  value={editableText} 
                  onChange={(e) => setEditableText(e.target.value)}
                  className="min-h-[500px] md:min-h-[700px] font-report text-[14px] md:text-lg leading-relaxed rounded-2xl md:rounded-3xl bg-slate-50 border-slate-200 focus:ring-primary/20 shadow-inner p-4 md:p-8"
                />
              </div>
            ) : (
              <div className="font-report text-[14px] md:text-lg leading-relaxed text-slate-800 tracking-tight document-content relative z-10 max-w-3xl mx-auto">
                {formatContent(report.fullText)}
              </div>
            )}
            
            <div className="mt-16 md:mt-32 pt-12 md:pt-16 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-10 max-w-3xl mx-auto">
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em]">Signature Authority</p>
                  <p className="font-report font-black text-slate-900 text-lg md:text-2xl">{report.reportingCommanderName}</p>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest leading-none mb-1">OC {report.unit}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Official Operational Signature</span>
                </div>
              </div>
              <div className="text-left sm:text-right space-y-2">
                <p className="text-9px] font-black uppercase text-slate-300 tracking-widest">Registry Reference ID</p>
                <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 flex items-center gap-2 max-w-[200px] md:max-w-none">
                  <p className="text-[10px] font-mono text-slate-400 truncate leading-none">{report.id}</p>
                  <ExternalLink className="h-3 w-3 text-slate-300 shrink-0" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col items-center gap-8 pt-8 md:pt-16 pb-20 print:hidden animate-in fade-in duration-1000">
          {isLeader && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" className="text-destructive font-black uppercase tracking-widest text-[10px] hover:bg-destructive/5 rounded-2xl px-8 h-12">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Purge from Command Registry
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-2xl md:rounded-[2.5rem] border-none shadow-3xl max-w-[95vw] sm:max-w-lg">
                <AlertDialogHeader className="p-4">
                  <AlertDialogTitle className="text-xl md:text-2xl font-black">Archive Deletion Protocol</AlertDialogTitle>
                  <AlertDialogDescription className="text-sm font-bold text-slate-500 leading-relaxed">
                    This will permanently expunge this transcript from the Command Registry. This action is irreversible and will be logged.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="p-4 gap-4 flex-col sm:flex-row">
                  <AlertDialogCancel className="rounded-xl md:rounded-2xl font-black h-12 md:h-14">Abort Operation</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90 rounded-xl md:rounded-2xl font-black h-12 md:h-14 shadow-xl shadow-destructive/20" disabled={isDeleting}>
                    {isDeleting ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : <Trash2 className="h-5 w-5 mr-2" />}
                    Confirm Purge
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <div className="flex items-center gap-6 w-full max-w-xl">
            <div className="h-px bg-slate-200 flex-1" />
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.6em]">End of Archive</p>
            <div className="h-px bg-slate-200 flex-1" />
          </div>
          <Button variant="ghost" onClick={() => router.push('/reports')} className="text-slate-400 font-black uppercase tracking-widest text-[10px] hover:text-primary hover:bg-transparent transition-all">
            Return to Operational Logbook
          </Button>
        </div>
      </main>
    </div>
  );
}
