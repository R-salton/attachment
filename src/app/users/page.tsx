
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc } from 'firebase/firestore';
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
import { Badge } from '@/components/ui/badge';
import { Loader2, ShieldAlert, UserCog, Mail, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function UserManagementPage() {
  const router = useRouter();
  const { toast } = useToast();
  const db = useFirestore();
  const { isAdmin, isLoading: isAuthLoading } = useUserProfile();

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
        <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold">Access Restricted</h2>
        <p className="text-slate-500 max-w-md mt-2">Only system administrators can access user management controls.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#f8fafc] p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <UserCog className="h-8 w-8 text-primary" />
            User Management
          </h1>
          <p className="text-slate-500">Assign roles and manage access levels for personnel.</p>
        </div>

        <Card className="border-none shadow-xl overflow-hidden rounded-[2rem]">
          <CardHeader className="bg-slate-900 text-white p-8">
            <CardTitle>Personnel Registry</CardTitle>
            <CardDescription className="text-slate-400">Total registered users: {users?.length || 0}</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isUsersLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm font-medium text-slate-500">Fetching records...</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="font-bold">Name</TableHead>
                    <TableHead className="font-bold">Email</TableHead>
                    <TableHead className="font-bold">Current Role</TableHead>
                    <TableHead className="font-bold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.map((u) => (
                    <TableRow key={u.uid} className="hover:bg-slate-50 transition-colors">
                      <TableCell className="font-medium">{u.displayName}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-slate-500 text-xs">
                          <Mail className="h-3 w-3" />
                          {u.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.role === 'LEADER' ? 'default' : 'secondary'} className="font-bold">
                          {u.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {u.email === 'nezasalton@gmail.com' ? (
                          <span className="text-xs text-slate-400 italic">System Admin</span>
                        ) : (
                          <Select 
                            defaultValue={u.role} 
                            onValueChange={(val) => handleRoleChange(u.uid, val)}
                          >
                            <SelectTrigger className="w-[140px] ml-auto h-9">
                              <SelectValue placeholder="Role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="TRAINEE">Trainee</SelectItem>
                              <SelectItem value="LEADER">Leader</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
