"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  FileText, 
  Loader2, 
  ChevronRight, 
  ChevronLeft, 
  Eye, 
  ShieldAlert, 
  ShieldCheck, 
  Plus, 
  Trash2,
  Clock,
  AlertTriangle,
  ArrowLeft,
  Lightbulb,
  Save,
  UserCheck,
  Type,
  Sparkles,
  Zap,
  Camera,
  ImageIcon,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { formatDailyReport, SituationReportInput } from '@/lib/report-formatter';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useUserProfile } from '@/hooks/use-user-profile';
import { RichTextEditor } from '@/components/ui/rich-text-editor';

const UNITS = ["Gasabo DPU", "Kicukiro DPU", "Nyarugenge DPU", "TRS", "SIF", "TFU", "ORDERLY REPORT"];

const FormSchema = z.object({
  reportDate: z.string().min(1, "Date is required"),
  unitName: z.string().min(1, "Unit name is required"),
  dayNumber: z.string().min(1, "Day number is required"),
  operationalSummary: z.string().optional().default(''),
  securitySituation: z.string().optional().default('calm and stable'),
  incidents: z.array(z.object({
    time: z.string().optional().default(''),
    description: z.string().optional().default('')
  })).default([]),
  actionTaken: z.string().optional().default(''),
  dutiesConducted: z.string().optional().default(''),
  casualties: z.string().optional().default('No casualties'),
  disciplinaryCases: z.string().optional().default('No disciplinary cases'),
  challenges: z.string().optional().default(''),
  recommendations: z.string().optional().default(''),
  overallSummary: z.string().optional().default(''),
  commanderName: z.string().min(1, "Commander name is required"),
  orderlyOfficerReport: z.string().optional().default(''),
  strategicNarrative: z.string().optional().default(''),
  images: z.array(z.string()).max(4).default([]),
});

type FormValues = z.infer<typeof FormSchema>;

/**
 * Aggressively compresses an image to stay under Firestore document limits.
 */
const compressImage = (base64Str: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 600;
      const MAX_HEIGHT = 600;
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
      resolve(canvas.toDataURL('image/jpeg', 0.6));
    };
  });
};

