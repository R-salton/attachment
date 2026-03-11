
"use client";

import { use, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useDoc, useMemoFirebase, useUser } from '@/firebase';
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
  Camera,
  FileText
} from 'lucide-react';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

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
  const { user } = useUser();
  const { isAdmin, isPTSLeadership, isLoading: isAuthLoading } = useUserProfile();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasAccess = isAdmin || isPTSLeadership;

  // Edit States
  const [editedName, setEditedName] = useState("");
  const [editedCompany, setEditedCompany] = useState("");
  const [editedPlatoon, setEditedPlatoon] = useState("");
  const [editedContent, setEditedContent] = useState("");
  const [editedImage, setEditedImage] = useState("");

  const articleRef = useMemoFirebase(() => {
    if (!db || !id || !user) return null;
    return doc(db, 'articles', id);
  }, [db, id, user?.uid]);

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

  const handleSave = () => {
    if (!articleRef) return;
    setIsSaving(true);

    const updateData = {
      cadetName: editedName,
      company: editedCompany,
      platoon: editedPlatoon,
      content: editedContent,
      imageUrl: editedImage,
    };

    updateDoc(articleRef, updateData)
      .then(() => {
        setIsEditing(false);
        toast({ title: "Update Success", description: "Article revised in registry." });
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: articleRef.path,
          operation: 'update',
          requestResourceData: updateData,
        });
        errorEmitter.emit('permission-error', permissionError);
        toast({ 
          variant: "destructive", 
          title: "Save Error", 
          description: "Could not update article archive." 
        });
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 text-center">
        <ShieldCheck className="h-20 w-20 text-slate-200 mb-6" />
        <h2 className="text-3xl font-black uppercase text-slate-900">Access Restricted</h2>
        <p className="text-slate-500 font-bold mt-2">Authorized personnel only.</p>
        <Button onClick={() => router.push('/')} className="mt-10 rounded-2xl h-14 px-12 font-black shadow-xl">Return Dashboard</Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Harvesting Data...</p>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 text-center">
        <BookOpen className="h-20 w-20 text-slate-200 mb-6" />
        <h2 className="text-3xl font-black uppercase text-slate-900">Record Not Found</h2>
        <Button onClick={() => router.push('/magazine/manage')} className="mt-10 rounded-2xl h-14 px-12 font-black">Return to Registry</Button>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#f8fafc] pb-32">
      <header className="border-b bg-white/95 backdrop-blur-md px-4 md:px-8 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
          <Button variant="ghost" size="icon" onClick={() => router.push('/magazine/manage')} className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 hover:bg-white transition-all shrink-0">
            <ArrowLeft className="h-5 w-5 text-slate-900" />
          </Button>
          <div className="flex flex-col overflow-hidden">
            <div className="flex items-center gap-2 mb-0.5">
              <BookOpen className="h-3 w-3 text-primary" />
              <span className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.3em] text-primary truncate">Official Literary Registry</span>
            </div>
            <h1 className="text-sm md:text-base font-black tracking-tight text-slate-900 uppercase truncate">
              {isEditing ? "Revision Mode" : `OC ${article.cadetName}`}
            </h1>
          </div>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} className="rounded-xl font-bold h-9 px-4 text-xs">
            <Edit3 className="h-3.5 w-3.5 mr-2" /> Edit Record
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} disabled={isSaving} className="rounded-xl font-bold text-slate-500 text-xs">Cancel</Button>
            <Button onClick={handleSave} size="sm" disabled={isSaving} className="rounded-xl font-black bg-slate-900 hover:bg-slate-800 text-white h-9 px-4 text-xs">
              {isSaving ? <Loader2 className="animate-spin mr-2 h-3.5 w-3.5" /> : <Save className="mr-2 h-3.5 w-3.5" />}
              Commit
            </Button>
          </div>
        )}
      </header>

      <main className="max-w-6xl mx-auto mt-8 md:mt-12 px-4 md:px-8 space-y-10">
        
        {/* Contributor Profile Header Card */}
        <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
          <CardContent className="p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12">
              {/* Profile Image Section */}
              <div 
                className="relative group cursor-pointer shrink-0" 
                onClick={() => isEditing && fileInputRef.current?.click()}
              >
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] overflow-hidden border-4 border-slate-50 shadow-xl bg-slate-50">
                  {(isEditing ? editedImage : article.imageUrl) ? (
                    <img 
                      src={isEditing ? editedImage : article.imageUrl} 
                      alt="Cadet Profile" 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="h-16 w-16 text-slate-200" />
                    </div>
                  )}
                </div>
                {isEditing && (
                  <div className="absolute inset-0 bg-slate-900/40 rounded-[2.5rem] flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="h-8 w-8 text-white mb-1" />
                    <span className="text-[8px] font-black text-white uppercase tracking-widest">Edit</span>
                  </div>
                )}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
              </div>

              {/* Contributor Details */}
              <div className="flex-1 text-center md:text-left space-y-6">
                {isEditing ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Officer Cadet Name</Label>
                      <Input value={editedName} onChange={e => setEditedName(e.target.value)} className="h-10 font-bold text-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Company</Label>
                        <Select value={editedCompany} onValueChange={setEditedCompany}>
                          <SelectTrigger className="h-10 font-bold text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {COMPANIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Platoon</Label>
                        <Select value={editedPlatoon} onValueChange={setEditedPlatoon}>
                          <SelectTrigger className="h-10 font-bold text-sm">
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
                  <div className="space-y-4">
                    <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                      {article.cadetName}
                    </h2>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                      <Badge className="bg-slate-900 text-white border-none h-7 px-3 font-black rounded-lg text-[9px] uppercase tracking-widest">
                        {article.company} Company
                      </Badge>
                      <Badge variant="outline" className="h-7 px-3 font-black rounded-lg border-slate-200 text-slate-500 text-[9px] uppercase tracking-widest">
                        Platoon {article.platoon}
                      </Badge>
                      <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest ml-2">
                        <Calendar className="h-3.5 w-3.5 text-primary" />
                        {article.createdAt?.toDate ? article.createdAt.toDate().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Verified Date'}
                      </div>
                    </div>
                  </div>
                )}
                <div className="pt-2 flex justify-center md:justify-start">
                  <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Verified Contribution Registry</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Article Content Layout */}
        <Card className="border-none shadow-3xl rounded-[3rem] bg-white overflow-hidden min-h-[600px] flex flex-col animate-in slide-in-from-bottom-4 duration-700">
          <div className="h-2 w-full bg-primary" />
          <CardHeader className="p-8 md:p-16 pb-0 flex flex-row items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-50 rounded-2xl">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase">
                {isEditing ? "Revision Console" : "Literary Transcript"}
              </CardTitle>
            </div>
            <Quote className="h-12 w-12 text-slate-50 hidden md:block" />
          </CardHeader>
          
          <CardContent className="p-8 md:p-16">
            {isEditing ? (
              <Textarea 
                value={editedContent}
                onChange={e => setEditedContent(e.target.value)}
                className="min-h-[450px] text-base md:text-lg font-medium leading-relaxed bg-slate-50 border-slate-100 p-8 rounded-3xl"
                placeholder="Refine literary contribution..."
              />
            ) : (
              <div className="md:columns-2 md:gap-12 lg:gap-16 space-y-6 md:space-y-0 text-slate-700 font-medium leading-relaxed selection:bg-primary/10">
                <p className="text-sm md:text-base whitespace-pre-wrap first-letter:text-5xl first-letter:font-black first-letter:text-primary first-letter:mr-3 first-letter:float-left first-letter:leading-none">
                  {article.content}
                </p>
              </div>
            )}
          </CardContent>

          <footer className="p-10 border-t border-slate-50 bg-slate-50/50 mt-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">
                Registry ID: {article.id.toUpperCase()}
              </p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Secure Command Archive</span>
              </div>
            </div>
          </footer>
        </Card>

      </main>
    </div>
  );
}
