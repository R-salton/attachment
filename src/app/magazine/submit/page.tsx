
"use client";

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore } from '@/firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Camera, Loader2, Send, CheckCircle2, User, Building2, Layers, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const COMPANIES = ["Alpha", "Bravo", "Charlie"];
const PLATOONS = ["1", "2", "3"];

export default function MagazineSubmissionPortal() {
  const router = useRouter();
  const { toast } = useToast();
  const db = useFirestore();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    cadetName: '',
    company: '',
    platoon: '',
    content: '',
    image: ''
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
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
        setFormData(prev => ({ ...prev, image: canvas.toDataURL('image/jpeg', 0.7) }));
      };
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.cadetName || !formData.company || !formData.platoon || !formData.content) {
      toast({ variant: "destructive", title: "Incomplete Form", description: "Please provide all required fields." });
      return;
    }

    setIsLoading(true);
    try {
      const articleId = doc(collection(db, 'articles')).id;
      const articleRef = doc(db, 'articles', articleId);

      await setDoc(articleRef, {
        id: articleId,
        cadetName: formData.cadetName,
        company: formData.company,
        platoon: formData.platoon,
        content: formData.content,
        imageUrl: formData.image,
        createdAt: serverTimestamp()
      });

      setIsSuccess(true);
      toast({ title: "Article Submitted", description: "Thank you for your contribution to the Cadet Magazine." });
    } catch (error) {
      toast({ variant: "destructive", title: "Submission Error", description: "Could not upload your article. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4">
        <Card className="max-w-md w-full text-center p-8 md:p-12 rounded-[2rem] md:rounded-[2.5rem] border-none shadow-2xl animate-in zoom-in-95 duration-500">
          <div className="bg-emerald-100 w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-3xl flex items-center justify-center mx-auto mb-6 md:mb-8">
            <CheckCircle2 className="text-emerald-600 h-8 w-8 md:h-10 md:w-10" />
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tighter mb-3 md:mb-4">Registry Success</h2>
          <p className="text-slate-500 font-bold mb-6 md:mb-8 text-sm md:text-base">Your contribution has been archived in the Cadet Magazine editorial vault.</p>
          <Button onClick={() => window.location.reload()} className="w-full rounded-xl md:rounded-2xl h-12 md:h-14 font-black text-sm md:text-base">Submit Another Article</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] py-8 md:py-12 px-4 md:px-6">
      <div className="max-w-3xl mx-auto space-y-6 md:space-y-8">
        <div className="text-center space-y-2 md:space-y-3">
          <div className="bg-primary w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-[2rem] flex items-center justify-center mx-auto shadow-xl shadow-primary/20 mb-3 md:mb-4">
            <BookOpen className="text-white h-6 w-6 md:h-8 md:w-8" />
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase">Magazine Portal</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[8px] md:text-[10px]">Editorial Contribution Terminal | Non-Authenticated Session</p>
        </div>

        <Card className="border-none shadow-2xl md:shadow-3xl rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden bg-white">
          <CardHeader className="bg-slate-900 text-white p-6 md:p-10">
            <CardTitle className="text-xl md:text-2xl font-black tracking-tight">Article Submission</CardTitle>
            <CardDescription className="text-slate-400 font-bold text-xs md:text-base">Provide your details and literary contribution below.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 md:p-10 space-y-6 md:space-y-8">
            <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-2 md:space-y-3">
                  <Label className="text-[10px] md:text-xs font-black uppercase text-slate-500 ml-1">Officer Cadet Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                      placeholder="e.g. MUGABO Paul" 
                      className="pl-11 h-11 md:h-12 rounded-xl text-sm"
                      value={formData.cadetName}
                      onChange={e => setFormData(prev => ({...prev, cadetName: e.target.value}))}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div className="space-y-2 md:space-y-3">
                    <Label className="text-[10px] md:text-xs font-black uppercase text-slate-500 ml-1">Company</Label>
                    <Select value={formData.company} onValueChange={v => setFormData(prev => ({...prev, company: v}))}>
                      <SelectTrigger className="h-11 md:h-12 rounded-xl text-sm">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {COMPANIES.map(c => <SelectItem key={c} value={c} className="text-sm">{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:space-y-3">
                    <Label className="text-[10px] md:text-xs font-black uppercase text-slate-500 ml-1">Platoon</Label>
                    <Select value={formData.platoon} onValueChange={v => setFormData(prev => ({...prev, platoon: v}))}>
                      <SelectTrigger className="h-11 md:h-12 rounded-xl text-sm">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {PLATOONS.map(p => <SelectItem key={p} value={p} className="text-sm">{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-2 md:space-y-3">
                <Label className="text-[10px] md:text-xs font-black uppercase text-slate-500 ml-1">Literary Contribution (Article Text)</Label>
                <Textarea 
                  placeholder="Draft your article here..." 
                  className="min-h-[250px] md:min-h-[300px] rounded-xl md:rounded-2xl bg-slate-50 border-slate-100 font-medium leading-relaxed text-sm md:text-base p-4 md:p-6"
                  value={formData.content}
                  onChange={e => setFormData(prev => ({...prev, content: e.target.value}))}
                  required
                />
              </div>

              <div className="space-y-3 md:space-y-4 pt-2 md:pt-4">
                <Label className="text-[10px] md:text-xs font-black uppercase text-slate-500 ml-1">Profile Photo (Optional)</Label>
                <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6">
                  <div 
                    className="w-24 h-24 md:w-32 md:h-32 rounded-2xl md:rounded-3xl border-2 border-dashed border-slate-200 flex items-center justify-center bg-slate-50 overflow-hidden cursor-pointer hover:border-primary transition-colors shrink-0"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {formData.image ? (
                      <img src={formData.image} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="h-6 w-6 md:h-8 md:w-8 text-slate-300" />
                    )}
                  </div>
                  <div className="space-y-1.5 md:space-y-2 text-center sm:text-left">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="rounded-xl font-bold h-9 md:h-10 text-xs md:text-sm border-slate-200 bg-white"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {formData.image ? 'Change Photo' : 'Choose Profile Image'}
                    </Button>
                    <p className="text-[8px] md:text-[10px] text-slate-400 font-bold uppercase tracking-widest">JPG/PNG | Auto-Compressed</p>
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                </div>
              </div>

              <Button type="submit" disabled={isLoading} className="w-full h-14 md:h-16 rounded-xl md:rounded-[2rem] font-black text-base md:text-lg bg-primary hover:bg-primary/90 shadow-xl md:shadow-2xl shadow-primary/20 transition-all active:scale-95">
                {isLoading ? <Loader2 className="animate-spin mr-2 md:mr-3 h-5 w-5 md:h-6 md:w-6" /> : <Send className="mr-2 md:mr-3 h-5 w-5 md:h-6 md:w-6" />}
                AUTHORIZE SUBMISSION
              </Button>
            </form>
          </CardContent>
          <CardFooter className="bg-slate-50 border-t p-6 md:p-8 flex justify-center">
            <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-tighter md:tracking-[0.2em] text-center leading-relaxed max-w-md">
              Official Cadet Magazine Registry. By submitting, you authorize editorial review and archival within the command literary database.
            </p>
          </CardFooter>
        </Card>
        
        <div className="flex justify-center pb-8">
          <Button variant="ghost" size="sm" onClick={() => router.push('/')} className="text-slate-400 hover:text-slate-600 font-bold rounded-xl text-[10px] uppercase tracking-widest">
            <ArrowLeft className="h-3 w-3 mr-2" /> Return Home
          </Button>
        </div>
      </div>
    </div>
  );
}
