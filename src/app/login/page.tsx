"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/firebase';
import { signInWithEmailAndPassword, signInAnonymously, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { FileText, Loader2, Mail, Lock, UserCheck, AlertCircle, ShieldX, Fingerprint } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [domainError, setDomainError] = useState(false);
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    setError(null);
    setDomainError(false);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/');
    } catch (err: any) {
      setError(err.message || "Invalid credentials provided.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    setDomainError(false);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push('/');
    } catch (err: any) {
      if (err.code === 'auth/unauthorized-domain') {
        setDomainError(true);
      } else {
        setError(err.message || "Google authentication failed.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnonymousLogin = async () => {
    setIsLoading(true);
    setError(null);
    setDomainError(false);
    try {
      await signInAnonymously(auth);
      router.push('/');
    } catch (err: any) {
      setError(err.message || "Anonymous access failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f1f5f9] px-4 md:px-6 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />

      <Card className="w-full max-w-md shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] rounded-[2.5rem] border-none overflow-hidden bg-white animate-in fade-in zoom-in-95 duration-700">
        <CardHeader className="space-y-4 text-center p-8 md:p-12 bg-white">
          <div className="mx-auto bg-slate-900 w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-2 shadow-2xl shadow-slate-900/20 transform hover:scale-105 transition-transform duration-300">
            <Fingerprint className="text-primary w-8 h-8" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 uppercase">Terminal Auth</CardTitle>
            <CardDescription className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Secure Operations Gateway</CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6 p-8 md:p-12 pt-0">
          {domainError && (
            <Alert variant="destructive" className="bg-red-50 border-red-100 rounded-2xl animate-in slide-in-from-top-2">
              <ShieldX className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-xs font-black uppercase tracking-tight text-red-900">Auth Restriction</AlertTitle>
              <AlertDescription className="text-[10px] font-bold text-red-700 leading-tight">
                This domain is not authorized. Update <b>Authorized domains</b> in Firebase Console.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert className="bg-red-50 border-red-100 rounded-2xl animate-in slide-in-from-top-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-xs font-black uppercase tracking-tight text-red-900">Protocol Error</AlertTitle>
              <AlertDescription className="text-[10px] font-bold text-red-700 leading-tight">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <Button 
            variant="outline" 
            className="w-full h-14 rounded-2xl text-sm font-black border-slate-100 hover:bg-slate-50 hover:border-slate-200 transition-all active:scale-[0.98]" 
            onClick={handleGoogleLogin} 
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="animate-spin mr-2 h-5 w-5" />
            ) : (
              <svg className="mr-3 h-5 w-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
              </svg>
            )}
            Google Credentials
          </Button>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-slate-100"></div>
            <span className="flex-shrink mx-4 text-[9px] text-slate-300 uppercase font-black tracking-[0.3em]">Secure Login</span>
            <div className="flex-grow border-t border-slate-100"></div>
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Work Email</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@pts.gov"
                  className="pl-12 h-14 rounded-2xl bg-slate-50 border-none font-bold text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Access Key</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-12 h-14 rounded-2xl bg-slate-50 border-none font-bold text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full h-14 rounded-2xl text-sm font-black shadow-2xl shadow-primary/20 bg-slate-900 hover:bg-slate-800 transition-all active:scale-[0.98]" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : "Authorize Session"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 p-8 md:p-12 bg-slate-50/50 border-t border-slate-50">
          <Button variant="ghost" className="w-full h-12 rounded-xl text-xs font-black text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all" onClick={handleAnonymousLogin} disabled={isLoading}>
            <UserCheck className="mr-2 h-4 w-4" />
            GUEST OBSERVATION MODE
          </Button>
          <p className="text-center text-[8px] text-slate-300 uppercase font-black tracking-[0.2em] max-w-[280px] leading-relaxed">
            Authorized Personnel Only. Mission-critical data is logged and encrypted.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
