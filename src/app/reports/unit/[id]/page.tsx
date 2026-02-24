"use client";

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, where, doc, deleteDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { FileText, Calendar, Loader2, Search, ArrowLeft, Trash2, ShieldAlert, Eye, Building2, Clock } from 'lucide-react';
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
import { useUserProfile } from '@/hooks/use-user-profile';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function UnitReportsArchive({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: unitName } = use(params);
  const db = useFirestore();
  const { toast } = useToast();
  const { isAdmin, isCommander, profile, isLoading: isAuthLoading, user } = useUserProfile();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const reportsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid || isAuthLoading || !unitName) return null;
    
    const baseQuery = collection(db, 'reports');
    const decodedUnit = decodeURIComponent(unitName);

    if (isAdmin || isCommander) {
      return query(baseQuery, where('unit', '==', decodedUnit), orderBy('createdAt', 'desc'));
    } 
    
    return query(
      baseQuery, 
      where('unit', '==', decodedUnit), 
      where('ownerId', '==', user.uid), 
      orderBy('createdAt', 'desc')
    );
    
  }, [db, unitName, user?.uid, isAuthLoading, isAdmin, isCommander]);

  const { data: reports, isLoading: isReportsLoading } = useCollection(reportsQuery);

  const handleDelete = async (e: React.MouseEvent, reportId: string) => {
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
    r.reportDate?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isLoading = isAuthLoading || isReportsLoading;

  return (
    <div className="flex-1 bg-background pb-24 p-4 md:p-10">
      <div className="max-w-7xl mx-auto space-y-12">
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="h-14 w-14 rounded-2xl bg-white shadow-md border border-slate-100 text-slate-900 hover:bg-slate-50">
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-600" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600">Unit Archives</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-slate-900 leading-none uppercase">{decodeURIComponent(unitName)}</h1>
            </div>
          </div>
          <div className="relative w-full sm:w-96 group">
            <div className="absolute inset-0 bg-blue-600/5 rounded-2xl blur-xl group-hover:bg-blue-600/10 transition-all" />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors z-10" />
            <Input 
              placeholder={`Search in ${decodeURIComponent(unitName)}...`} 
              className="relative pl-12 h-14 rounded-2xl bg-white border-slate-200 shadow-xl text-sm font-bold text-slate-900 focus:ring-blue-600"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </section>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-6">
            <Loader2 className="h-16 w-16 animate-spin text-blue-600" />
            <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.3em] animate-pulse">Syncing Registry...</p>
          </div>
        ) : filteredReports && filteredReports.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredReports.map((report) => (
              <div 
                key={report.id} 
                onClick={() => router.push(`/reports/view/${report.id}`)}
                className="hover:shadow-3xl transition-all cursor-pointer group border border-slate-100 shadow-xl flex flex-col h-full bg-white rounded-3xl overflow-hidden hover:-translate-y-2 duration-500"
              >
                <div className="h-2 w-full bg-slate-900 group-hover:bg-blue-600 transition-colors" />
                <div className="p-6 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-5">
                    <div className="p-3 bg-slate-900 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all text-blue-400 shadow-lg shadow-slate-900/10">
                      <FileText className="h-5 w-5" />
                    </div>
                    {(isAdmin || isCommander || report.ownerId === user?.uid) && (
                      <div onClick={(e) => e.stopPropagation()}>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-[2.5rem] border-none shadow-3xl p-8">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Purge Record?</AlertDialogTitle>
                              <AlertDialogDescription className="text-sm font-bold text-slate-500 mt-2">
                                Permanent removal of SITREP from unit archive.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="p-4 gap-3">
                              <AlertDialogCancel className="rounded-2xl font-black h-12 bg-slate-50 border-none">Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={(e) => handleDelete(e, report.id)} className="bg-red-500 text-white rounded-2xl font-black h-12 shadow-xl shadow-red-500/20">
                                {deletingId === report.id ? <Loader2 className="h-5 w-5 animate-spin" /> : "Confirm Purge"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="text-lg font-black text-slate-900 line-clamp-2 group-hover:text-blue-600 transition-colors uppercase tracking-tight leading-tight">
                      {report.reportTitle}
                    </h4>
                    <div className="flex flex-col gap-2 pt-4 border-t border-slate-50">
                      <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        {report.reportDate}
                      </div>
                      {report.createdAt && (
                        <div className="flex items-center gap-3 text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                          <Clock className="h-3.5 w-3.5 text-blue-600/60" />
                          Filed: {report.createdAt.toDate ? report.createdAt.toDate().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'Processing...'}
                        </div>
                      )}
                      <div className="flex items-center gap-3 pt-4 mt-2">
                        <div className="h-8 w-8 rounded-xl bg-slate-900 flex items-center justify-center text-[10px] font-black text-blue-400 border border-slate-800 shadow-lg shadow-slate-900/10">
                          {report.reportingCommanderName?.charAt(0)}
                        </div>
                        <div className="flex flex-col overflow-hidden">
                          <span className="text-[10px] font-black text-slate-900 truncate uppercase tracking-tight">{report.reportingCommanderName}</span>
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Officer in Charge</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-40 bg-white rounded-[4rem] border border-dashed border-slate-200 flex flex-col items-center gap-8 px-10 shadow-sm">
            <div className="h-24 w-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center">
              <ShieldAlert className="h-12 w-12 text-slate-200" />
            </div>
            <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Unit Archive Empty</h3>
            <Button size="lg" asChild className="rounded-2xl px-12 font-black h-14 shadow-2xl shadow-blue-600/20 bg-blue-600 hover:bg-blue-700">
              <Link href="/daily/new">File First Report</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
