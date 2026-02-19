
"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { 
  FileText, 
  PlusCircle, 
  History, 
  Loader2, 
  ShieldCheck, 
  ArrowRight,
  Lock,
  UserCog,
  Building2,
  Navigation,
  ExternalLink,
  ShieldAlert,
  Shield,
  Eye,
  Activity
} from 'lucide-react';
import { useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { collection, query, orderBy, limit, where } from 'firebase/firestore';
import { useUserProfile } from '@/hooks/use-user-profile';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { ReportPreviewDialog } from '@/components/reports/ReportPreviewDialog';

const UNITS = [
  { name: "Gasabo DPU", slug: "gasabodpu" },
  { name: "Kicukiro DPU", slug: "kicukirodpu" },
  { name: "Nyarugenge DPU", slug: "nyarugengedpu" },
  { name: "TRS", slug: "trs" },
  { name: "SIF", slug: "sif" },
  { name: "TFU", slug: "tfu" }
];

export default function Home() {
  const db = useFirestore();
  const router = useRouter();
  const { isAdmin, isLeader, isCommander, profile, isLoading, user } = useUserProfile();
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Admins see more recent activity to provide better oversight
  const displayLimit = isAdmin ? 12 : 6;

  const recentReportsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid || isLoading || !profile) return null;
    
    const baseQuery = collection(db, 'reports');
    
    if (isAdmin || isCommander || isLeader) {
      return query(baseQuery, orderBy('createdAt', 'desc'), limit(displayLimit));
    } else {
      if (!profile.unit || profile.unit === 'N/A') return null;
      return query(baseQuery, where('unit', '==', profile.unit), orderBy('createdAt', 'desc'), limit(displayLimit));
    }
  }, [db, isAdmin, isCommander, isLeader, profile, user?.uid, isLoading, displayLimit]);

  const { data: reports, isLoading: isReportsLoading } = useCollection(recentReportsQuery);

  const handlePreview = (report: any) => {
    setSelectedReport(report);
    setIsPreviewOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#f8fafc]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 font-bold text-slate-400 tracking-widest uppercase text-xs">Decrypting Terminal...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#f8fafc] p-6 text-center">
        <div className="bg-white p-8 md:p-12 rounded-[2rem] md:rounded-[3rem] shadow-2xl border border-slate-100 max-w-lg w-full">
          <div className="bg-primary w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock className="text-white h-8 w-8" />
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-4">Secure Gateway</h1>
          <p className="text-slate-500 mb-8 leading-relaxed text-sm md:text-base">Authorized personnel must authenticate with official credentials to access operational data.</p>
          <Button size="lg" className="w-full h-14 rounded-2xl font-bold text-lg" onClick={() => router.push('/login')}>
            Sign In to Protocol
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#f8fafc] p-4 md:p-8 lg:p-12 space-y-8 md:space-y-12 pb-32">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 md:h-5 md:w-5 text-emerald-500" />
            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.4em] text-emerald-600">Secure Protocol Active</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-slate-900 leading-none">
            {isAdmin ? 'Command Center' : `Welcome, ${profile?.displayName?.split(' ')[0] || 'Officer'}`}
          </h1>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="secondary" className="bg-white border-slate-200 text-slate-600 font-bold px-3 py-1 text-xs rounded-lg shadow-sm uppercase">
              ROLE: <span className="text-primary ml-1">{profile?.role || 'User'}</span>
            </Badge>
            <Badge variant="secondary" className="bg-white border-slate-200 text-slate-600 font-bold px-3 py-1 text-xs rounded-lg shadow-sm uppercase">
              UNIT: <span className="text-slate-900 ml-1">{profile?.unit || 'Station'}</span>
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild className="h-12 md:h-14 rounded-2xl font-black shadow-xl shadow-primary/20 px-6 md:px-8">
            <Link href="/daily/new">
              <PlusCircle className="mr-2 h-5 w-5" />
              FILE NEW REPORT
            </Link>
          </Button>
        </div>
      </header>

      {(isAdmin || isCommander) && (
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-900 rounded-lg">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Unit Repositories</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
            {UNITS.map((unit) => (
              <Card 
                key={unit.slug} 
                className="group hover:shadow-xl transition-all cursor-pointer border-none shadow-sm rounded-2xl md:rounded-3xl overflow-hidden bg-white hover:-translate-y-1 duration-300" 
                onClick={() => router.push(`/reports/unit/${unit.slug}`)}
              >
                <CardContent className="p-4 md:p-6 flex flex-col items-center text-center space-y-3">
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <Navigation className="h-5 w-5 md:h-6 md:w-6 text-slate-400 group-hover:text-primary transition-colors" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">{unit.name.split(' ').slice(1).join(' ')}</p>
                    <p className="text-sm md:text-base font-black text-slate-900 leading-none">{unit.name.split(' ')[0]}</p>
                  </div>
                  <ExternalLink className="h-3 w-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10">
        <Card className="lg:col-span-2 border-none shadow-xl md:shadow-2xl rounded-[2rem] md:rounded-[3rem] bg-white overflow-hidden flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between p-6 md:p-10 pb-2 md:pb-4">
            <div className="space-y-1">
              <CardTitle className="text-xl md:text-3xl font-black text-slate-900 flex items-center gap-3">
                <Activity className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                {(isAdmin || isCommander || isLeader) ? 'Global Command Feed' : 'My Unit Activity'}
              </CardTitle>
              <CardDescription className="text-xs md:text-sm font-bold text-slate-400">
                {(isAdmin || isCommander || isLeader) ? `Displaying latest ${displayLimit} filings across all units.` : `Recent filings for ${profile?.unit}.`}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild className="font-black text-primary hover:bg-primary/5 rounded-xl">
              <Link href="/reports" className="flex items-center gap-1.5 text-xs md:text-sm">
                Full Archive <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="px-6 md:px-10 pb-8 md:pb-12 flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isReportsLoading ? (
                <div className="col-span-full py-20 flex flex-col items-center gap-4">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Records...</span>
                </div>
              ) : reports && reports.length > 0 ? (
                reports.map((report) => (
                  <div 
                    key={report.id} 
                    onClick={() => handlePreview(report)}
                    className="cursor-pointer group relative flex flex-col p-5 rounded-3xl bg-slate-50 hover:bg-white transition-all border border-transparent hover:border-slate-100 hover:shadow-xl hover:shadow-slate-200/50"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <Badge variant="outline" className="text-[8px] md:text-[9px] font-black px-2 py-0.5 border-primary/20 text-primary uppercase tracking-widest bg-white">
                        {report.unit}
                      </Badge>
                      <div className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                        {report.reportDate}
                      </div>
                    </div>
                    <h4 className="font-black text-slate-900 text-sm md:text-base line-clamp-2 leading-tight mb-4 group-hover:text-primary transition-colors">
                      {report.reportTitle}
                    </h4>
                    <div className="mt-auto flex items-center justify-between pt-2 border-t border-slate-100/50">
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-5 rounded-full bg-slate-200 border border-white flex items-center justify-center text-[8px] font-black">
                          {report.reportingCommanderName?.charAt(0)}
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 truncate max-w-[100px]">{report.reportingCommanderName}</span>
                      </div>
                      <Eye className="h-3.5 w-3.5 text-slate-300 group-hover:text-primary transition-colors group-hover:scale-110 duration-300" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-24 bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200">
                  <div className="bg-white h-16 w-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <ShieldAlert className="h-8 w-8 text-slate-200" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-2 uppercase">Registry Empty</h3>
                  <p className="text-xs md:text-sm text-slate-400 max-w-[240px] mx-auto mb-8 font-medium">
                    No operational logs recorded for {(isAdmin || isCommander || isLeader) ? 'the command' : profile?.unit}.
                  </p>
                  <Button asChild className="rounded-xl font-bold">
                    <Link href="/daily/new">File First Report</Link>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6 md:space-y-8">
          <Card className="bg-slate-900 border-none shadow-2xl rounded-[2.5rem] overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-700">
              <ShieldCheck className="h-32 w-32 text-white" />
            </div>
            <CardHeader className="p-8 md:p-10 relative z-10">
              <CardTitle className="text-2xl font-black text-white">Action Center</CardTitle>
              <CardDescription className="text-slate-400 font-bold text-xs">Mission critical system tools.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 md:p-10 pt-0 relative z-10 space-y-4">
              <Button asChild variant="outline" className="w-full h-14 rounded-2xl bg-white/5 border-white/10 hover:bg-white hover:text-slate-900 text-white font-black transition-all group/btn">
                <Link href="/reports">
                  <History className="mr-2 h-5 w-5 group-hover/btn:rotate-12 transition-transform" />
                  ACCESS ARCHIVES
                </Link>
              </Button>
              {isAdmin && (
                <Button asChild variant="outline" className="w-full h-14 rounded-2xl bg-white/5 border-white/10 hover:bg-white hover:text-slate-900 text-white font-black transition-all group/btn">
                  <Link href="/users">
                    <UserCog className="mr-2 h-5 w-5 group-hover/btn:rotate-12 transition-transform" />
                    MANAGE PERSONNEL
                  </Link>
                </Button>
              )}
              {(isAdmin || isCommander || isLeader) && (
                <div className="pt-6 border-t border-white/5 mt-6">
                  <div className="bg-primary/20 border border-primary/30 p-5 rounded-3xl space-y-4">
                    <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5 text-primary" />
                      <span className="text-[10px] font-black uppercase text-white tracking-widest">Executive AI Tool</span>
                    </div>
                    <p className="text-xs text-slate-300 font-medium leading-relaxed">Consolidate multiple logs into a strategic weekly summary.</p>
                    <Button asChild size="sm" className="w-full rounded-xl font-black shadow-lg shadow-primary/20">
                      <Link href="/weekly/new">LAUNCH AI ANALYSIS</Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ReportPreviewDialog 
        report={selectedReport} 
        isOpen={isPreviewOpen} 
        onClose={() => setIsPreviewOpen(false)} 
      />
    </div>
  );
}
