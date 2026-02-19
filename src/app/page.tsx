"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { FileText, Calendar, PlusCircle, History, LogIn, LogOut, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';
import { useUser, useAuth, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { collection, query, orderBy, where, limit } from 'firebase/firestore';

export default function Home() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const recentReportsQuery = useMemoFirebase(() => {
    // CRITICAL: Only construct the query if the user is explicitly authenticated.
    // This prevents the 'Missing or insufficient permissions' error on initial load.
    if (!user || !db) return null;
    
    return query(
      collection(db, 'reports'),
      where('ownerId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
  }, [db, user?.uid]);

  const { data: reports, isLoading: isReportsLoading } = useCollection(recentReportsQuery);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast({ title: "Signed out", description: "You have been successfully signed out." });
      router.refresh();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to sign out." });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <nav className="border-b bg-white px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-primary w-10 h-10 rounded-lg flex items-center justify-center">
            <FileText className="text-white w-6 h-6" />
          </div>
          <span className="text-xl font-bold tracking-tight text-primary">Report Master</span>
        </div>
        <div className="flex items-center gap-4">
          {!isUserLoading && (
            <>
              {user ? (
                <div className="flex items-center gap-4">
                  <div className="hidden md:flex flex-col items-end text-right">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Active Duty</span>
                    <span className="text-xs font-semibold text-primary truncate max-w-[150px]">{user.email || 'Cadet'}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-muted-foreground hover:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              ) : (
                <Button size="sm" asChild variant="outline">
                  <Link href="/login">
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign In
                  </Link>
                </Button>
              )}
            </>
          )}
          <Button size="sm" asChild className="bg-primary hover:bg-primary/90">
            <Link href="/daily/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Report
            </Link>
          </Button>
        </div>
      </nav>

      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full space-y-8">
        <section className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Operations Command</h1>
          <p className="text-slate-500 text-lg">Centralized operational reporting and GenAI consolidation.</p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-all border-none shadow-sm group">
            <Link href="/daily/new" className="block p-6">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <PlusCircle className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Create Report</h3>
              <p className="text-sm text-slate-500">Document daily deployments, cases, and unit status for the command hierarchy.</p>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-all border-none shadow-sm group">
            <Link href="/weekly/new" className="block p-6">
              <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Calendar className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-bold mb-2">Weekly Summary</h3>
              <p className="text-sm text-slate-500">Use AI to synthesize multiple daily logs into a high-level weekly executive summary.</p>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-all border-none shadow-sm group">
            <Link href="/reports" className="block p-6">
              <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <History className="h-6 w-6 text-slate-700" />
              </div>
              <h3 className="text-xl font-bold mb-2">Archive</h3>
              <p className="text-sm text-slate-500">Access and export previously filed reports for historical review and audit trails.</p>
            </Link>
          </Card>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Filing</CardTitle>
                <CardDescription>Your last 5 operational reports.</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/reports">View All</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isReportsLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-xs text-muted-foreground">Retrieving secure data...</p>
                  </div>
                ) : user ? (
                  reports && reports.length > 0 ? (
                    reports.map((report) => (
                      <div key={report.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-transparent hover:border-primary/20 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="p-2.5 bg-white rounded-lg shadow-sm">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex flex-col">
                            <p className="font-bold text-sm text-slate-900 truncate max-w-[180px] md:max-w-[240px]">{report.reportTitle}</p>
                            <p className="text-[11px] text-slate-500 font-medium">{report.reportDate} • By {report.reportingCommanderName}</p>
                          </div>
                        </div>
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="h-9 px-4 font-semibold"
                          asChild
                        >
                          <Link href={`/reports/${report.id}`}>Review</Link>
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-sm text-muted-foreground mb-4">No reports filed yet.</p>
                      <Button variant="default" size="sm" asChild>
                        <Link href="/daily/new">Start First Report</Link>
                      </Button>
                    </div>
                  )
                ) : (
                  <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed">
                    <p className="text-sm text-slate-500 mb-4">Sign in to view your operational reports.</p>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/login">Authenticate</Link>
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 text-white overflow-hidden relative border-none shadow-xl">
            <CardHeader className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Security Protocol</span>
              </div>
              <CardTitle className="text-white text-2xl">Standard Operating Procedures</CardTitle>
              <CardDescription className="text-slate-400">Ensure all reports adhere to the following command guidelines.</CardDescription>
            </CardHeader>
            <CardContent className="relative z-10 space-y-6">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0 text-xs font-bold">01</div>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    All case counts must be verified by the DPU Duty Officer before submission.
                  </p>
                </div>
                <div className="flex gap-4">
                  <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0 text-xs font-bold">02</div>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    'Other Activities' should capture any non-routine interactions or incidents.
                  </p>
                </div>
              </div>
              
              <div className="pt-4 border-t border-slate-800">
                <p className="text-[10px] text-slate-500 font-mono italic">
                  Systems encryption active. All data is archived for official review only.
                </p>
              </div>
            </CardContent>
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-primary/20 rounded-full blur-[80px]"></div>
          </Card>
        </section>
      </main>

      <footer className="border-t bg-white px-6 py-8 text-center mt-auto">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">© 2026 Report Master Command Systems</p>
      </footer>
    </div>
  );
}