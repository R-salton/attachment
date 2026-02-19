"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CaseDetailList } from '@/components/reports/CaseDetailList';
import { FileText, Save, Loader2, ChevronRight, ChevronLeft, Eye, ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser } from '@/firebase';
import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { formatDailyReport } from '@/lib/report-formatter';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const FormSchema = z.object({
  reportDate: z.string().min(1, "Date is required"),
  cadetsIntake: z.string().min(1, "Intake is required"),
  commanderName: z.string().min(1, "Commander name is required"),

  // Gasabo
  gasaboSecuritySituation: z.string().default('calm'),
  gasaboActivities: z.string().default(''),
  gasaboSentryDuties: z.boolean().default(true),

  // Kicukiro
  kicukiroSecuritySituation: z.string().default('calm'),
  kicukiroOperationTime: z.string().default('0600hrs to 1900hrs'),
  kicukiroOperationFocus: z.string().default('introduction to Station Duties and responsibilities of the OC Station'),
  kicukiroIntroductionBy: z.string().default('DPC Kicukiro'),
  kicukiroEmphasizedPoints: z.string().default(''),

  // Nyarugenge
  nyarugengeSecuritySituation: z.string().default('calm'),
  nyarugengeNyabugogoCases: z.array(z.object({ caseType: z.string(), count: z.number() })).default([]),
  nyarugengeInkundamahoroCases: z.array(z.object({ caseType: z.string(), count: z.number() })).default([]),
  nyarugengeKimisagaraCases: z.array(z.object({ caseType: z.string(), count: z.number() })).default([]),
  nyarugengeKimisagaraNotes: z.string().default(''),

  // SIF
  sifOperationTime: z.string().default('1400hrs to 2000hrs'),
  sifCompany: z.string().default('Delta Company'),
  sifAreaOfOperation: z.string().default('Giporoso, Gisimenti, Nyabugogo, Ku Iposita'),
  sifSecuritySituation: z.string().default('calm'),
  sifOperationFocus: z.string().default('introduction to SIF duties and responsibilities'),
  sifIntroductionBy: z.string().default('Operations Commander'),
  sifEmphasizedPoints: z.string().default(''),
  sifPatrolOperations: z.string().default('foot and vehicle'),
  sifPatrolIncidentsFree: z.boolean().default(true),

  // TRS
  trsCompany: z.string().default('Echo company'),
  trsInductionTraining: z.string().default('TRS structure, core values, and expected attitude of police officers on the road'),
  trsRemarksBy: z.string().default('various Directors and the Deputy Commissioner in charge of Operations'),
  trsRemarksTime: z.string().default('0700hrs to 1130hrs'),
  trsDeploymentTime: z.string().default('1400hrs to 2000hrs'),
  trsDeploymentLocations: z.string().default('Nyarugenge Sector, Gasabo Sector, Kicukiro Sector, Traffic Fine Recovery Unit'),

  // FOX
  foxSecuritySituation: z.string().default('calm'),
  foxShiftDuration: z.string().default('8-hour morning shift'),
  foxCompany: z.string().default('Delta Company'),
  foxBriefingBy: z.string().default('TFU Operations Officer'),
  foxInductionTrainingLocation: z.string().default('Muhima'),
  foxCasesReportedCount: z.number().default(0),
  foxCasesReportedDistrict: z.string().default('Kicukiro District'),
  foxCasesReportedDetails: z.array(z.object({ caseType: z.string(), count: z.number() })).default([]),
  foxFootPatrols: z.string().default('Foot patrols enabled engagement and collaboration with local security agencies, including DASSO and Irondo Ry’umwuga, to detect and prevent illegal activities (community policing).'),
  foxNightShiftsScheduled: z.string().default('Officers are scheduled for night shifts, with each company assigned specific working hours and areas of operation.'),

  // General
  challenges: z.string().default(''),
  recommendations: z.string().default(''),
  otherActivities: z.string().default(''),
});

type FormValues = z.infer<typeof FormSchema>;

