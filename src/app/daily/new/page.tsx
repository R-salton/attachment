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
  AlertTriangle,
  ArrowLeft
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
        <ShieldAlert className="h-12 w-12 md:h-16 md:w-16 text-destructive mb-4" />
        <h2 className="text-xl md:text-2xl font-bold">Clearance Level Low</h2>
        <p className="text-slate-500 max-w-md mt-2 text-sm md:text-base">Only officers with <strong>Leader</strong> status can access report creation protocols.</p>
        <Button onClick={() => router.push('/')} className="mt-6">Return to Dashboard</Button>
      </div>
    );
  }

  const tabs = [
    { id: "header", label: "Basics" },
    { id: "summary", label: "Operations" },
    { id: "incidents", label: "Security" },
    { id: "discipline", label: "Force" },
    { id: "preview", label: "Review", icon: Eye },
  ];

  return (
    <div className="flex-1 bg-[#f8fafc] pb-24">
      <header className="border-b bg-white px-4 md:px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="md:hidden">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex flex-col">
            <h1 className="text-lg md:text-xl font-extrabold text-slate-900 leading-none">Situation Report</h1>
            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-primary mt-1">Authorized Protocol</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => form.reset()} className="hidden sm:flex rounded-xl">Reset</Button>
          <Button size="sm" disabled={isLoading} onClick={form.handleSubmit(onSubmit)} className="rounded-xl">
            {isLoading ? <Loader2 className="animate-spin mr-1 h-3.5 w-3.5" /> : <Eye className="mr-1 h-3.5 w-3.5" />}
            Preview
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto mt-6 md:mt-10 px-4 md:px-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 md:space-y-8">
          <div className="bg-white p-1 rounded-2xl border shadow-sm sticky top-[73px] z-40 overflow-x-auto">
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
                    <Input {...form.register('reportDate')} className="h-10 md:h-11 rounded-xl text-sm" placeholder="e.g. 18 Feb 26" />
                  </div>
                  <div className="space-y-2 md:space-y-3">
                    <Label className="font-bold text-slate-700 text-xs md:text-sm">Day Number</Label>
                    <Input {...form.register('dayNumber')} className="h-10 md:h-11 rounded-xl text-sm" placeholder="e.g. 3" />
                  </div>
                  <div className="space-y-2 md:space-y-3">
                    <Label className="font-bold text-slate-700 text-xs md:text-sm">Company Name</Label>
                    <Input {...form.register('companyName')} className="h-10 md:h-11 rounded-xl text-sm" placeholder="e.g. ALPHA COMPANY" />
                  </div>
                  <div className="space-y-2 md:space-y-3">
                    <Label className="font-bold text-slate-700 text-xs md:text-sm">Unit Name</Label>
                    <Input {...form.register('unitName')} className="h-10 md:h-11 rounded-xl text-sm" placeholder="e.g. TRS" />
                  </div>
                  <div className="col-span-1 md:col-span-2 space-y-2 md:space-y-3">
                    <Label className="font-bold text-slate-700 text-xs md:text-sm">Officer in Charge (Name)</Label>
                    <Input {...form.register('commanderName')} className="h-10 md:h-11 rounded-xl text-sm" placeholder="e.g. CASTRO Boaz" />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="summary" className="space-y-6 animate-in fade-in duration-300">
                <div className="space-y-5 md:space-y-6">
                  <div className="space-y-2 md:space-y-3">
                    <Label className="font-bold text-slate-700 text-xs md:text-sm">Operational Summary</Label>
                    <Textarea {...form.register('operationalSummary')} className="min-h-[100px] md:min-h-[120px] rounded-xl font-mono text-xs md:text-sm" />
                  </div>
                  <div className="space-y-2 md:space-y-3">
                    <Label className="font-bold text-slate-700 text-xs md:text-sm">Duties Conducted (One per line)</Label>
                    <Textarea {...form.register('dutiesConducted')} className="min-h-[140px] md:min-h-[180px] rounded-xl font-mono text-xs md:text-sm" />
                  </div>
                  <div className="space-y-2 md:space-y-3">
                    <Label className="font-bold text-slate-700 text-xs md:text-sm">Overall Narrative Summary</Label>
                    <Textarea {...form.register('overallSummary')} className="min-h-[100px] md:min-h-[120px] rounded-xl font-mono text-xs md:text-sm" />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="incidents" className="space-y-6 md:space-y-8 animate-in fade-in duration-300">
                <div className="space-y-5 md:space-y-6">
                  <div className="space-y-2 md:space-y-3">
                    <Label className="font-bold text-slate-700 text-xs md:text-sm">General Security Situation</Label>
                    <Input {...form.register('securitySituation')} className="h-10 md:h-11 rounded-xl text-sm" placeholder="e.g. calm and stable" />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="font-bold text-slate-700 text-xs md:text-sm">Incident Log</Label>
                      <Button type="button" variant="outline" size="sm" onClick={() => appendIncident({ time: '', description: '' })} className="rounded-lg h-8 text-[10px] md:text-xs">
                        <Plus className="h-3.5 w-3.5 mr-1" /> Add
                      </Button>
                    </div>
                    
                    {incidentFields.length === 0 && (
                      <div className="text-center py-6 border border-dashed rounded-xl bg-slate-50">
                        <p className="text-[10px] md:text-xs text-slate-400 font-medium italic">No incidents recorded for this period.</p>
                      </div>
                    )}

                    {incidentFields.map((field, index) => (
                      <div key={field.id} className="p-4 bg-slate-50 rounded-xl border space-y-4 animate-in slide-in-from-right-2">
                        <div className="flex flex-col md:flex-row md:items-start gap-4">
                          <div className="w-full md:w-48 space-y-1.5">
                            <Label className="text-[9px] uppercase font-bold text-slate-400">Time (DTG)</Label>
                            <div className="relative">
                              <Clock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                              <Input {...form.register(`incidents.${index}.time`)} className="pl-9 h-9 text-xs" placeholder="181020B FEB 26" />
                            </div>
                          </div>
                          <div className="flex-1 space-y-1.5">
                            <Label className="text-[9px] uppercase font-bold text-slate-400">Description & Location</Label>
                            <Input {...form.register(`incidents.${index}.description`)} className="h-9 text-xs" placeholder="e.g. SANY truck collided..." />
                          </div>
                          <Button type="button" variant="ghost" size="icon" className="md:mt-6 text-destructive h-8 w-8 self-end md:self-auto" onClick={() => removeIncident(index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2 md:space-y-3">
                    <Label className="font-bold text-slate-700 text-xs md:text-sm flex items-center gap-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                      Action Taken
                    </Label>
                    <Textarea {...form.register('actionTaken')} className="min-h-[80px] md:min-h-[100px] rounded-xl font-mono text-xs md:text-sm" placeholder="Actions taken for reported incidents" />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="discipline" className="space-y-6 md:space-y-8 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  <div className="space-y-2 md:space-y-3">
                    <Label className="font-bold text-slate-700 text-xs md:text-sm">Casualties Status</Label>
                    <Input {...form.register('casualties')} className="h-10 md:h-11 rounded-xl text-sm" />
                  </div>
                  <div className="space-y-2 md:space-y-3">
                    <Label className="font-bold text-slate-700 text-xs md:text-sm">Disciplinary Status</Label>
                    <Input {...form.register('disciplinaryCases')} className="h-10 md:h-11 rounded-xl text-sm" />
                  </div>
                </div>
                <div className="space-y-2 md:space-y-3">
                  <Label className="font-bold text-slate-700 text-xs md:text-sm">Challenges (One per line)</Label>
                  <Textarea {...form.register('challenges')} className="min-h-[100px] md:min-h-[120px] rounded-xl font-mono text-xs md:text-sm" />
                </div>
              </TabsContent>

              <TabsContent value="preview" className="space-y-6 md:space-y-8 animate-in zoom-in-95 duration-500">
                {previewContent ? (
                  <div className="space-y-6">
                    <div className="bg-slate-50 p-6 md:p-12 rounded-xl md:rounded-2xl font-report text-[13px] md:text-[15px] whitespace-pre-wrap border border-slate-200 shadow-inner leading-relaxed text-slate-800 overflow-x-auto">
                      {previewContent}
                    </div>
                    <div className="flex flex-col sm:flex-row justify-end gap-3">
                      <Button variant="outline" className="rounded-xl h-10 md:h-11 px-6 font-bold text-xs md:text-sm w-full sm:w-auto" onClick={() => {
                        navigator.clipboard.writeText(previewContent);
                        toast({ title: "Copied", description: "Report text copied to clipboard." });
                      }}>
                        Copy Text
                      </Button>
                      <Button className="rounded-xl h-10 md:h-11 px-8 font-bold text-xs md:text-sm w-full sm:w-auto shadow-lg shadow-primary/20" onClick={saveReport} disabled={isLoading}>
                        {isLoading && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                        Finalize & Archive
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-20 md:py-32 text-slate-400">
                    <FileText className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-4 opacity-20" />
                    <p className="text-base md:text-lg font-bold">No Preview Available</p>
                    <p className="text-xs md:text-sm">Fill in the operational sections and click "Preview".</p>
                  </div>
                )}
              </TabsContent>

            </CardContent>
          </Card>
        </Tabs>

        <div className="mt-8 md:mt-12 flex justify-between gap-4">
          <Button 
            type="button"
            variant="ghost" 
            disabled={activeTab === tabs[0].id}
            className="font-bold text-slate-600 rounded-xl"
            onClick={() => {
              const idx = tabs.findIndex(t => t.id === activeTab);
              setActiveTab(tabs[idx-1].id);
            }}
          >
            <ChevronLeft className="mr-1 md:mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Previous</span>
          </Button>
          <Button 
            type="button"
            variant="outline" 
            disabled={activeTab === tabs[tabs.length-1].id}
            className="font-bold bg-white rounded-xl shadow-sm"
            onClick={() => {
              const idx = tabs.findIndex(t => t.id === activeTab);
              setActiveTab(tabs[idx+1].id);
            }}
          >
            <span className="hidden sm:inline">Next Section</span>
            <ChevronRight className="ml-1 md:ml-2 h-4 w-4" />
          </Button>
        </div>
      </main>
    </div>
  );
}
