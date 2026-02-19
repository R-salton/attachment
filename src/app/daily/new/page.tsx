"use client";

import { useState } from 'react';
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
  FileText, 
  Save, 
  Loader2, 
  ChevronRight, 
  ChevronLeft, 
  Eye, 
  ShieldAlert, 
  ShieldCheck, 
  Plus, 
  Trash2,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { formatDailyReport, SituationReportInput } from '@/lib/report-formatter';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useUserProfile } from '@/hooks/use-user-profile';

const FormSchema = z.object({
  reportDate: z.string().min(1, "Date is required"),
  companyName: z.string().min(1, "Company is required"),
  unitName: z.string().min(1, "Unit name is required"),
  dayNumber: z.string().min(1, "Day number is required"),
  operationalSummary: z.string().min(1, "Summary is required"),
  securitySituation: z.string().default('calm and stable'),
  incidents: z.array(z.object({
    time: z.string(),
    description: z.string()
  })).default([]),
  actionTaken: z.string().optional(),
  dutiesConducted: z.string().describe("New line separated list"),
  casualties: z.string().default('No casualties'),
  disciplinaryCases: z.string().default('No disciplinary cases'),
  challenges: z.string().describe("New line separated list"),
  overallSummary: z.string().min(1, "Overall summary is required"),
  commanderName: z.string().min(1, "Commander name is required"),
});

type FormValues = z.infer<typeof FormSchema>;

