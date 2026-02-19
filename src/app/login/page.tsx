"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/firebase';
import { signInWithEmailAndPassword, signInAnonymously, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { FileText, Loader2, Mail, Lock, UserCheck, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [domainError, setDomainError] = useState(false);
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    setDomainError(false);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: "Success", description: "You are now signed in." });
      router.push('/');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description: error.message || "Invalid credentials. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setDomainError(false);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast({ title: "Success", description: "Signed in with Google." });
      router.push('/');
    } catch (error: any) {
      if (error.code === 'auth/unauthorized-domain') {
        setDomainError(true);
      }
      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description: error.message || "Failed to sign in with Google.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnonymousLogin = async () => {
    setIsLoading(true);
    setDomainError(false);
    try {
      await signInAnonymously(auth);
      toast({ title: "Success", description: "Signed in anonymously." });
      router.push('/');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description: error.message || "Failed to sign in anonymously.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 md:px-6">
      <Card className="w-full max-w-md shadow-2xl rounded-[1.5rem] md:rounded-[2rem] border-none overflow-hidden">
        <CardHeader className="space-y-2 text-center p-6 md:p-8 bg-white">
          <div className="mx-auto bg-primary w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center mb-2 shadow-lg shadow-primary/20">
            <FileText className="text-white w-6 h-6 md:w-7 md:h-7" />
          </div>
          <CardTitle className="text-xl md:text-2xl font-black">Report Master</CardTitle>
          <CardDescription className="text-xs md:text-sm">Sign in to access operational terminal</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-6 md:p-8 pt-0 bg-white">
          {domainError && (
            <Alert variant="destructive" className="mb-4 text-left">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="text-xs font-bold uppercase tracking-tight">Configuration Required</AlertTitle>
              <AlertDescription className="text-[10px] leading-tight">
                This domain is not authorized for Google Sign-in. Please add this URL to <b>Authorized domains</b> in the Firebase Console (Authentication &gt; Settings).
              </AlertDescription>
            </Alert>
          )}

          <Button variant="outline" className="w-full h-11 rounded-xl text-sm font-bold" onClick={handleGoogleLogin} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="animate-spin mr-2 h-4 w-4" />
            ) : (
              <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
              </svg>
            )}
            Google Sign In
          </Button>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-slate-100"></div>
            <span className="flex-shrink mx-4 text-[10px] text-muted-foreground uppercase font-black tracking-widest">Or</span>
            <div className="flex-grow border-t border-slate-100"></div>
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-bold text-slate-600">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  className="pl-10 h-11 rounded-xl text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-bold text-slate-600">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10 h-11 rounded-xl text-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full h-12 rounded-xl text-sm font-bold shadow-lg shadow-primary/20" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "Sign In with Email"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 p-6 md:p-8 bg-slate-50 border-t border-slate-100">
          <Button variant="ghost" className="w-full text-xs font-bold hover:bg-slate-200" onClick={handleAnonymousLogin} disabled={isLoading}>
            <UserCheck className="mr-2 h-4 w-4" />
            Continue Anonymously
          </Button>
          <p className="text-center text-[9px] md:text-[10px] text-slate-400 uppercase font-bold tracking-tighter max-w-[240px] leading-relaxed">
            Official use only. Unauthorized terminal access is strictly prohibited and monitored.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
