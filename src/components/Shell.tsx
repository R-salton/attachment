'use client';

import { useUser, useAuth } from '@/firebase';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { LogIn, ShieldCheck, Menu, Loader2, Lock, LogOut, Clock, ShieldAlert, Fingerprint, ChevronRight } from 'lucide-react';
import { useUserProfile } from '@/hooks/use-user-profile';
import { signOut } from 'firebase/auth';

/**
 * Shell component that manages the global layout based on authentication state.
 * Handles the sidebar visibility and provides a guest header for signed-out users.
 */
export function Shell({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const { isInactive, isLoading: isProfileLoading } = useUserProfile();
  const auth = useAuth();

  const handleSignOut = () => signOut(auth);

  // Show a robust loading state while checking auth
  if (isUserLoading || (user && isProfileLoading)) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">Initializing Terminal...</p>
      </div>
    );
  }

  // Guest Layout: No sidebar, shows a simple sign-in header
  if (!user) {
    return (
      <div className="flex min-h-screen w-full flex-col bg-[#f8fafc]">
        <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50 px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-lg">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <span className="font-black text-lg tracking-tighter text-slate-900">Report Master</span>
          </div>
          <Button asChild variant="outline" size="sm" className="rounded-xl font-bold border-slate-200">
            <Link href="/login">
              <LogIn className="h-4 w-4 mr-2" />
              Sign In
            </Link>
          </Button>
        </header>
        <main className="flex-1 flex flex-col">
          {children}
        </main>
      </div>
    );
  }

  // Pending Approval Layout: For users with the INACTIVE role
  if (isInactive) {
    return (
      <div className="min-h-screen bg-[#f1f5f9] flex items-center justify-center p-4 md:p-6 relative overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.02] pointer-events-none">
          <div className="absolute top-10 left-10"><ShieldAlert className="w-64 h-64" /></div>
          <div className="absolute bottom-10 right-10"><Fingerprint className="w-64 h-64" /></div>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] border border-slate-100 max-w-4xl w-full animate-in zoom-in-95 duration-700 relative z-10 overflow-hidden">
          <div className="flex flex-col md:flex-row">
            {/* Left Column: Status & Brand */}
            <div className="md:w-2/5 p-8 md:p-12 bg-slate-50/50 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col items-center justify-center text-center">
              <div className="relative w-20 h-20 md:w-24 md:h-24 mb-6">
                <div className="absolute inset-0 bg-amber-100 rounded-2xl md:rounded-3xl rotate-12 animate-pulse" />
                <div className="relative bg-white w-full h-full rounded-2xl md:rounded-3xl shadow-lg flex items-center justify-center border border-amber-100">
                  <Lock className="text-amber-600 h-8 w-8 md:h-10 md:w-10" />
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 text-amber-600 font-black text-[9px] uppercase tracking-[0.2em] bg-amber-50 px-4 py-1.5 rounded-full border border-amber-100 shadow-sm">
                  <Clock className="h-3 w-3" /> Pending Auth
                </div>
                <h1 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tighter leading-tight">Terminal Locked</h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Official Operational Gateway</p>
              </div>
            </div>

            {/* Right Column: Information & Actions */}
            <div className="flex-1 p-8 md:p-12 space-y-8">
              <div className="space-y-4">
                <p className="text-slate-500 font-bold text-sm md:text-base leading-relaxed">
                  Your credentials have been registered. For operational security, your terminal access must be manually authorized by a Command Administrator.
                </p>

                <div className="p-5 md:p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-3 shadow-inner">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Protocol Briefing</p>
                  </div>
                  <ul className="space-y-2">
                    {[
                      "Admin will review and verify your identity.",
                      "Unit assignment and privileges will be granted.",
                      "Registry features will unlock upon authorization."
                    ].map((step, i) => (
                      <li key={i} className="flex gap-2.5 text-[11px] md:text-xs text-slate-600 font-bold">
                        <ChevronRight className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <Button onClick={() => window.location.reload()} className="w-full sm:w-auto rounded-xl h-11 px-8 font-black text-xs shadow-lg shadow-primary/20">
                  Check Status
                </Button>
                <Button onClick={handleSignOut} variant="ghost" className="w-full sm:w-auto h-11 px-6 rounded-xl font-black text-xs text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all gap-2">
                  <LogOut className="h-4 w-4" /> Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated Layout: Includes sidebar and mobile command header
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#f8fafc]">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="md:hidden border-b bg-white/90 backdrop-blur-sm p-4 flex items-center gap-4 sticky top-0 z-40">
            <SidebarTrigger>
              <Menu className="h-5 w-5" />
            </SidebarTrigger>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <span className="font-black tracking-tighter text-slate-900">Report Master</span>
            </div>
          </header>
          <main className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