export default function NewDailyReport() {
  const router = useRouter();
  const { toast } = useToast();
  const db = useFirestore();
  const { user, profile, isAdmin, isLoading: isAuthLoading } = useUserProfile();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("header");
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      reportDate: '',
      unitName: '',
      dayNumber: '',
      operationalSummary: '',
      securitySituation: 'calm and stable',
      incidents: [],
      actionTaken: '',
      dutiesConducted: '',
      casualties: 'No casualties',
      disciplinaryCases: 'No disciplinary cases',
      challenges: '',
      recommendations: '',
      overallSummary: '',
      commanderName: '',
      orderlyOfficerReport: '',
      strategicNarrative: '',
      images: [],
    },
  });

  useEffect(() => {
    const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).toUpperCase();
    form.setValue('reportDate', today);

    if (profile) {
      form.setValue('unitName', profile.unit || UNITS[0]);
      form.setValue('commanderName', profile.displayName || '');
    }
  }, [profile, form]);

  const { fields: incidentFields, append: appendIncident, remove: removeIncident } = useFieldArray({
    control: form.control,
    name: "incidents"
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const currentImages = form.getValues('images');
    
    if (currentImages.length + files.length > 4) {
      toast({ 
        variant: "destructive", 
        title: "Limit Reached", 
        description: "You can only attach up to 4 images per report." 
      });
      return;
    }

    setIsLoading(true);
    try {
      const newImages = await Promise.all(
        files.map(file => new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = async () => {
            const compressed = await compressImage(reader.result as string);
            resolve(compressed);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        }))
      );

      form.setValue('images', [...currentImages, ...newImages]);
      toast({ title: "Media Attached", description: `${files.length} evidence photos optimized for archive.` });
    } catch (error) {
      toast({ 
        variant: "destructive", 
        title: "Upload Failed", 
        description: "Could not process one or more images." 
      });
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    const currentImages = form.getValues('images');
    form.setValue('images', currentImages.filter((_, i) => i !== index));
  };

  const onSubmitPreview = async (values: FormValues) => {
    if (!user) {
      toast({ variant: "destructive", title: "Authentication Required", description: "You must be signed in to generate reports." });
      return;
    }

    setIsLoading(true);
    try {
      const formattedInput: SituationReportInput = {
        ...values,
        dayNumber: values.dayNumber || 'N/A',
        dutiesConducted: values.dutiesConducted?.split('\n').filter(s => s.trim()) || [],
        challenges: values.challenges?.split('\n').filter(s => s.trim()) || [],
        recommendations: values.recommendations?.split('\n').filter(s => s.trim()) || [],
        forceDiscipline: {
          casualties: values.casualties || 'No casualties',
          disciplinaryCases: values.disciplinaryCases || 'No disciplinary cases'
        },
        actionTaken: values.actionTaken || '',
        orderlyOfficerReport: (isAdmin && values.orderlyOfficerReport) ? values.orderlyOfficerReport : values.strategicNarrative,
        images: values.images
      };

      const content = formatDailyReport(formattedInput);
      setPreviewContent(content);
      setActiveTab("preview");
      toast({ title: "Preview Generated", description: "Review the SITUATION REPORT below." });
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Formatting Error", description: "Could not format the report data." });
    } finally {
      setIsLoading(false);
    }
  };

  const saveReport = () => {
    if (!user || !db || !previewContent || !profile) return;
    setIsLoading(true);

    const values = form.getValues();
    const reportId = doc(collection(db, 'reports')).id;
    const reportRef = doc(db, 'reports', reportId);

    const reportData = {
      id: reportId,
      ownerId: user.uid,
      reportDate: values.reportDate.toUpperCase(),
      dayNumber: parseInt(values.dayNumber) || 0,
      unit: values.unitName,
      reportTitle: values.unitName === 'ORDERLY REPORT' ? `OVERALL REPORT - ${values.reportDate}` : `SITUATION REPORT - ${values.unitName} (${values.reportDate})`,
      reportingCommanderName: values.commanderName,
      reportingCommanderTitle: 'Officer in Charge',
      fullText: previewContent,
      images: values.images,
      status: 'SUBMITTED',
      createdAt: serverTimestamp(),
    };

    setDoc(reportRef, reportData)
      .then(() => {
        toast({ title: "Report Saved", description: "SITUATION REPORT has been archived." });
        router.push('/reports');
      })
      .catch(error => {
        console.error("Save error:", error);
        toast({ 
          variant: "destructive", 
          title: "Archive Failed", 
          description: "Could not save report. Total data size (including high-res images) may exceed registry limits." 
        });
        const contextualError = new FirestorePermissionError({
          path: reportRef.path,
          operation: 'create',
          requestResourceData: reportData
        });
        errorEmitter.emit('permission-error', contextualError);
      })
      .finally(() => {
        setIsLoading(false);
        setShowConfirmDialog(false);
      });
  };

  if (isAuthLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const tabs = [
    { id: "header", label: "Basics" },
    { id: "summary", label: "Operations" },
    { id: "incidents", label: "Security" },
    { id: "discipline", label: "Force" },
    { id: "media", label: "Media", icon: Camera },
  ];

  if (isAdmin) {
    tabs.splice(4, 0, { id: "orderly", label: "Orderly Officer", icon: Sparkles });
  }

  tabs.push({ id: "preview", label: "Review", icon: Eye });

  return (
    <div className="flex-1 bg-[#f8fafc] pb-24">
      <header className="border-b bg-white px-4 md:px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="md:hidden">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex flex-col">
            <h1 className="text-lg md:text-xl font-extrabold text-slate-900 leading-none">Situation Report</h1>
            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-primary mt-1">Operational Protocol</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => form.reset()} className="hidden sm:flex rounded-xl">Reset</Button>
          <Button size="sm" disabled={isLoading} onClick={form.handleSubmit(onSubmitPreview)} className="rounded-xl font-bold">
            {isLoading ? <Loader2 className="animate-spin mr-1 h-3.5 w-3.5" /> : <Eye className="mr-1 h-3.5 w-3.5" />}
            Preview
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto mt-4 md:mt-10 px-4 md:px-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 md:space-y-8">
          <div className="bg-white p-1 rounded-2xl border shadow-sm sticky top-[68px] md:top-[73px] z-40 overflow-x-auto">
            <TabsList className="w-full h-auto flex justify-start gap-1 bg-transparent border-none p-0 scrollbar-hide">
              {tabs.map((tab) => (
                <TabsTrigger 
                  key={tab.id} 
                  value={tab.id}
                  className="px-4 md:px-6 py-2 md:py-2.5 text-[10px] md:text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl transition-all whitespace-nowrap"
                >
                  {tab.icon && <tab.icon className="w-3 h-3 md:w-3.5 md:h-3.5 mr-1.5 md:mr-2" />}
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <Card className="shadow-xl border-none rounded-[1.5rem] md:rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-slate-900 text-white p-6 md:p-8">
              <CardTitle className="flex items-center gap-3 text-lg md:text-xl">
                <div className="p-1.5 md:p-2 bg-white/10 rounded-lg">
                  {tabs.find(t => t.id === activeTab)?.icon ? (
                    (() => {
                      const Icon = tabs.find(t => t.id === activeTab)!.icon!;
                      return <Icon className="h-4 w-4 md:h-5 md:w-5" />;
                    })()
                  ) : (
                    <ShieldCheck className="h-4 w-4 md:h-5 md:w-5" />
                  )}
                </div>
                {tabs.find(t => t.id === activeTab)?.label}
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs md:text-sm">Section {tabs.findIndex(t => t.id === activeTab) + 1} of {tabs.length}</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 md:pt-8 px-6 md:px-8">
              
              <TabsContent value="header" className="space-y-8 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  <div className="space-y-2 md:space-y-3">
                    <Label className="font-bold text-slate-700 text-xs md:text-sm">Report Date</Label>
                    <Input {...form.register('reportDate')} className="h-11 rounded-xl text-sm" placeholder="e.g. 18 FEB 26" />
                  </div>
                  <div className="space-y-2 md:space-y-3">
                    <Label className="font-bold text-slate-700 text-xs md:text-sm">Unit Name</Label>
                    <Select 
                      value={form.watch('unitName')} 
                      onValueChange={(val) => form.setValue('unitName', val)}
                    >
                      <SelectTrigger className="h-11 rounded-xl text-sm">
                        <SelectValue placeholder="Select Deployment Unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:space-y-3">
                    <Label className="font-bold text-slate-700 text-xs md:text-sm">Day Number of Attachment</Label>
                    <Input {...form.register('dayNumber')} type="number" className="h-11 rounded-xl text-sm" placeholder="e.g. 3" />
                  </div>
                  <div className="space-y-2 md:space-y-3">
                    <Label className="font-bold text-slate-700 text-xs md:text-sm">Officer in Charge (Full Name)</Label>
                    <Input {...form.register('commanderName')} className="h-11 rounded-xl text-sm" placeholder="e.g. CASTRO Boaz" />
                  </div>
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 border-l-4 border-l-blue-600 space-y-4">
                  <div className="flex items-center gap-3">
                    <Zap className="h-5 w-5 text-blue-600" />
                    <h3 className="font-black text-slate-900 uppercase tracking-tight">Strategic Narrative</h3>
                  </div>
                  <div className="space-y-3">
                    <Label className="font-bold text-slate-700 text-xs md:text-sm">Executive Transcript</Label>
                    <Controller
                      name="strategicNarrative"
                      control={form.control}
                      render={({ field }) => (
                        <RichTextEditor 
                          value={field.value} 
                          onChange={field.onChange} 
                          placeholder="Draft the strategic overview here..."
                        />
                      )}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="summary" className="space-y-6 animate-in fade-in duration-300">
                <div className="space-y-5 md:space-y-6">
                  <div className="space-y-2 md:space-y-3">
                    <Label className="font-bold text-slate-700 text-xs md:text-sm">Operational Narrative</Label>
                    <Textarea 
                      {...form.register('operationalSummary')} 
                      className="min-h-[120px] rounded-xl font-mono text-xs md:text-sm" 
                      placeholder="e.g. continued performing Traffic regulations, control, traffic recoveries..."
                    />
                  </div>
                  <div className="space-y-2 md:space-y-3">
                    <Label className="font-bold text-slate-700 text-xs md:text-sm">Specific Duties (One per line)</Label>
                    <Textarea 
                      {...form.register('dutiesConducted')} 
                      className="min-h-[180px] rounded-xl font-mono text-xs md:text-sm" 
                      placeholder="Regulated traffic flow&#10;Checked vehicle documents&#10;Punished law violators"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="media" className="space-y-6 animate-in fade-in duration-300">
                <div className="space-y-6">
                  <div className="bg-slate-50 p-6 rounded-[2rem] border border-dashed border-slate-200 text-center space-y-4">
                    <div className="mx-auto w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary">
                      {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Camera className="h-6 w-6" />}
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Attach Operational Evidence</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Maximum 4 images allowed (JPG/PNG)</p>
                    </div>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-xl font-bold h-10 border-slate-200"
                      disabled={form.watch('images').length >= 4 || isLoading}
                    >
                      <Plus className="h-4 w-4 mr-2" /> Select Photos
                    </Button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      multiple 
                      onChange={handleImageUpload} 
                    />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {form.watch('images').map((img, idx) => (
                      <div key={idx} className="group relative aspect-square rounded-2xl overflow-hidden border bg-slate-100">
                        <img src={img} alt={`Attachment ${idx + 1}`} className="w-full h-full object-cover" />
                        <button 
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                    {Array.from({ length: Math.max(0, 4 - form.watch('images').length) }).map((_, idx) => (
                      <div key={`empty-${idx}`} className="aspect-square rounded-2xl border border-dashed border-slate-200 flex items-center justify-center bg-slate-50/50">
                        <Camera className="h-6 w-6 text-slate-200" />
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="preview" className="space-y-6 md:space-y-8 animate-in zoom-in-95 duration-500">
                {previewContent ? (
                  <div className="space-y-6">
                    <div className="bg-white p-6 md:p-12 rounded-2xl font-report text-[13px] md:text-[15px] border border-slate-200 shadow-xl leading-relaxed text-slate-800 overflow-x-auto min-h-[400px]">
                      <div dangerouslySetInnerHTML={{ __html: previewContent }} className="prose prose-slate max-w-none" />
                    </div>
                    <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                      <Button className="rounded-xl h-12 px-10 font-bold text-xs md:text-sm w-full sm:w-auto shadow-xl shadow-primary/20 bg-slate-900 hover:bg-slate-800" onClick={() => setShowConfirmDialog(true)} disabled={isLoading}>
                        {isLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                        Archive Registry Record
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-24 md:py-36 text-slate-400">
                    <FileText className="h-12 w-12 md:h-20 md:w-20 mx-auto mb-6 opacity-10" />
                    <p className="text-base md:text-xl font-black text-slate-900 mb-2">Awaiting Completion</p>
                    <p className="text-xs md:text-sm max-w-xs mx-auto text-slate-500">Please fill out all operational sections and click "Preview" to generate the final transcript.</p>
                  </div>
                )}
              </TabsContent>

            </CardContent>
          </Card>
        </Tabs>

        <div className="mt-8 md:mt-12 flex justify-between items-center gap-4">
          <Button 
            type="button"
            variant="ghost" 
            disabled={activeTab === tabs[0].id}
            className="font-bold text-slate-600 rounded-xl px-4"
            onClick={() => {
              const idx = tabs.findIndex(t => t.id === activeTab);
              setActiveTab(tabs[idx-1].id);
            }}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-1.5">
            {tabs.map((t, idx) => (
              <div key={t.id} className={`h-1.5 rounded-full transition-all duration-300 ${activeTab === t.id ? 'w-6 bg-primary' : 'w-1.5 bg-slate-200'}`} />
            ))}
          </div>
          <Button 
            type="button"
            variant="outline" 
            disabled={activeTab === tabs[tabs.length-1].id}
            className="font-bold bg-white rounded-xl shadow-sm px-4"
            onClick={() => {
              const idx = tabs.findIndex(t => t.id === activeTab);
              setActiveTab(tabs[idx+1].id);
            }}
          >
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </main>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="rounded-[1.5rem] md:rounded-2xl max-w-[95vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black">Archive SITUATION REPORT?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-relaxed">
              By confirming, you authorize this transcript for the official registry. This document and its media attachments will be archived permanently.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-3 mt-4">
            <AlertDialogCancel disabled={isLoading} className="rounded-xl font-bold h-11">Review Again</AlertDialogCancel>
            <AlertDialogAction onClick={saveReport} disabled={isLoading} className="bg-primary rounded-xl font-bold h-11 shadow-lg shadow-primary/20">
              {isLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
              Confirm Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
