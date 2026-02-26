
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
import { BookOpen, Camera, Loader2, Send, CheckCircle2, User, Building2, Layers } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const COMPANIES = ["Alpha", "Bravo", "Charlie"];
const PLATOONS = ["1", "2", "3"];

export default function MagazineSubmissionPortal() {
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
      <div className="flex-1 flex items-center justify-center bg-slate-50 p-6">
        <Card className="max-w-md w-full text-center p-12 rounded-[2.5rem] border-none shadow-2xl animate-in zoom-in-95 duration-500">
          <div className="bg-emerald-100 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 className="text-emerald-600 h-10 w-10" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-4">Registry Success</h2>
          <p className="text-slate-500 font-bold mb-8">Your contribution has been archived in the Cadet Magazine editorial vault.</p>
          <Button onClick={() => window.location.reload()} className="w-full rounded-2xl h-14 font-black">Submit Another Article</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-50 py-12 px-4 md:px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <div className="bg-primary w-16 h-16 rounded-[2rem] flex items-center justify-center mx-auto shadow-xl shadow-primary/20 mb-4">
            <BookOpen className="text-white h-8 w-8" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase">Magazine Portal</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] md:text-xs">Editorial Contribution Terminal | Non-Authenticated Session</p>
        </div>

        <Card className="border-none shadow-3xl rounded-[2.5rem] overflow-hidden bg-white">
          <CardHeader className="bg-slate-900 text-white p-8 md:p-10">
            <CardTitle className="text-2xl font-black tracking-tight">Article Submission</CardTitle>
            <CardDescription className="text-slate-400 font-bold">Provide your details and literary contribution below.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 md:p-10 space-y-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-xs font-black uppercase text-slate-500 ml-1">Officer Cadet Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                      placeholder="e.g. MUGABO Paul" 
                      className="pl-12 h-12 rounded-xl"
                      value={formData.cadetName}
                      onChange={e => setFormData(prev => ({...prev, cadetName: e.target.value}))}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Label className="text-xs font-black uppercase text-slate-500 ml-1">Company</Label>
                    <Select value={formData.company} onValueChange={v => setFormData(prev => ({...prev, company: v}))}>
                      <SelectTrigger className="h-12 rounded-xl">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {COMPANIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xs font-black uppercase text-slate-500 ml-1">Platoon</Label>
                    <Select value={formData.platoon} onValueChange={v => setFormData(prev => ({...prev, platoon: v}))}>
                      <SelectTrigger className="h-12 rounded-xl">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {PLATOONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-black uppercase text-slate-500 ml-1">Literary Contribution (Article Text)</Label>
                <Textarea 
                  placeholder="Draft your article here..." 
                  className="min-h-[300px] rounded-2xl bg-slate-50 border-slate-100 font-medium leading-relaxed"
                  value={formData.content}
                  onChange={e => setFormData(prev => ({...prev, content: e.target.value}))}
                  required
                />
              </div>

              <div className="space-y-4 pt-4">
                <Label className="text-xs font-black uppercase text-slate-500 ml-1">Profile Photo (Optional)</Label>
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div 
                    className="w-32 h-32 rounded-3xl border-2 border-dashed border-slate-200 flex items-center justify-center bg-slate-50 overflow-hidden cursor-pointer hover:border-primary transition-colors shrink-0"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {formData.image ? (
                      <img src={formData.image} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="h-8 w-8 text-slate-300" />
                    )}
                  </div>
                  <div className="space-y-2 text-center md:text-left">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="rounded-xl font-bold h-10"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Choose Profile Image
                    </Button>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">JPG or PNG | Automatic Compression Active</p>
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                </div>
              </div>

              <Button type="submit" disabled={isLoading} className="w-full h-16 rounded-[2rem] font-black text-lg bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/20 transition-all active:scale-95">
                {isLoading ? <Loader2 className="animate-spin mr-3 h-6 w-6" /> : <Send className="mr-3 h-6 w-6" />}
                AUTHORIZE SUBMISSION
              </Button>
            </form>
          </CardContent>
          <CardFooter className="bg-slate-50 border-t p-6 md:p-8 flex justify-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center leading-relaxed">
              Official Cadet Magazine Registry. By submitting, you authorize editorial review and archival within the command literary database.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
