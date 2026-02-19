"use client";

import { useState } from 'react';
import { useAuth, useUser } from '@/firebase';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ShieldCheck, Lock, Loader2, AlertCircle, KeyRound, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function SettingsPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const auth = useAuth();
  const { user } = useUser();
  const { toast } = useToast();

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.email) return;

    if (newPassword !== confirmPassword) {
      toast({ variant: "destructive", title: "Mismatch", description: "New passwords do not match." });
      return;
    }

    if (newPassword.length < 6) {
      toast({ variant: "destructive", title: "Too Weak", description: "Password must be at least 6 characters." });
      return;
    }

    setIsLoading(true);
    setIsSuccess(false);

    try {
      // Re-authentication is required for sensitive operations
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Update the password
      await updatePassword(user, newPassword);
      
      setIsSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      toast({ title: "Protocol Updated", description: "Your access credentials have been successfully changed." });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "Could not change password. Check your current password.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-[#f8fafc] p-6 md:p-10 flex items-center justify-center">
      <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center space-y-2">
          <div className="bg-primary/10 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-primary/20">
            <ShieldCheck className="text-primary h-8 w-8" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Security Protocols</h1>
          <p className="text-slate-500">Manage your encrypted access credentials</p>
        </div>

        <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
          <CardHeader className="bg-slate-900 text-white p-8">
            <CardTitle className="flex items-center gap-3">
              <KeyRound className="h-5 w-5" />
              Change Password
            </CardTitle>
            <CardDescription className="text-slate-400">Regularly updating your password ensures mission security.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-10">
            {isSuccess && (
              <Alert className="mb-6 bg-emerald-50 border-emerald-200 text-emerald-800">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>Your password has been updated. Use your new credentials for future logins.</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="current">Current Password</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                  <Input 
                    id="current"
                    type="password" 
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="pl-11 h-12 rounded-xl bg-slate-50"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <div className="h-px bg-slate-100 my-2" />

              <div className="space-y-3">
                <Label htmlFor="new">New Secure Password</Label>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                  <Input 
                    id="new"
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-11 h-12 rounded-xl bg-slate-50"
                    placeholder="Min. 6 characters"
                    required
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="confirm">Confirm New Password</Label>
                <div className="relative">
                  <CheckCircle2 className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                  <Input 
                    id="confirm"
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-11 h-12 rounded-xl bg-slate-50"
                    placeholder="Match new password"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-12 rounded-xl font-bold shadow-lg shadow-primary/20" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : "Authorize Change"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="bg-slate-50 border-t p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-slate-400 mt-0.5" />
              <p className="text-[11px] text-slate-500 leading-relaxed uppercase font-bold tracking-tight">
                Warning: Re-authentication is required. You will need your current password to authorize this sensitive operation.
              </p>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
