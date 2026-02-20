"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
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
  Type
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { formatDailyReport, SituationReportInput } from '@/lib/report-formatter';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useUserProfile } from '@/hooks/use-user-profile';

const UNITS = ["Gasabo DPU", "Kicukiro DPU", "Nyarugenge DPU", "TRS", "SIF", "TFU", "N/A"];

const FormSchema = z.object({
  reportDate: z.string().min(1, "Date is required"),
  unitName: z.string().min(1, "Unit name is required"),
  dayNumber: z.string().optional().default(''),
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
});

type FormValues = z.infer<typeof FormSchema>;

export default function NewDailyReport() {
  const router = useRouter();
  const { toast } = useToast();
  const db = useFirestore();
  const { user, profile, isAdmin, isLoading: isAuthLoading } = useUserProfile();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("header");
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      reportDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).toUpperCase(),
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
    },
  });

  // Sync profile data to form once loaded
  useEffect(() => {
    if (profile) {
      form.reset({
        ...form.getValues(),
        unitName: profile.unit || 'N/A',
        commanderName: profile.displayName || '',
      });
    }
  }, [profile, form]);

  const { fields: incidentFields, append: appendIncident, remove: removeIncident } = useFieldArray({
    control: form.control,
    name: "incidents"
  });

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
        orderlyOfficerReport: isAdmin ? values.orderlyOfficerReport : undefined
      };

      const content = formatDailyReport(formattedInput);
      setPreviewContent(content);
      setActiveTab("preview");
      toast({ title: "Preview Generated", description: "Review the SITUATION REPORT below." });
    } catch (error) {
      toast({ variant: "destructive", title: "Formatting Error", description: "Could not format the report data." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalize = () => {
    setShowConfirmDialog(true);
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
      reportDate: values.reportDate,
      unit: values.unitName,
      reportTitle: values.orderlyOfficerReport ? `OVERALL REPORT - ${values.reportDate}` : `SITUATION REPORT - ${values.unitName} (${values.reportDate})`,
      reportingCommanderName: values.commanderName,
      reportingCommanderTitle: 'Officer in Charge',
      creationDateTime: new Date().toISOString(),
      fullText: previewContent,
      status: 'SUBMITTED',
      createdAt: serverTimestamp(),
    };

    setDoc(reportRef, reportData)
      .then(() => {
        toast({ title: "Report Saved", description: "SITUATION REPORT has been archived." });
        router.push('/reports');
      })
      .catch(error => {
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

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <ShieldAlert className="h-12 w-12 md:h-16 md:w-16 text-destructive mb-4" />
        <h2 className="text-xl md:text-2xl font-bold">Authentication Required</h2>
        <p className="text-slate-500 max-w-md mt-2 text-sm md:text-base">Please sign in to access the report creation terminal.</p>
        <Button onClick={() => router.push('/login')} className="mt-6">Sign In</Button>
      </div>
    );
  }

  const tabs = [
    { id: "header", label: "Basics" },
    { id: "summary", label: "Operations" },
    { id: "incidents", label: "Security" },
    { id: "discipline", label: "Force" },
  ];

  if (isAdmin) {
    tabs.push({ id: "orderly", label: "Orderly Officer" });
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
                  <ShieldCheck className="h-4 w-4 md:h-5 md:w-5" />
                </div>
                {tabs.find(t => t.id === activeTab)?.label}
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs md:text-sm">Section {tabs.findIndex(t => t.id === activeTab) + 1} of {tabs.length}</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 md:pt-8 px-6 md:px-8">
              
              <TabsContent value="header" className="space-y-6 animate-in fade-in duration-300">
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
                    <Input {...form.register('dayNumber')} className="h-11 rounded-xl text-sm" placeholder="e.g. 3" />
                  </div>
                  <div className="space-y-2 md:space-y-3">
                    <Label className="font-bold text-slate-700 text-xs md:text-sm">Officer in Charge (Full Name)</Label>
                    <Input {...form.register('commanderName')} className="h-11 rounded-xl text-sm" placeholder="e.g. CASTRO Boaz" />
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
                  <div className="space-y-2 md:space-y-3">
                    <Label className="font-bold text-slate-700 text-xs md:text-sm">Overall Status Narrative</Label>
                    <Textarea 
                      {...form.register('overallSummary')} 
                      className="min-h-[100px] rounded-xl font-mono text-xs md:text-sm" 
                      placeholder="Summarize the overall success or tone of the day's activities."
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="incidents" className="space-y-6 md:space-y-8 animate-in fade-in duration-300">
                <div className="space-y-5 md:space-y-6">
                  <div className="space-y-2 md:space-y-3">
                    <Label className="font-bold text-slate-700 text-xs md:text-sm">General Security Situation</Label>
                    <Input {...form.register('securitySituation')} className="h-11 rounded-xl text-sm" placeholder="e.g. calm and stable" />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="font-bold text-slate-700 text-xs md:text-sm">Incident Records</Label>
                      <Button type="button" variant="outline" size="sm" onClick={() => appendIncident({ time: '', description: '' })} className="rounded-lg h-8 text-[10px] md:text-xs font-bold">
                        <Plus className="h-3.5 w-3.5 mr-1" /> Add Record
                      </Button>
                    </div>
                    
                    {incidentFields.length === 0 && (
                      <div className="text-center py-8 border border-dashed rounded-2xl bg-slate-50">
                        <p className="text-[10px] md:text-xs text-slate-400 font-medium italic">No specific incidents to log.</p>
                      </div>
                    )}

                    {incidentFields.map((field, index) => (
                      <div key={field.id} className="p-4 bg-slate-50 rounded-2xl border space-y-4 animate-in slide-in-from-right-2">
                        <div className="flex flex-col md:flex-row md:items-start gap-4">
                          <div className="w-full md:w-48 space-y-1.5">
                            <Label className="text-[9px] uppercase font-black text-slate-400">Time (DTG)</Label>
                            <div className="relative">
                              <Clock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                              <Input {...form.register(`incidents.${index}.time`)} className="pl-9 h-9 text-xs rounded-lg" placeholder="181020B FEB 26" />
                            </div>
                          </div>
                          <div className="flex-1 space-y-1.5">
                            <Label className="text-[9px] uppercase font-black text-slate-400">Description & Location</Label>
                            <Input {...form.register(`incidents.${index}.description`)} className="h-9 text-xs rounded-lg" placeholder="e.g. Minor collision at Nyabugogo..." />
                          </div>
                          <Button type="button" variant="ghost" size="icon" className="md:mt-6 text-destructive h-9 w-9 self-end md:self-auto hover:bg-destructive/10" onClick={() => removeIncident(index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2 md:space-y-3">
                    <Label className="font-bold text-slate-700 text-xs md:text-sm flex items-center gap-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                      Actions Taken
                    </Label>
                    <Textarea 
                      {...form.register('actionTaken')} 
                      className="min-h-[100px] rounded-xl font-mono text-xs md:text-sm" 
                      placeholder="Detail the response to incidents logged above."
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="discipline" className="space-y-6 md:space-y-8 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  <div className="space-y-2 md:space-y-3">
                    <Label className="font-bold text-slate-700 text-xs md:text-sm">Casualties Report</Label>
                    <Input {...form.register('casualties')} className="h-11 rounded-xl text-sm" placeholder="e.g. No casualties" />
                  </div>
                  <div className="space-y-2 md:space-y-3">
                    <Label className="font-bold text-slate-700 text-xs md:text-sm">Disciplinary Status</Label>
                    <Input {...form.register('disciplinaryCases')} className="h-11 rounded-xl text-sm" placeholder="e.g. No disciplinary cases" />
                  </div>
                </div>
                <div className="space-y-2 md:space-y-3">
                  <Label className="font-bold text-slate-700 text-xs md:text-sm">Challenges Encountered (One per line)</Label>
                  <Textarea 
                    {...form.register('challenges')} 
                    className="min-h-[120px] rounded-xl font-mono text-xs md:text-sm" 
                    placeholder="e.g. Delay in shift replacement&#10;Adverse weather conditions"
                  />
                </div>
                <div className="space-y-2 md:space-y-3">
                  <Label className="font-bold text-slate-700 text-xs md:text-sm flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-primary" />
                    Recommendations (One per line)
                  </Label>
                  <Textarea 
                    {...form.register('recommendations')} 
                    className="min-h-[120px] rounded-xl font-mono text-xs md:text-sm" 
                    placeholder="Suggest specific improvements for future deployments."
                  />
                </div>
              </TabsContent>

              {isAdmin && (
                <TabsContent value="orderly" className="space-y-6 animate-in fade-in duration-300">
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 border-l-4 border-l-primary space-y-4">
                    <div className="flex items-center gap-3">
                      <UserCheck className="h-5 w-5 text-primary" />
                      <h3 className="font-black text-slate-900 uppercase tracking-tight">Orderly Officer Narrative</h3>
                    </div>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      This section is reserved for higher-level administrative summaries. Use the formatting guide below to structure the narrative.
                    </p>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="font-bold text-slate-700 text-xs md:text-sm">Overall Report Transcript</Label>
                        <Textarea 
                          {...form.register('orderlyOfficerReport')} 
                          className="min-h-[300px] rounded-xl font-mono text-sm leading-relaxed" 
                          placeholder="Type overall command report here..."
                        />
                      </div>
                      
                      <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                          <Type className="h-3 w-3" />
                          Command Formatting Guide
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[10px] font-bold">
                          <div className="flex items-center gap-2 text-slate-600">
                            <code className="bg-slate-100 px-1.5 py-0.5 rounded">*Bold*</code>
                            <span>Main Heading</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-600">
                            <code className="bg-slate-100 px-1.5 py-0.5 rounded">. Item</code>
                            <span>Bullet Point</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-600">
                            <code className="bg-slate-100 px-1.5 py-0.5 rounded">_Underline_</code>
                            <span>Special Emphasis</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              )}

              <TabsContent value="preview" className="space-y-6 md:space-y-8 animate-in zoom-in-95 duration-500">
                {previewContent ? (
                  <div className="space-y-6">
                    <div className="bg-slate-50 p-6 md:p-12 rounded-2xl font-report text-[13px] md:text-[15px] whitespace-pre-wrap border border-slate-200 shadow-inner leading-relaxed text-slate-800 overflow-x-auto">
                      {previewContent}
                    </div>
                    <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                      <Button variant="outline" className="rounded-xl h-12 px-6 font-bold text-xs md:text-sm w-full sm:w-auto" onClick={() => {
                        navigator.clipboard.writeText(previewContent);
                        toast({ title: "Copied", description: "Report text copied to clipboard." });
                      }}>
                        Copy Transcript
                      </Button>
                      <Button className="rounded-xl h-12 px-10 font-bold text-xs md:text-sm w-full sm:w-auto shadow-xl shadow-primary/20" onClick={handleFinalize} disabled={isLoading}>
                        {isLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                        Finalize & Archive
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
              By confirming, you authorize this transcript for the official registry. This document will be accessible to Command oversight and archived permanently.
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
