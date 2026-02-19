"use client";

import { useRouter } from 'next/navigation';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, where } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { FileText, PlusCircle, ChevronLeft, Calendar, User, ArrowRight, Loader2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

export default function ReportsList() {
  const router = useRouter();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const [searchTerm, setSearchTerm] = useState('');

  const reportsQuery = useMemoFirebase(() => {
    // CRITICAL: Defensive query construction to ensure rule compliance
    if (!user || !db) return null;
    
    return query(
      collection(db, 'reports'),
      where('ownerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
  }, [db, user?.uid]);

  const { data: reports, isLoading: isReportsLoading } = useCollection(reportsQuery);

  const filteredReports = reports?.filter(r => 
    r.reportTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.reportDate?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isLoading = isUserLoading || isReportsLoading;

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20">
      <header className="border-b bg-white px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/')}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Dashboard
          </Button>
          <h1 className="text-xl font-extrabold text-slate-900">Report Archive</h1>
        </div>
        <Button size="sm" onClick={() => router.push('/daily/new')} className="font-bold">
          <PlusCircle className="mr-2 h-4 w-4" />
          New Entry
        </Button>
      </header>

      <main className="max-w-6xl mx-auto mt-10 px-6 space-y-10">
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Operation Records</h2>
            <p className="text-slate-500">Secure access to all historical operational daily reports.</p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Filter by date or title..." 
              className="pl-10 h-11 rounded-xl bg-white border-slate-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </section>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-slate-500 font-medium animate-pulse">Establishing secure connection...</p>
          </div>
        ) : filteredReports && filteredReports.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredReports.map((report) => (
              <Card key={report.id} className="hover:shadow-xl transition-all cursor-pointer group border-none shadow-sm flex flex-col h-full bg-white" onClick={() => router.push(`/reports/${report.id}`)}>
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary group-hover:text-white transition-colors text-primary">
                      <FileText className="h-6 w-6" />
                    </div>
                    <span className="text-[10px] px-2.5 py-1 rounded-full font-extrabold uppercase bg-emerald-100 text-emerald-700 tracking-wider">
                      {report.status}
                    </span>
                  </div>
                  <CardTitle className="text-lg font-bold line-clamp-2 leading-tight text-slate-900">
                    {report.reportTitle}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-0 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                      <Calendar className="h-4 w-4" />
                      {report.reportDate}
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                      <User className="h-4 w-4" />
                      {report.reportingCommanderName}
                    </div>
                  </div>
                  <div className="pt-6 mt-auto border-t flex justify-end">
                    <Button variant="ghost" size="sm" className="font-bold text-primary hover:bg-primary/5 px-0 h-auto">
                      View Full Log <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-white rounded-3xl border border-dashed border-slate-300 flex flex-col items-center gap-6">
            <div className="p-6 bg-slate-50 rounded-full text-slate-300">
              <Search className="h-16 w-16" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-slate-900">Record Not Found</h3>
              <p className="text-slate-500 max-w-sm mx-auto">No operational reports match your current filter or no entries have been filed yet.</p>
            </div>
            {searchTerm ? (
              <Button variant="outline" onClick={() => setSearchTerm('')} className="rounded-xl px-8 font-bold">Clear Filter</Button>
            ) : (
              <Button onClick={() => router.push('/daily/new')} className="rounded-xl px-10 h-12 font-bold">File First Report</Button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}