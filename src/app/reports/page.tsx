
"use client";

import { useRouter } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, where, doc, deleteDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { FileText, Calendar, Loader2, Search, ArrowLeft, Trash2, ShieldAlert, Eye } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function ReportsList() {
  const router = useRouter();
  const db = useFirestore();
  const { toast } = useToast();
  const { isCommander, isAdmin, profile, isLoading: isAuthLoading, user } = useUserProfile();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const reportsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid || isAuthLoading || !profile) return null;
    
    const baseQuery = collection(db, 'reports');
    
    // Admins and Commanders see everything
    if (isAdmin || isCommander) {
      return query(baseQuery, orderBy('createdAt', 'desc'));
    } 
    
    // Leaders and regular personnel are strictly limited to reports they created
    return query(baseQuery, where('ownerId', '==', user.uid), orderBy('createdAt', 'desc'));
    
  }, [db, isAdmin, isCommander, profile, user?.uid, isAuthLoading]);

  const { data: reports, isLoading: isReportsLoading } = useCollection(reportsQuery);

  const handleDelete = async (e: React.MouseEvent, reportId: string) => {
    // CRITICAL: Stop propagation to prevent navigation to detail page
    e.preventDefault();
    e.stopPropagation();
    
    if (!db) return;
    setDeletingId(reportId);
    try {
      await deleteDoc(doc(db, 'reports', reportId));
      toast({ title: "Record Deleted", description: "The operational log has been removed from the registry." });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not delete report." });
    } finally {
      setDeletingId(null);
    }
  };

  const filteredReports = reports?.filter(r => 
    r.reportTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.reportDate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.unit?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isLoading = isAuthLoading || isReportsLoading;

  return (
    <div className="flex-1 bg-background pb-20 p-4 md:p-10">
      <div className="max-w-6xl mx-auto space-y-10">
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="h-12 w-12 rounded-2xl bg-card shadow-sm border border-border">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="space-y-1">
              <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-foreground leading-none uppercase">Registry Archive</h1>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest border-primary/20 text-primary">
                  {(isAdmin || isCommander) ? 'Global Command Logs' : 'Personal Filings Registry'}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search archive..." 
                className="pl-11 h-12 rounded-2xl bg-card border-border shadow-sm text-sm font-bold"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </section>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-6">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground font-black uppercase text-[10px] tracking-[0.3em] animate-pulse">Accessing Vault Registry...</p>
          </div>
        ) : filteredReports && filteredReports.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredReports.map((report) => (
              <div 
                key={report.id} 
                onClick={() => router.push(`/reports/view/${report.id}`)}
                className="hover:shadow-3xl transition-all cursor-pointer group border-none shadow-sm flex flex-col h-full bg-card rounded-[2rem] overflow-hidden hover:-translate-y-2 duration-500"
              >
                <CardHeader className="p-8 pb-4">
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-3 bg-accent rounded-2xl group-hover:bg-primary group-hover:text-white transition-all duration-500 text-primary">
                      <FileText className="h-6 w-6" />
                    </div>
                    {(isAdmin || report.ownerId === user?.uid) && (
                      <div onClick={(e) => e.stopPropagation()}>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={(e) => {
                                e.stopPropagation();
                                // Dialog opens
                              }}
                              className="h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-xl transition-colors"
                            >
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-[2rem] border-none shadow-3xl">
                            <AlertDialogHeader className="p-4">
                              <AlertDialogTitle className="text-2xl font-black tracking-tight">Purge Record?</AlertDialogTitle>
                              <AlertDialogDescription className="text-sm font-bold text-muted-foreground leading-relaxed">
                                This action is irreversible. The situational log for <span className="text-foreground">{report.reportDate}</span> will be permanently expunged.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="p-4 gap-3">
                              <AlertDialogCancel className="rounded-2xl font-black h-12" onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={(e) => handleDelete(e, report.id)} 
                                className="bg-destructive text-white hover:bg-destructive/90 rounded-2xl font-black h-12"
                              >
                                {deletingId === report.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5 mr-2" />}
                                Confirm Purge
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </div>
                  <CardTitle className="text-lg md:text-xl font-black line-clamp-2 leading-[1.1] text-foreground group-hover:text-primary transition-colors duration-500">
                    {report.reportTitle}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6 pt-0 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                      <Calendar className="h-4 w-4" />
                      {report.reportDate}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center text-[10px] font-black text-primary">
                        {report.reportingCommanderName?.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter">Officer in Charge</span>
                        <span className="text-xs font-bold text-foreground truncate max-w-[140px] leading-none">{report.reportingCommanderName}</span>
                      </div>
                    </div>
                  </div>
                  <div className="pt-6 border-t border-border mt-auto flex justify-end">
                    <Button variant="ghost" size="sm" className="font-black text-primary hover:bg-transparent group-hover:translate-x-2 transition-transform h-auto p-0 text-xs">
                      View Transcript <Eye className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-48 bg-card rounded-[3rem] border border-dashed border-border flex flex-col items-center gap-6 px-10 shadow-sm">
            <div className="h-20 w-20 bg-accent rounded-[2rem] flex items-center justify-center">
              <ShieldAlert className="h-10 w-10 text-primary/50" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-foreground tracking-tight uppercase">Registry Empty</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto font-bold uppercase">
                No situational logs recorded in your archive.
              </p>
            </div>
            <Button size="lg" asChild className="rounded-2xl px-10 font-black h-14 shadow-xl shadow-primary/10">
              <Link href="/daily/new">File First Report</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
