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
  ListOrdered,
  FileText,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/hooks/use-user-profile';
import { exportMagazineToDocx, exportContributionRegistry, exportContributionRegistryPDF } from '@/lib/magazine-export';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function MagazineManagementPortal() {
  const router = useRouter();
  const { toast } = useToast();
  const db = useFirestore();
  const { isAdmin, isPTSLeadership, isLoading: isAuthLoading } = useUserProfile();
  const [searchTerm, setSearchTerm] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingRoll, setIsExportingRoll] = useState(false);

  const hasAccess = isAdmin || isPTSLeadership;

  const articlesQuery = useMemoFirebase(() => {
    if (!db || !hasAccess) return null;
    return query(collection(db, 'articles'), orderBy('createdAt', 'desc'));
  }, [db, hasAccess]);

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

  const handleExportNominalRoll = async (format: 'DOCX' | 'PDF') => {
    if (!articles || articles.length === 0) return;
    setIsExportingRoll(true);
    try {
      if (format === 'DOCX') {
        await exportContributionRegistry(articles);
      } else {
        await exportContributionRegistryPDF(articles);
      }
      toast({ title: "Registry Exported", description: `Nominal roll (${format}) is ready.` });
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

  const getWordPreview = (text: string, count: number) => {
    const words = text.split(/\s+/);
    if (words.length <= count) return text;
    return words.slice(0, count).join(' ') + '...';
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

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-12 rounded-[3rem] shadow-2xl border border-slate-100 max-w-lg">
          <ShieldCheck className="h-20 w-20 text-slate-200 mb-6 mx-auto" />
          <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900">Access Unauthorized</h2>
          <p className="text-slate-500 font-bold mt-2">Only authorized command personnel may access the magazine registry terminal.</p>
          <Button onClick={() => router.push('/')} className="mt-10 rounded-2xl h-14 px-12 font-black w-full shadow-xl">Return to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#f8fafc] pb-32">
      <header className="border-b bg-white/95 backdrop-blur-md px-4 md:px-8 py-3 md:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between sticky top-0 z-50 shadow-sm gap-4">
        <div className="flex items-center gap-3 md:gap-4 w-full sm:w-auto">
          <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="h-9 w-9 md:h-10 md:w-10 rounded-lg bg-slate-50 border border-slate-100 shadow-sm hover:bg-white transition-all shrink-0">
            <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
          <div className="flex flex-col overflow-hidden">
            <div className="flex items-center gap-1.5 mb-0.5">
              <ShieldCheck className="h-3 w-3 text-primary" />
              <span className="text-[8px] font-black uppercase tracking-widest text-primary truncate">PTS Command Terminal</span>
            </div>
            <h1 className="text-lg md:text-xl font-black tracking-tight text-slate-900 leading-none uppercase truncate">Magazine Registry</h1>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline"
                disabled={isExportingRoll || stats.total === 0} 
                className="flex-1 sm:flex-none rounded-lg h-10 px-3 md:px-4 font-bold border-slate-200 shadow-sm text-xs"
              >
                {isExportingRoll ? <Loader2 className="animate-spin mr-2 h-3.5 w-3.5" /> : <ListOrdered className="mr-2 h-3.5 w-3.5" />}
                NOMINAL ROLL
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="rounded-xl p-2 w-48">
              <DropdownMenuLabel className="text-[10px] uppercase font-black tracking-widest text-slate-400">Select Format</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleExportNominalRoll('PDF')} className="cursor-pointer gap-2 py-2.5 rounded-lg font-bold text-xs">
                <FileText className="h-3.5 w-3.5 text-red-500" /> Mobile PDF Archive
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportNominalRoll('DOCX')} className="cursor-pointer gap-2 py-2.5 rounded-lg font-bold text-xs">
                <FileDown className="h-3.5 w-3.5 text-blue-500" /> Word Registry (DOCX)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button 
            onClick={handleExport} 
            disabled={isExporting || stats.total === 0} 
            className="flex-1 sm:flex-none rounded-lg h-10 px-4 md:px-6 font-black shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-xs transition-all active:scale-95"
          >
            {isExporting ? <Loader2 className="animate-spin mr-2 h-3.5 w-3.5" /> : <FileDown className="mr-2 h-3.5 w-3.5" />}
            GENERATE MAG DRAFT
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto mt-6 md:mt-10 px-4 md:px-8 space-y-8 md:space-y-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Card className="border-none shadow-xl rounded-2xl bg-slate-900 text-white p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <TrendingUp className="h-12 w-12 md:h-16 md:w-16" />
            </div>
            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Total Contributions</span>
            <div className="text-3xl md:text-4xl font-black leading-none">{stats.total}</div>
            <div className="mt-4 flex items-center gap-2">
              <Badge className="bg-primary text-white border-none text-[7px] md:text-[8px] font-black px-2 py-0.5">ACTIVE DATABASE</Badge>
            </div>
          </Card>
          
          {[
            { name: 'Alpha', count: stats.alpha, color: 'bg-blue-600' },
            { name: 'Bravo', count: stats.bravo, color: 'bg-emerald-600' },
            { name: 'Charlie', count: stats.charlie, color: 'bg-amber-600' }
          ].map(company => (
            <Card 
              key={company.name} 
              onClick={() => router.push(`/magazine/manage/company/${company.name}`)}
              className="border-none shadow-lg rounded-2xl bg-white p-6 relative overflow-hidden group hover:shadow-xl transition-all duration-500 cursor-pointer active:scale-[0.98]"
            >
              <div className={`absolute top-0 right-0 w-1 h-full ${company.color}`} />
              <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">{company.name} Company</span>
              <div className="text-3xl md:text-4xl font-black text-slate-900 leading-none">{company.count}</div>
              <p className="mt-4 text-[8px] font-black uppercase text-slate-300 tracking-tighter flex items-center gap-1">
                Filed Submissions <ArrowUpRight className="h-2 w-2" />
              </p>
            </Card>
          ))}
        </div>

        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-white shadow-md flex items-center justify-center text-primary">
                <BookOpen className="h-4.5 w-4.5" />
              </div>
              <h2 className="text-lg md:text-xl font-black uppercase tracking-tight text-slate-900">Submission Archives</h2>
            </div>
            <div className="relative w-full md:w-[320px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Filter by cadet or company..." 
                className="pl-10 h-11 rounded-xl bg-white shadow-lg border-none font-bold text-xs focus:ring-primary transition-all"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {isArticlesLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                <Loader2 className="h-10 w-10 animate-spin text-primary relative z-10" />
              </div>
              <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">Harvesting Articles...</span>
            </div>
          ) : filteredArticles && filteredArticles.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
              {filteredArticles.map((article) => (
                <div 
                  key={article.id} 
                  onClick={() => router.push(`/magazine/view/${article.id}`)}
                  className="group relative flex flex-col p-6 bg-white border border-slate-100 rounded-2xl hover:shadow-2xl hover:border-primary/20 transition-all duration-300 cursor-pointer overflow-hidden"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-slate-100 shrink-0 bg-slate-50 shadow-sm group-hover:border-primary/30 transition-colors">
                      {article.imageUrl ? (
                        <img src={article.imageUrl} alt={article.cadetName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="h-8 w-8 text-slate-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xl font-black text-slate-900 uppercase leading-tight mb-1">
                        {article.cadetName}
                      </h4>
                      <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <Layers className="h-3 w-3 text-primary" /> PLT {article.platoon}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 min-h-[10rem]">
                      <p className="text-sm font-medium text-slate-600 italic leading-relaxed line-clamp-6">
                        "{getWordPreview(article.content, 60)}"
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" className="w-full h-11 rounded-xl text-primary font-black text-[11px] uppercase tracking-widest bg-primary/5 hover:bg-primary/10 border border-transparent hover:border-primary/20 group/btn shadow-sm">
                      View Full Article <ExternalLink className="ml-2 h-3.5 w-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                    </Button>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-50 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-1.5">
                        <Badge className="w-fit h-5 text-[8px] font-black px-2 uppercase bg-slate-900 text-white border-none shrink-0">
                          {article.company} Company
                        </Badge>
                        <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          <Calendar className="h-3 w-3 text-primary" /> 
                          {article.createdAt?.toDate ? article.createdAt.toDate().toLocaleDateString('en-GB') : '...'}
                        </div>
                      </div>
                      
                      <div onClick={e => e.stopPropagation()} className="flex items-center gap-2">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-[2rem] border-none shadow-3xl p-8 max-w-sm">
                            <AlertDialogHeader>
                              <div className="h-12 w-12 bg-red-100 rounded-xl flex items-center justify-center mb-4">
                                <Trash2 className="h-6 w-6 text-red-500" />
                              </div>
                              <AlertDialogTitle className="text-xl font-black uppercase tracking-tighter text-slate-900">Purge Entry?</AlertDialogTitle>
                              <AlertDialogDescription className="text-sm font-bold text-slate-500">
                                Permanently expunge OC {article.cadetName}'s article from the registry.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="mt-6 gap-2">
                              <AlertDialogCancel className="rounded-xl h-10 font-black border-none bg-slate-100 text-slate-600 px-6">Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={(e) => handleDelete(e, article.id)} className="bg-red-500 text-white rounded-xl h-10 font-black px-6 hover:bg-red-600 border-none shadow-lg shadow-red-500/20">
                                Confirm
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        <div className="h-9 w-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                          <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-24 bg-white rounded-[3rem] border border-dashed border-slate-200 flex flex-col items-center gap-6 px-6 shadow-sm">
              <div className="h-20 w-20 bg-slate-50 rounded-3xl flex items-center justify-center shadow-inner">
                <BookOpen className="h-10 w-10 text-slate-200" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Registry Empty</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest max-w-md mx-auto">No literary contributions have been harvested into the magazine database yet.</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
