"use client";

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  BookOpen, 
  Loader2, 
  User, 
  Building2, 
  Layers, 
  Calendar,
  Quote,
  ShieldCheck
} from 'lucide-react';
import { useUserProfile } from '@/hooks/use-user-profile';

export default function ArticleDetailPortal({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const db = useFirestore();
  const { isMasterAdmin, isLoading: isAuthLoading } = useUserProfile();

  const articleRef = useMemoFirebase(() => {
    if (!db || !id || !isMasterAdmin) return null;
    return doc(db, 'articles', id);
  }, [db, id, isMasterAdmin]);

  const { data: article, isLoading } = useDoc(articleRef);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isMasterAdmin) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 text-center">
        <ShieldCheck className="h-20 w-20 text-slate-200 mb-6" />
        <h2 className="text-3xl font-black uppercase text-slate-900">Unauthorized Access</h2>
        <p className="text-slate-500 font-bold mt-2">Only Master Command personnel may view the article transcripts.</p>
        <Button onClick={() => router.push('/')} className="mt-10 rounded-2xl h-14 px-12 font-black">Return Dashboard</Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Decrypting Transcript...</p>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 text-center">
        <BookOpen className="h-20 w-20 text-slate-200 mb-6" />
        <h2 className="text-3xl font-black uppercase text-slate-900">Article Not Found</h2>
        <Button onClick={() => router.push('/magazine/manage')} className="mt-10 rounded-2xl h-14 px-12 font-black">Return to Registry</Button>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#f8fafc] pb-32">
      <header className="border-b bg-white/95 backdrop-blur-md px-4 md:px-12 py-6 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-4 md:gap-8 overflow-hidden">
          <Button variant="ghost" size="icon" onClick={() => router.push('/magazine/manage')} className="h-12 w-12 md:h-14 md:w-14 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white transition-all shrink-0">
            <ArrowLeft className="h-6 w-6 text-slate-900" />
          </Button>
          <div className="flex flex-col overflow-hidden">
            <div className="flex items-center gap-2 mb-0.5">
              <BookOpen className="h-3 w-3 text-primary" />
              <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em] text-primary truncate">Editorial Registry Transcript</span>
            </div>
            <h1 className="text-lg md:text-2xl font-black tracking-tighter text-slate-900 uppercase truncate">
              Contribution: {article.cadetName}
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto mt-10 md:mt-16 px-4 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 md:gap-16">
          
          {/* Sidebar: Metadata & Image */}
          <aside className="lg:col-span-1 space-y-10">
            <div className="space-y-6">
              <div className="aspect-square rounded-[3rem] overflow-hidden border-8 border-white shadow-2xl bg-slate-100 relative group">
                {article.imageUrl ? (
                  <img src={article.imageUrl} alt={article.cadetName} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="h-24 w-24 text-slate-200" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              <Card className="border-none shadow-xl rounded-[2rem] bg-white overflow-hidden">
                <CardContent className="p-8 space-y-6">
                  <div className="space-y-4 pb-6 border-b border-slate-100">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Company</span>
                        <span className="text-sm font-black text-slate-900">{article.company} Company</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <Layers className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Platoon</span>
                        <span className="text-sm font-black text-slate-900">Platoon {article.platoon}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Filed Date</span>
                        <span className="text-sm font-black text-slate-900">
                          {article.createdAt?.toDate ? article.createdAt.toDate().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Processing...'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <Badge className="w-full justify-center bg-slate-900 text-white border-none h-10 rounded-xl text-[10px] font-black tracking-[0.2em] uppercase">
                      Verified Contribution
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </aside>

          {/* Main: Content */}
          <section className="lg:col-span-2 space-y-10">
            <Card className="border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden min-h-[600px] flex flex-col">
              <div className="h-2 w-full bg-primary" />
              <CardHeader className="p-10 md:p-16 pb-0">
                <Quote className="h-12 w-12 text-primary/10 mb-6" />
                <CardTitle className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase leading-[0.9]">
                  Literary Contribution Transcript
                </CardTitle>
              </CardHeader>
              <CardContent className="p-10 md:p-16 flex-1">
                <div className="prose prose-slate prose-lg md:prose-xl max-w-none text-slate-700 leading-relaxed font-medium selection:bg-primary/10 whitespace-pre-wrap italic">
                  "{article.content}"
                </div>
              </CardContent>
              <div className="p-10 border-t border-slate-50 bg-slate-50/50">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] text-center">
                  Official Cadet Magazine Registry | Registry ID: {article.id.substring(0,12)}
                </p>
              </div>
            </Card>
          </section>

        </div>
      </main>
    </div>
  );
}
