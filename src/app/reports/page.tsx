"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, where } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { FileText, ChevronLeft, Calendar, User, ArrowRight, Loader2, Search, ArrowLeft, LayoutGrid, List } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { useUserProfile } from '@/hooks/use-user-profile';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ReportsList() {
  const router = useRouter();
  const db = useFirestore();
  const { isCommander, profile, isLoading: isAuthLoading } = useUserProfile();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewType, setViewType] = useState<'daily' | 'weekly'>('daily');

  const reportsQuery = useMemoFirebase(() => {
    if (!db || !profile) return null;
    
    const baseQuery = collection(db, 'reports');
    // Commander and Admin see all reports. Others see their unit only.
    if (isCommander) {
      return query(baseQuery, orderBy('createdAt', 'desc'));
    } else {
      return query(baseQuery, where('unit', '==', profile.unit || 'TRS'), orderBy('createdAt', 'desc'));
    }
  }, [db, isCommander, profile?.unit]);

  const { data: reports, isLoading: isReportsLoading } = useCollection(reportsQuery);

  const filteredReports = reports?.filter(r => 
    r.reportTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.reportDate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.unit?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isLoading = isAuthLoading || isReportsLoading;

  return (
    <div className="flex-1 bg-[#f8fafc] pb-20 p-4 md:p-10">
      <div className="max-w-6xl mx-auto space-y-6 md:space-y-10">
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="md:hidden">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="space-y-0.5 md:space-y-1">
              <h1 className="text-2xl md:text-4xl font-black tracking-tighter text-slate-900">Archive</h1>
              <p className="text-xs md:text-sm text-slate-500 font-medium">
                {isCommander ? 'Global Command Registry' : `${profile?.unit} Unit Registry`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search logs..." 
                className="pl-10 h-10 rounded-xl bg-white border-slate-200 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Tabs value={viewType} onValueChange={(val) => setViewType(val as any)} className="hidden sm:block">
              <TabsList className="rounded-xl bg-slate-100 p-1">
                <TabsTrigger value="daily" className="rounded-lg text-[10px] uppercase font-bold px-4 data-[state=active]:bg-white">Daily</TabsTrigger>
                <TabsTrigger value="weekly" className="rounded-lg text-[10px] uppercase font-bold px-4 data-[state=active]:bg-white">Weekly</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </section>

        {isCommander && (
          <div className="bg-primary/5 border border-primary/10 p-4 md:p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                <FileText className="text-white h-6 w-6" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900">Executive Summary Generation</h2>
                <p className="text-xs text-slate-500">Analyze multiple logs to produce a consolidated weekly report.</p>
              </div>
            </div>
            <Button size="sm" className="rounded-xl font-bold shadow-lg shadow-primary/10" asChild>
              <Link href="/weekly/new">Launch AI Consolidation</Link>
            </Button>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 md:py-32 gap-4">
            <Loader2 className="h-8 w-8 md:h-10 md:w-10 animate-spin text-primary" />
            <p className="text-slate-500 font-bold uppercase text-[9px] md:text-[10px] tracking-widest">Accessing Vault...</p>
          </div>
        ) : filteredReports && filteredReports.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
            {filteredReports.map((report) => (
              <Card 
                key={report.id} 
                className="hover:shadow-2xl transition-all cursor-pointer group border-none shadow-sm flex flex-col h-full bg-white rounded-[1.5rem] md:rounded-[2rem] overflow-hidden" 
                onClick={() => router.push(`/reports/${report.id}`)}
              >
                <CardHeader className="p-5 md:p-6 pb-2 md:pb-4">
                  <div className="flex justify-between items-start mb-3 md:mb-4">
                    <div className="p-2.5 md:p-3 bg-primary/10 rounded-xl group-hover:bg-primary group-hover:text-white transition-colors text-primary">
                      <FileText className="h-5 w-5 md:h-6 md:w-6" />
                    </div>
                    <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-primary/20 text-primary">
                      {report.unit}
                    </Badge>
                  </div>
                  <CardTitle className="text-base md:text-lg font-bold line-clamp-2 leading-tight text-slate-900">
                    {report.reportTitle}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 md:p-6 space-y-4 pt-0 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest">
                      <Calendar className="h-3 w-3" />
                      {report.reportDate}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] md:text-xs font-bold text-slate-500 truncate">
                      <User className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{report.reportingCommanderName}</span>
                    </div>
                  </div>
                  <div className="pt-4 md:pt-6 mt-auto border-t flex justify-end">
                    <Button variant="ghost" size="sm" className="font-bold text-primary hover:bg-primary/5 px-0 h-auto text-xs">
                      Review Log <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 md:py-32 bg-white rounded-[2rem] md:rounded-[3rem] border border-dashed border-slate-200 flex flex-col items-center gap-4 md:gap-6 px-6">
            <Search className="h-12 w-12 md:h-16 md:w-16 text-slate-200" />
            <div className="space-y-1 md:space-y-2">
              <h3 className="text-xl md:text-2xl font-bold text-slate-900">No Records Found</h3>
              <p className="text-xs md:text-sm text-slate-500 max-w-sm mx-auto">The archive is empty or no reports match your search criteria.</p>
            </div>
            {profile?.role === 'LEADER' && (
              <Button size="sm" asChild className="rounded-xl px-6">
                <Link href="/daily/new">File New Report</Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
