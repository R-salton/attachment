"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { FileText, Calendar, PlusCircle, History, LogIn, LogOut, User, Loader2, ArrowRight } from 'lucide-react';
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

  // Fetch the 5 most recent reports for the dashboard
  const recentReportsQuery = useMemoFirebase(() => {
    if (!db || isUserLoading || !user) return null;
    return query(
      collection(db, 'reports'),
      where('ownerId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
  }, [db, user?.uid, isUserLoading]);

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
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="border-b bg-white px-6 py-4 flex items-center justify-between sticky top-0 z-50">
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
                  <div className="hidden md:flex flex-col items-end">
                    <span className="text-xs font-medium text-muted-foreground">Logged in as</span>
                    <span className="text-sm font-bold text-primary truncate max-w-[150px]">{user.email || 'Anonymous User'}</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleSignOut}>
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
        {/* Header */}
        <section className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Operations Dashboard</h1>
          <p className="text-muted-foreground text-lg">Streamlined report generation for cadets and operational units.</p>
        </section>

        {/* Quick Actions */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-md transition-shadow cursor-pointer group">
            <Link href="/daily/new" className="block p-6">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <PlusCircle className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Create Daily Report</h3>
              <p className="text-sm text-muted-foreground">Log daily activities, cases, and unit operations for internal filing.</p>
            </Link>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer group">
            <Link href="/weekly/new" className="block p-6">
              <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                <Calendar className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Weekly Summary</h3>
              <p className="text-sm text-muted-foreground">Consolidate daily reports into a comprehensive weekly overview using GenAI.</p>
            </Link>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer group">
            <Link href="/reports" className="block p-6">
              <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center mb-4 group-hover:bg-secondary/80 transition-colors">
                <History className="h-6 w-6 text-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Report History</h3>
              <p className="text-sm text-muted-foreground">Review and export previously generated reports for auditing and review.</p>
            </Link>
          </Card>
        </section>

        {/* Recent Reports Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Recent Reports</CardTitle>
              <CardDescription>Your 5 most recently generated operational reports.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isReportsLoading ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <p className="text-xs text-muted-foreground">Loading reports...</p>
                  </div>
                ) : reports && reports.length > 0 ? (
                  reports.map((report) => (
                    <div key={report.id} className="flex items-center justify-between p-3 rounded-lg bg-white border border-border/50 shadow-sm hover:border-primary/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-muted rounded-md">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm truncate max-w-[150px] md:max-w-[200px]">{report.reportTitle}</p>
                          <p className="text-xs text-muted-foreground">{report.reportDate} • {report.reportingCommanderName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${report.status === 'SUBMITTED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {report.status}
                        </span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 px-2 text-xs"
                          onClick={() => router.push(`/reports/${report.id}`)}
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10">
                    <p className="text-sm text-muted-foreground mb-4">No recent reports found.</p>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/daily/new">Create Report</Link>
                    </Button>
                  </div>
                )}
              </div>
              {reports && reports.length > 0 && (
                <div className="mt-4 flex justify-center border-t pt-4">
                  <Button variant="link" size="sm" asChild className="text-primary">
                    <Link href="/reports">
                      View All Reports <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-primary text-white overflow-hidden relative">
            <CardHeader className="relative z-10">
              <CardTitle className="text-white">Reporting Guidelines</CardTitle>
              <CardDescription className="text-primary-foreground/70">Ensuring consistent and accurate operational documentation.</CardDescription>
            </CardHeader>
            <CardContent className="relative z-10 space-y-4">
              <p className="text-sm opacity-90">
                Always include security situation status (e.g., Calm), deployment times, and specific case counts for all DPUs. Use the "Other Activities" section for incidents outside the standard unit logs.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-white/10 rounded-lg border border-white/20">
                  <p className="text-xs font-bold uppercase mb-1">Accuracy</p>
                  <p className="text-[10px] opacity-80">Double-check case counts for Nyarugenge and Fox units.</p>
                </div>
                <div className="p-3 bg-white/10 rounded-lg border border-white/20">
                  <p className="text-xs font-bold uppercase mb-1">Format</p>
                  <p className="text-[10px] opacity-80">Follow the military reporting hierarchy provided.</p>
                </div>
              </div>
            </CardContent>
            {/* Decorative background element */}
            <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-accent/20 rounded-full blur-3xl"></div>
          </Card>
        </section>
      </main>

      <footer className="border-t bg-white px-6 py-8 text-center">
        <p className="text-sm text-muted-foreground">© 2026 Report Master Systems. For official use only.</p>
      </footer>
    </div>
  );
}
