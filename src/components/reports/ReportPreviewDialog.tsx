
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Printer, 
  Copy, 
  ChevronRight, 
  ShieldCheck,
  Building2,
  User,
  Clock
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

interface Report {
  id: string;
  reportTitle: string;
  reportDate: string;
  unit: string;
  fullText: string;
  reportingCommanderName?: string;
  status?: string;
}

interface ReportPreviewDialogProps {
  report: Report | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ReportPreviewDialog({ report, isOpen, onClose }: ReportPreviewDialogProps) {
  const router = useRouter();
  const { toast } = useToast();

  if (!report) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(report.fullText);
    toast({ title: "Copied", description: "Transcript copied to clipboard." });
  };

  const formatContent = (text: string) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
      if (line.startsWith('*') && line.endsWith('*')) {
        return (
          <h3 key={i} className="text-sm md:text-base font-black text-slate-900 mt-6 mb-3 uppercase tracking-tight border-b border-slate-100 pb-2">
            {line.replace(/\*/g, '')}
          </h3>
        );
      }
      return <p key={i} className="mb-2 text-xs md:text-sm text-slate-700 leading-relaxed">{line}</p>;
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] md:max-w-4xl max-h-[90vh] p-0 overflow-hidden border-none rounded-[1.5rem] md:rounded-[2rem] shadow-3xl">
        <div className="flex flex-col h-full bg-[#f8fafc]">
          <header className="bg-slate-900 text-white p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Registry Preview</span>
              </div>
              <DialogTitle className="text-lg md:text-xl font-black truncate max-w-[300px] md:max-w-xl">
                {report.reportTitle}
              </DialogTitle>
              <div className="flex items-center gap-3">
                <Badge className="bg-primary/20 hover:bg-primary/30 text-primary border-none text-[9px] font-black">{report.unit}</Badge>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{report.reportDate}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy} className="bg-white/5 border-white/10 hover:bg-white/10 text-white rounded-xl h-10 font-bold">
                <Copy className="h-4 w-4 mr-2" /> Copy
              </Button>
              <Button size="sm" onClick={() => router.push(`/reports/view/${report.id}`)} className="bg-primary text-white hover:bg-primary/90 rounded-xl h-10 font-black shadow-lg shadow-primary/20">
                Open Full <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </header>

          <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-4">
            <aside className="hidden md:block border-r border-slate-100 bg-white p-6 space-y-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <Building2 className="h-4 w-4 text-slate-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Station</span>
                    <span className="text-xs font-bold text-slate-900">{report.unit}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <User className="h-4 w-4 text-slate-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">In Charge</span>
                    <span className="text-xs font-bold text-slate-900">{report.reportingCommanderName || 'N/A'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <Clock className="h-4 w-4 text-slate-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Archived</span>
                    <span className="text-xs font-bold text-slate-900">{report.reportDate}</span>
                  </div>
                </div>
              </div>
              
              <div className="pt-8 border-t border-slate-50">
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] leading-relaxed">
                  OFFICIAL COMMAND TRANSCRIPT. UNAUTHORIZED SHARING IS PROHIBITED.
                </p>
              </div>
            </aside>

            <ScrollArea className="col-span-1 md:col-span-3 h-[50vh] md:h-auto bg-white">
              <div className="p-6 md:p-12 font-report relative">
                <div className="absolute top-0 left-0 w-full h-full opacity-[0.02] pointer-events-none flex items-center justify-center">
                  <ShieldCheck className="h-64 w-64" />
                </div>
                <div className="relative z-10 max-w-2xl mx-auto">
                  {formatContent(report.fullText)}
                </div>
              </div>
            </ScrollArea>
          </div>
          
          <footer className="p-4 md:p-6 border-t bg-slate-50 flex justify-between items-center">
            <span className="text-[9px] font-mono text-slate-400 uppercase">Registry ID: {report.id}</span>
            <Button variant="ghost" size="sm" onClick={() => window.print()} className="h-10 rounded-xl font-bold">
              <Printer className="h-4 w-4 mr-2" /> Print PDF
            </Button>
          </footer>
        </div>
      </DialogContent>
    </Dialog>
  );
}
