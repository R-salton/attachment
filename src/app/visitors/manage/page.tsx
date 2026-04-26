'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Users, 
  FileDown, 
  Loader2, 
  Trash2, 
  ArrowLeft, 
  Search, 
  ShieldCheck,
  Building2,
  ListFilter,
  MapPin,
  Edit3,
  Save,
  Phone,
  Baby,
  Accessibility
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/hooks/use-user-profile';
import { exportVisitorsToExcel } from '@/lib/visitor-export';
import { recordLog } from '@/lib/logger';

const PLATOONS = ["A1", "A2", "A3", "B1", "B2", "B3", "C1", "C2", "C3"];

export default function VisitorManagement() {
  const router = useRouter();
  const { toast } = useToast();
  const db = useFirestore();
  const { isAdmin, isPTSLeadership, profile, user, isLoading: isAuthLoading } = useUserProfile();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [platoonFilter, setPlatoonFilter] = useState('ALL');
  const [isExporting, setIsExporting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Edit State
  const [editingRecord, setEditingRecord] = useState<any | null>(null);

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

  const handleDelete = async (id: string, name: string) => {
    if (!db || !user) return;
    try {
      await deleteDoc(doc(db, 'visitor_responses', id));
      recordLog(db, {
        userId: user.uid,
        userName: profile?.displayName || 'Admin',
        action: 'VISITOR_PURGE',
        details: `Deleted visitor registry for OC ${name}`
      });
      toast({ title: "Record Purged", description: "Entry removed from registry." });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Could not remove entry." });
    }
  };

  const handleUpdateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !editingRecord || !user) return;

    setIsUpdating(true);
    try {
      const docRef = doc(db, 'visitor_responses', editingRecord.id);
      await updateDoc(docRef, {
        cadetName: editingRecord.cadetName.toUpperCase(),
        platoon: editingRecord.platoon,
        visitor1: editingRecord.visitor1,
        visitor2: editingRecord.visitor2
      });

      recordLog(db, {
        userId: user.uid,
        userName: profile?.displayName || 'Admin',
        action: 'VISITOR_UPDATE',
        details: `Refined visitor data for OC ${editingRecord.cadetName}`
      });

      toast({ title: "Registry Updated", description: "Record revisions have been committed." });
      setEditingRecord(null);
    } catch (e) {
      toast({ variant: "destructive", title: "Update Failed", description: "Could not save revisions." });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleVisitorEditChange = (visitorKey: 'visitor1' | 'visitor2', field: string, value: string) => {
    if (!editingRecord) return;
    setEditingRecord({
      ...editingRecord,
      [visitorKey]: { ...editingRecord[visitorKey], [field]: value }
    });
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
        <div className="flex flex-col md:flex-row gap-6">
          <Card className="flex-1 border-none shadow-2xl rounded-3xl bg-white overflow-hidden">
            <CardHeader className="bg-slate-900 text-white p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2 uppercase tracking-tighter">
                    <ListFilter className="h-5 w-5 text-primary" />
                    Archive Preview
                  </CardTitle>
                  <CardDescription className="text-slate-400 font-bold text-xs mt-1">Found {filteredResponses.length} officer cadet registrations matching current filters.</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                   <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                      <Input 
                        placeholder="Search by cadet name..." 
                        className="pl-9 h-9 w-full md:w-56 rounded-lg bg-slate-800 border-none text-xs font-bold text-white placeholder:text-slate-600"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                      />
                   </div>
                   <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 z-10" />
                      <select 
                        value={platoonFilter}
                        onChange={e => setPlatoonFilter(e.target.value)}
                        className="pl-9 pr-4 h-9 rounded-lg bg-slate-800 border-none text-xs font-bold text-white appearance-none outline-none focus:ring-1 focus:ring-primary min-w-[120px]"
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
                      <TableHead className="font-black text-[10px] uppercase tracking-widest">Visitors Details</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest">Registry Date</TableHead>
                      <TableHead className="text-right font-black text-[10px] uppercase tracking-widest">Controls</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredResponses.map((res) => (
                      <TableRow key={res.id} className="hover:bg-slate-50/50 transition-colors">
                        <TableCell className="font-black text-slate-900 uppercase text-xs">{res.cadetName}</TableCell>
                        <TableCell><Badge variant="outline" className="font-black text-[10px] border-primary/20 text-primary">{res.platoon}</Badge></TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-3 py-3">
                            {[res.visitor1, res.visitor2].map((v, i) => (
                              <div key={i} className="space-y-1 group/v">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-black text-slate-900 uppercase">{i + 1}. {v.fullName}</span>
                                  <Badge variant="ghost" className="h-4 text-[7px] font-bold text-slate-400 px-1 border border-slate-100">{v.age} Yrs</Badge>
                                </div>
                                <div className="flex flex-col gap-0.5 pl-3 border-l-2 border-slate-100">
                                  <div className="flex items-center gap-1.5 text-[8px] font-bold text-slate-400 uppercase">
                                    <MapPin className="h-2.5 w-2.5 text-primary" /> {v.district} / {v.sector} / {v.cell} / {v.village}
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-[8px] font-bold text-slate-500 uppercase flex items-center gap-1"><Phone className="h-2 w-2" /> {v.telephone}</span>
                                    <span className="text-[8px] font-bold text-slate-500 uppercase">{v.profession}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-[10px] font-bold text-slate-400 uppercase">
                          {res.createdAt?.toDate ? res.createdAt.toDate().toLocaleDateString('en-GB') : 'Processing'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => setEditingRecord(res)} className="h-8 w-8 text-slate-400 hover:text-primary rounded-lg">
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(res.id, res.cadetName)} className="h-8 w-8 text-slate-300 hover:text-red-500 rounded-lg">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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
                  <p className="text-xs font-black uppercase text-slate-400 tracking-widest">Registry Empty or No Match</p>
                </div>
              )}
            </CardContent>
          </Card>

          <aside className="w-full md:w-80 space-y-6">
             <Card className="bg-slate-900 text-white border-none shadow-2xl rounded-3xl overflow-hidden relative group">
                <CardHeader className="p-8">
                  <CardTitle className="text-xl font-black uppercase tracking-tight">Quick Archive</CardTitle>
                  <CardDescription className="text-slate-400 font-bold text-xs mt-1">Download platoon-specific Excel registry sheets.</CardDescription>
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
                  <h4 className="font-black text-slate-900 uppercase tracking-tight text-sm">Registry Health</h4>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-500 uppercase tracking-widest">Registry Entries</span>
                    <span className="font-black text-slate-900">{responses?.length || 0}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${Math.min(100, (responses?.length || 0) / 3)}%` }} />
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-tighter">
                    Authorized command access is strictly monitored. All administrative updates are logged for auditing.
                  </p>
                </div>
             </Card>
          </aside>
        </div>
      </main>

      {/* Edit Record Dialog */}
      <Dialog open={!!editingRecord} onOpenChange={(open) => !open && setEditingRecord(null)}>
        <DialogContent className="max-w-[95vw] md:max-w-4xl max-h-[90vh] overflow-y-auto p-0 border-none rounded-[2rem]">
          {editingRecord && (
            <form onSubmit={handleUpdateRecord}>
              <header className="bg-slate-900 text-white p-8">
                <DialogHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Edit3 className="h-4 w-4 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Registry Revision Terminal</span>
                  </div>
                  <DialogTitle className="text-2xl font-black uppercase tracking-tight">Revise OC {editingRecord.cadetName}</DialogTitle>
                  <DialogDescription className="text-slate-400 font-bold text-xs">Commit verified adjustments to the visitor registry.</DialogDescription>
                </DialogHeader>
              </header>

              <div className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500">Cadet Full Name</Label>
                    <Input 
                      value={editingRecord.cadetName} 
                      onChange={e => setEditingRecord({...editingRecord, cadetName: e.target.value})}
                      className="h-11 rounded-xl bg-slate-50 font-bold uppercase"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500">Platoon</Label>
                    <select 
                      value={editingRecord.platoon}
                      onChange={e => setEditingRecord({...editingRecord, platoon: e.target.value})}
                      className="w-full h-11 rounded-xl bg-slate-50 border-slate-200 px-3 font-bold"
                    >
                      {PLATOONS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {/* Visitor 1 & 2 Columns */}
                  {['visitor1', 'visitor2'].map((vKey, i) => (
                    <div key={vKey} className="space-y-6">
                      <div className="flex items-center gap-3 border-b border-slate-100 pb-2">
                        <div className="h-6 w-6 rounded-lg bg-primary text-white flex items-center justify-center text-[10px] font-black">{i + 1}</div>
                        <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">Visitor {i + 1}</h3>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <Label className="text-[9px] font-black text-slate-400 uppercase">Full Identity</Label>
                          <Input 
                            value={editingRecord[vKey].fullName} 
                            onChange={e => handleVisitorEditChange(vKey as any, 'fullName', e.target.value)}
                            className="h-10 rounded-lg text-xs font-bold"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-[9px] font-black text-slate-400 uppercase">NID Number</Label>
                            <Input 
                              value={editingRecord[vKey].idNumber} 
                              onChange={e => handleVisitorEditChange(vKey as any, 'idNumber', e.target.value)}
                              className="h-10 rounded-lg text-xs font-bold"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[9px] font-black text-slate-400 uppercase">Telephone</Label>
                            <Input 
                              value={editingRecord[vKey].telephone} 
                              onChange={e => handleVisitorEditChange(vKey as any, 'telephone', e.target.value)}
                              className="h-10 rounded-lg text-xs font-bold"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-3 bg-slate-50 p-4 rounded-xl">
                          <Label className="text-[9px] font-black text-primary uppercase flex items-center gap-1.5"><MapPin className="h-3 w-3" /> Location Breakdown</Label>
                          <div className="grid grid-cols-2 gap-3">
                            <Input value={editingRecord[vKey].district} onChange={e => handleVisitorEditChange(vKey as any, 'district', e.target.value)} placeholder="District" className="h-9 text-[10px] font-bold bg-white" />
                            <Input value={editingRecord[vKey].sector} onChange={e => handleVisitorEditChange(vKey as any, 'sector', e.target.value)} placeholder="Sector" className="h-9 text-[10px] font-bold bg-white" />
                            <Input value={editingRecord[vKey].cell} onChange={e => handleVisitorEditChange(vKey as any, 'cell', e.target.value)} placeholder="Cell" className="h-9 text-[10px] font-bold bg-white" />
                            <Input value={editingRecord[vKey].village} onChange={e => handleVisitorEditChange(vKey as any, 'village', e.target.value)} placeholder="Village" className="h-9 text-[10px] font-bold bg-white" />
                          </div>
                        </div>

                        <div className="space-y-3 pt-2">
                           <div className="space-y-1.5">
                            <Label className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1"><Baby className="h-3 w-3" /> Accompanied Ages</Label>
                            <Input value={editingRecord[vKey].childBelow6} onChange={e => handleVisitorEditChange(vKey as any, 'childBelow6', e.target.value)} className="h-9 text-[10px] font-bold" />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1"><Accessibility className="h-3 w-3" /> Disability Notes</Label>
                            <Input value={editingRecord[vKey].disability} onChange={e => handleVisitorEditChange(vKey as any, 'disability', e.target.value)} className="h-9 text-[10px] font-bold" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <DialogFooter className="p-8 bg-slate-50 border-t flex flex-row justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setEditingRecord(null)} className="rounded-xl font-bold h-11 px-6">Discard</Button>
                <Button type="submit" disabled={isUpdating} className="rounded-xl font-black h-11 px-10 shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90">
                  {isUpdating ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                  COMMIT REVISIONS
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
