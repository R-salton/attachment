
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
  CheckCircle2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/hooks/use-user-profile';
import { exportMagazineToDocx } from '@/lib/magazine-export';
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

  const articlesQuery = useMemoFirebase(() => {
    if (!db || !isMasterAdmin) return null;
    return query(collection(db, 'articles'), orderBy('createdAt', 'desc'));
  }, [db, isMasterAdmin]);

  const { data: articles, isLoading: isArticlesLoading } = useCollection(articlesQuery);

  const handleDelete = async (id: string) => {
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
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isMasterAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <Layers className="h-20 w-20 text-slate-200 mb-6" />
        <h2 className="text-3xl font-black uppercase tracking-tighter">Access Unauthorized</h2>
        <p className="text-slate-500 font-bold mt-2">Only Master Command personnel may access the magazine registry.</p>
        <Button onClick={() => router.push('/')} className="mt-8 rounded-2xl h-14 px-12 font-black">Return Home</Button>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#f8fafc] pb-32">
      <header className="border-b bg-white px-4 md:px-12 py-6 md:py-8 flex flex-col md:flex-row items-start md:items-center justify-between sticky top-0 z-50 shadow-sm gap-4 md:gap-0">
        <div className="flex items-center gap-4 md:gap-6 w-full md:w-auto">
          <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="h-10 w-10 md:h-14 md:w-14 rounded-xl md:rounded-2xl bg-slate-50 border border-slate-100 shadow-sm hover:bg-white transition-all shrink-0">
            <ArrowLeft className="h-5 w-5 md:h-6 md:w-6" />
          </Button>
          <div className="flex flex-col overflow-hidden">
            <div className="flex items-center gap-2 mb-0.5 md:mb-1">
              <ShieldCheck className="h-3 w-3 md:h-4 md:w-4 text-blue-600" />
              <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.4em] text-blue-600 truncate">Master Registry</span>
            </div>
            <h1 className="text-xl md:text-4xl font-black tracking-tighter text-slate-900 leading-none uppercase truncate">Magazine Portal</h1>
          </div>
        </div>
        <Button 
          onClick={handleExport} 
          disabled={isExporting || stats.total === 0} 
          className="w-full md:w-auto rounded-xl md:rounded-2xl h-12 md:h-14 px-6 md:px-8 font-black shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 text-sm md:text-base"
        >
          {isExporting ? <Loader2 className="animate-spin mr-2 h-4 w-4 md:h-6 md:w-6" /> : <FileDown className="mr-2 h-4 w-4 md:h-6 md:w-6" />}
          GENERATE DOCX
        </Button>
      </header>

      <main className="max-w-7xl mx-auto mt-6 md:mt-12 px-4 md:px-12 space-y-8 md:space-y-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
          <Card className="col-span-2 md:col-span-1 border-none shadow-xl rounded-[1.5rem] md:rounded-[2rem] bg-slate-900 text-white p-6 md:p-8 space-y-1 md:space-y-2">
            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-400">Total Articles</span>
            <div className="text-3xl md:text-5xl font-black">{stats.total}</div>
            <div className="pt-2 md:pt-4"><Badge className="bg-primary/20 text-primary border-none text-[8px] md:text-xs">Active Database</Badge></div>
          </Card>
          {['Alpha', 'Bravo', 'Charlie'].map(company => (
            <Card key={company} className="border-none shadow-xl rounded-[1.5rem] md:rounded-[2rem] bg-white p-6 md:p-8 space-y-1 md:space-y-2">
              <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-400">{company} Company</span>
              <div className="text-3xl md:text-5xl font-black text-slate-900">
                {company === 'Alpha' ? stats.alpha : company === 'Bravo' ? stats.bravo : stats.charlie}
              </div>
              <div className="pt-2 md:pt-4 text-[8px] md:text-[10px] font-black uppercase text-slate-300">Submissions</div>
            </Card>
          ))}
        </div>

        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 px-2 md:px-4">
            <div className="flex items-center gap-3 md:gap-4">
              <BookOpen className="h-6 w-6 md:h-8 md:w-8 text-primary" />
              <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter">Contribution Registry</h2>
            </div>
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-slate-400" />
              <Input 
                placeholder="Filter cadet or company..." 
                className="pl-11 md:pl-12 h-12 md:h-14 rounded-xl md:rounded-2xl bg-white shadow-lg md:shadow-xl border-none font-bold text-sm"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {isArticlesLoading ? (
            <div className="py-24 md:py-32 flex flex-col items-center justify-center gap-4 md:gap-6">
              <Loader2 className="h-12 w-12 md:h-16 md:w-16 animate-spin text-primary" />
              <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-slate-400">Harvesting Articles...</span>
            </div>
          ) : filteredArticles && filteredArticles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {filteredArticles.map((article) => (
                <Card key={article.id} className="group border-none shadow-xl md:shadow-2xl rounded-[2rem] md:rounded-[2.5rem] overflow-hidden bg-white hover:-translate-y-1 md:hover:-translate-y-2 transition-all duration-500">
                  <div className="h-1.5 md:h-2 w-full bg-slate-900 group-hover:bg-primary transition-colors" />
                  <CardContent className="p-6 md:p-8 space-y-4 md:space-y-6">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                        <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shadow-inner shrink-0">
                          {article.imageUrl ? (
                            <img src={article.imageUrl} alt={article.cadetName} className="w-full h-full object-cover" />
                          ) : (
                            <User className="h-5 w-5 md:h-6 md:w-6 text-slate-300" />
                          )}
                        </div>
                        <div className="flex flex-col overflow-hidden">
                          <h4 className="font-black text-slate-900 uppercase tracking-tight leading-none mb-1 text-sm md:text-base truncate">{article.cadetName}</h4>
                          <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">{article.company} Co | Plat {article.platoon}</span>
                        </div>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shrink-0">
                            <Trash2 className="h-4 w-4 md:h-5 md:w-5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-[2rem] md:rounded-[2.5rem] border-none shadow-3xl p-6 md:p-10 max-w-[90vw] md:max-w-lg">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-xl md:text-2xl font-black uppercase tracking-tighter">Expunge Article?</AlertDialogTitle>
                            <AlertDialogDescription className="text-sm md:text-base font-bold text-slate-500 mt-2">
                              Permanent removal of contribution from the magazine draft registry.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="mt-6 md:mt-8 gap-3 md:gap-4">
                            <AlertDialogCancel className="rounded-xl md:rounded-2xl h-12 md:h-14 font-black border-none bg-slate-50 text-sm">Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(article.id)} className="bg-red-500 text-white rounded-xl md:rounded-2xl h-12 md:h-14 font-black shadow-xl shadow-red-500/20 text-sm">
                              Confirm Purge
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>

                    <div className="bg-slate-50 p-4 md:p-6 rounded-xl md:rounded-2xl border border-slate-100 relative min-h-[120px] md:min-h-[160px]">
                      <p className="text-[11px] md:text-xs font-medium text-slate-600 leading-relaxed line-clamp-5 md:line-clamp-6 italic">"{article.content}"</p>
                      <div className="absolute bottom-0 right-0 p-3 md:p-4 opacity-[0.03] md:opacity-5 pointer-events-none">
                        <CheckCircle2 className="h-8 w-8 md:h-12 md:w-12 text-slate-900" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 md:pt-4 border-t border-slate-50">
                      <div className="flex items-center gap-1.5 md:gap-2">
                        <Calendar className="h-3 w-3 md:h-3.5 md:w-3.5 text-slate-300" />
                        <span className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                          Filed: {article.createdAt?.toDate ? article.createdAt.toDate().toLocaleDateString('en-GB') : 'Archiving...'}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-[7px] md:text-[8px] font-black uppercase px-1.5 md:px-2 py-0 border-slate-200 text-slate-400">PLATOON {article.platoon}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-24 md:py-48 bg-white rounded-[2rem] md:rounded-[4rem] border border-dashed border-slate-200 flex flex-col items-center gap-6 md:gap-8 px-6 md:px-10 shadow-sm">
              <div className="h-16 w-16 md:h-24 md:w-24 bg-slate-50 rounded-2xl md:rounded-[2.5rem] flex items-center justify-center">
                <BookOpen className="h-8 w-8 md:h-12 md:w-12 text-slate-200" />
              </div>
              <div className="space-y-1 md:space-y-2">
                <h3 className="text-xl md:text-3xl font-black text-slate-900 tracking-tighter uppercase">Article Registry Empty</h3>
                <p className="text-[10px] md:text-sm text-slate-400 font-bold uppercase tracking-wide">No literary contributions have been harvested yet.</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
