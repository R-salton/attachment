
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/firebase';
import { signInWithEmailAndPassword, signInAnonymously, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Loader2, Mail, Lock, UserCheck, AlertCircle, ShieldX, Fingerprint, UserPlus, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from 'next/link';

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

      <Card className="w-full max-w-4xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] rounded-[2.5rem] border-none overflow-hidden bg-white animate-in fade-in zoom-in-95 duration-700">
        <div className="flex flex-col md:flex-row">
          {/* Left Column: Branding & Social */}
          <div className="flex-1 p-8 md:p-12 bg-slate-50/50 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col justify-center">
            <div className="space-y-6 text-center md:text-left">
              <div className="mx-auto md:mx-0 bg-slate-900 w-14 h-14 rounded-[1.2rem] flex items-center justify-center mb-2 shadow-2xl shadow-slate-900/20 transform hover:scale-105 transition-transform duration-300">
                <Fingerprint className="text-primary w-7 h-7" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-xl md:text-2xl font-black tracking-tight text-slate-900 uppercase">Terminal Auth</CardTitle>
                <CardDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Secure Operations Gateway</CardDescription>
              </div>

              <div className="space-y-4 pt-4">
                {domainError && (
                  <Alert variant="destructive" className="bg-red-50 border-red-100 rounded-2xl animate-in slide-in-from-top-2">
                    <AlertTitle className="text-[10px] font-black uppercase tracking-tight text-red-900">Auth Restriction</AlertTitle>
                    <AlertDescription className="text-[9px] font-bold text-red-700 leading-tight">
                      Authorized domains only.
                    </AlertDescription>
                  </Alert>
                )}

                <Button 
                  variant="outline" 
                  className="w-full h-12 rounded-2xl text-xs font-black border-slate-200 bg-white hover:bg-slate-50 transition-all active:scale-[0.98]" 
                  onClick={handleGoogleLogin} 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  ) : (
                    <svg className="mr-3 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                      <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                    </svg>
                  )}
                  Google Credentials
                </Button>

                <div className="pt-6 border-t border-slate-100 space-y-4">
                  <div className="flex items-center gap-2">
                    <UserPlus className="h-3 w-3 text-primary" />
                    <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Public Registry</span>
                  </div>
                  <Button asChild variant="ghost" className="w-full h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest text-primary bg-primary/5 hover:bg-primary/10 transition-all border border-primary/10">
                    <Link href="/visitors/register">
                      Visitor Registration <ChevronRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Email Form */}
          <div className="flex-1 p-8 md:p-12 flex flex-col justify-center">
            {error && (
              <Alert className="mb-6 bg-red-50 border-red-100 rounded-2xl animate-in slide-in-from-top-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-[10px] font-bold text-red-700 leading-tight">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Work Email</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@pts.gov"
                    className="pl-11 h-12 rounded-xl bg-slate-50 border-none font-bold text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Access Key</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-11 h-12 rounded-xl bg-slate-50 border-none font-bold text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full h-12 rounded-xl text-xs font-black shadow-xl shadow-primary/20 bg-slate-900 hover:bg-slate-800 transition-all active:scale-[0.98]" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "Authorize Session"}
              </Button>
            </form>
          </div>
        </div>

        {/* Full Width Footer */}
        <CardFooter className="flex flex-col md:flex-row items-center justify-between gap-4 p-6 md:px-12 bg-slate-50 border-t border-slate-100">
          <Button variant="ghost" className="h-9 rounded-xl text-[10px] font-black text-slate-400 hover:text-slate-900 transition-all" onClick={handleAnonymousLogin} disabled={isLoading}>
            <UserCheck className="mr-2 h-4 w-4" />
            GUEST OBSERVATION MODE
          </Button>
          <p className="text-[8px] text-slate-300 uppercase font-black tracking-[0.2em] leading-relaxed text-center md:text-right">
            Authorized Personnel Only. Mission-critical data is logged.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
