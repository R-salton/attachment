
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
  AlertTriangle,
  Lock,
  UserCog,
  Building2
} from 'lucide-react';
import { useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { collection, query, orderBy, limit, where } from 'firebase/firestore';
import { useUserProfile } from '@/hooks/use-user-profile';

export default function Home() {
  const db = useFirestore();
  const router = useRouter();
  const { isLeader, isAdmin, isCommander, profile, isLoading, user } = useUserProfile();

  const recentReportsQuery = useMemoFirebase(() => {
    if (!db || !profile) return null;
    
    const baseQuery = collection(db, 'reports');
    if (isCommander) {
      return query(baseQuery, orderBy('createdAt', 'desc'), limit(3));
    } else {
      return query(baseQuery, where('unit', '==', profile.unit || 'TRS'), orderBy('createdAt', 'desc'), limit(3));
    }
  }, [db, isCommander, profile?.unit]);

  const { data: reports, isLoading: isReportsLoading } = useCollection(recentReportsQuery);

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
    <div className="flex-1 bg-[#f8fafc] p-4 md:p-10 space-y-6 md:space-y-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 md:h-5 md:w-5 text-emerald-500" />
            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-emerald-600">Secure Access Granted</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-slate-900">
            Welcome, {profile?.displayName?.split(' ')[0]}
          </h1>
          <div className="flex items-center gap-3">
            <p className="text-slate-500 text-sm md:text-lg">Clearance: <span className="font-bold text-primary uppercase">{isAdmin ? 'Admin' : profile?.role}</span></p>
            <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
            <p className="text-slate-500 text-sm md:text-lg">Station: <span className="font-bold text-slate-900 uppercase">{profile?.unit || 'N/A'}</span></p>
          </div>
        </div>
      </header>

      {profile?.role === 'TRAINEE' && !isAdmin && (
        <Card className="bg-amber-50 border-amber-200 border-2 rounded-[1.5rem] md:rounded-[2rem] shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-amber-800 text-xl md:text-2xl">
              <AlertTriangle className="h-5 w-5 md:h-6 md:w-6" />
              Limited Access Mode
            </CardTitle>
            <CardDescription className="text-amber-700/80 font-medium">
              You are currently registered as a <strong>Trainee</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-amber-800/70 text-xs md:text-sm leading-relaxed">
            While you can view reports within the <strong>{profile?.unit}</strong> unit, operational creation and cross-unit archives are restricted.
          </CardContent>
        </Card>
      )}

      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        {isLeader && (
          <Card className="hover:shadow-2xl transition-all border-none shadow-sm group bg-white rounded-[1.5rem] md:rounded-[2rem] overflow-hidden">
            <Link href="/daily/new" className="block p-6 md:p-8">
              <div className="h-12 w-12 md:h-14 md:w-14 rounded-xl md:rounded-2xl bg-primary/10 flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 transition-transform">
                <PlusCircle className="h-6 w-6 md:h-7 md:w-7 text-primary" />
              </div>
              <h3 className="text-xl md:text-2xl font-black mb-1 md:mb-2">Create Report</h3>
              <p className="text-xs md:text-sm text-slate-500 font-medium leading-relaxed">Document active deployments and unit operational status.</p>
            </Link>
          </Card>
        )}

        <Card className="hover:shadow-2xl transition-all border-none shadow-sm group bg-white rounded-[1.5rem] md:rounded-[2rem] overflow-hidden">
          <Link href="/reports" className="block p-6 md:p-8">
            <div className="h-12 w-12 md:h-14 md:w-14 rounded-xl md:rounded-2xl bg-slate-100 flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 transition-transform">
              <History className="h-6 w-6 md:h-7 md:w-7 text-slate-700" />
            </div>
            <h3 className="text-xl md:text-2xl font-black mb-1 md:mb-2">History</h3>
            <p className="text-xs md:text-sm text-slate-500 font-medium leading-relaxed">Access the operational logbook for {isCommander ? 'all units' : profile?.unit}.</p>
          </Link>
        </Card>

        {isAdmin && (
          <Card className="hover:shadow-2xl transition-all border-none shadow-sm group bg-slate-900 rounded-[1.5rem] md:rounded-[2rem] overflow-hidden">
            <Link href="/users" className="block p-6 md:p-8">
              <div className="h-12 w-12 md:h-14 md:w-14 rounded-xl md:rounded-2xl bg-white/10 flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 transition-transform">
                <UserCog className="h-6 w-6 md:h-7 md:w-7 text-white" />
              </div>
              <h3 className="text-xl md:text-2xl font-black text-white mb-1 md:mb-2">Personnel</h3>
              <p className="text-xs md:text-sm text-slate-400 font-medium leading-relaxed">Manage user roles, units and system access.</p>
            </Link>
          </Card>
        )}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        <Card className="border-none shadow-xl rounded-[2rem] md:rounded-[2.5rem] bg-white overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between p-6 md:p-8">
            <div>
              <CardTitle className="text-xl md:text-2xl font-black">Recent Logs</CardTitle>
              <CardDescription className="text-xs md:text-sm">{isCommander ? 'Latest cross-unit filings.' : `Latest ${profile?.unit} filings.`}</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild className="font-bold text-primary">
              <Link href="/reports" className="flex items-center gap-1 text-xs md:text-sm">View All <ArrowRight className="h-3 w-3 md:h-4 md:w-4" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="px-6 md:px-8 pb-6 md:pb-8">
            <div className="space-y-3 md:space-y-4">
              {isReportsLoading ? (
                <div className="py-10 text-center text-slate-400 flex flex-col items-center gap-2">
                  <Loader2 className="h-5 w-5 md:h-6 md:w-6 animate-spin" />
                  <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest">Retrieving Logbook...</span>
                </div>
              ) : reports && reports.length > 0 ? (
                reports.map((report) => (
                  <Link key={report.id} href={`/reports/${report.id}`} className="flex items-center justify-between p-4 md:p-5 rounded-2xl md:rounded-3xl bg-slate-50 hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200">
                    <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                      <div className="p-2 md:p-3 bg-white rounded-xl shadow-sm flex-shrink-0">
                        <FileText className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-bold text-slate-900 text-sm md:text-base truncate">{report.reportTitle}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">{report.reportDate}</p>
                          {isCommander && (
                            <Badge variant="outline" className="text-[7px] py-0 px-1 font-black h-3.5 border-primary/20 text-primary">
                              {report.unit}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-300 flex-shrink-0" />
                  </Link>
                ))
              ) : (
                <div className="text-center py-10 bg-slate-50 rounded-3xl border border-dashed border-slate-300">
                  <p className="text-xs md:text-sm font-medium text-slate-500 mb-4">No records found for your station.</p>
                  {isLeader && (
                    <Button size="sm" asChild>
                      <Link href="/daily/new">Start First Log</Link>
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 text-white overflow-hidden relative border-none shadow-2xl rounded-[2rem] md:rounded-[2.5rem]">
          <div className="absolute top-0 right-0 p-6 md:p-8 opacity-20 pointer-events-none">
            <Building2 className="h-24 w-24 md:h-32 md:w-32" />
          </div>
          <CardHeader className="p-8 md:p-10 relative z-10">
            <CardTitle className="text-2xl md:text-3xl font-black">Command Info</CardTitle>
            <CardDescription className="text-slate-400 font-medium text-xs md:text-sm">Station specific operational logic.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 md:p-10 pt-0 relative z-10 space-y-6 md:space-y-8">
            <div className="space-y-4 md:space-y-6">
              <div className="flex gap-4 md:gap-5">
                <div className="h-8 w-8 md:h-10 md:w-10 rounded-xl md:rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0 text-xs md:text-sm font-black">01</div>
                <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-medium">
                  Reports are partitioned by Unit. You can only view and edit logs filed within <strong>{profile?.unit || 'your assigned unit'}</strong>.
                </p>
              </div>
              <div className="flex gap-4 md:gap-5">
                <div className="h-8 w-8 md:h-10 md:w-10 rounded-xl md:rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0 text-xs md:text-sm font-black">02</div>
                <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-medium">
                  Personnel with <strong>Commander</strong> clearance have oversight of all unit registries for central summary generation.
                </p>
              </div>
            </div>
          </CardContent>
          <div className="absolute -bottom-20 -left-20 w-60 h-60 md:w-80 md:h-80 bg-primary/30 rounded-full blur-[80px] md:blur-[100px] pointer-events-none"></div>
        </Card>
      </section>
    </div>
  );
}
