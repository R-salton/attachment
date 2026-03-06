"use client";

import { useRouter } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  FileDown, 
  Loader2, 
  Trash2, 
  User, 
  ArrowLeft,
  Calendar,
  Layers,
  ShieldCheck,
  Search,
  CheckCircle2,
  TrendingUp,
  ArrowUpRight,
  Eye,
  ChevronRight,
  Building2,
  ListOrdered
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/hooks/use-user-profile';
import { exportMagazineToDocx, exportContributionRegistry } from '@/lib/magazine-export';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";

export default function MagazineManagementPortal() {
  const router = useRouter();
  const { toast } = useToast();
  const db = useFirestore();
  const { isMasterAdmin, isLoading: isAuthLoading } = useUserProfile();
  const [searchTerm, setSearchTerm] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingRoll, setIsExportingRoll] = useState(false);

  const articlesQuery = useMemoFirebase(() => {
    if (!db || !isMasterAdmin) return null;
    return query(collection(db, 'articles'), orderBy('createdAt', 'desc'));
  }, [db, isMasterAdmin]);

  const { data: articles, isLoading: isArticlesLoading } = useCollection(articlesQuery);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!db) return;
    try {
      await deleteDoc(doc(db, 'articles', id));
      toast({ title: "Article Removed", description: "Submission has been deleted from the registry." });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Could not remove article." });
    }
  };

  const handleExport = async () => {
    if (!articles || articles.length === 0) return;
    setIsExporting(true);
    try {
      await exportMagazineToDocx(articles);
      toast({ title: "Export Complete", description: "Magazine draft has been generated successfully." });
    } catch (e) {
      toast({ variant: "destructive", title: "Export Failed", description: "Could not generate DOCX file." });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportNominalRoll = async () => {
    if (!articles || articles.length === 0) return;
    setIsExportingRoll(true);
    try {
      await exportContributionRegistry(articles);
      toast({ title: "Registry Exported", description: "Nominal roll contribution list is ready." });
    } catch (e) {
      toast({ variant: "destructive", title: "Export Failed", description: "Could not generate registry document." });
    } finally {
      setIsExportingRoll(false);
    }
  };

  const filteredArticles = articles?.filter(a => 
    a.cadetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: articles?.length || 0,
    alpha: articles?.filter(a => a.company === 'Alpha').length || 0,
    bravo: articles?.filter(a => a.company === 'Bravo').length || 0,
    charlie: articles?.filter(a => a.company === 'Charlie').length || 0,
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">Synchronizing Command...</p>
        </div>
      </div>
    );
  }

  if (!isMasterAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-12 rounded-[3rem] shadow-2xl border border-slate-100 max-w-lg">
          <Layers className="h-20 w-20 text-slate-200 mb-6 mx-auto" />
          <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900">Access Unauthorized</h2>
          <p className="text-slate-500 font-bold mt-2">Only Master Command personnel may access the magazine registry terminal.</p>
          <Button onClick={() => router.push('/')} className="mt-10 rounded-2xl h-14 px-12 font-black w-full shadow-xl">Return to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#f8fafc] pb-32">
      <header className="border-b bg-white/95 backdrop-blur-md px-4 md:px-12 py-4 md:py-8 flex flex-col lg:flex-row items-start lg:items-center justify-between sticky top-0 z-50 shadow-sm gap-4 lg:gap-0">
        <div className="flex items-center gap-3 md:gap-8 w-full lg:w-auto">
          <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="h-10 w-10 md:h-16 md:w-16 rounded-xl md:rounded-2xl bg-slate-50 border border-slate-100 shadow-sm hover:bg-white transition-all shrink-0">
            <ArrowLeft className="h-5 w-5 md:h-7 md:w-7" />
          </Button>
          <div className="flex flex-col overflow-hidden">
            <div className="flex items-center gap-2 mb-0.5 md:mb-1">
              <ShieldCheck className="h-3 w-3 md:h-4 md:w-4 text-primary" />
              <span className="text-[7px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.4em] text-primary truncate">Master Command Terminal</span>
            </div>
            <h1 className="text-xl md:text-5xl font-black tracking-tighter text-slate-900 leading-none uppercase truncate">Magazine Registry</h1>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2 md:gap-3 w-full lg:w-auto">
          <Button 
            variant="outline"
            onClick={handleExportNominalRoll} 
            disabled={isExportingRoll || stats.total === 0} 
            className="w-full sm:w-auto rounded-xl md:rounded-2xl h-11 md:h-14 px-4 md:px-6 font-bold border-slate-200 shadow-sm text-[10px] md:text-sm"
          >
            {isExportingRoll ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <ListOrdered className="mr-2 h-4 w-4" />}
            NOMINAL ROLL
          </Button>
          <Button 
            onClick={handleExport} 
            disabled={isExporting || stats.total === 0} 
            className="w-full sm:w-auto rounded-xl md:rounded-2xl h-11 md:h-16 px-6 md:px-10 font-black shadow-xl md:shadow-2xl shadow-primary/30 bg-primary hover:bg-primary/90 text-xs md:text-lg transition-all active:scale-95"
          >
            {isExporting ? <Loader2 className="animate-spin mr-2 md:mr-3 h-4 w-4 md:h-6 md:w-6" /> : <FileDown className="mr-2 md:mr-3 h-4 w-4 md:h-6 md:w-6" />}
            GENERATE MAG DRAFT
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto mt-6 md:mt-16 px-4 md:px-12 space-y-8 md:space-y-16">
        {/* Statistics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
          <Card className="border-none shadow-2xl rounded-[1.5rem] md:rounded-[2rem] bg-slate-900 text-white p-6 md:p-10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <TrendingUp className="h-16 w-16 md:h-20 md:w-20" />
            </div>
            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1 md:mb-2">Total Contributions</span>
            <div className="text-4xl md:text-6xl font-black leading-none">{stats.total}</div>
            <div className="mt-4 md:mt-6 flex items-center gap-2">
              <Badge className="bg-primary text-white border-none text-[7px] md:text-[9px] font-black px-2 md:px-3 py-0.5 md:py-1">ACTIVE DATABASE</Badge>
            </div>
          </Card>
          
          {[
            { name: 'Alpha', count: stats.alpha, color: 'bg-blue-600' },
            { name: 'Bravo', count: stats.bravo, color: 'bg-emerald-600' },
            { name: 'Charlie', count: stats.charlie, color: 'bg-amber-600' }
          ].map(company => (
            <Card key={company.name} className="border-none shadow-xl rounded-[1.5rem] md:rounded-[2rem] bg-white p-6 md:p-10 relative overflow-hidden group hover:shadow-2xl transition-all duration-500">
              <div className={`absolute top-0 right-0 w-1.5 h-full ${company.color}`} />
              <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1 md:mb-2">{company.name} Company</span>
              <div className="text-4xl md:text-6xl font-black text-slate-900 leading-none">{company.count}</div>
              <p className="mt-4 md:mt-6 text-[8px] md:text-[10px] font-black uppercase text-slate-300 tracking-tighter flex items-center gap-1">
                Filed Submissions <ArrowUpRight className="h-2.5 w-2.5 md:h-3 md:w-3" />
              </p>
            </Card>
          ))}
        </div>

        <div className="space-y-6 md:space-y-8">
          {/* Filter Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 px-2">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl bg-white shadow-xl flex items-center justify-center text-primary">
                <BookOpen className="h-5 w-5 md:h-6 md:w-6" />
              </div>
              <h2 className="text-xl md:text-3xl font-black uppercase tracking-tighter text-slate-900">Submission Archives</h2>
            </div>
            <div className="relative w-full md:w-[400px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-slate-400" />
              <Input 
                placeholder="Filter by cadet name or company..." 
                className="pl-11 md:pl-14 h-12 md:h-16 rounded-xl md:rounded-[1.5rem] bg-white shadow-2xl border-none font-bold text-xs md:text-base focus:ring-primary transition-all"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {isArticlesLoading ? (
            <div className="py-24 md:py-32 flex flex-col items-center justify-center gap-4 md:gap-6">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
                <Loader2 className="h-12 w-12 md:h-20 md:w-20 animate-spin text-primary relative z-10" />
              </div>
              <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">Harvesting Articles...</span>
            </div>
          ) : filteredArticles && filteredArticles.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              {filteredArticles.map((article) => (
                <div 
                  key={article.id} 
                  onClick={() => router.push(`/magazine/view/${article.id}`)}
                  className="group flex items-start gap-3 md:gap-4 p-3 md:p-4 bg-white border border-slate-100 rounded-[1.5rem] md:rounded-[2rem] hover:shadow-2xl hover:border-primary/20 transition-all duration-300 cursor-pointer relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-1 md:w-1.5 h-full bg-slate-900 group-hover:bg-primary transition-colors" />
                  
                  <div className="w-16 h-16 sm:w-28 sm:h-28 rounded-xl md:rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 shadow-inner flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-500 mt-1">
                    {article.imageUrl ? (
                      <img src={article.imageUrl} alt={article.cadetName} className="w-full h-full object-cover" />
                    ) : (
                      <User className="h-6 w-6 md:h-10 md:w-10 text-slate-200" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-between h-full pt-1">
                    <div className="space-y-1 md:space-y-1.5">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm sm:text-lg font-black text-slate-900 uppercase tracking-tight truncate max-w-[140px] sm:max-w-none">
                          {article.cadetName}
                        </h4>
                        <Badge className="bg-slate-900 text-white text-[6px] md:text-[7px] font-black px-1 md:px-1.5 py-0.5 uppercase tracking-widest border-none shrink-0">
                          {article.company}
                        </Badge>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-x-2 md:gap-x-3 gap-y-1 text-[7px] md:text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        <div className="flex items-center gap-1">
                          <Layers className="h-2.5 w-2.5 md:h-3 md:w-3" /> PLT {article.platoon}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-2.5 w-2.5 md:h-3 md:w-3" /> 
                          {article.createdAt?.toDate ? article.createdAt.toDate().toLocaleDateString('en-GB') : 'Processing...'}
                        </div>
                      </div>

                      <p className="text-[10px] md:text-xs font-medium text-slate-500 line-clamp-2 italic leading-relaxed mt-1 md:mt-2">
                        "{article.content}"
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-3 md:mt-4">
                      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 md:h-8 md:w-8 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                              <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-[2rem] md:rounded-[2.5rem] border-none shadow-3xl p-6 md:p-10 max-w-lg">
                            <AlertDialogHeader>
                              <div className="h-12 w-12 md:h-16 md:w-16 bg-red-50 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6">
                                <Trash2 className="h-6 w-6 md:h-8 md:w-8 text-red-500" />
                              </div>
                              <AlertDialogTitle className="text-xl md:text-2xl font-black uppercase tracking-tighter text-slate-900">Purge Contribution?</AlertDialogTitle>
                              <AlertDialogDescription className="text-sm md:text-base font-bold text-slate-500 mt-2">
                                This will permanently expunge OC {article.cadetName}'s article from the magazine draft registry. This action is final.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="mt-6 md:mt-10 gap-3 md:gap-4">
                              <AlertDialogCancel className="rounded-xl md:rounded-2xl h-11 md:h-14 font-black border-none bg-slate-50 text-slate-600 px-6 md:px-8">Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={(e) => handleDelete(e, article.id)} className="bg-red-500 text-white rounded-xl md:rounded-2xl h-11 md:h-14 font-black shadow-2xl shadow-red-500/30 px-8 md:px-10 border-none hover:bg-red-600">
                                Confirm Purge
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                      
                      <div className="flex items-center gap-1.5 text-[7px] md:text-[9px] font-black text-primary uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                        Review Transcript <ChevronRight className="h-2.5 w-2.5 md:h-3 md:w-3" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-32 md:py-56 bg-white rounded-[2rem] md:rounded-[5rem] border border-dashed border-slate-200 flex flex-col items-center gap-6 md:gap-8 px-6 md:px-10 shadow-sm">
              <div className="h-16 w-16 md:h-28 md:w-28 bg-slate-50 rounded-[1.5rem] md:rounded-[3rem] flex items-center justify-center shadow-inner">
                <BookOpen className="h-8 w-8 md:h-14 md:w-14 text-slate-200" />
              </div>
              <div className="space-y-2 md:space-y-3">
                <h3 className="text-xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase">Registry Empty</h3>
                <p className="text-[8px] md:text-sm text-slate-400 font-bold uppercase tracking-[0.2em] md:tracking-[0.3em] max-w-md mx-auto">No literary contributions have been harvested into the magazine database yet.</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
