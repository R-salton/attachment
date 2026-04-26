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
  Phone,
  Baby,
  Accessibility,
  Eye,
  FileText
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { recordLog } from '@/lib/logger';

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
    visitor1: { 
      fullName: '', 
      idNumber: '', 
      age: '', 
      telephone: '', 
      district: '', 
      sector: '', 
      cell: '', 
      village: '', 
      profession: '', 
      childBelow6: '', 
      disability: '' 
    },
    visitor2: { 
      fullName: '', 
      idNumber: '', 
      age: '', 
      telephone: '', 
      district: '', 
      sector: '', 
      cell: '', 
      village: '', 
      profession: '', 
      childBelow6: '', 
      disability: '' 
    }
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
        cadetName: selectedCadet.toUpperCase(),
        platoon: selectedPlatoon,
        visitor1: formData.visitor1,
        visitor2: formData.visitor2,
        createdAt: serverTimestamp()
      });

      recordLog(db, {
        userId: 'VISITOR_PORTAL',
        userName: selectedCadet.toUpperCase(),
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

  const VisitorSummary = ({ title, data }: { title: string, data: any }) => (
    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
      <h4 className="text-[10px] font-black text-primary uppercase tracking-widest">{title}</h4>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] md:text-xs">
        <div className="text-slate-400 font-bold uppercase">Name:</div>
        <div className="text-slate-900 font-black">{data.fullName || 'N/A'}</div>
        <div className="text-slate-400 font-bold uppercase">ID/NID:</div>
        <div className="text-slate-900 font-black">{data.idNumber || 'N/A'}</div>
        <div className="text-slate-400 font-bold uppercase">Age:</div>
        <div className="text-slate-900 font-black">{data.age}</div>
        <div className="text-slate-400 font-bold uppercase">Tel:</div>
        <div className="text-slate-900 font-black">{data.telephone || 'N/A'}</div>
        <div className="text-slate-400 font-bold uppercase">District:</div>
        <div className="text-slate-900 font-black">{data.district || 'N/A'}</div>
        <div className="text-slate-400 font-bold uppercase">Sector:</div>
        <div className="text-slate-900 font-black">{data.sector || 'N/A'}</div>
      </div>
    </div>
  );

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
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Section {step} of 4</span>
              </div>
              <div className="flex gap-1">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className={`h-1 rounded-full transition-all duration-500 ${step >= i ? 'w-6 bg-primary' : 'w-2 bg-slate-700'}`} />
                ))}
              </div>
            </div>
            <CardTitle className="text-2xl md:text-3xl font-black tracking-tight uppercase">
              {step === 1 ? 'Cadet Identity' : step === 2 ? 'Visitor One' : step === 3 ? 'Visitor Two' : 'Verify Entries'}
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

                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <Label className="text-[10px] font-black uppercase text-primary tracking-widest">Location Registry</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-500">District</Label>
                      <Input 
                        placeholder="e.g. RWAMAGANA" 
                        className="h-11 rounded-xl bg-slate-50"
                        value={formData[step === 2 ? 'visitor1' : 'visitor2'].district}
                        onChange={e => handleVisitorChange(step === 2 ? 'visitor1' : 'visitor2', 'district', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-500">Sector</Label>
                      <Input 
                        placeholder="e.g. GISHARI" 
                        className="h-11 rounded-xl bg-slate-50"
                        value={formData[step === 2 ? 'visitor1' : 'visitor2'].sector}
                        onChange={e => handleVisitorChange(step === 2 ? 'visitor1' : 'visitor2', 'sector', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-500">Cell</Label>
                      <Input 
                        placeholder="e.g. CELL NAME" 
                        className="h-11 rounded-xl bg-slate-50"
                        value={formData[step === 2 ? 'visitor1' : 'visitor2'].cell}
                        onChange={e => handleVisitorChange(step === 2 ? 'visitor1' : 'visitor2', 'cell', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-500">Village</Label>
                      <Input 
                        placeholder="e.g. VILLAGE" 
                        className="h-11 rounded-xl bg-slate-50"
                        value={formData[step === 2 ? 'visitor1' : 'visitor2'].village}
                        onChange={e => handleVisitorChange(step === 2 ? 'visitor1' : 'visitor2', 'village', e.target.value)}
                      />
                    </div>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 border-y border-slate-100">
                   <div className="space-y-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Baby className="h-3.5 w-3.5 text-primary" />
                        <Label className="text-[10px] font-black uppercase text-slate-500">ACCOMPANIED BY CHILD Below 6 (Ages only)</Label>
                      </div>
                      <Input 
                        placeholder="e.g. 2, 4 or None" 
                        className="h-11 rounded-xl bg-slate-50"
                        value={formData[step === 2 ? 'visitor1' : 'visitor2'].childBelow6}
                        onChange={e => handleVisitorChange(step === 2 ? 'visitor1' : 'visitor2', 'childBelow6', e.target.value)}
                      />
                   </div>
                   <div className="space-y-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Accessibility className="h-3.5 w-3.5 text-primary" />
                        <Label className="text-[10px] font-black uppercase text-slate-500">Living with Disability?</Label>
                      </div>
                      <Input 
                        placeholder="e.g. None, or specific detail" 
                        className="h-11 rounded-xl bg-slate-50"
                        value={formData[step === 2 ? 'visitor1' : 'visitor2'].disability}
                        onChange={e => handleVisitorChange(step === 2 ? 'visitor1' : 'visitor2', 'disability', e.target.value)}
                      />
                   </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <Button variant="ghost" onClick={() => setStep(step - 1)} className="h-14 px-8 rounded-2xl font-bold">Back</Button>
                  <Button 
                    onClick={() => setStep(step + 1)} 
                    className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest shadow-xl"
                  >
                    Continue <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
                <div className="bg-primary/5 p-6 rounded-[2rem] border border-primary/10 space-y-4">
                  <div className="flex items-center gap-3 border-b border-primary/10 pb-3">
                    <ShieldCheck className="h-6 w-6 text-primary" />
                    <h3 className="font-black text-slate-900 uppercase tracking-tight">Identity Confirmation</h3>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Officer Cadet:</span>
                    <span className="text-xl font-black text-slate-900 uppercase">{selectedCadet}</span>
                    <Badge className="w-fit mt-1 px-3 py-1 font-black bg-slate-900 text-white border-none">{selectedPlatoon} PLATOON</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <VisitorSummary title="Visitor One" data={formData.visitor1} />
                  <VisitorSummary title="Visitor Two" data={formData.visitor2} />
                </div>

                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex gap-3">
                  <Eye className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[10px] md:text-xs font-bold text-amber-800 leading-relaxed">
                    Verify all entries carefully. Once submitted, this record will be archived in the official command registry and cannot be edited by the sender.
                  </p>
                </div>

                <div className="flex gap-4">
                  <Button variant="ghost" onClick={() => setStep(3)} className="h-16 px-8 rounded-2xl font-bold" disabled={isLoading}>Back</Button>
                  <Button 
                    onClick={handleSubmit} 
                    className="flex-1 h-16 rounded-[1.5rem] font-black uppercase tracking-widest shadow-2xl shadow-primary/30 bg-primary hover:bg-primary/90"
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : <Send className="mr-2 h-5 w-5" />}
                    SUBMIT
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

