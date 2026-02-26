
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
  Users, 
  Building2, 
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
  const { isLeader, isLoading: isAuthLoading } = useUserProfile();
  const [searchTerm, setSearchTerm] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const articlesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'articles'), orderBy('createdAt', 'desc'));
  }, [db]);

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

  if (!isLeader) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <Layers className="h-20 w-20 text-slate-200 mb-6" />
        <h2 className="text-3xl font-black uppercase tracking-tighter">Access Unauthorized</h2>
        <p className="text-slate-500 font-bold mt-2">Only Command personnel may access the magazine registry.</p>
        <Button onClick={() => router.push('/')} className="mt-8 rounded-2xl h-14 px-12 font-black">Return Home</Button>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#f8fafc] pb-32">
      <header className="border-b bg-white px-6 md:px-12 py-8 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-6">
          <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="h-14 w-14 rounded-2xl bg-slate-50 border border-slate-100 shadow-sm hover:bg-white transition-all">
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600">Command Registry</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900 leading-none uppercase">Magazine Management</h1>
          </div>
        </div>
        <Button 
          onClick={handleExport} 
          disabled={isExporting || stats.total === 0} 
          className="rounded-2xl h-14 px-8 font-black shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 text-base"
        >
          {isExporting ? <Loader2 className="animate-spin mr-3 h-6 w-6" /> : <FileDown className="mr-3 h-6 w-6" />}
          GENERATE MAGAZINE DOCX
        </Button>
      </header>

      <main className="max-w-7xl mx-auto mt-12 px-6 md:px-12 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-none shadow-xl rounded-[2rem] bg-slate-900 text-white p-8 space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Articles</span>
            <div className="text-5xl font-black">{stats.total}</div>
            <div className="pt-4"><Badge className="bg-primary/20 text-primary border-none">Active Database</Badge></div>
          </Card>
          {['Alpha', 'Bravo', 'Charlie'].map(company => (
            <Card key={company} className="border-none shadow-xl rounded-[2rem] bg-white p-8 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{company} Company</span>
              <div className="text-5xl font-black text-slate-900">
                {company === 'Alpha' ? stats.alpha : company === 'Bravo' ? stats.bravo : stats.charlie}
              </div>
              <div className="pt-4 text-[10px] font-black uppercase text-slate-300">Submissions Tracked</div>
            </Card>
          ))}
        </div>

        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
            <div className="flex items-center gap-4">
              <BookOpen className="h-8 w-8 text-primary" />
              <h2 className="text-2xl font-black uppercase tracking-tighter">Contribution Registry</h2>
            </div>
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input 
                placeholder="Filter by cadet or company..." 
                className="pl-12 h-14 rounded-2xl bg-white shadow-xl border-none font-bold"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {isArticlesLoading ? (
            <div className="py-32 flex flex-col items-center justify-center gap-6">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
              <span className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Decrypting Registry Articles...</span>
            </div>
          ) : filteredArticles && filteredArticles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredArticles.map((article) => (
                <Card key={article.id} className="group border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white hover:-translate-y-2 transition-all duration-500">
                  <div className="h-2 w-full bg-slate-900 group-hover:bg-primary transition-colors" />
                  <CardContent className="p-8 space-y-6">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shadow-inner">
                          {article.imageUrl ? (
                            <img src={article.imageUrl} alt={article.cadetName} className="w-full h-full object-cover" />
                          ) : (
                            <User className="h-6 w-6 text-slate-300" />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <h4 className="font-black text-slate-900 uppercase tracking-tight leading-none mb-1">{article.cadetName}</h4>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{article.company} Company | Plat {article.platoon}</span>
                        </div>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-[2.5rem] border-none shadow-3xl p-10">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-2xl font-black uppercase tracking-tighter">Expunge Article?</AlertDialogTitle>
                            <AlertDialogDescription className="text-base font-bold text-slate-500 mt-2">
                              Permanent removal of contribution from the magazine draft registry.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="mt-8 gap-4">
                            <AlertDialogCancel className="rounded-2xl h-14 font-black border-none bg-slate-50">Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(article.id)} className="bg-red-500 text-white rounded-2xl h-14 font-black shadow-xl shadow-red-500/20">
                              Confirm Purge
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 relative min-h-[160px]">
                      <p className="text-xs font-medium text-slate-600 leading-relaxed line-clamp-6 italic">"{article.content}"</p>
                      <div className="absolute bottom-0 right-0 p-4 opacity-5 pointer-events-none">
                        <CheckCircle2 className="h-12 w-12 text-slate-900" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-slate-300" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                          Filed: {article.createdAt?.toDate ? article.createdAt.toDate().toLocaleDateString('en-GB') : 'Archiving...'}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-[8px] font-black uppercase px-2 py-0 border-slate-200 text-slate-400">Platoon {article.platoon}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-48 bg-white rounded-[4rem] border border-dashed border-slate-200 flex flex-col items-center gap-8 px-10 shadow-sm">
              <div className="h-24 w-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center">
                <BookOpen className="h-12 w-12 text-slate-200" />
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Article Registry Empty</h3>
                <p className="text-sm text-slate-400 font-bold uppercase tracking-wide">No literary contributions have been harvested yet.</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
