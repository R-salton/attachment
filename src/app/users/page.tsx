
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, setDoc, deleteDoc, serverTimestamp, limit } from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { firebaseConfig } from '@/firebase/config';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, 
  ShieldAlert, 
  UserCog, 
  Mail, 
  UserPlus, 
  ShieldPlus, 
  Trash2, 
  ArrowLeft, 
  Building2, 
  Clock, 
  History, 
  Search,
  Activity,
  Calendar,
  User
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { recordLog } from '@/lib/logger';

const UNITS = ["Gasabo DPU", "Kicukiro DPU", "Nyarugenge DPU", "TRS", "SIF", "TFU", "ORDERLY REPORT"];
const ROLES = ["ADMIN", "COMMANDER", "LEADER", "TRAINEE", "PTSLEADERSHIP", "INACTIVE"];

export default function UserManagementPage() {
  const router = useRouter();
  const { toast } = useToast();
  const db = useFirestore();
  const { isAdmin, user: currentUser, profile: currentProfile, isLoading: isAuthLoading } = useUserProfile();
  
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [logSearch, setLogSearch] = useState('');
  
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('TRAINEE');
  const [newUnit, setNewUnit] = useState(UNITS[0]);

  // Users Query
  const usersQuery = useMemoFirebase(() => {
    if (!db || !isAdmin) return null;
    return query(collection(db, 'users'), orderBy('email', 'asc'));
  }, [db, isAdmin]);

  const { data: users, isLoading: isUsersLoading } = useCollection(usersQuery);

  // Logs Query
  const logsQuery = useMemoFirebase(() => {
    if (!db || !isAdmin) return null;
    return query(collection(db, 'system_logs'), orderBy('timestamp', 'desc'), limit(100));
  }, [db, isAdmin]);

  const { data: logs, isLoading: isLogsLoading } = useCollection(logsQuery);

  const handleRoleChange = async (userId: string, targetUserName: string, newRole: string) => {
    if (!db || !currentUser || !currentProfile) return;
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      recordLog(db, {
        userId: currentUser.uid,
        userName: currentProfile.displayName || 'Admin',
        action: 'ROLE_UPDATE',
        details: `Changed role of ${targetUserName} to ${newRole}`
      });
      toast({ title: "Role Updated", description: "User permissions have been modified." });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Could not update user role." });
    }
  };

  const handleUnitChange = async (userId: string, targetUserName: string, newUnit: string) => {
    if (!db || !currentUser || !currentProfile) return;
    try {
      await updateDoc(doc(db, 'users', userId), { unit: newUnit });
      recordLog(db, {
        userId: currentUser.uid,
        userName: currentProfile.displayName || 'Admin',
        action: 'UNIT_UPDATE',
        details: `Reassigned ${targetUserName} to ${newUnit}`
      });
      toast({ title: "Unit Updated", description: "User station has been reassigned." });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Could not update user unit." });
    }
  };

  const handleDeleteUser = async (userId: string, targetUserName: string) => {
    if (!db || !currentUser || !currentProfile) return;
    setIsDeleting(userId);
    try {
      await deleteDoc(doc(db, 'users', userId));
      recordLog(db, {
        userId: currentUser.uid,
        userName: currentProfile.displayName || 'Admin',
        action: 'USER_DELETE',
        details: `Removed user ${targetUserName} from registry`
      });
      toast({ title: "Registry Updated", description: "User profile has been removed." });
    } catch (e) {
      toast({ variant: "destructive", title: "Deletion Failed", description: "Could not remove user." });
    } finally {
      setIsDeleting(null);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newPassword || !newName || !db || !currentUser || !currentProfile) return;

    setIsCreating(true);
    const secondaryAppName = `Secondary-${Date.now()}`;
    let secondaryApp;
    
    try {
      secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
      const secondaryAuth = getAuth(secondaryApp);
      
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, newEmail, newPassword);
      const newUser = userCredential.user;

      const userProfile = {
        uid: newUser.uid,
        email: newEmail,
        displayName: newName,
        role: newRole,
        unit: newRole === 'PTSLEADERSHIP' ? 'ORDERLY REPORT' : newUnit,
        createdAt: serverTimestamp(),
        lastLogin: null
      };

      await setDoc(doc(db, 'users', newUser.uid), userProfile);

      recordLog(db, {
        userId: currentUser.uid,
        userName: currentProfile.displayName || 'Admin',
        action: 'USER_PROVISION',
        details: `Provisioned new account for ${newName} (${newEmail})`
      });

      toast({ title: "User Provisioned", description: `${newName} added successfully.` });
      setIsAddUserOpen(false);
      setNewEmail(''); setNewPassword(''); setNewName('');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Provisioning Failed", description: error.message });
    } finally {
      if (secondaryApp) await deleteApp(secondaryApp);
      setIsCreating(false);
    }
  };

  const filteredLogs = logs?.filter(log => 
    log.userName.toLowerCase().includes(logSearch.toLowerCase()) || 
    log.action.toLowerCase().includes(logSearch.toLowerCase()) ||
    log.details.toLowerCase().includes(logSearch.toLowerCase())
  );

  const formatTimestamp = (ts: any) => {
    if (!ts) return 'N/A';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleString('en-GB', { 
      day: '2-digit', month: 'short', year: '2-digit', 
      hour: '2-digit', minute: '2-digit' 
    });
  };

  if (isAuthLoading) return <div className="flex-1 flex items-center justify-center bg-slate-50"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;

  if (!isAdmin) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold uppercase tracking-tight">Access Restricted</h2>
        <Button onClick={() => router.push('/')} className="mt-6 rounded-xl">Return Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#f8fafc] p-4 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="h-12 w-12 rounded-xl bg-white shadow-sm border border-slate-100">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex flex-col">
              <h1 className="text-2xl md:text-4xl font-black tracking-tight text-slate-900 uppercase leading-none">Management</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Authorized Command Registry</p>
            </div>
          </div>

          <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl font-bold h-12 px-8 shadow-xl shadow-primary/20">
                <UserPlus className="mr-2 h-5 w-5" />
                Add Personnel
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Provision Account</DialogTitle>
                <DialogDescription>Enter official credentials to authorize a new user.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddUser} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Jean Damascene" required />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="name@pts.gov" required />
                </div>
                <div className="space-y-2">
                  <Label>Initial Password</Label>
                  <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 6 characters" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select value={newRole} onValueChange={setNewRole}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Unit</Label>
                    <Select value={newUnit} onValueChange={setNewUnit}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter><Button type="submit" className="w-full h-12" disabled={isCreating}>{isCreating ? <Loader2 className="animate-spin" /> : 'Create Record'}</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="bg-slate-100 p-1 rounded-xl h-auto gap-1">
            <TabsTrigger value="users" className="rounded-lg font-bold px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <UserCog className="h-4 w-4 mr-2" /> Personnel Registry
            </TabsTrigger>
            <TabsTrigger value="logs" className="rounded-lg font-bold px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <History className="h-4 w-4 mr-2" /> Command Logs Board
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card className="border-none shadow-2xl rounded-3xl overflow-hidden">
              <CardHeader className="bg-slate-900 text-white p-8">
                <CardTitle>Authorized Personnel</CardTitle>
                <CardDescription className="text-slate-400">Manage access levels and unit assignments for the {users?.length || 0} active records.</CardDescription>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                {isUsersLoading ? (
                  <div className="py-20 flex flex-col items-center"><Loader2 className="animate-spin text-primary h-10 w-10" /></div>
                ) : (
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="font-bold">Identity</TableHead>
                        <TableHead className="font-bold">Privileges</TableHead>
                        <TableHead className="font-bold">Deployment</TableHead>
                        <TableHead className="font-bold">Temporal Log</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users?.map((u) => {
                        const isSystemMaster = u.email === 'nezasalton@gmail.com' || u.uid === 'S7QoMkUQNHaok4JjLB1fFd9OI0g1' || u.uid === '7oiKVWSJ30Ucg0DxamaRhoxlI3G2';
                        return (
                          <TableRow key={u.uid} className="hover:bg-slate-50 transition-colors">
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-black text-slate-900 uppercase text-xs flex items-center gap-2">
                                  {u.displayName}
                                  {isSystemMaster && <Badge className="bg-blue-100 text-blue-700 text-[8px] h-4">MASTER</Badge>}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400 tracking-tight">{u.email}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Select disabled={isSystemMaster} defaultValue={u.role} onValueChange={(val) => handleRoleChange(u.uid, u.displayName, val)}>
                                <SelectTrigger className="h-8 text-[10px] font-bold w-[120px]"><SelectValue /></SelectTrigger>
                                <SelectContent>{ROLES.map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}</SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Select disabled={isSystemMaster} defaultValue={u.unit} onValueChange={(val) => handleUnitChange(u.uid, u.displayName, val)}>
                                <SelectTrigger className="h-8 text-[10px] font-bold w-[140px]"><SelectValue /></SelectTrigger>
                                <SelectContent>{UNITS.map(unit => <SelectItem key={unit} value={unit}>{unit}</SelectItem>)}</SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500">
                                  <Calendar className="h-3 w-3 text-blue-600" /> Reg: {formatTimestamp(u.createdAt)}
                                </div>
                                <div className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-600">
                                  <Clock className="h-3 w-3" /> Last: {formatTimestamp(u.lastLogin)}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              {!isSystemMaster && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-slate-300 hover:text-red-500"><Trash2 className="h-4 w-4" /></Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Revoke Access?</AlertDialogTitle>
                                      <AlertDialogDescription>Permanently expunge <strong>{u.displayName}</strong> from the registry.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDeleteUser(u.uid, u.displayName)} className="bg-red-500 text-white">Confirm Purge</AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs">
            <Card className="border-none shadow-2xl rounded-3xl overflow-hidden">
              <CardHeader className="bg-slate-900 text-white p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-primary" />
                      Command Activity Board
                    </CardTitle>
                    <CardDescription className="text-slate-400">Audit trail of mission-critical system operations.</CardDescription>
                  </div>
                  <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input 
                      placeholder="Audit Search..." 
                      className="pl-10 h-10 bg-slate-800 border-slate-700 text-white text-xs font-bold"
                      value={logSearch}
                      onChange={e => setLogSearch(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {isLogsLoading ? (
                  <div className="py-20 flex flex-col items-center"><Loader2 className="animate-spin text-primary h-10 w-10" /></div>
                ) : filteredLogs && filteredLogs.length > 0 ? (
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="font-bold">Timestamp</TableHead>
                        <TableHead className="font-bold">Operator</TableHead>
                        <TableHead className="font-bold">Operation</TableHead>
                        <TableHead className="font-bold">Briefing Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.map((log) => (
                        <TableRow key={log.id} className="text-[11px] font-bold text-slate-600">
                          <TableCell className="text-slate-400 whitespace-nowrap">{formatTimestamp(log.timestamp)}</TableCell>
                          <TableCell className="text-slate-900 uppercase"><User className="h-3 w-3 inline mr-1 text-blue-600" />{log.userName}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-slate-100 text-slate-700 border-none text-[8px] tracking-widest">{log.action}</Badge>
                          </TableCell>
                          <TableCell className="max-w-md italic font-medium leading-tight">"{log.details}"</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="py-32 text-center space-y-4">
                    <History className="h-12 w-12 text-slate-200 mx-auto" />
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No activity records found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
