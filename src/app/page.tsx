
"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { 
  FileText, 
  Calendar, 
  PlusCircle, 
  History, 
  Loader2, 
  ShieldCheck, 
  ArrowRight,
  AlertTriangle,
  Lock,
  UserCog
} from 'lucide-react';
import { useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { useUserProfile } from '@/hooks/use-user-profile';

export default function Home() {
  const db = useFirestore();
  const router = useRouter();
  const { isLeader, isAdmin, profile, isLoading, user } = useUserProfile();

  const recentReportsQuery = useMemoFirebase(() => {
    // Only construct query if user is a Leader/Admin
    if (!db || !isLeader) return null;
    return query(collection(db, 'reports'), orderBy('createdAt', 'desc'), limit(3));
  }, [db, isLeader]);

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
      <div className="flex-1 flex flex-col items-center justify-center bg-[#f8fafc] p-10 text-center">
        <div className="bg-white p-12 rounded-[3rem] shadow-2xl border border-slate-100 max-w-lg">
          <div className="bg-primary w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock className="text-white h-8 w-8" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-4">Secure Gateway</h1>
          <p className="text-slate-500 mb-8 leading-relaxed">Authorized personnel must authenticate with official credentials to access operational data.</p>
          <Button size="lg" className="w-full h-14 rounded-2xl font-bold text-lg" onClick={() => router.push('/login')}>
            Sign In to Protocol
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#f8fafc] p-6 md:p-10 space-y-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600">Secure Access Granted</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-slate-900">
            Welcome, {profile?.displayName?.split(' ')[0]}
          </h1>
          <p className="text-slate-500 text-lg">Current Clearance: <span className="font-bold text-primary uppercase">{isAdmin ? 'Admin' : profile?.role}</span></p>
        </div>
      </header>

      {profile?.role === 'TRAINEE' && !isAdmin ? (
        <Card className="bg-amber-50 border-amber-200 border-2 rounded-[2rem] shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-amber-800">
              <AlertTriangle className="h-6 w-6" />
              Limited Access Mode
            </CardTitle>
            <CardDescription className="text-amber-700/80 font-medium">
              You are currently registered as a <strong>Trainee</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-amber-800/70 text-sm leading-relaxed">
            Operational duties and archive retrieval are restricted to <strong>Leaders</strong> and <strong>Admins</strong>. 
            If you believe this is an error, please contact your commanding officer to update your clearance.
          </CardContent>
        </Card>
      ) : (
        <>
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="hover:shadow-2xl transition-all border-none shadow-sm group bg-white rounded-[2rem] overflow-hidden">
              <Link href="/daily/new" className="block p-8">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <PlusCircle className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-2xl font-black mb-2">Create Report</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">Document active deployments and unit operational status.</p>
              </Link>
            </Card>

            <Card className="hover:shadow-2xl transition-all border-none shadow-sm group bg-white rounded-[2rem] overflow-hidden">
              <Link href="/reports" className="block p-8">
                <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <History className="h-7 w-7 text-slate-700" />
                </div>
                <h3 className="text-2xl font-black mb-2">History</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">Access the centralized operational log of all filed entries.</p>
              </Link>
            </Card>

            {isAdmin && (
              <Card className="hover:shadow-2xl transition-all border-none shadow-sm group bg-slate-900 rounded-[2rem] overflow-hidden">
                <Link href="/users" className="block p-8">
                  <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <UserCog className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-black text-white mb-2">Personnel</h3>
                  <p className="text-sm text-slate-400 font-medium leading-relaxed">Manage user roles and system access controls.</p>
                </Link>
              </Card>
            )}
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between p-8">
                <div>
                  <CardTitle className="text-2xl font-black">Recent Logs</CardTitle>
                  <CardDescription>Latest operational filings across all DPUs.</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild className="font-bold text-primary">
                  <Link href="/reports" className="flex items-center gap-1">View All <ArrowRight className="h-4 w-4" /></Link>
                </Button>
              </CardHeader>
              <CardContent className="px-8 pb-8">
                <div className="space-y-4">
                  {isReportsLoading ? (
                    <div className="py-10 text-center text-slate-400 flex flex-col items-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Retrieving Logbook...</span>
                    </div>
                  ) : reports && reports.length > 0 ? (
                    reports.map((report) => (
                      <Link key={report.id} href={`/reports/${report.id}`} className="flex items-center justify-between p-5 rounded-3xl bg-slate-50 hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-white rounded-xl shadow-sm">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 truncate max-w-[150px] md:max-w-xs">{report.reportTitle}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{report.reportDate}</p>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-slate-300" />
                      </Link>
                    ))
                  ) : (
                    <div className="text-center py-10 bg-slate-50 rounded-3xl border border-dashed border-slate-300">
                      <p className="text-sm font-medium text-slate-500 mb-4">No records found in the current period.</p>
                      <Button size="sm" asChild>
                        <Link href="/daily/new">Start First Log</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 text-white overflow-hidden relative border-none shadow-2xl rounded-[2.5rem]">
              <div className="absolute top-0 right-0 p-8 opacity-20">
                <ShieldCheck className="h-32 w-32" />
              </div>
              <CardHeader className="p-10 relative z-10">
                <CardTitle className="text-3xl font-black">Operational Guidelines</CardTitle>
                <CardDescription className="text-slate-400 font-medium">Standard reporting protocols for intake {profile?.cadetsIntake || '14'}.</CardDescription>
              </CardHeader>
              <CardContent className="p-10 pt-0 relative z-10 space-y-8">
                <div className="space-y-6">
                  <div className="flex gap-5">
                    <div className="h-10 w-10 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0 text-sm font-black">01</div>
                    <p className="text-sm text-slate-300 leading-relaxed font-medium">
                      All incidents must be logged before shift end. Accuracy is non-negotiable for command review.
                    </p>
                  </div>
                  <div className="flex gap-5">
                    <div className="h-10 w-10 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0 text-sm font-black">02</div>
                    <p className="text-sm text-slate-300 leading-relaxed font-medium">
                      Ensure ownership filters are applied when exporting regional data for summary generation.
                    </p>
                  </div>
                </div>
              </CardContent>
              <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-primary/30 rounded-full blur-[100px] pointer-events-none"></div>
            </Card>
          </section>
        </>
      )}
    </div>
  );
}
