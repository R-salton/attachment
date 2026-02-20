"use client";

import { useRouter } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, where, doc, deleteDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { FileText, Calendar, Loader2, Search, ArrowLeft, Trash2, ShieldAlert, Eye, Filter, Building2, User } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useState } from 'react';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

const UNITS = ["Gasabo DPU", "Kicukiro DPU", "Nyarugenge DPU", "TRS", "SIF", "TFU", "ORDERLY REPORT"];

export default function ReportsList() {
  const router = useRouter();
  const db = useFirestore();
  const { toast } = useToast();
  const { isCommander, isLeader, isAdmin, profile, isLoading: isAuthLoading, user } = useUserProfile();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [unitFilter, setUnitFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');
  const [submitterFilter, setSubmitterFilter] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const reportsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid || isAuthLoading || !profile) return null;
    
    const baseQuery = collection(db, 'reports');
    
    if (isAdmin || isCommander || isLeader) {
      return query(baseQuery, orderBy('createdAt', 'desc'));
    } 
    
    return query(baseQuery, where('ownerId', '==', user.uid), orderBy('createdAt', 'desc'));
    
  }, [db, isAdmin, isCommander, isLeader, profile, user?.uid, isAuthLoading]);

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

  const filteredReports = reports?.filter(r => {
    const matchesSearch = r.reportTitle?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUnit = unitFilter === 'ALL' || r.unit === unitFilter;
    const matchesDate = !dateFilter || r.reportDate?.toLowerCase().includes(dateFilter.toLowerCase());
    const matchesSubmitter = !submitterFilter || r.reportingCommanderName?.toLowerCase().includes(submitterFilter.toLowerCase());
    
    return matchesSearch && matchesUnit && matchesDate && matchesSubmitter;
  });

  const isLoading = isAuthLoading || isReportsLoading;

  return (
    <div className="flex-1 bg-background pb-20 p-4 md:p-10">
      <div className="max-w-7xl mx-auto space-y-10">
        <section className="flex flex-col gap-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="h-14 w-14 rounded-2xl bg-white shadow-md border border-slate-100 text-slate-900 hover:bg-slate-50 transition-all">
                <ArrowLeft className="h-6 w-6" />
              </Button>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600">Operational Database</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-slate-900 leading-none uppercase">Registry Archive</h1>
              </div>
            </div>
            <Button asChild className="rounded-2xl h-14 px-8 font-black shadow-xl shadow-blue-600/20 bg-blue-600 hover:bg-blue-700">
              <Link href="/daily/new">FILE NEW SITREP</Link>
            </Button>
          </div>

          <Card className="border-none shadow-2xl rounded-[2.5rem] bg-slate-900 text-white overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <div className="flex items-center gap-3">
                <Filter className="h-5 w-5 text-blue-400" />
                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-blue-400">Tactical Search Filters</h2>
              </div>
            </CardHeader>
            <CardContent className="p-8 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-500 ml-1">Title Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input 
                      placeholder="Search logs..." 
                      className="pl-10 h-12 rounded-xl bg-slate-800 border-slate-700 text-sm font-bold text-white placeholder:text-slate-600"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-500 ml-1">Deployment Unit</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 z-10" />
                    <Select value={unitFilter} onValueChange={setUnitFilter}>
                      <SelectTrigger className="pl-10 h-12 rounded-xl bg-slate-800 border-slate-700 text-sm font-bold text-white">
                        <SelectValue placeholder="All Units" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-700 text-white">
                        <SelectItem value="ALL">All Units</SelectItem>
                        {UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-500 ml-1">Log Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input 
                      placeholder="e.g. 18 FEB 26" 
                      className="pl-10 h-12 rounded-xl bg-slate-800 border-slate-700 text-sm font-bold text-white placeholder:text-slate-600"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-500 ml-1">Officer in Charge</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input 
                      placeholder="Search by name..." 
                      className="pl-10 h-12 rounded-xl bg-slate-800 border-slate-700 text-sm font-bold text-white placeholder:text-slate-600"
                      value={submitterFilter}
                      onChange={(e) => setSubmitterFilter(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-6">
            <Loader2 className="h-16 w-16 animate-spin text-blue-600" />
            <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.3em] animate-pulse">Accessing Encrypted Vault...</p>
          </div>
        ) : filteredReports && filteredReports.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredReports.map((report) => (
              <div 
                key={report.id} 
                onClick={() => router.push(`/reports/view/${report.id}`)}
                className="hover:shadow-3xl transition-all cursor-pointer group border border-slate-100 shadow-xl flex flex-col h-full bg-white rounded-3xl overflow-hidden hover:-translate-y-2 duration-500"
              >
                <div className="h-2 w-full bg-blue-600" />
                <div className="p-6 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-5">
                    <div className="p-3 bg-slate-900 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all text-blue-400 shadow-lg shadow-slate-900/10">
                      <FileText className="h-5 w-5" />
                    </div>
                    {(isAdmin || isCommander || report.ownerId === user?.uid) && (
                      <div onClick={(e) => e.stopPropagation()}>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-10 w-10 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                            >
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-[2.5rem] border-none shadow-3xl p-8">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Purge Record?</AlertDialogTitle>
                              <AlertDialogDescription className="text-sm font-bold text-slate-500 leading-relaxed">
                                This situational log for <span className="text-slate-900">{report.reportDate}</span> will be permanently expunged from the official command registry. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="gap-4 mt-6">
                              <AlertDialogCancel className="rounded-2xl font-black h-12 bg-slate-50 border-none hover:bg-slate-100">Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={(e) => handleDelete(e, report.id)} 
                                className="bg-red-500 text-white rounded-2xl font-black h-12 shadow-xl shadow-red-500/20 hover:bg-red-600"
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
                  
                  <div className="space-y-4">
                    <h4 className="text-lg font-black text-slate-900 line-clamp-2 group-hover:text-blue-600 transition-colors uppercase tracking-tight leading-tight">
                      {report.reportTitle}
                    </h4>
                    
                    <div className="flex flex-col gap-3 pt-4 border-t border-slate-50">
                      <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        {report.reportDate}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <Building2 className="h-4 w-4 text-blue-600" />
                        {report.unit}
                      </div>
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
          <div className="text-center py-48 bg-white rounded-[4rem] border border-dashed border-slate-200 flex flex-col items-center gap-8 px-10 shadow-sm">
            <div className="h-24 w-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center shadow-inner">
              <ShieldAlert className="h-12 w-12 text-slate-200" />
            </div>
            <div className="space-y-3">
              <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">No Matching Records</h3>
              <p className="text-sm text-slate-400 max-w-sm mx-auto font-bold uppercase tracking-wide">
                Adjust your filters or initiate a new SITUATION REPORT for the unit.
              </p>
            </div>
            <Button size="lg" asChild className="rounded-2xl px-12 font-black h-14 shadow-2xl shadow-blue-600/20 bg-blue-600 hover:bg-blue-700">
              <Link href="/daily/new">File First Report</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
