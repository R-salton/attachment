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
import { FileText, Save, Loader2, ChevronRight, ChevronLeft, Eye } from 'lucide-react';
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
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("header");
  const [previewContent, setPreviewContent] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      reportDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).toUpperCase(),
      cadetsIntake: '14/2025-2026',
      commanderName: 'Isiah KAYIRANGA',
      gasaboActivities: "JOC presentation planning\nPolice core values\nOfficer Cadet expectations in modern policing\nProfessional social media management and appropriate use of force\nCollaboration with local governance\nProactive policing approach\nProper recording in station registers and detainees’ files\nClear understanding of Area of Responsibility (AoR)\nCommon crimes within the AoR",
      kicukiroEmphasizedPoints: "Values of a good officer – confidence, professionalism, and seeking guidance where necessary.\nExpectations from cadets – gaining practical experience and applying training knowledge.\nMedia management – maintaining professionalism due to public and media visibility.\nCooperation with local governance – promoting safety, security, and rule of law through collaboration.",
      sifEmphasizedPoints: "Values of a good officer like confidence, professionalism, and seeking guidance when necessary.\nExpectations from cadets – gaining field experience and applying training knowledge.\nMedia management – maintaining professionalism due to constant public and media scrutiny.",
      challenges: "Delayed and long Deployment.\nDelayed Shift Replacement\nFailing to get Lunch\nTransportation for embarking and disembarking to/from operations/duties is poor.",
      recommendations: "Proper coordination mainly with Dpcs and Logistics for effective transportation.",
      otherActivities: "25 Officer cadets went to Zigama for Bank issues and all we are returned with incidents Free.\nAll police officers received their meal except some who are supposed to be disembarked from duty but still now not yet arrived, They are 21 Oc’s from Alpha Company\nCurrently all officer cadets are well and ready to continue the operation",
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (!user) {
      toast({ variant: "destructive", title: "Not Authenticated", description: "You must be signed in to save reports." });
      return;
    }

    setIsLoading(true);
    try {
      const formattedInput = {
        ...values,
        gasaboActivities: values.gasaboActivities.split('\n').filter(s => s.trim()),
        kicukiroEmphasizedPoints: values.kicukiroEmphasizedPoints.split('\n').filter(s => s.trim()),
        sifEmphasizedPoints: values.sifEmphasizedPoints.split('\n').filter(s => s.trim()),
        sifAreaOfOperation: values.sifAreaOfOperation.split(',').map(s => s.trim()).filter(Boolean),
        trsInductionTraining: values.trsInductionTraining.split(',').map(s => s.trim()).filter(Boolean),
        trsDeploymentLocations: values.trsDeploymentLocations.split(',').map(s => s.trim()).filter(Boolean),
        challenges: values.challenges.split('\n').filter(s => s.trim()),
        recommendations: values.recommendations.split('\n').filter(s => s.trim()),
        otherActivities: values.otherActivities.split('\n').filter(s => s.trim()),
      };

      const content = formatDailyReport(formattedInput as any);
      setPreviewContent(content);
      setActiveTab("preview");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: "There was an error formatting the report content.",
      });
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
        toast({ title: "Report Saved", description: "The daily report has been archived successfully." });
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

  const tabs = [
    { id: "header", label: "Metadata" },
    { id: "gasabo", label: "Gasabo" },
    { id: "kicukiro", label: "Kicukiro" },
    { id: "nyarugenge", label: "Nyarugenge" },
    { id: "sif", label: "SIF" },
    { id: "trs", label: "TRS" },
    { id: "fox", label: "Fox Unit" },
    { id: "general", label: "Review" },
    { id: "preview", label: "Preview", icon: Eye },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="border-b bg-white px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/')}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <h1 className="text-xl font-bold text-primary">New Daily Report</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => form.reset()}>Reset</Button>
          <Button size="sm" disabled={isLoading} onClick={form.handleSubmit(onSubmit)}>
            {isLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
            Preview Report
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto mt-8 px-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="bg-white p-1 rounded-xl border shadow-sm">
            <TabsList className="w-full h-auto flex flex-wrap justify-start gap-1 bg-transparent border-none p-0">
              {tabs.map((tab) => (
                <TabsTrigger 
                  key={tab.id} 
                  value={tab.id}
                  className="px-4 py-2 text-xs font-medium data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg transition-all"
                >
                  {tab.icon && <tab.icon className="w-3 h-3 mr-1.5" />}
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <Card className="shadow-lg border-primary/10">
            <CardHeader className="bg-primary/5 border-b">
              <CardTitle className="text-primary flex items-center gap-2">
                {tabs.find(t => t.id === activeTab)?.label}
              </CardTitle>
              <CardDescription>Fill in operational details for this section.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              
              <TabsContent value="header" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Report Date</Label>
                    <Input {...form.register('reportDate')} placeholder="e.g. 16 FEB 26" />
                  </div>
                  <div className="space-y-2">
                    <Label>Cadets Intake</Label>
                    <Input {...form.register('cadetsIntake')} placeholder="e.g. 14/2025-2026" />
                  </div>
                  <div className="space-y-2">
                    <Label>Cadet Commander Name</Label>
                    <Input {...form.register('commanderName')} placeholder="Full Name" />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="gasabo" className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Security Situation</Label>
                    <Input {...form.register('gasaboSecuritySituation')} placeholder="e.g. calm" />
                  </div>
                  <div className="space-y-2">
                    <Label>Activities (One per line)</Label>
                    <Textarea {...form.register('gasaboActivities')} className="min-h-[200px]" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch 
                      checked={form.watch('gasaboSentryDuties')} 
                      onCheckedChange={(val) => form.setValue('gasaboSentryDuties', val)} 
                    />
                    <Label>Sentry duties undertaken?</Label>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="kicukiro" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Security Situation</Label>
                    <Input {...form.register('kicukiroSecuritySituation')} />
                  </div>
                  <div className="space-y-2">
                    <Label>Operation Time</Label>
                    <Input {...form.register('kicukiroOperationTime')} />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Operation Focus</Label>
                    <Input {...form.register('kicukiroOperationFocus')} />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Introduction By</Label>
                    <Input {...form.register('kicukiroIntroductionBy')} />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Emphasized Points (One per line)</Label>
                    <Textarea {...form.register('kicukiroEmphasizedPoints')} className="min-h-[150px]" />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="nyarugenge" className="space-y-8">
                <div className="space-y-2">
                  <Label>Security Situation</Label>
                  <Input {...form.register('nyarugengeSecuritySituation')} />
                </div>
                
                <CaseDetailList 
                  label="Nyabugogo Post Cases" 
                  cases={form.watch('nyarugengeNyabugogoCases')} 
                  onChange={(val) => form.setValue('nyarugengeNyabugogoCases', val)} 
                />
                
                <CaseDetailList 
                  label="Inkundamahoro Post Cases" 
                  cases={form.watch('nyarugengeInkundamahoroCases')} 
                  onChange={(val) => form.setValue('nyarugengeInkundamahoroCases', val)} 
                />

                <div className="space-y-4">
                  <CaseDetailList 
                    label="Kimisagara Post Cases" 
                    cases={form.watch('nyarugengeKimisagaraCases')} 
                    onChange={(val) => form.setValue('nyarugengeKimisagaraCases', val)} 
                  />
                  <div className="space-y-2">
                    <Label>Additional Notes for Kimisagara</Label>
                    <Input {...form.register('nyarugengeKimisagaraNotes')} placeholder="e.g. 101 cases of substandard home-brewed drinks recovered" />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="sif" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Operation Time</Label>
                    <Input {...form.register('sifOperationTime')} />
                  </div>
                  <div className="space-y-2">
                    <Label>Company</Label>
                    <Input {...form.register('sifCompany')} />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Area of Operation (Comma separated)</Label>
                    <Input {...form.register('sifAreaOfOperation')} />
                  </div>
                  <div className="space-y-2">
                    <Label>Security Situation</Label>
                    <Input {...form.register('sifSecuritySituation')} />
                  </div>
                  <div className="space-y-2">
                    <Label>Operation Focus</Label>
                    <Input {...form.register('sifOperationFocus')} />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Introduction By</Label>
                    <Input {...form.register('sifIntroductionBy')} />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Emphasized Points (One per line)</Label>
                    <Textarea {...form.register('sifEmphasizedPoints')} className="min-h-[150px]" />
                  </div>
                  <div className="space-y-2">
                    <Label>Patrol Operations Description</Label>
                    <Input {...form.register('sifPatrolOperations')} />
                  </div>
                  <div className="flex items-center gap-2 pt-8">
                    <Switch 
                      checked={form.watch('sifPatrolIncidentsFree')} 
                      onCheckedChange={(val) => form.setValue('sifPatrolIncidentsFree', val)} 
                    />
                    <Label>Incident Free?</Label>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="trs" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Company</Label>
                    <Input {...form.register('trsCompany')} />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Induction Training Topics (Comma separated)</Label>
                    <Textarea {...form.register('trsInductionTraining')} />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Remarks By</Label>
                    <Input {...form.register('trsRemarksBy')} />
                  </div>
                  <div className="space-y-2">
                    <Label>Remarks Timeframe</Label>
                    <Input {...form.register('trsRemarksTime')} />
                  </div>
                  <div className="space-y-2">
                    <Label>Deployment Timeframe</Label>
                    <Input {...form.register('trsDeploymentTime')} />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Deployment Locations (Comma separated)</Label>
                    <Textarea {...form.register('trsDeploymentLocations')} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="fox" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Security Situation</Label>
                    <Input {...form.register('foxSecuritySituation')} />
                  </div>
                  <div className="space-y-2">
                    <Label>Shift Duration</Label>
                    <Input {...form.register('foxShiftDuration')} />
                  </div>
                  <div className="space-y-2">
                    <Label>Company</Label>
                    <Input {...form.register('foxCompany')} />
                  </div>
                  <div className="space-y-2">
                    <Label>Briefing By</Label>
                    <Input {...form.register('foxBriefingBy')} />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Induction Location</Label>
                    <Input {...form.register('foxInductionTrainingLocation')} />
                  </div>
                </div>

                <div className="space-y-4 mt-4">
                  <CaseDetailList 
                    label="Fox Unit Cases" 
                    cases={form.watch('foxCasesReportedDetails')} 
                    onChange={(val) => form.setValue('foxCasesReportedDetails', val)} 
                  />
                  <div className="space-y-2">
                    <Label>Fox District for Cases</Label>
                    <Input {...form.register('foxCasesReportedDistrict')} />
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  <Label>Foot Patrols Description</Label>
                  <Textarea {...form.register('foxFootPatrols')} />
                </div>
                <div className="space-y-2">
                  <Label>Night Shifts Information</Label>
                  <Input {...form.register('foxNightShiftsScheduled')} />
                </div>
              </TabsContent>

              <TabsContent value="general" className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Challenges (One per line)</Label>
                    <Textarea {...form.register('challenges')} className="min-h-[150px]" />
                  </div>
                  <div className="space-y-2">
                    <Label>Recommendations (One per line)</Label>
                    <Textarea {...form.register('recommendations')} className="min-h-[100px]" />
                  </div>
                  <div className="space-y-2">
                    <Label>Other Activities (One per line)</Label>
                    <Textarea {...form.register('otherActivities')} className="min-h-[150px]" />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="preview" className="space-y-6">
                {previewContent ? (
                  <div className="space-y-4">
                    <div className="bg-muted p-6 rounded-lg font-mono text-sm whitespace-pre-wrap border shadow-inner leading-relaxed">
                      {previewContent}
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => {
                        navigator.clipboard.writeText(previewContent);
                        toast({ title: "Copied", description: "Report content copied to clipboard" });
                      }}>
                        Copy to Clipboard
                      </Button>
                      <Button onClick={saveReport} disabled={isLoading}>
                        {isLoading && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                        Finalize and Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-20 text-muted-foreground">
                    <p>Complete the form sections and click "Preview Report" to see the output here.</p>
                  </div>
                )}
              </TabsContent>

            </CardContent>
          </Card>
        </Tabs>

        {/* Navigation Buttons for Tabs */}
        <div className="mt-8 flex justify-between">
          <Button 
            variant="ghost" 
            disabled={activeTab === tabs[0].id}
            onClick={() => {
              const idx = tabs.findIndex(t => t.id === activeTab);
              setActiveTab(tabs[idx-1].id);
            }}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous Section
          </Button>
          <Button 
            variant="outline" 
            disabled={activeTab === tabs[tabs.length-1].id}
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
