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
  Calendar,
  Search,
  Filter,
  User,
  Clock
} from 'lucide-react';
import { useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { collection, query, orderBy, limit, where } from 'firebase/firestore';
import { useUserProfile } from '@/hooks/use-user-profile';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

const UNITS = [
  { id: "Gasabo DPU", name: "Gasabo DPU", color: "bg-blue-600" },
  { id: "Kicukiro DPU", name: "Kicukiro DPU", color: "bg-blue-700" },
  { id: "Nyarugenge DPU", name: "Nyarugenge DPU", color: "bg-blue-800" },
  { id: "TRS", name: "TRS", color: "bg-slate-800" },
  { id: "SIF", name: "SIF", color: "bg-slate-700" },
  { id: "TFU", name: "TFU", color: "bg-slate-900" },
  { id: "ORDERLY REPORT", name: "ORDERLY REPORT", color: "bg-blue-500" },
];

export default function Home() {
  const db = useFirestore();
  const router = useRouter();
  const { isAdmin, isCommander, isLeader, profile, isLoading, user } = useUserProfile();

  const [searchTerm, setSearchTerm] = useState('');
  const [unitFilter, setUnitFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');

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

  const filteredReports = reports?.filter(r => {
    const matchesSearch = r.reportTitle?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUnit = unitFilter === 'ALL' || r.unit === unitFilter;
    const matchesDate = !dateFilter || r.reportDate?.toLowerCase().includes(dateFilter.toLowerCase());
    return matchesSearch && matchesUnit && matchesDate;
  });

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
          <div className="bg-slate-900 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock className="text-white h-8 w-8" />
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-foreground mb-4">Secure Gateway</h1>
          <p className="text-muted-foreground mb-8 leading-relaxed text-sm md:text-base">Authorized personnel must authenticate with official credentials to access operational data.</p>
          <Button size="lg" className="w-full h-14 rounded-2xl font-bold text-lg bg-slate-900 hover:bg-slate-800" onClick={() => router.push('/login')}>
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
            <ShieldCheck className="h-4 w-4 text-blue-600" />
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">Secure Protocol Active</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-slate-900 leading-none">
            {isAdmin || isCommander || isLeader ? 'Command Registry' : `Operational Feed`}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="bg-slate-900 text-white font-bold px-3 py-1 text-[10px] rounded-lg shadow-sm uppercase">
              ROLE: <span className="text-blue-400 ml-1">{profile?.role || 'User'}</span>
            </Badge>
            <Badge variant="secondary" className="bg-white border-slate-200 text-slate-600 font-bold px-3 py-1 text-[10px] rounded-lg shadow-sm uppercase">
              UNIT: <span className="text-slate-900 ml-1">{profile?.unit || 'Station'}</span>
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild className="h-12 rounded-xl font-black shadow-xl shadow-blue-600/20 px-8 bg-blue-600 hover:bg-blue-700">
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
            <Navigation className="h-4 w-4 text-blue-600" />
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Unit Repositories</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
            {UNITS.map((unit) => (
              <Link key={unit.id} href={`/reports/unit/${unit.id}`}>
                <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border border-slate-200 shadow-sm cursor-pointer group overflow-hidden bg-white">
                  <div className={`h-1 w-full ${unit.color}`} />
                  <CardHeader className="p-4 space-y-2">
                    <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      {unit.id === "ORDERLY REPORT" ? <FileText className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                    </div>
                    <CardTitle className="text-[10px] font-black uppercase tracking-tight truncate text-slate-900">{unit.name}</CardTitle>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <Card className="lg:col-span-3 border border-slate-200 shadow-2xl rounded-[2.5rem] bg-white overflow-hidden flex flex-col">
          <CardHeader className="p-8 pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1">
                <CardTitle className="text-2xl font-black text-slate-900 flex items-center gap-2">
                  <Activity className="h-6 w-6 text-blue-600" />
                  Registry Activity
                </CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Real-time operational situational awareness.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild className="font-black text-blue-600 hover:bg-blue-50 rounded-xl">
                  <Link href="/reports" className="flex items-center gap-1.5 text-xs">
                    Full Archive <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* In-Line Filters */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input 
                  placeholder="Filter logs..." 
                  className="pl-9 h-10 rounded-xl bg-white border-slate-200 text-xs font-bold"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 z-10" />
                <Select value={unitFilter} onValueChange={setUnitFilter}>
                  <SelectTrigger className="pl-9 h-10 rounded-xl bg-white border-slate-200 text-xs font-bold">
                    <SelectValue placeholder="All Units" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Units</SelectItem>
                    {UNITS.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input 
                  placeholder="e.g. 18 FEB 26" 
                  className="pl-9 h-10 rounded-xl bg-white border-slate-200 text-xs font-bold"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="px-8 pb-10 flex-1 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {isReportsLoading ? (
                <div className="col-span-full py-20 flex flex-col items-center gap-4">
                  <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Records...</span>
                </div>
              ) : filteredReports && filteredReports.length > 0 ? (
                filteredReports.map((report) => (
                  <div 
                    key={report.id} 
                    onClick={() => router.push(`/reports/view/${report.id}`)}
                    className="group relative flex flex-col p-5 rounded-2xl bg-white hover:bg-slate-50 transition-all border border-slate-100 hover:border-blue-600 hover:shadow-2xl cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Badge className="text-[8px] font-black px-2 py-0.5 bg-blue-600 text-white uppercase tracking-widest border-none">
                        {report.unit}
                      </Badge>
                      <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                        <Calendar className="h-3 w-3" />
                        {report.reportDate}
                      </div>
                    </div>
                    <h4 className="font-black text-slate-900 text-sm line-clamp-1 mb-2 group-hover:text-blue-600 transition-colors uppercase tracking-tight">
                      {report.reportTitle}
                    </h4>
                    
                    {report.createdAt && (
                      <div className="flex items-center gap-1.5 text-[8px] font-bold text-slate-400 uppercase tracking-tighter mb-4">
                        <Clock className="h-2.5 w-2.5" />
                        Filed: {report.createdAt.toDate ? report.createdAt.toDate().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'Processing...'}
                      </div>
                    )}

                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-lg bg-slate-900 text-blue-400 flex items-center justify-center text-[9px] font-black border border-slate-800">
                          {report.reportingCommanderName?.charAt(0)}
                        </div>
                        <span className="text-[10px] font-bold text-slate-600 truncate max-w-[100px]">{report.reportingCommanderName}</span>
                      </div>
                      <Eye className="h-4 w-4 text-slate-300 group-hover:text-blue-600 transition-colors" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-20 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                  <div className="bg-white h-12 w-12 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <ShieldAlert className="h-6 w-6 text-slate-200" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mb-1 uppercase">No Records Found</h3>
                  <Button asChild variant="outline" size="sm" className="rounded-xl font-bold border-slate-200">
                    <Link href="/daily/new">File First Report</Link>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-1">
          <Card className="bg-slate-900 text-white border-none shadow-2xl rounded-[2.5rem] overflow-hidden relative group">
            <CardHeader className="p-8">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-blue-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">Terminal Access</span>
              </div>
              <CardTitle className="text-2xl font-black tracking-tight">Command Center</CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-4">
              <Button asChild className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 font-black text-xs shadow-lg shadow-blue-600/20">
                <Link href="/daily/new">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  NEW SITREP
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full h-12 rounded-xl bg-white/5 border-white/10 hover:bg-white hover:text-slate-900 font-black text-xs">
                <Link href="/reports">
                  <History className="mr-2 h-4 w-4" />
                  ACCESS ARCHIVES
                </Link>
              </Button>
              
              <div className="pt-6 border-t border-white/10 mt-6">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-relaxed">
                  Authorized access only. All actions are logged and encrypted within the command registry.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
