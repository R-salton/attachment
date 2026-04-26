
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore } from '@/firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Users, 
  User, 
  Send, 
  Loader2, 
  CheckCircle2, 
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  MapPin,
  Phone
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { recordLog } from '@/lib/logger';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const PLATOONS = ["A1", "A2", "A3", "B1", "B2", "B3", "C1", "C2", "C3"];

export default function VisitorRegistration() {
  const router = useRouter();
  const { toast } = useToast();
  const db = useFirestore();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [selectedPlatoon, setSelectedPlatoon] = useState<string>('');
  const [selectedCadet, setSelectedCadet] = useState<string>('');

  const [formData, setFormData] = useState({
    visitor1: { fullName: '', idNumber: '', age: '', telephone: '', location: '', profession: '', childBelow6: 'No', childAge: '', disability: 'No' },
    visitor2: { fullName: '', idNumber: '', age: '', telephone: '', location: '', profession: '', childBelow6: 'No', childAge: '', disability: 'No' }
  });

  const handleVisitorChange = (visitorKey: 'visitor1' | 'visitor2', field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [visitorKey]: { ...prev[visitorKey], [field]: value }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCadet || !selectedPlatoon) {
      toast({ variant: "destructive", title: "Incomplete Identity", description: "Please enter your name and select your platoon." });
      return;
    }

    setIsLoading(true);
    try {
      const responseId = doc(collection(db, 'visitor_responses')).id;
      const responseRef = doc(db, 'visitor_responses', responseId);

      await setDoc(responseRef, {
        id: responseId,
        cadetName: selectedCadet,
        platoon: selectedPlatoon,
        visitor1: formData.visitor1,
        visitor2: formData.visitor2,
        createdAt: serverTimestamp()
      });

      recordLog(db, {
        userId: 'VISITOR_PORTAL',
        userName: selectedCadet,
        action: 'VISITOR_REGISTERED',
        details: `Registered visitors for Platoon ${selectedPlatoon}`
      });

      setIsSuccess(true);
      toast({ title: "Registration archived", description: "Your visitor data has been securely recorded." });
    } catch (error) {
      toast({ variant: "destructive", title: "Storage Error", description: "Could not archive records. Try again." });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="max-w-md w-full text-center p-10 rounded-[2.5rem] border-none shadow-3xl animate-in zoom-in-95 duration-700">
          <div className="bg-emerald-100 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 className="text-emerald-600 h-10 w-10" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-4">Registry Secured</h2>
          <p className="text-slate-500 font-bold mb-10 leading-relaxed">Your visitor information has been processed and added to the official command registry.</p>
          <Button onClick={() => window.location.reload()} className="w-full h-14 rounded-2xl font-black uppercase text-sm tracking-widest shadow-xl shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700">New Registration</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] py-8 md:py-16 px-4 md:px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <div className="bg-primary w-16 h-16 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-primary/20 mb-6 transform -rotate-6">
            <Users className="text-white h-8 w-8" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">Visitor Protocol</h1>
          <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">Officer Cadet Intake 14/25-26 Registry</p>
        </div>

        <Card className="border-none shadow-[0_48px_96px_-12px_rgba(0,0,0,0.12)] rounded-[2.5rem] overflow-hidden bg-white">
          <div className="bg-slate-900 text-white p-8 md:p-12">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Section {step} of 3</span>
              </div>
              <div className="flex gap-1">
                {[1, 2, 3].map(i => (
                  <div key={i} className={`h-1 rounded-full transition-all duration-500 ${step >= i ? 'w-6 bg-primary' : 'w-2 bg-slate-700'}`} />
                ))}
              </div>
            </div>
            <CardTitle className="text-2xl md:text-3xl font-black tracking-tight uppercase">
              {step === 1 ? 'Cadet Identity' : step === 2 ? 'Visitor One' : 'Visitor Two'}
            </CardTitle>
          </div>

          <CardContent className="p-8 md:p-12">
            {step === 1 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Select Platoon</Label>
                  <Select value={selectedPlatoon} onValueChange={setSelectedPlatoon}>
                    <SelectTrigger className="h-14 rounded-2xl border-slate-200 bg-slate-50/50 text-base font-bold shadow-inner">
                      <SelectValue placeholder="Choose Platoon..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {PLATOONS.map(p => <SelectItem key={p} value={p} className="font-bold">{p} Platoon</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Officer Cadet Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input 
                      placeholder="Type your full name..." 
                      className="pl-12 h-14 rounded-2xl border-slate-200 bg-slate-50/50 text-base font-bold shadow-inner uppercase"
                      value={selectedCadet}
                      onChange={(e) => setSelectedCadet(e.target.value)}
                    />
                  </div>
                </div>

                <Button 
                  disabled={!selectedCadet || !selectedPlatoon} 
                  onClick={() => setStep(2)} 
                  className="w-full h-16 rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl shadow-primary/20 group"
                >
                  Proceed to Visitors
                  <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            )}

            {(step === 2 || step === 3) && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input 
                        placeholder="Visitor's Name" 
                        className="pl-11 h-12 rounded-xl bg-slate-50 border-slate-200" 
                        value={formData[step === 2 ? 'visitor1' : 'visitor2'].fullName}
                        onChange={e => handleVisitorChange(step === 2 ? 'visitor1' : 'visitor2', 'fullName', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500">ID Number (NID)</Label>
                    <Input 
                      placeholder="1 19XX ..." 
                      className="h-12 rounded-xl bg-slate-50 border-slate-200" 
                      value={formData[step === 2 ? 'visitor1' : 'visitor2'].idNumber}
                      onChange={e => handleVisitorChange(step === 2 ? 'visitor1' : 'visitor2', 'idNumber', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500">Age</Label>
                    <Input 
                      type="number" 
                      placeholder="Age" 
                      className="h-12 rounded-xl bg-slate-50 border-slate-200" 
                      value={formData[step === 2 ? 'visitor1' : 'visitor2'].age}
                      onChange={e => handleVisitorChange(step === 2 ? 'visitor1' : 'visitor2', 'age', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500">Telephone</Label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input 
                        placeholder="07XX ..." 
                        className="pl-11 h-12 rounded-xl bg-slate-50 border-slate-200" 
                        value={formData[step === 2 ? 'visitor1' : 'visitor2'].telephone}
                        onChange={e => handleVisitorChange(step === 2 ? 'visitor1' : 'visitor2', 'telephone', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-500">Location (District / Sector / Cell / Village)</Label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                      placeholder="e.g. RWAMAGANA / GISHARI / ..." 
                      className="pl-11 h-12 rounded-xl bg-slate-50 border-slate-200" 
                      value={formData[step === 2 ? 'visitor1' : 'visitor2'].location}
                      onChange={e => handleVisitorChange(step === 2 ? 'visitor1' : 'visitor2', 'location', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-500">Profession</Label>
                  <Input 
                    placeholder="Visitor's Job" 
                    className="h-12 rounded-xl bg-slate-50 border-slate-200" 
                    value={formData[step === 2 ? 'visitor1' : 'visitor2'].profession}
                    onChange={e => handleVisitorChange(step === 2 ? 'visitor1' : 'visitor2', 'profession', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4 border-y border-slate-100">
                   <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase text-slate-400">Child below 6 years?</Label>
                      <RadioGroup 
                        value={formData[step === 2 ? 'visitor1' : 'visitor2'].childBelow6} 
                        onValueChange={v => handleVisitorChange(step === 2 ? 'visitor1' : 'visitor2', 'childBelow6', v)}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2 bg-slate-50 px-4 py-2 rounded-lg border">
                          <RadioGroupItem value="Yes" id={`y-${step}`} /><Label htmlFor={`y-${step}`} className="font-bold">Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2 bg-slate-50 px-4 py-2 rounded-lg border">
                          <RadioGroupItem value="No" id={`n-${step}`} /><Label htmlFor={`n-${step}`} className="font-bold">No</Label>
                        </div>
                      </RadioGroup>
                   </div>
                   {formData[step === 2 ? 'visitor1' : 'visitor2'].childBelow6 === 'Yes' && (
                     <div className="space-y-2 animate-in slide-in-from-left-2">
                        <Label className="text-[10px] font-black uppercase text-slate-500">Child's Age</Label>
                        <Input 
                          placeholder="e.g. 4 years" 
                          className="h-12 rounded-xl"
                          value={formData[step === 2 ? 'visitor1' : 'visitor2'].childAge}
                          onChange={e => handleVisitorChange(step === 2 ? 'visitor1' : 'visitor2', 'childAge', e.target.value)}
                        />
                     </div>
                   )}
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Living with Disability?</Label>
                  <RadioGroup 
                    value={formData[step === 2 ? 'visitor1' : 'visitor2'].disability} 
                    onValueChange={v => handleVisitorChange(step === 2 ? 'visitor1' : 'visitor2', 'disability', v)}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2 bg-slate-50 px-4 py-2 rounded-lg border">
                      <RadioGroupItem value="Yes" id={`dy-${step}`} /><Label htmlFor={`dy-${step}`} className="font-bold">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2 bg-slate-50 px-4 py-2 rounded-lg border">
                      <RadioGroupItem value="No" id={`dn-${step}`} /><Label htmlFor={`dn-${step}`} className="font-bold">No</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="flex gap-4 pt-6">
                  <Button variant="ghost" onClick={() => setStep(step - 1)} className="h-14 px-8 rounded-2xl font-bold">Back</Button>
                  <Button 
                    onClick={step === 2 ? () => setStep(3) : handleSubmit} 
                    className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest shadow-xl"
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : step === 2 ? <ChevronRight className="mr-2 h-5 w-5" /> : <Send className="mr-2 h-5 w-5" />}
                    {step === 2 ? 'Continue to Visitor 2' : 'Authorize Registry'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <div className="text-center">
          <Button variant="ghost" size="sm" onClick={() => router.push('/')} className="text-slate-400 font-bold uppercase tracking-widest text-[9px] h-10 hover:text-slate-900 transition-all">
            <ArrowLeft className="h-3 w-3 mr-2" /> Back to Terminal
          </Button>
        </div>
      </div>
    </div>
  );
}
