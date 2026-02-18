"use client";

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, where } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { FileText, PlusCircle, ChevronLeft, Calendar, User, ArrowRight, Loader2 } from 'lucide-react';

export default function ReportsList() {
  const router = useRouter();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();

  const reportsQuery = useMemoFirebase(() => {
    // CRITICAL: Only construct the query if the user's auth state is resolved AND they are logged in.
    if (!db || isUserLoading || !user) return null;
    
    return query(
      collection(db, 'reports'),
      where('ownerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
  }, [db, user?.uid, isUserLoading]);

  const { data: reports, isLoading: isReportsLoading } = useCollection(reportsQuery);

  const isLoading = isUserLoading || isReportsLoading;

  return (
    <div className="min-h-screen bg-background pb-12">
      <header className="border-b bg-white px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/')}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Dashboard
          </Button>
          <h1 className="text-xl font-bold text-primary">Report History</h1>
        </div>
        <Button size="sm" onClick={() => router.push('/daily/new')}>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Report
        </Button>
      </header>

      <main className="max-w-5xl mx-auto mt-8 px-6 space-y-6">
        <section className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold tracking-tight">Your Reports</h2>
          <p className="text-muted-foreground">View and manage all your generated operational reports.</p>
        </section>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground animate-pulse">Fetching your reports...</p>
          </div>
        ) : reports && reports.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => (
              <Card key={report.id} className="hover:shadow-md transition-all cursor-pointer group border-primary/5" onClick={() => router.push(`/reports/${report.id}`)}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start mb-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-green-100 text-green-700">
                      {report.status}
                    </span>
                  </div>
                  <CardTitle className="text-lg line-clamp-2 leading-snug">
                    {report.reportTitle}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    {report.reportDate}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User className="h-3.5 w-3.5" />
                    {report.reportingCommanderName}
                  </div>
                  <div className="pt-4 flex justify-end">
                    <Button variant="ghost" size="sm" className="text-primary group-hover:translate-x-1 transition-transform">
                      View Report <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-white rounded-xl border border-dashed flex flex-col items-center gap-4">
            <div className="p-4 bg-muted rounded-full">
              <FileText className="h-12 w-12 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">No reports found</h3>
              <p className="text-muted-foreground text-sm">You haven't generated any daily reports yet.</p>
            </div>
            <Button onClick={() => router.push('/daily/new')}>Create your first report</Button>
          </div>
        )}
      </main>
    </div>
  );
}