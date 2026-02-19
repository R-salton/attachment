
"use client";

import { useRouter } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { FileText, PlusCircle, ChevronLeft, Calendar, User, ArrowRight, Loader2, Search, ShieldAlert } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { useUserProfile } from '@/hooks/use-user-profile';

export default function ReportsList() {
  const router = useRouter();
  const db = useFirestore();
  const { isLeader, isLoading: isAuthLoading } = useUserProfile();
  const [searchTerm, setSearchTerm] = useState('');

  const reportsQuery = useMemoFirebase(() => {
    if (!db || !isLeader) return null;
    return query(collection(db, 'reports'), orderBy('createdAt', 'desc'));
  }, [db, isLeader]);

  const { data: reports, isLoading: isReportsLoading } = useCollection(reportsQuery);

  const filteredReports = reports?.filter(r => 
    r.reportTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.reportDate?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isLoading = isAuthLoading || isReportsLoading;

  if (!isAuthLoading && !isLeader) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold">Access Restricted</h2>
        <p className="text-slate-500 max-w-md mt-2">Only authorized personnel with Leader clearance can view operational archives.</p>
        <Button onClick={() => router.push('/')} className="mt-6">Return Home</Button>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#f8fafc] pb-20 p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-10">
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tighter text-slate-900">Archive Records</h1>
            <p className="text-slate-500">Historical database of all filed operational reports.</p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search date or title..." 
              className="pl-10 h-11 rounded-xl bg-white border-slate-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </section>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Accessing Vault...</p>
          </div>
        ) : filteredReports && filteredReports.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredReports.map((report) => (
              <Card key={report.id} className="hover:shadow-2xl transition-all cursor-pointer group border-none shadow-sm flex flex-col h-full bg-white rounded-[2rem] overflow-hidden" onClick={() => router.push(`/reports/${report.id}`)}>
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary group-hover:text-white transition-colors text-primary">
                      <FileText className="h-6 w-6" />
                    </div>
                  </div>
                  <CardTitle className="text-lg font-bold line-clamp-2 leading-tight text-slate-900">
                    {report.reportTitle}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-0 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                      <Calendar className="h-3 w-3" />
                      {report.reportDate}
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                      <User className="h-3 w-3" />
                      {report.reportingCommanderName}
                    </div>
                  </div>
                  <div className="pt-6 mt-auto border-t flex justify-end">
                    <Button variant="ghost" size="sm" className="font-bold text-primary hover:bg-primary/5 px-0 h-auto">
                      Review Log <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-white rounded-[3rem] border border-dashed border-slate-200 flex flex-col items-center gap-6">
            <Search className="h-16 w-16 text-slate-200" />
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-slate-900">No Records Found</h3>
              <p className="text-slate-500">Either the archive is empty or no reports match your search criteria.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
