'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
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
import { Loader2, ShieldAlert, UserCog, Mail, UserPlus, ShieldPlus, Trash2, ArrowLeft, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Official Command Units including N/A for Command Staff
const UNITS = ["Gasabo DPU", "Kicukiro DPU", "Nyarugenge DPU", "TRS", "SIF", "TFU", "N/A"];
const ROLES = ["ADMIN", "COMMANDER", "LEADER", "TRAINEE"];

export default function UserManagementPage() {
  const router = useRouter();
  const { toast } = useToast();
  const db = useFirestore();
  const { isAdmin, isLoading: isAuthLoading } = useUserProfile();
  
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('TRAINEE');
  const [newUnit, setNewUnit] = useState('TRS');

  const usersQuery = useMemoFirebase(() => {
    if (!db || !isAdmin) return null;
    return query(collection(db, 'users'), orderBy('email', 'asc'));
  }, [db, isAdmin]);

  const { data: users, isLoading: isUsersLoading } = useCollection(usersQuery);

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      toast({ title: "Role Updated", description: "User permissions have been modified." });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Could not update user role." });
    }
  };

  const handleUnitChange = async (userId: string, newUnit: string) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'users', userId), { unit: newUnit });
      toast({ title: "Unit Updated", description: "User station has been reassigned." });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Could not update user unit." });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!db) return;
    setIsDeleting(userId);
    try {
      await deleteDoc(doc(db, 'users', userId));
      toast({ title: "Registry Updated", description: "User profile has been removed." });
    } catch (e) {
      toast({ variant: "destructive", title: "Deletion Failed", description: "Could not remove user." });
    } finally {
      setIsDeleting(null);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newPassword || !newName || !db) return;

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
        unit: newUnit,
        createdAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'users', newUser.uid), userProfile);

      toast({ 
        title: "User Provisioned", 
        description: `${newName} added successfully.` 
      });
      
      setIsAddUserOpen(false);
      setNewEmail('');
      setNewPassword('');
      setNewName('');
      setNewRole('TRAINEE');
      setNewUnit('TRS');
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Provisioning Failed", 
        description: error.message || "Could not create user." 
      });
    } finally {
      if (secondaryApp) {
        await deleteApp(secondaryApp);
      }
      setIsCreating(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <ShieldAlert className="h-12 w-12 md:h-16 md:w-16 text-destructive mb-4" />
        <h2 className="text-xl md:text-2xl font-bold">Access Restricted</h2>
        <p className="text-slate-500 max-w-md mt-2 text-sm md:text-base">Only system administrators can access user management controls.</p>
        <Button onClick={() => router.push('/')} className="mt-6">Return Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#f8fafc] p-4 md:p-10">
      <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="md:hidden">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex flex-col gap-0.5 md:gap-1">
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 flex items-center gap-2 md:gap-3">
                <UserCog className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                Management
              </h1>
              <p className="text-xs md:text-sm text-slate-500">Personnel registry and role assignments.</p>
            </div>
          </div>

          <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl font-bold h-10 md:h-12 px-6 shadow-lg shadow-primary/20 text-xs md:text-sm w-full md:w-auto">
                <UserPlus className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                Add Personnel
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] w-[95vw] rounded-2xl md:rounded-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-lg">
                  <ShieldPlus className="h-5 w-5 text-primary" />
                  Provision Account
                </DialogTitle>
                <DialogDescription className="text-xs md:text-sm">
                  Enter official credentials to authorize a new user.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddUser} className="space-y-4 py-4">
                <div className="space-y-1.5 md:space-y-2">
                  <Label htmlFor="name" className="text-xs">Full Name</Label>
                  <Input 
                    id="name" 
                    value={newName} 
                    onChange={(e) => setNewName(e.target.value)} 
                    placeholder="e.g. Jean Damascene" 
                    required 
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5 md:space-y-2">
                  <Label htmlFor="email" className="text-xs">Official Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={newEmail} 
                    onChange={(e) => setNewEmail(e.target.value)} 
                    placeholder="name@example.com" 
                    required 
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5 md:space-y-2">
                  <Label htmlFor="password" className="text-xs">Initial Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    placeholder="Min 6 characters" 
                    required 
                    className="h-9 text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 md:space-y-2">
                    <Label htmlFor="role" className="text-xs">Access Role</Label>
                    <Select value={newRole} onValueChange={setNewRole}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Select Role" />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 md:space-y-2">
                    <Label htmlFor="unit" className="text-xs">Unit</Label>
                    <Select value={newUnit} onValueChange={setNewUnit}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Select Unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter className="pt-4">
                  <Button type="submit" className="w-full h-10 text-sm" disabled={isCreating}>
                    {isCreating ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />}
                    Create Record
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="border-none shadow-xl overflow-hidden rounded-[1.5rem] md:rounded-[2rem]">
          <CardHeader className="bg-slate-900 text-white p-6 md:p-8">
            <CardTitle className="text-lg md:text-xl">Personnel Registry</CardTitle>
            <CardDescription className="text-slate-400 text-xs md:text-sm">Active records: {users?.length || 0}</CardDescription>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {isUsersLoading ? (
              <div className="flex flex-col items-center justify-center py-16 md:py-20 gap-4">
                <Loader2 className="h-8 w-8 md:h-10 md:w-10 animate-spin text-primary" />
                <p className="text-xs md:text-sm font-medium text-slate-500">Fetching records...</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="font-bold text-xs md:text-sm h-10 md:h-12">Name</TableHead>
                    <TableHead className="font-bold text-xs md:text-sm h-10 md:h-12">Role</TableHead>
                    <TableHead className="font-bold text-xs md:text-sm h-10 md:h-12">Unit</TableHead>
                    <TableHead className="font-bold text-xs md:text-sm h-10 md:h-12 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.map((u) => {
                    const isSystemMaster = u.email === 'nezasalton@gmail.com' || u.uid === 'S7QoMkUQNHaok4JjLB1fFd9OI0g1';
                    return (
                      <TableRow key={u.uid} className="hover:bg-slate-50 transition-colors">
                        <TableCell className="font-medium text-xs md:text-sm py-3 md:py-4">
                          <div className="flex flex-col">
                            <span className="flex items-center gap-2">
                              {u.displayName}
                              {isSystemMaster && <Badge variant="secondary" className="h-4 text-[7px] uppercase tracking-tighter bg-primary/10 text-primary">Master</Badge>}
                            </span>
                            <span className="text-[10px] text-slate-400 truncate max-w-[120px]">{u.email}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 md:py-4">
                          <div className="flex items-center gap-2">
                            <Select 
                              disabled={isSystemMaster}
                              defaultValue={u.role} 
                              onValueChange={(val) => handleRoleChange(u.uid, val)}
                            >
                              <SelectTrigger className="w-[110px] md:w-[140px] h-8 md:h-9 text-[10px] md:text-xs">
                                <SelectValue placeholder="Role" />
                              </SelectTrigger>
                              <SelectContent>
                                {ROLES.map(role => (
                                  <SelectItem key={role} value={role} className="text-[10px] md:text-xs">
                                    {role}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 md:py-4">
                          <Select 
                            disabled={isSystemMaster}
                            defaultValue={u.unit || 'N/A'} 
                            onValueChange={(val) => handleUnitChange(u.uid, val)}
                          >
                            <SelectTrigger className="w-[110px] md:w-[140px] h-8 md:h-9 text-[10px] md:text-xs">
                              <SelectValue placeholder="Unit" />
                            </SelectTrigger>
                            <SelectContent>
                              {UNITS.map(unit => <SelectItem key={unit} value={unit} className="text-[10px] md:text-xs">{unit}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right py-3 md:py-4">
                          <div className="flex items-center justify-end gap-2">
                            {isSystemMaster ? (
                              <span className="text-[10px] md:text-xs text-slate-400 italic px-2 md:px-4">System Master</span>
                            ) : (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 md:h-9 md:w-9">
                                    {isDeleting === u.uid ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="w-[95vw] rounded-2xl md:rounded-lg">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="text-lg">Revoke Access?</AlertDialogTitle>
                                    <AlertDialogDescription className="text-xs md:text-sm">
                                      This will permanently remove <strong>{u.displayName}</strong>.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter className="gap-2">
                                    <AlertDialogCancel className="text-xs md:text-sm h-10">Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteUser(u.uid)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs md:text-sm h-10">
                                      Confirm Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
