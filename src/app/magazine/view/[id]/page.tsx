"use client";

import { use, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  ArrowLeft, 
  BookOpen, 
  Loader2, 
  User, 
  Building2, 
  Layers, 
  Calendar,
  Quote,
  ShieldCheck,
  Edit3,
  Save,
  X,
  Camera
} from 'lucide-react';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useToast } from '@/hooks/use-toast';

const COMPANIES = ["Alpha", "Bravo", "Charlie"];
const PLATOONS = ["1", "2", "3"];

/**
 * Aggressively compresses an image to stay under Firestore document limits.
 */
const compressImage = (base64Str: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 400;
      const MAX_HEIGHT = 400;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
  });
};

export default function ArticleDetailPortal({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const { toast } = useToast();
  const db = useFirestore();
  const { isMasterAdmin, isLoading: isAuthLoading } = useUserProfile();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit States
  const [editedName, setEditedName] = useState("");
  const [editedCompany, setEditedCompany] = useState("");
  const [editedPlatoon, setEditedPlatoon] = useState("");
  const [editedContent, setEditedContent] = useState("");
  const [editedImage, setEditedImage] = useState("");

  const articleRef = useMemoFirebase(() => {
    if (!db || !id || !isMasterAdmin) return null;
    return doc(db, 'articles', id);
  }, [db, id, isMasterAdmin]);

  const { data: article, isLoading } = useDoc(articleRef);

  useEffect(() => {
    if (article) {
      setEditedName(article.cadetName || "");
      setEditedCompany(article.company || "");
      setEditedPlatoon(article.platoon || "");
      setEditedContent(article.content || "");
      setEditedImage(article.imageUrl || "");
    }
  }, [article]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSaving(true);
    try {
      const reader = new FileReader();
      const b64 = await new Promise<string>((resolve, reject) => {
        reader.onload = (ev) => resolve(ev.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const compressed = await compressImage(b64);
      setEditedImage(compressed);
      toast({ title: "Image Processed", description: "Profile photo updated in memory." });
    } catch (err) {
      toast({ variant: "destructive", title: "Upload Error", description: "Could not process image." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    if (!articleRef) return;
    setIsSaving(true);
    try {
      await updateDoc(articleRef, {
        cadetName: editedName,
        company: editedCompany,
        platoon: editedPlatoon,
        content: editedContent,
        imageUrl: editedImage,
      });
      setIsEditing(false);
      toast({ title: "Update Success", description: "Article revised in registry." });
    } catch (err) {
      toast({ variant: "destructive", title: "Save Error", description: "Could not update article archive." });
    } finally {
      setIsSaving(false);
    }
  };

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
              {isEditing ? "Revising Article" : `Contribution: ${article.cadetName}`}
            </h1>
          </div>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} className="rounded-xl font-bold h-10 px-6">
            <Edit3 className="h-4 w-4 mr-2" /> Edit Article
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => setIsEditing(false)} disabled={isSaving} className="rounded-xl font-bold text-slate-500">Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving} className="rounded-xl font-black bg-slate-900 hover:bg-slate-800 text-white h-10 px-6">
              {isSaving ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
              Commit Revision
            </Button>
          </div>
        )}
      </header>

      <main className="max-w-5xl mx-auto mt-10 md:mt-16 px-4 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 md:gap-16">
          
          {/* Sidebar: Metadata & Image */}
          <aside className="lg:col-span-1 space-y-10">
            <div className="space-y-6">
              <div className="aspect-square rounded-[3rem] overflow-hidden border-8 border-white shadow-2xl bg-slate-100 relative group cursor-pointer" onClick={() => isEditing && fileInputRef.current?.click()}>
                {(isEditing ? editedImage : article.imageUrl) ? (
                  <img src={isEditing ? editedImage : article.imageUrl} alt="Cadet Profile" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="h-24 w-24 text-slate-200" />
                  </div>
                )}
                {isEditing && (
                  <div className="absolute inset-0 bg-slate-900/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="h-10 w-10 text-white mb-2" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Change Photo</span>
                  </div>
                )}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
              </div>

              <Card className="border-none shadow-xl rounded-[2rem] bg-white overflow-hidden">
                <CardContent className="p-8 space-y-6">
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Full Name</Label>
                        <Input value={editedName} onChange={e => setEditedName(e.target.value)} className="h-10 font-bold" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Company</Label>
                          <Select value={editedCompany} onValueChange={setEditedCompany}>
                            <SelectTrigger className="h-10 font-bold">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {COMPANIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Platoon</Label>
                          <Select value={editedPlatoon} onValueChange={setEditedPlatoon}>
                            <SelectTrigger className="h-10 font-bold">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PLATOONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  ) : (
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
                  )}
                  
                  <div className="pt-2">
                    <Badge className="w-full justify-center bg-slate-900 text-white border-none h-10 rounded-xl text-[10px] font-black tracking-[0.2em] uppercase">
                      {isEditing ? "Editing Mode" : "Verified Contribution"}
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
                  {isEditing ? "Revision Console" : "Literary Transcript"}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-10 md:p-16 flex-1">
                {isEditing ? (
                  <Textarea 
                    value={editedContent}
                    onChange={e => setEditedContent(e.target.value)}
                    className="min-h-[450px] text-lg font-medium leading-relaxed bg-slate-50 border-slate-100 p-6 rounded-2xl"
                    placeholder="Refine article content..."
                  />
                ) : (
                  <div className="prose prose-slate prose-lg md:prose-xl max-w-none text-slate-700 leading-relaxed font-medium selection:bg-primary/10 whitespace-pre-wrap italic">
                    "{article.content}"
                  </div>
                )}
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
