'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Users, 
  FileDown, 
  Loader2, 
  Trash2, 
  ArrowLeft, 
  Search, 
  Filter, 
  ShieldCheck,
  Building2,
  ListFilter,
  MapPin
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/hooks/use-user-profile';
import { exportVisitorsToExcel } from '@/lib/visitor-export';

const PLATOONS = ["A1", "A2", "A3", "B1", "B2", "B3", "C1", "C2", "C3"];

export default function VisitorManagement() {
  const router = useRouter();
  const { toast } = useToast();
  const db = useFirestore();
  const { isAdmin, isPTSLeadership, isLoading: isAuthLoading } = useUserProfile();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [platoonFilter, setPlatoonFilter] = useState('ALL');
  const [isExporting, setIsExporting] = useState(false);

  const responsesQuery = useMemoFirebase(() => {
    if (!db || !(isAdmin || isPTSLeadership)) return null;
    return query(collection(db, 'visitor_responses'), orderBy('createdAt', 'desc'));
  }, [db, isAdmin, isPTSLeadership]);

  const { data: responses, isLoading: isDataLoading } = useCollection(responsesQuery);

  const filteredResponses = useMemo(() => {
    if (!responses) return [];
    return responses.filter(r => {
      const matchesSearch = r.cadetName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPlatoon = platoonFilter === 'ALL' || r.platoon === platoonFilter;
      return matchesSearch && matchesPlatoon;
    });
  }, [responses, searchTerm, platoonFilter]);

  const handleExport = async (platoon: string = 'ALL') => {
    const dataToExport = platoon === 'ALL' 
      ? filteredResponses 
      : filteredResponses.filter(r => r.platoon === platoon);

    if (dataToExport.length === 0) {
      toast({ variant: "destructive", title: "No Data", description: "No responses available for this platoon." });
      return;
    }

    setIsExporting(true);
    try {
      await exportVisitorsToExcel(dataToExport, platoon);
      toast({ title: "Registry Generated", description: `Excel archive for ${platoon} is ready.` });
    } catch (e) {
      toast({ variant: "destructive", title: "Export Failed", description: "Could not generate Excel file." });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!db) return;
    try {
      await deleteDoc(doc(db, 'visitor_responses', id));
      toast({ title: "Record Purged", description: "Entry removed from registry." });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Could not remove entry." });
    }
  };

  if (isAuthLoading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;

  if (!isAdmin && !isPTSLeadership) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <ShieldCheck className="h-20 w-20 text-slate-200 mb-6" />
        <h2 className="text-3xl font-black uppercase text-slate-900">Access Unauthorized</h2>
        <Button onClick={() => router.push('/')} className="mt-8 rounded-2xl h-14 px-12 font-black shadow-xl shadow-primary/20">Return Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#f8fafc] pb-32">
      <header className="border-b bg-white/95 backdrop-blur-md px-4 md:px-8 py-4 flex flex-col sm:flex-row items-center justify-between sticky top-0 z-50 shadow-sm gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 shadow-sm transition-all">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-0.5">
              <Users className="h-3 w-3 text-primary" />
              <span className="text-[8px] font-black uppercase tracking-widest text-primary">PTS Visitor Terminal</span>
            </div>
            <h1 className="text-lg md:text-xl font-black tracking-tight text-slate-900 leading-none uppercase">Visitor Management</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button 
            disabled={isExporting || filteredResponses.length === 0} 
            onClick={() => handleExport(platoonFilter)}
            className="flex-1 sm:flex-none rounded-xl h-11 px-6 font-black shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-xs transition-all active:scale-95"
          >
            {isExporting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <FileDown className="mr-2 h-4 w-4" />}
            {platoonFilter === 'ALL' ? 'ARCHIVE ALL' : `ARCHIVE ${platoonFilter}`}
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto mt-8 px-4 md:px-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 border-none shadow-2xl rounded-3xl bg-white overflow-hidden">
            <CardHeader className="bg-slate-900 text-white p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2 uppercase tracking-tighter">
                    <ListFilter className="h-5 w-5 text-primary" />
                    Strategic Registry
                  </CardTitle>
                  <CardDescription className="text-slate-400 font-bold text-xs mt-1">Audit trail for {filteredResponses.length} officer cadet registrations.</CardDescription>
                </div>
                <div className="flex gap-2">
                   <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                      <Input 
                        placeholder="Cadet Name..." 
                        className="pl-9 h-9 w-48 rounded-lg bg-slate-800 border-none text-xs font-bold text-white placeholder:text-slate-600"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                      />
                   </div>
                   <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 z-10" />
                      <select 
                        value={platoonFilter}
                        onChange={e => setPlatoonFilter(e.target.value)}
                        className="pl-9 pr-4 h-9 rounded-lg bg-slate-800 border-none text-xs font-bold text-white appearance-none outline-none focus:ring-1 focus:ring-primary min-w-[100px]"
                      >
                        <option value="ALL">ALL PLTS</option>
                        {PLATOONS.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                   </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {isDataLoading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-4">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Registry...</span>
                </div>
              ) : filteredResponses.length > 0 ? (
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest">Officer Cadet</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest">Platoon</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest">Visitors & Location</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest">Registry Date</TableHead>
                      <TableHead className="text-right font-black text-[10px] uppercase tracking-widest">Audit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredResponses.map((res) => (
                      <TableRow key={res.id} className="hover:bg-slate-50/50 transition-colors">
                        <TableCell className="font-black text-slate-900 uppercase text-xs">{res.cadetName}</TableCell>
                        <TableCell><Badge variant="outline" className="font-black text-[10px] border-primary/20 text-primary">{res.platoon}</Badge></TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-2 py-2">
                            <div className="space-y-1">
                              <span className="text-[10px] font-black text-slate-900 uppercase">1. {res.visitor1.fullName}</span>
                              <div className="flex items-center gap-1.5 text-[8px] font-bold text-slate-400 uppercase">
                                <MapPin className="h-2.5 w-2.5" /> {res.visitor1.district} / {res.visitor1.sector}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] font-black text-slate-900 uppercase">2. {res.visitor2.fullName}</span>
                              <div className="flex items-center gap-1.5 text-[8px] font-bold text-slate-400 uppercase">
                                <MapPin className="h-2.5 w-2.5" /> {res.visitor2.district} / {res.visitor2.sector}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-[10px] font-bold text-slate-400 uppercase">
                          {res.createdAt?.toDate ? res.createdAt.toDate().toLocaleDateString('en-GB') : 'Processing'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(res.id)} className="h-8 w-8 text-slate-300 hover:text-red-500 rounded-lg">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-32 text-center space-y-4">
                  <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto border shadow-inner">
                    <Users className="h-8 w-8 text-slate-200" />
                  </div>
                  <p className="text-xs font-black uppercase text-slate-400 tracking-widest">Registry Empty</p>
                </div>
              )}
            </CardContent>
          </Card>

          <aside className="space-y-6">
             <Card className="bg-slate-900 text-white border-none shadow-2xl rounded-3xl overflow-hidden relative group">
                <CardHeader className="p-8">
                  <CardTitle className="text-xl font-black uppercase tracking-tight">Platoon Archive</CardTitle>
                  <CardDescription className="text-slate-400 font-bold text-xs mt-1">Download specific platoon registry sheets.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-0 grid grid-cols-3 gap-2">
                  {PLATOONS.map(p => (
                    <Button 
                      key={p} 
                      variant="outline" 
                      onClick={() => handleExport(p)}
                      className="h-10 bg-white/5 border-white/10 hover:bg-white hover:text-slate-900 font-black text-[10px] transition-all rounded-lg"
                    >
                      {p}
                    </Button>
                  ))}
                </CardContent>
             </Card>

             <Card className="border-none shadow-xl rounded-3xl bg-white p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <h4 className="font-black text-slate-900 uppercase tracking-tight text-sm">Registry Status</h4>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-500 uppercase tracking-widest">Total Filed</span>
                    <span className="font-black text-slate-900">{responses?.length || 0}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${Math.min(100, (responses?.length || 0) / 3)}%` }} />
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-tighter">
                    Authorized Command Access Only. Mission-critical data is logged.
                  </p>
                </div>
             </aside>
        </div>
      </main>
    </div>
  );
}
