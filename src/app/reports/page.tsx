
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
  const { isLeader, isCommander, isAdmin, profile, isLoading: isAuthLoading, user } = useUserProfile();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const reportsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid || isAuthLoading || !profile) return null;
    
    const baseQuery = collection(db, 'reports');
    
    // Admins, Commanders, and Leaders can view the global feed
    if (isAdmin || isCommander || isLeader) {
      return query(baseQuery, orderBy('createdAt', 'desc'));
    } 
    
    // Regular personnel are limited to their unit's logs
    if (!profile.unit || profile.unit === 'N/A') return null;
    return query(baseQuery, where('unit', '==', profile.unit), orderBy('createdAt', 'desc'));
    
  }, [db, isAdmin, isCommander, isLeader, profile, user?.uid, isAuthLoading]);

  const { data: reports, isLoading: isReportsLoading } = useCollection(reportsQuery);

  const handleDelete = async (e: React.MouseEvent, reportId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!db) return;
    setDeletingId(reportId);
    try {
      await deleteDoc(doc(db, 'reports', reportId));
      toast({ title: "Record Deleted", description: "The operational log has been removed." });
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
    <div className="flex-1 bg-[#f8fafc] dark:bg-slate-950 pb-20 p-4 md:p-10">
      <div className="max-w-6xl mx-auto space-y-6 md:space-y-10">
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="h-12 w-12 rounded-2xl bg-white dark:bg-slate-900 shadow-sm border md:hidden">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="space-y-1">
              <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-slate-900 dark:text-white leading-none uppercase">Archive Registry</h1>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest border-primary/20 text-primary">
                  {(isAdmin || isCommander || isLeader) ? 'Global Command Logs' : `${profile?.unit || 'Station'} Logs`}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search command logs..." 
                className="pl-11 h-12 rounded-2xl bg-white dark:bg-slate-900 border-slate-200 shadow-sm text-sm font-bold"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </section>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-6">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.3em] animate-pulse">Accessing Vault Registry...</p>
          </div>
        ) : filteredReports && filteredReports.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {filteredReports.map((report) => (
              <Card 
                key={report.id} 
                className="hover:shadow-3xl transition-all cursor-pointer group border-none shadow-sm flex flex-col h-full bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden hover:-translate-y-2 duration-500" 
                onClick={() => router.push(`/reports/view/${report.id}`)}
              >
                <CardHeader className="p-6 md:p-8 pb-4">
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl group-hover:bg-primary group-hover:text-white transition-all duration-500 text-slate-400">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[8px] font-black uppercase tracking-[0.15em] border-slate-200 text-slate-500 group-hover:text-primary transition-colors">
                        {report.unit}
                      </Badge>
                      {isAdmin && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-10 w-10 text-slate-200 hover:text-destructive hover:bg-destructive/5 rounded-xl transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-[2rem] border-none shadow-3xl" onClick={(e) => e.stopPropagation()}>
                            <AlertDialogHeader className="p-4">
                              <AlertDialogTitle className="text-2xl font-black tracking-tight">Purge Operational Record?</AlertDialogTitle>
                              <AlertDialogDescription className="text-sm font-bold text-slate-500 leading-relaxed">
                                This action is irreversible. The record for <span className="text-slate-900">{report.reportDate}</span> will be permanently expunged.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="p-4 gap-3">
                              <AlertDialogCancel className="rounded-2xl font-black h-12">Cancel</AlertDialogCancel>
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
                      )}
                    </div>
                  </div>
                  <CardTitle className="text-lg md:text-xl font-black line-clamp-2 leading-[1.1] text-slate-900 dark:text-white group-hover:text-primary transition-colors duration-500">
                    {report.reportTitle}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 md:p-8 space-y-6 pt-0 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                      <Calendar className="h-4 w-4" />
                      {report.reportDate}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-400">
                        {report.reportingCommanderName?.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Officer in Charge</span>
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate max-w-[140px] leading-none">{report.reportingCommanderName}</span>
                      </div>
                    </div>
                  </div>
                  <div className="pt-6 border-t border-slate-50 dark:border-slate-800 mt-auto flex justify-end">
                    <Button variant="ghost" size="sm" className="font-black text-primary hover:bg-transparent group-hover:translate-x-2 transition-transform h-auto p-0 text-xs">
                      View Transcript <Eye className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 md:py-48 bg-white dark:bg-slate-900 rounded-[3rem] border border-dashed border-slate-200 flex flex-col items-center gap-6 px-10 shadow-sm animate-in zoom-in-95 duration-500">
            <div className="h-20 w-20 bg-slate-50 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center">
              <ShieldAlert className="h-10 w-10 text-slate-200" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Registry Entry Not Found</h3>
              <p className="text-sm text-slate-400 max-w-sm mx-auto font-bold uppercase">
                The command registry is currently empty for the {(isAdmin || isCommander || isLeader) ? 'selected criteria' : profile?.unit}.
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
