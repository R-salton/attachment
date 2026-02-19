"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@/firebase';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ShieldCheck, Lock, Loader2, AlertCircle, KeyRound, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function SettingsPage() {
  const router = useRouter();
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
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      
      setIsSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      toast({ title: "Protocol Updated", description: "Your credentials have been changed." });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "Invalid current password.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-[#f8fafc] p-4 md:p-10 flex flex-col items-center justify-start md:justify-center overflow-y-auto">
      <div className="w-full md:hidden mb-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/')} className="px-2">
          <ArrowLeft className="h-5 w-5 mr-1" />
          Back
        </Button>
      </div>

      <div className="w-full max-w-md space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center space-y-2">
          <div className="bg-primary/10 w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-3xl flex items-center justify-center mx-auto mb-3 md:mb-4 border border-primary/20">
            <ShieldCheck className="text-primary h-6 w-6 md:h-8 md:w-8" />
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">Security</h1>
          <p className="text-xs md:text-sm text-slate-500">Manage your encrypted access credentials</p>
        </div>

        <Card className="border-none shadow-2xl rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden bg-white">
          <CardHeader className="bg-slate-900 text-white p-6 md:p-8">
            <CardTitle className="flex items-center gap-2 md:gap-3 text-lg md:text-xl">
              <KeyRound className="h-4 w-4 md:h-5 md:w-5" />
              Change Password
            </CardTitle>
            <CardDescription className="text-slate-400 text-xs md:text-sm">Regularly updating your password ensures mission security.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 md:p-8 pt-8 md:pt-10">
            {isSuccess && (
              <Alert className="mb-6 bg-emerald-50 border-emerald-200 text-emerald-800">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <AlertTitle className="text-sm">Success</AlertTitle>
                <AlertDescription className="text-xs">Your password has been updated. Use new credentials for next login.</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-5 md:space-y-6">
              <div className="space-y-1.5 md:space-y-2">
                <Label htmlFor="current" className="text-xs md:text-sm">Current Password</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3 h-4 w-4 md:h-5 md:w-5 text-slate-400" />
                  <Input 
                    id="current"
                    type="password" 
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="pl-11 h-10 md:h-12 rounded-xl bg-slate-50 text-sm"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <div className="h-px bg-slate-100 my-2" />

              <div className="space-y-1.5 md:space-y-2">
                <Label htmlFor="new" className="text-xs md:text-sm">New Password</Label>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-3 h-4 w-4 md:h-5 md:w-5 text-slate-400" />
                  <Input 
                    id="new"
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-11 h-10 md:h-12 rounded-xl bg-slate-50 text-sm"
                    placeholder="Min. 6 characters"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5 md:space-y-2">
                <Label htmlFor="confirm" className="text-xs md:text-sm">Confirm Password</Label>
                <div className="relative">
                  <CheckCircle2 className="absolute left-4 top-3 h-4 w-4 md:h-5 md:w-5 text-slate-400" />
                  <Input 
                    id="confirm"
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-11 h-10 md:h-12 rounded-xl bg-slate-50 text-sm"
                    placeholder="Match new password"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-10 md:h-12 rounded-xl font-bold shadow-lg shadow-primary/20 text-sm" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "Authorize Change"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="bg-slate-50 border-t p-4 md:p-6">
            <div className="flex items-start gap-2 md:gap-3">
              <AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-slate-400 mt-0.5" />
              <p className="text-[9px] md:text-[11px] text-slate-500 leading-relaxed uppercase font-bold tracking-tight">
                Warning: Re-authentication is required. Current password is needed to authorize this sensitive operation.
              </p>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