export default function NewDailyReport() {
  const router = useRouter();
  const { toast } = useToast();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("header");
  const [previewContent, setPreviewContent] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      reportDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).toUpperCase(),
      cadetsIntake: '14/2025-2026',
      commanderName: 'Isiah KAYIRANGA',
      gasaboSecuritySituation: 'calm',
      gasaboActivities: "JOC presentation planning\nPolice core values\nOfficer Cadet expectations in modern policing\nProfessional social media management and appropriate use of force\nCollaboration with local governance\nProactive policing approach\nProper recording in station registers and detainees’ files\nClear understanding of Area of Responsibility (AoR)\nCommon crimes within the AoR",
      gasaboSentryDuties: true,
      kicukiroSecuritySituation: 'calm',
      kicukiroOperationTime: '0600hrs to 1900hrs',
      kicukiroOperationFocus: 'introduction to Station Duties and responsibilities of the OC Station',
      kicukiroIntroductionBy: 'DPC Kicukiro',
      kicukiroEmphasizedPoints: "Values of a good officer – confidence, professionalism, and seeking guidance where necessary.\nExpectations from cadets – gaining practical experience and applying training knowledge.\nMedia management – maintaining professionalism due to public and media visibility.\nCooperation with local governance – promoting safety, security, and rule of law through collaboration.",
      nyarugengeSecuritySituation: 'calm',
      nyarugengeNyabugogoCases: [],
      nyarugengeInkundamahoroCases: [],
      nyarugengeKimisagaraCases: [],
      nyarugengeKimisagaraNotes: '',
      sifOperationTime: '1400hrs to 2000hrs',
      sifCompany: 'Delta Company',
      sifAreaOfOperation: 'Giporoso, Gisimenti, Nyabugogo, Ku Iposita',
      sifSecuritySituation: 'calm',
      sifOperationFocus: 'introduction to SIF duties and responsibilities',
      sifIntroductionBy: 'Operations Commander',
      sifEmphasizedPoints: "Values of a good officer like confidence, professionalism, and seeking guidance when necessary.\nExpectations from cadets – gaining field experience and applying training knowledge.\nMedia management – maintaining professionalism due to constant public and media scrutiny.",
      sifPatrolOperations: 'foot and vehicle',
      sifPatrolIncidentsFree: true,
      trsCompany: 'Echo company',
      trsInductionTraining: 'TRS structure, core values, and expected attitude of police officers on the road',
      trsRemarksBy: 'various Directors and the Deputy Commissioner in charge of Operations',
      trsRemarksTime: '0700hrs to 1130hrs',
      trsDeploymentTime: '1400hrs to 2000hrs',
      trsDeploymentLocations: 'Nyarugenge Sector, Gasabo Sector, Kicukiro Sector, Traffic Fine Recovery Unit',
      foxSecuritySituation: 'calm',
      foxShiftDuration: '8-hour morning shift',
      foxCompany: 'Delta Company',
      foxBriefingBy: 'TFU Operations Officer',
      foxInductionTrainingLocation: 'Muhima',
      foxCasesReportedCount: 0,
      foxCasesReportedDistrict: 'Kicukiro District',
      foxCasesReportedDetails: [],
      foxFootPatrols: 'Foot patrols enabled engagement and collaboration with local security agencies, including DASSO and Irondo Ry’umwuga, to detect and prevent illegal activities (community policing).',
      foxNightShiftsScheduled: 'Officers are scheduled for night shifts, with each company assigned specific working hours and areas of operation.',
      challenges: "Delayed and long Deployment.\nDelayed Shift Replacement\nFailing to get Lunch\nTransportation for embarking and disembarking to/from operations/duties is poor.",
      recommendations: "Proper coordination mainly with Dpcs and Logistics for effective transportation.",
      otherActivities: "25 Officer cadets went to Zigama for Bank issues and all we are returned with incidents Free.\nAll police officers received their meal except some who are supposed to be disembarked from duty but still now not yet arrived, They are 21 Oc’s from Alpha Company\nCurrently all officer cadets are well and ready to continue the operation",
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (!user) {
      toast({ variant: "destructive", title: "Authentication Required", description: "You must be signed in to generate reports." });
      return;
    }

    setIsLoading(true);
    try {
      const formattedInput = {
        ...values,
        gasaboActivities: (values.gasaboActivities || "").split('\n').filter(s => s.trim()),
        kicukiroEmphasizedPoints: (values.kicukiroEmphasizedPoints || "").split('\n').filter(s => s.trim()),
        sifEmphasizedPoints: (values.sifEmphasizedPoints || "").split('\n').filter(s => s.trim()),
        sifAreaOfOperation: (values.sifAreaOfOperation || "").split(',').map(s => s.trim()).filter(Boolean),
        trsInductionTraining: (values.trsInductionTraining || "").split(',').map(s => s.trim()).filter(Boolean),
        trsDeploymentLocations: (values.trsDeploymentLocations || "").split(',').map(s => s.trim()).filter(Boolean),
        challenges: (values.challenges || "").split('\n').filter(s => s.trim()),
        recommendations: (values.recommendations || "").split('\n').filter(s => s.trim()),
        otherActivities: (values.otherActivities || "").split('\n').filter(s => s.trim()),
      };

      const content = formatDailyReport(formattedInput as any);
      setPreviewContent(content);
      setActiveTab("preview");
      toast({ title: "Preview Generated", description: "Review the formatted report below before saving." });
    } catch (error) {
      toast({ variant: "destructive", title: "Formatting Error", description: "Could not format the report data." });
    } finally {
      setIsLoading(false);
    }
  };

  const saveReport = () => {
    if (!user || !db || !previewContent) return;
    setIsLoading(true);

    const values = form.getValues();
    const reportId = doc(collection(db, 'reports')).id;
    const reportRef = doc(db, 'reports', reportId);

    // CRITICAL: use 'ownerId' to match firestore.rules and queries
    const reportData = {
      id: reportId,
      ownerId: user.uid,
      reportDate: values.reportDate,
      cadetIntake: values.cadetsIntake,
      reportTitle: `General daily report for cadets intake ${values.cadetsIntake} as of ${values.reportDate}`,
      reportingCommanderName: values.commanderName,
      reportingCommanderTitle: 'Cadet Commander',
      creationDateTime: new Date().toISOString(),
      fullText: previewContent,
      status: 'SUBMITTED',
      createdAt: serverTimestamp(),
    };

    setDoc(reportRef, reportData)
      .then(() => {
        toast({ title: "Report Saved", description: "Operation log has been archived successfully." });
        router.push('/reports');
      })
      .catch(error => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: reportRef.path,
          operation: 'create',
          requestResourceData: reportData
        }));
      })
      .finally(() => setIsLoading(false));
  };

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
        <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Restricted Access</h2>
        <p className="text-slate-500 mb-6 text-center max-w-md">You must be authenticated with official credentials to file operational reports.</p>
        <Button onClick={() => router.push('/login')}>Sign In</Button>
      </div>
    );
  }

  const tabs = [
    { id: "header", label: "Basics" },
    { id: "gasabo", label: "Gasabo" },
    { id: "kicukiro", label: "Kicukiro" },
    { id: "nyarugenge", label: "Nyarugenge" },
    { id: "sif", label: "SIF" },
    { id: "trs", label: "TRS" },
    { id: "fox", label: "Fox Unit" },
    { id: "general", label: "Misc" },
    { id: "preview", label: "Review", icon: Eye },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24">
      <header className="border-b bg-white px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/')}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Dashboard
          </Button>
          <div className="h-6 w-px bg-slate-200 hidden md:block" />
          <h1 className="text-xl font-extrabold text-slate-900 hidden md:block">Operational Daily Report</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => form.reset()} className="hidden sm:flex">Clear Form</Button>
          <Button size="sm" disabled={isLoading} onClick={form.handleSubmit(onSubmit)}>
            {isLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
            Preview
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto mt-10 px-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <div className="bg-white p-1.5 rounded-2xl border shadow-sm sticky top-[73px] z-40 overflow-x-auto">
            <TabsList className="w-full h-auto flex justify-start gap-1 bg-transparent border-none p-0">
              {tabs.map((tab) => (
                <TabsTrigger 
                  key={tab.id} 
                  value={tab.id}
                  className="px-4 py-2 text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl transition-all whitespace-nowrap"
                >
                  {tab.icon && <tab.icon className="w-3.5 h-3.5 mr-2" />}
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <Card className="shadow-xl border-none">
            <CardHeader className="bg-slate-900 text-white rounded-t-2xl">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-lg">
                  <FileText className="h-5 w-5" />
                </div>
                {tabs.find(t => t.id === activeTab)?.label}
              </CardTitle>
              <CardDescription className="text-slate-400">Section {tabs.findIndex(t => t.id === activeTab) + 1} of {tabs.length}</CardDescription>
            </CardHeader>
            <CardContent className="pt-8 px-8">
              
              <TabsContent value="header" className="space-y-6 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="font-bold text-slate-700">Report Date</Label>
                    <Input {...form.register('reportDate')} className="h-11 rounded-xl" placeholder="e.g. 16 FEB 26" />
                  </div>
                  <div className="space-y-3">
                    <Label className="font-bold text-slate-700">Cadets Intake</Label>
                    <Input {...form.register('cadetsIntake')} className="h-11 rounded-xl" placeholder="e.g. 14/2025-2026" />
                  </div>
                  <div className="col-span-1 md:col-span-2 space-y-3">
                    <Label className="font-bold text-slate-700">Reporting Officer / Commander Name</Label>
                    <Input {...form.register('commanderName')} className="h-11 rounded-xl" placeholder="Full Official Name" />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="gasabo" className="space-y-6 animate-in fade-in duration-300">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label className="font-bold text-slate-700">Security Situation</Label>
                    <Input {...form.register('gasaboSecuritySituation')} className="h-11 rounded-xl" />
                  </div>
                  <div className="space-y-3">
                    <Label className="font-bold text-slate-700">Operational Activities (One per line)</Label>
                    <Textarea {...form.register('gasaboActivities')} className="min-h-[240px] rounded-xl font-mono text-sm leading-relaxed" />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border">
                    <Label className="font-bold text-slate-700 cursor-pointer" htmlFor="gasabo-sentry">Sentry duties were subsequently undertaken?</Label>
                    <Switch 
                      id="gasabo-sentry"
                      checked={form.watch('gasaboSentryDuties')} 
                      onCheckedChange={(val) => form.setValue('gasaboSentryDuties', val)} 
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="kicukiro" className="space-y-6 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="font-bold text-slate-700">Security Status</Label>
                    <Input {...form.register('kicukiroSecuritySituation')} className="rounded-xl h-11" />
                  </div>
                  <div className="space-y-3">
                    <Label className="font-bold text-slate-700">Operation Window</Label>
                    <Input {...form.register('kicukiroOperationTime')} className="rounded-xl h-11" />
                  </div>
                  <div className="col-span-2 space-y-3">
                    <Label className="font-bold text-slate-700">Primary Operation Focus</Label>
                    <Input {...form.register('kicukiroOperationFocus')} className="rounded-xl h-11" />
                  </div>
                  <div className="col-span-2 space-y-3">
                    <Label className="font-bold text-slate-700">Introduction/Briefing Conducted By</Label>
                    <Input {...form.register('kicukiroIntroductionBy')} className="rounded-xl h-11" />
                  </div>
                  <div className="col-span-2 space-y-3">
                    <Label className="font-bold text-slate-700">Emphasized Command Points (One per line)</Label>
                    <Textarea {...form.register('kicukiroEmphasizedPoints')} className="min-h-[180px] rounded-xl font-mono text-sm leading-relaxed" />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="nyarugenge" className="space-y-8 animate-in fade-in duration-300">
                <div className="space-y-3">
                  <Label className="font-bold text-slate-700">Nyarugenge District Security Status</Label>
                  <Input {...form.register('nyarugengeSecuritySituation')} className="rounded-xl h-11" />
                </div>
                
                <div className="grid grid-cols-1 gap-6">
                  <CaseDetailList 
                    label="Nyabugogo Post Case Log" 
                    cases={form.watch('nyarugengeNyabugogoCases')} 
                    onChange={(val) => form.setValue('nyarugengeNyabugogoCases', val)} 
                  />
                  
                  <CaseDetailList 
                    label="Inkundamahoro Post Case Log" 
                    cases={form.watch('nyarugengeInkundamahoroCases')} 
                    onChange={(val) => form.setValue('nyarugengeInkundamahoroCases', val)} 
                  />

                  <div className="space-y-4">
                    <CaseDetailList 
                      label="Kimisagara Post Case Log" 
                      cases={form.watch('nyarugengeKimisagaraCases')} 
                      onChange={(val) => form.setValue('nyarugengeKimisagaraCases', val)} 
                    />
                    <div className="space-y-3">
                      <Label className="font-bold text-slate-700">Recovery / Intelligence Notes (Kimisagara)</Label>
                      <Input {...form.register('nyarugengeKimisagaraNotes')} placeholder="e.g. 101 cases of substandard drinks recovered" className="rounded-xl h-11" />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="sif" className="space-y-6 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="font-bold text-slate-700">Operation Window</Label>
                    <Input {...form.register('sifOperationTime')} className="rounded-xl h-11" />
                  </div>
                  <div className="space-y-3">
                    <Label className="font-bold text-slate-700">Deployed Company</Label>
                    <Input {...form.register('sifCompany')} className="rounded-xl h-11" />
                  </div>
                  <div className="col-span-2 space-y-3">
                    <Label className="font-bold text-slate-700">Areas of Operation (Comma separated)</Label>
                    <Input {...form.register('sifAreaOfOperation')} className="rounded-xl h-11" />
                  </div>
                  <div className="space-y-3">
                    <Label className="font-bold text-slate-700">Security Status</Label>
                    <Input {...form.register('sifSecuritySituation')} className="rounded-xl h-11" />
                  </div>
                  <div className="space-y-3">
                    <Label className="font-bold text-slate-700">Operation Focus</Label>
                    <Input {...form.register('sifOperationFocus')} className="rounded-xl h-11" />
                  </div>
                  <div className="col-span-2 space-y-3">
                    <Label className="font-bold text-slate-700">Introduction By</Label>
                    <Input {...form.register('sifIntroductionBy')} className="rounded-xl h-11" />
                  </div>
                  <div className="col-span-2 space-y-3">
                    <Label className="font-bold text-slate-700">Points Emphasized (One per line)</Label>
                    <Textarea {...form.register('sifEmphasizedPoints')} className="min-h-[160px] rounded-xl font-mono text-sm leading-relaxed" />
                  </div>
                  <div className="space-y-3">
                    <Label className="font-bold text-slate-700">Patrol Types</Label>
                    <Input {...form.register('sifPatrolOperations')} className="rounded-xl h-11" />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border mt-7">
                    <Label className="font-bold text-slate-700 cursor-pointer" htmlFor="sif-incident">Incident Free?</Label>
                    <Switch 
                      id="sif-incident"
                      checked={form.watch('sifPatrolIncidentsFree')} 
                      onCheckedChange={(val) => form.setValue('sifPatrolIncidentsFree', val)} 
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="trs" className="space-y-6 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="font-bold text-slate-700">Deployed Company</Label>
                    <Input {...form.register('trsCompany')} className="rounded-xl h-11" />
                  </div>
                  <div className="col-span-2 space-y-3">
                    <Label className="font-bold text-slate-700">Induction Training Core Topics (Comma separated)</Label>
                    <Textarea {...form.register('trsInductionTraining')} className="rounded-xl" />
                  </div>
                  <div className="col-span-2 space-y-3">
                    <Label className="font-bold text-slate-700">High-Level Remarks Delivered By</Label>
                    <Input {...form.register('trsRemarksBy')} className="rounded-xl h-11" />
                  </div>
                  <div className="space-y-3">
                    <Label className="font-bold text-slate-700">Training Session Time</Label>
                    <Input {...form.register('trsRemarksTime')} className="rounded-xl h-11" />
                  </div>
                  <div className="space-y-3">
                    <Label className="font-bold text-slate-700">Field Deployment Time</Label>
                    <Input {...form.register('trsDeploymentTime')} className="rounded-xl h-11" />
                  </div>
                  <div className="col-span-2 space-y-3">
                    <Label className="font-bold text-slate-700">Deployment Grid Locations (Comma separated)</Label>
                    <Textarea {...form.register('trsDeploymentLocations')} className="rounded-xl" />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="fox" className="space-y-6 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="font-bold text-slate-700">Security Situation</Label>
                    <Input {...form.register('foxSecuritySituation')} className="rounded-xl h-11" />
                  </div>
                  <div className="space-y-3">
                    <Label className="font-bold text-slate-700">Shift Window</Label>
                    <Input {...form.register('foxShiftDuration')} className="rounded-xl h-11" />
                  </div>
                  <div className="space-y-3">
                    <Label className="font-bold text-slate-700">Deployed Company</Label>
                    <Input {...form.register('foxCompany')} className="rounded-xl h-11" />
                  </div>
                  <div className="space-y-3">
                    <Label className="font-bold text-slate-700">Briefing Officer</Label>
                    <Input {...form.register('foxBriefingBy')} className="rounded-xl h-11" />
                  </div>
                  <div className="col-span-2 space-y-3">
                    <Label className="font-bold text-slate-700">Induction Location</Label>
                    <Input {...form.register('foxInductionTrainingLocation')} className="rounded-xl h-11" />
                  </div>
                </div>

                <div className="space-y-6 mt-8">
                  <CaseDetailList 
                    label="Fox Unit Detailed Case Log" 
                    cases={form.watch('foxCasesReportedDetails')} 
                    onChange={(val) => form.setValue('foxCasesReportedDetails', val)} 
                  />
                  <div className="space-y-3">
                    <Label className="font-bold text-slate-700">Primary District of Focus</Label>
                    <Input {...form.register('foxCasesReportedDistrict')} className="rounded-xl h-11" />
                  </div>
                </div>

                <div className="space-y-3 mt-8">
                  <Label className="font-bold text-slate-700">Foot Patrol & Community Policing Narrative</Label>
                  <Textarea {...form.register('foxFootPatrols')} className="min-h-[140px] rounded-xl font-mono text-sm" />
                </div>
                <div className="space-y-3">
                  <Label className="font-bold text-slate-700">Night Shift Coordination Info</Label>
                  <Input {...form.register('foxNightShiftsScheduled')} className="rounded-xl h-11" />
                </div>
              </TabsContent>

              <TabsContent value="general" className="space-y-8 animate-in fade-in duration-300">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label className="font-bold text-slate-700">Command Challenges (One per line)</Label>
                    <Textarea {...form.register('challenges')} className="min-h-[150px] rounded-xl font-mono text-sm leading-relaxed" />
                  </div>
                  <div className="space-y-3">
                    <Label className="font-bold text-slate-700">Command Recommendations (One per line)</Label>
                    <Textarea {...form.register('recommendations')} className="min-h-[120px] rounded-xl font-mono text-sm leading-relaxed" />
                  </div>
                  <div className="space-y-3">
                    <Label className="font-bold text-slate-700">Miscellaneous Activities (One per line)</Label>
                    <Textarea {...form.register('otherActivities')} className="min-h-[150px] rounded-xl font-mono text-sm leading-relaxed" />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="preview" className="space-y-8 animate-in zoom-in-95 duration-500">
                {previewContent ? (
                  <div className="space-y-6">
                    <div className="bg-slate-50 p-8 md:p-12 rounded-2xl font-mono text-sm whitespace-pre-wrap border border-slate-200 shadow-inner leading-relaxed text-slate-800">
                      {previewContent}
                    </div>
                    <div className="flex flex-col sm:flex-row justify-end gap-3">
                      <Button variant="outline" className="rounded-xl h-11 px-6 font-bold" onClick={() => {
                        navigator.clipboard.writeText(previewContent);
                        toast({ title: "Copied", description: "Standardized report text copied to clipboard." });
                      }}>
                        Copy to Clipboard
                      </Button>
                      <Button className="rounded-xl h-11 px-8 font-bold" onClick={saveReport} disabled={isLoading}>
                        {isLoading && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                        Finalize & Archive
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-32 text-slate-400">
                    <FileText className="h-16 w-16 mx-auto mb-4 opacity-20" />
                    <p className="text-lg">No content to preview yet.</p>
                    <p className="text-sm">Please fill in the operational sections and click "Preview".</p>
                  </div>
                )}
              </TabsContent>

            </CardContent>
          </Card>
        </Tabs>

        <div className="mt-12 flex justify-between">
          <Button 
            type="button"
            variant="ghost" 
            disabled={activeTab === tabs[0].id}
            className="font-bold text-slate-600"
            onClick={() => {
              const idx = tabs.findIndex(t => t.id === activeTab);
              setActiveTab(tabs[idx-1].id);
            }}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>
          <Button 
            type="button"
            variant="outline" 
            disabled={activeTab === tabs[tabs.length-1].id}
            className="font-bold bg-white"
            onClick={() => {
              const idx = tabs.findIndex(t => t.id === activeTab);
              setActiveTab(tabs[idx+1].id);
            }}
          >
            Next Section
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </main>
    </div>
  );
}