export default function NewDailyReport() {
  const router = useRouter();
  const { toast } = useToast();
  const db = useFirestore();
  const { user, isLeader, isLoading: isAuthLoading } = useUserProfile();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("header");
  const [previewContent, setPreviewContent] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      reportDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).toUpperCase(),
      companyName: 'ALPHA COMPANY',
      unitName: 'TRS',
      dayNumber: '1',
      operationalSummary: 'continued performing Traffic regulations, control, traffic recoveries, public education and enforcing laws through punishments.',
      securitySituation: 'calm and stable',
      incidents: [],
      actionTaken: '',
      dutiesConducted: "Regulated traffic flow from different junctions\nChecked vehicle documents and equipment\nPunished law violators with fine of traffic laws and regulations\nResponded to an accident incident",
      casualties: 'No casualties',
      disciplinaryCases: 'No disciplinary cases',
      challenges: "Delay in shift replacement\nWeather condition changes",
      overallSummary: 'Day activities were conducted successfully in accordance with operational procedures.',
      commanderName: '',
    },
  });

  const { fields: incidentFields, append: appendIncident, remove: removeIncident } = useFieldArray({
    control: form.control,
    name: "incidents"
  });

  const onSubmit = async (values: FormValues) => {
    if (!user || !isLeader) {
      toast({ variant: "destructive", title: "Clearance Required", description: "Only Leaders can generate reports." });
      return;
    }

    setIsLoading(true);
    try {
      const formattedInput: SituationReportInput = {
        ...values,
        dutiesConducted: values.dutiesConducted.split('\n').filter(s => s.trim()),
        challenges: values.challenges.split('\n').filter(s => s.trim()),
        forceDiscipline: {
          casualties: values.casualties,
          disciplinaryCases: values.disciplinaryCases
        },
        actionTaken: values.actionTaken || ''
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
      cadetIntake: 'N/A',
      reportTitle: `SITUATION REPORT - ${values.companyName} (${values.reportDate})`,
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
      .finally(() => setIsLoading(false));
  };

  if (isAuthLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!isLeader) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold">Clearance Level Low</h2>
        <p className="text-slate-500 max-w-md mt-2">Only officers with <strong>Leader</strong> status can access report creation protocols.</p>
        <Button onClick={() => router.push('/')} className="mt-6">Return to Dashboard</Button>
      </div>
    );
  }

  const tabs = [
    { id: "header", label: "Basics" },
    { id: "summary", label: "Operations" },
    { id: "incidents", label: "Security" },
    { id: "discipline", label: "Force Status" },
    { id: "preview", label: "Review", icon: Eye },
  ];

  return (
    <div className="flex-1 bg-[#f8fafc] pb-24">
      <header className="border-b bg-white px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <h1 className="text-xl font-extrabold text-slate-900 leading-none">Situation Report</h1>
            <span className="text-[10px] font-black uppercase tracking-widest text-primary mt-1">Authorized Protocol</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => form.reset()} className="hidden sm:flex">Reset</Button>
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
                  className="px-6 py-2.5 text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl transition-all whitespace-nowrap"
                >
                  {tab.icon && <tab.icon className="w-3.5 h-3.5 mr-2" />}
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <Card className="shadow-xl border-none rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-slate-900 text-white p-8">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-lg">
                  <ShieldCheck className="h-5 w-5" />
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
                    <Input {...form.register('reportDate')} className="h-11 rounded-xl" placeholder="e.g. 18 Feb 26" />
                  </div>
                  <div className="space-y-3">
                    <Label className="font-bold text-slate-700">Day Number</Label>
                    <Input {...form.register('dayNumber')} className="h-11 rounded-xl" placeholder="e.g. 3" />
                  </div>
                  <div className="space-y-3">
                    <Label className="font-bold text-slate-700">Company Name</Label>
                    <Input {...form.register('companyName')} className="h-11 rounded-xl" placeholder="e.g. ALPHA COMPANY" />
                  </div>
                  <div className="space-y-3">
                    <Label className="font-bold text-slate-700">Unit Name</Label>
                    <Input {...form.register('unitName')} className="h-11 rounded-xl" placeholder="e.g. TRS" />
                  </div>
                  <div className="col-span-1 md:col-span-2 space-y-3">
                    <Label className="font-bold text-slate-700">Officer in Charge (Name)</Label>
                    <Input {...form.register('commanderName')} className="h-11 rounded-xl" placeholder="e.g. CASTRO Boaz" />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="summary" className="space-y-6 animate-in fade-in duration-300">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label className="font-bold text-slate-700">Operational Summary (Starts with: "continued performing...")</Label>
                    <Textarea {...form.register('operationalSummary')} className="min-h-[120px] rounded-xl font-mono text-sm" />
                  </div>
                  <div className="space-y-3">
                    <Label className="font-bold text-slate-700">Duties Conducted (One per line)</Label>
                    <Textarea {...form.register('dutiesConducted')} className="min-h-[180px] rounded-xl font-mono text-sm" />
                  </div>
                  <div className="space-y-3">
                    <Label className="font-bold text-slate-700">Overall Narrative Summary</Label>
                    <Textarea {...form.register('overallSummary')} className="min-h-[120px] rounded-xl font-mono text-sm" />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="incidents" className="space-y-8 animate-in fade-in duration-300">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label className="font-bold text-slate-700">General Security Situation</Label>
                    <Input {...form.register('securitySituation')} className="h-11 rounded-xl" placeholder="e.g. calm and stable" />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="font-bold text-slate-700">Incident Log</Label>
                      <Button type="button" variant="outline" size="sm" onClick={() => appendIncident({ time: '', description: '' })}>
                        <Plus className="h-4 w-4 mr-2" /> Add Incident
                      </Button>
                    </div>
                    
                    {incidentFields.map((field, index) => (
                      <div key={field.id} className="p-4 bg-slate-50 rounded-xl border space-y-4 animate-in slide-in-from-right-2">
                        <div className="flex items-center gap-3">
                          <div className="w-48 space-y-1.5">
                            <Label className="text-[10px] uppercase font-bold text-slate-400">Time (DTG)</Label>
                            <div className="relative">
                              <Clock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                              <Input {...form.register(`incidents.${index}.time`)} className="pl-9 h-9 text-xs" placeholder="181020B FEB 26" />
                            </div>
                          </div>
                          <div className="flex-1 space-y-1.5">
                            <Label className="text-[10px] uppercase font-bold text-slate-400">Description & Location</Label>
                            <Input {...form.register(`incidents.${index}.description`)} className="h-9 text-xs" placeholder="e.g. SANY truck collided..." />
                          </div>
                          <Button type="button" variant="ghost" size="icon" className="mt-6 text-destructive" onClick={() => removeIncident(index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <Label className="font-bold text-slate-700 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      Action Taken (for incidents)
                    </Label>
                    <Textarea {...form.register('actionTaken')} className="min-h-[100px] rounded-xl font-mono text-sm" placeholder="Describe actions taken for incidents reported above" />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="discipline" className="space-y-8 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="font-bold text-slate-700">Casualties Status</Label>
                    <Input {...form.register('casualties')} className="h-11 rounded-xl" />
                  </div>
                  <div className="space-y-3">
                    <Label className="font-bold text-slate-700">Disciplinary Status</Label>
                    <Input {...form.register('disciplinaryCases')} className="h-11 rounded-xl" />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="font-bold text-slate-700">Challenges (One per line)</Label>
                  <Textarea {...form.register('challenges')} className="min-h-[120px] rounded-xl font-mono text-sm" />
                </div>
              </TabsContent>

              <TabsContent value="preview" className="space-y-8 animate-in zoom-in-95 duration-500">
                {previewContent ? (
                  <div className="space-y-6">
                    <div className="bg-slate-50 p-8 md:p-12 rounded-2xl font-report text-[15px] whitespace-pre-wrap border border-slate-200 shadow-inner leading-relaxed text-slate-800">
                      {previewContent}
                    </div>
                    <div className="flex flex-col sm:flex-row justify-end gap-3">
                      <Button variant="outline" className="rounded-xl h-11 px-6 font-bold" onClick={() => {
                        navigator.clipboard.writeText(previewContent);
                        toast({ title: "Copied", description: "Standardized report text copied to clipboard." });
                      }}>
                        Copy
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
