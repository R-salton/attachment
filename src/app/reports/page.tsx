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
      <div className="max-w-6xl mx-auto space-y-8 md:space-y-10">
        <section className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="h-12 w-12 rounded-2xl bg-card shadow-sm border border-border text-foreground">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="space-y-1">
                <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-foreground leading-none uppercase">Registry Archive</h1>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest border-primary/20 text-primary">
                    {(isAdmin || isCommander || isLeader) ? 'Operational Command Registry' : 'Personal Registry Archive'}
                  </Badge>
                </div>
              </div>
            </div>
            <Button asChild className="rounded-2xl h-12 px-6 font-black shadow-lg shadow-primary/20">
              <Link href="/daily/new">FILE NEW REPORT</Link>
            </Button>
          </div>

          <div className="bg-card p-6 md:p-8 rounded-[2rem] border border-border shadow-sm space-y-6">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-primary" />
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Search Filters</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Title Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input 
                    placeholder="Search logs..." 
                    className="pl-9 h-11 rounded-xl bg-background border-border text-sm font-bold text-foreground"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Deployment Unit</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground z-10" />
                  <Select value={unitFilter} onValueChange={setUnitFilter}>
                    <SelectTrigger className="pl-9 h-11 rounded-xl bg-background border-border text-sm font-bold text-foreground">
                      <SelectValue placeholder="All Units" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Units</SelectItem>
                      {UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Log Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input 
                    placeholder="e.g. 18 FEB 26" 
                    className="pl-9 h-11 rounded-xl bg-background border-border text-sm font-bold text-foreground"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Officer in Charge</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input 
                    placeholder="Search by name..." 
                    className="pl-9 h-11 rounded-xl bg-background border-border text-sm font-bold text-foreground"
                    value={submitterFilter}
                    onChange={(e) => setSubmitterFilter(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-6">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground font-black uppercase text-[10px] tracking-[0.3em] animate-pulse">Accessing Vault Registry...</p>
          </div>
        ) : filteredReports && filteredReports.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredReports.map((report) => (
              <div 
                key={report.id} 
                onClick={() => router.push(`/reports/view/${report.id}`)}
                className="hover:shadow-2xl transition-all cursor-pointer group border border-border shadow-sm flex flex-col h-full bg-card rounded-2xl overflow-hidden hover:-translate-y-1 duration-300"
              >
                <div className="p-4 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-3">
                    <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary group-hover:text-white transition-all text-primary">
                      <FileText className="h-4 w-4" />
                    </div>
                    {(isAdmin || isCommander || report.ownerId === user?.uid) && (
                      <div onClick={(e) => e.stopPropagation()}>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-lg"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-2xl border-none shadow-3xl">
                            <AlertDialogHeader className="p-4">
                              <AlertDialogTitle className="text-xl font-black">Purge Record?</AlertDialogTitle>
                              <AlertDialogDescription className="text-sm font-bold text-muted-foreground">
                                This situational log for <span className="text-foreground">{report.reportDate}</span> will be permanently expunged.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="p-4 gap-3">
                              <AlertDialogCancel className="rounded-xl font-black h-10">Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={(e) => handleDelete(e, report.id)} 
                                className="bg-destructive text-white rounded-xl font-black h-10 shadow-lg shadow-destructive/20"
                              >
                                {deletingId === report.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                                Confirm Purge
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="text-sm font-black text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                      {report.reportTitle}
                    </h4>
                    
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        <Calendar className="h-3 w-3 text-primary" />
                        {report.reportDate}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        <Building2 className="h-3 w-3 text-primary" />
                        {report.unit}
                      </div>
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-50 mt-1">
                        <div className="h-5 w-5 rounded-full bg-accent flex items-center justify-center text-[8px] font-black text-primary">
                          {report.reportingCommanderName?.charAt(0)}
                        </div>
                        <span className="text-[10px] font-bold text-foreground truncate">{report.reportingCommanderName}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-48 bg-card rounded-[3rem] border border-dashed border-border flex flex-col items-center gap-6 px-10 shadow-sm">
            <div className="h-20 w-20 bg-accent rounded-[2rem] flex items-center justify-center">
              <ShieldAlert className="h-10 w-10 text-primary/50" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-foreground tracking-tight uppercase">No Matching Records</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto font-bold uppercase">
                Adjust your filters or file a new SITUATION REPORT.
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
