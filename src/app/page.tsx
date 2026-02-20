"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { 
  PlusCircle, 
  History, 
  Loader2, 
  ShieldCheck, 
  ArrowRight,
  Lock,
  UserCog,
  ShieldAlert,
  Shield,
  Eye,
  Activity,
  Building2,
  Navigation,
  FileText,
  Calendar
} from 'lucide-react';
import { useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { collection, query, orderBy, limit, where } from 'firebase/firestore';
import { useUserProfile } from '@/hooks/use-user-profile';
import { Badge } from '@/components/ui/badge';

const UNITS = [
  { id: "Gasabo DPU", name: "Gasabo DPU", color: "bg-blue-500" },
  { id: "Kicukiro DPU", name: "Kicukiro DPU", color: "bg-indigo-500" },
  { id: "Nyarugenge DPU", name: "Nyarugenge DPU", color: "bg-violet-500" },
  { id: "TRS", name: "TRS", color: "bg-slate-700" },
  { id: "SIF", name: "SIF", color: "bg-emerald-600" },
  { id: "TFU", name: "TFU", color: "bg-amber-600" },
  { id: "ORDERLY REPORT", name: "ORDERLY REPORT", color: "bg-primary" },
];

export default function Home() {
  const db = useFirestore();
  const router = useRouter();
  const { isAdmin, isCommander, isLeader, profile, isLoading, user } = useUserProfile();

  const displayLimit = (isAdmin || isCommander || isLeader) ? 50 : 20;

  const recentReportsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid || isLoading || !profile) return null;
    
    const baseQuery = collection(db, 'reports');
    
    if (isAdmin || isCommander || isLeader) {
      return query(baseQuery, orderBy('createdAt', 'desc'), limit(displayLimit));
    } else {
      return query(baseQuery, where('ownerId', '==', user.uid), orderBy('createdAt', 'desc'), limit(displayLimit));
    }
  }, [db, isAdmin, isCommander, isLeader, profile, user?.uid, isLoading, displayLimit]);

  const { data: reports, isLoading: isReportsLoading } = useCollection(recentReportsQuery);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 font-bold text-muted-foreground tracking-widest uppercase text-xs">Decrypting Terminal...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background p-6 text-center">
        <div className="bg-card p-12 rounded-[3rem] shadow-2xl border border-border max-w-lg w-full">
          <div className="bg-primary w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock className="text-primary-foreground h-8 w-8" />
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-foreground mb-4">Secure Gateway</h1>
          <p className="text-muted-foreground mb-8 leading-relaxed text-sm md:text-base">Authorized personnel must authenticate with official credentials to access operational data.</p>
          <Button size="lg" className="w-full h-14 rounded-2xl font-bold text-lg" onClick={() => router.push('/login')}>
            Sign In to Protocol
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-background p-4 md:p-10 space-y-10 pb-32">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Secure Protocol Active</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-foreground leading-none">
            {isAdmin || isCommander || isLeader ? 'Command Registry' : `Operational Feed: ${profile?.displayName?.split(' ')[0] || 'Officer'}`}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="bg-card border-border text-muted-foreground font-bold px-3 py-1 text-[10px] rounded-lg shadow-sm uppercase">
              ROLE: <span className="text-primary ml-1">{profile?.role || 'User'}</span>
            </Badge>
            <Badge variant="secondary" className="bg-card border-border text-muted-foreground font-bold px-3 py-1 text-[10px] rounded-lg shadow-sm uppercase">
              UNIT: <span className="text-foreground ml-1">{profile?.unit || 'Station'}</span>
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild className="h-12 rounded-xl font-black shadow-xl shadow-primary/20 px-8">
            <Link href="/daily/new">
              <PlusCircle className="mr-2 h-5 w-5" />
              FILE NEW REPORT
            </Link>
          </Button>
        </div>
      </header>

      {(isAdmin || isCommander) && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <Navigation className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Unit Repositories</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
            {UNITS.map((unit) => (
              <Link key={unit.id} href={`/reports/unit/${unit.id}`}>
                <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border border-border shadow-sm cursor-pointer group overflow-hidden bg-card">
                  <div className={`h-1 w-full ${unit.color}`} />
                  <CardHeader className="p-4 space-y-2">
                    <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                      {unit.id === "ORDERLY REPORT" ? <FileText className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                    </div>
                    <CardTitle className="text-[10px] font-black uppercase tracking-tight truncate">{unit.name}</CardTitle>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <Card className="lg:col-span-3 border border-border shadow-xl rounded-[2.5rem] bg-card overflow-hidden flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between p-8 pb-4">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-black text-foreground flex items-center gap-2">
                <Activity className="h-6 w-6 text-primary" />
                {(isAdmin || isCommander || isLeader) ? 'Operational Feed' : 'My Filings'}
              </CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Displaying latest {(isAdmin || isCommander || isLeader) ? 'global logs' : 'personal entries'}.
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild className="font-black text-primary hover:bg-primary/5 rounded-xl">
              <Link href="/reports" className="flex items-center gap-1.5 text-xs">
                Full Archive <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="px-8 pb-10 flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {isReportsLoading ? (
                <div className="col-span-full py-20 flex flex-col items-center gap-4">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Syncing Records...</span>
                </div>
              ) : reports && reports.length > 0 ? (
                reports.map((report) => (
                  <div 
                    key={report.id} 
                    onClick={() => router.push(`/reports/view/${report.id}`)}
                    className="group relative flex flex-col p-4 rounded-2xl bg-accent/30 hover:bg-accent/50 transition-all border border-transparent hover:border-border hover:shadow-xl cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="outline" className="text-[8px] font-black px-2 py-0.5 border-primary/20 text-primary uppercase tracking-widest bg-background">
                        {report.unit}
                      </Badge>
                      <div className="flex items-center gap-1.5 text-[9px] font-black text-muted-foreground uppercase tracking-tighter">
                        <Calendar className="h-3 w-3" />
                        {report.reportDate}
                      </div>
                    </div>
                    <h4 className="font-black text-foreground text-sm line-clamp-1 mb-3 group-hover:text-primary transition-colors">
                      {report.reportTitle}
                    </h4>
                    <div className="mt-auto flex items-center justify-between pt-3 border-t border-border/50">
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[8px] font-black">
                          {report.reportingCommanderName?.charAt(0)}
                        </div>
                        <span className="text-[9px] font-bold text-muted-foreground truncate max-w-[100px]">{report.reportingCommanderName}</span>
                      </div>
                      <Eye className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-20 bg-accent/20 rounded-[2rem] border border-dashed border-border">
                  <div className="bg-card h-12 w-12 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <ShieldAlert className="h-6 w-6 text-primary/20" />
                  </div>
                  <h3 className="text-lg font-black text-foreground mb-1 uppercase">No Records</h3>
                  <Button asChild variant="outline" size="sm" className="rounded-xl font-bold">
                    <Link href="/daily/new">File First Report</Link>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-1">
          <Card className="bg-slate-900 text-white border-none shadow-2xl rounded-[2rem] overflow-hidden relative group">
            <CardHeader className="p-8">
              <CardTitle className="text-xl font-black">Action Center</CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-3">
              <Button asChild variant="outline" className="w-full h-12 rounded-xl bg-white/5 border-white/10 hover:bg-white hover:text-slate-900 font-black text-xs">
                <Link href="/reports">
                  <History className="mr-2 h-4 w-4" />
                  ACCESS ARCHIVES
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
