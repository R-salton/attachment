
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
    <div className="flex-1 bg-background p-4 md:p-12 space-y-12 pb-32">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-600">Secure Protocol Active</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-foreground leading-none">
            {isAdmin ? 'Command Center' : `Welcome, ${profile?.displayName?.split(' ')[0] || 'Officer'}`}
          </h1>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="secondary" className="bg-card border-border text-muted-foreground font-bold px-3 py-1 text-xs rounded-lg shadow-sm uppercase">
              ROLE: <span className="text-primary ml-1">{profile?.role || 'User'}</span>
            </Badge>
            <Badge variant="secondary" className="bg-card border-border text-muted-foreground font-bold px-3 py-1 text-xs rounded-lg shadow-sm uppercase">
              UNIT: <span className="text-foreground ml-1">{profile?.unit || 'Station'}</span>
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild className="h-14 rounded-2xl font-black shadow-xl shadow-primary/20 px-8">
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
            <div className="p-2 bg-foreground rounded-lg">
              <Building2 className="h-4 w-4 text-background" />
            </div>
            <h2 className="text-xl font-black text-foreground uppercase tracking-tight">Unit Repositories</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {UNITS.map((unit) => (
              <Card 
                key={unit.slug} 
                className="group hover:shadow-xl transition-all cursor-pointer border-none shadow-sm rounded-3xl overflow-hidden bg-card hover:-translate-y-1 duration-300" 
                onClick={() => router.push(`/reports/unit/${unit.slug}`)}
              >
                <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
                  <div className="h-12 w-12 rounded-xl bg-accent flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <Navigation className="h-6 w-6 text-primary/50 group-hover:text-primary transition-colors" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">{unit.name.split(' ').slice(1).join(' ')}</p>
                    <p className="text-base font-black text-foreground leading-none">{unit.name.split(' ')[0]}</p>
                  </div>
                  <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <Card className="lg:col-span-2 border-none shadow-2xl rounded-[3rem] bg-card overflow-hidden flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between p-10 pb-4">
            <div className="space-y-1">
              <CardTitle className="text-3xl font-black text-foreground flex items-center gap-3">
                <Activity className="h-8 w-8 text-primary" />
                {(isAdmin || isCommander || isLeader) ? 'Global Command Feed' : 'My Unit Activity'}
              </CardTitle>
              <CardDescription className="text-sm font-bold text-muted-foreground">
                {(isAdmin || isCommander || isLeader) ? `Displaying latest ${displayLimit} filings across all units.` : `Recent filings for ${profile?.unit}.`}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild className="font-black text-primary hover:bg-primary/5 rounded-xl">
              <Link href="/reports" className="flex items-center gap-1.5 text-sm">
                Full Archive <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="px-10 pb-12 flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isReportsLoading ? (
                <div className="col-span-full py-20 flex flex-col items-center gap-4">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Syncing Records...</span>
                </div>
              ) : reports && reports.length > 0 ? (
                reports.map((report) => (
                  <Link 
                    key={report.id} 
                    href={`/reports/view/${report.id}`}
                    className="group relative flex flex-col p-5 rounded-3xl bg-accent/50 hover:bg-background transition-all border border-transparent hover:border-border hover:shadow-xl"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <Badge variant="outline" className="text-[9px] font-black px-2 py-0.5 border-primary/20 text-primary uppercase tracking-widest bg-background">
                        {report.unit}
                      </Badge>
                      <div className="text-[9px] font-black text-muted-foreground uppercase tracking-tighter">
                        {report.reportDate}
                      </div>
                    </div>
                    <h4 className="font-black text-foreground text-base line-clamp-2 leading-tight mb-4 group-hover:text-primary transition-colors">
                      {report.reportTitle}
                    </h4>
                    <div className="mt-auto flex items-center justify-between pt-2 border-t border-border">
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-5 rounded-full bg-accent flex items-center justify-center text-[8px] font-black">
                          {report.reportingCommanderName?.charAt(0)}
                        </div>
                        <span className="text-[10px] font-bold text-muted-foreground truncate max-w-[100px]">{report.reportingCommanderName}</span>
                      </div>
                      <Eye className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors group-hover:scale-110 duration-300" />
                    </div>
                  </Link>
                ))
              ) : (
                <div className="col-span-full text-center py-24 bg-accent/20 rounded-[2.5rem] border border-dashed border-border">
                  <div className="bg-card h-16 w-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <ShieldAlert className="h-8 w-8 text-primary/20" />
                  </div>
                  <h3 className="text-xl font-black text-foreground mb-2 uppercase">Registry Empty</h3>
                  <p className="text-sm text-muted-foreground max-w-[240px] mx-auto mb-8 font-medium">
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

        <div className="space-y-8">
          <Card className="bg-foreground text-background border-none shadow-2xl rounded-[2.5rem] overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-700">
              <ShieldCheck className="h-32 w-32" />
            </div>
            <CardHeader className="p-10 relative z-10">
              <CardTitle className="text-2xl font-black">Action Center</CardTitle>
              <CardDescription className="text-background/50 font-bold text-xs">Mission critical system tools.</CardDescription>
            </CardHeader>
            <CardContent className="p-10 pt-0 relative z-10 space-y-4">
              <Button asChild variant="outline" className="w-full h-14 rounded-2xl bg-background/5 border-background/10 hover:bg-background hover:text-foreground font-black transition-all group/btn">
                <Link href="/reports">
                  <History className="mr-2 h-5 w-5 group-hover/btn:rotate-12 transition-transform" />
                  ACCESS ARCHIVES
                </Link>
              </Button>
              {isAdmin && (
                <Button asChild variant="outline" className="w-full h-14 rounded-2xl bg-background/5 border-background/10 hover:bg-background hover:text-foreground font-black transition-all group/btn">
                  <Link href="/users">
                    <UserCog className="mr-2 h-5 w-5 group-hover/btn:rotate-12 transition-transform" />
                    MANAGE PERSONNEL
                  </Link>
                </Button>
              )}
              {(isAdmin || isCommander || isLeader) && (
                <div className="pt-6 border-t border-background/5 mt-6">
                  <div className="bg-primary/20 border border-primary/30 p-5 rounded-3xl space-y-4">
                    <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5 text-primary" />
                      <span className="text-[10px] font-black uppercase text-background tracking-widest">Executive AI Tool</span>
                    </div>
                    <p className="text-xs text-background/70 font-medium leading-relaxed">Consolidate multiple logs into a strategic weekly summary.</p>
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
    </div>
  );
}
