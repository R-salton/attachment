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
      <div className="min-h-screen bg-[#f1f5f9] flex items-center justify-center p-6 text-center relative overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none">
          <div className="absolute top-10 left-10"><ShieldAlert className="w-64 h-64" /></div>
          <div className="absolute bottom-10 right-10"><Fingerprint className="w-64 h-64" /></div>
        </div>

        <div className="bg-white p-10 md:p-20 rounded-[3rem] shadow-[0_48px_96px_-12px_rgba(0,0,0,0.12)] border border-white max-w-2xl w-full space-y-10 animate-in zoom-in-95 duration-700 relative z-10">
          <div className="relative mx-auto w-24 h-24 md:w-32 md:h-32">
            <div className="absolute inset-0 bg-amber-100 rounded-[2.5rem] rotate-12 animate-pulse" />
            <div className="absolute inset-0 bg-amber-50 rounded-[2.5rem] -rotate-6" />
            <div className="relative bg-white w-full h-full rounded-[2.5rem] shadow-xl flex items-center justify-center border border-amber-100">
              <Lock className="text-amber-600 h-10 w-10 md:h-14 md:w-14" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 text-amber-600 font-black text-[10px] md:text-xs uppercase tracking-[0.3em] bg-amber-50 px-6 py-2 rounded-full w-fit mx-auto border border-amber-100 shadow-sm">
              <Clock className="h-4 w-4" /> Awaiting Authorization
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 uppercase tracking-tighter leading-none">Terminal Locked</h1>
          </div>

          <p className="text-slate-500 font-bold text-base md:text-xl leading-relaxed max-w-lg mx-auto">
            Credentials registered. For operational security, your terminal access must be manually authorized by a Command Administrator.
          </p>

          <div className="pt-6 space-y-6">
            <div className="p-6 md:p-8 bg-slate-50 rounded-[2rem] border border-slate-100 text-left space-y-4 shadow-inner">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol Briefing</p>
              </div>
              <ul className="space-y-3">
                <li className="flex gap-3 text-xs md:text-sm text-slate-600 font-bold">
                  <ChevronRight className="h-4 w-4 text-primary shrink-0" />
                  <span>Admin will review and verify your identity.</span>
                </li>
                <li className="flex gap-3 text-xs md:text-sm text-slate-600 font-bold">
                  <ChevronRight className="h-4 w-4 text-primary shrink-0" />
                  <span>Unit assignment and role privileges will be granted.</span>
                </li>
                <li className="flex gap-3 text-xs md:text-sm text-slate-600 font-bold">
                  <ChevronRight className="h-4 w-4 text-primary shrink-0" />
                  <span>Registry features will unlock upon authorization.</span>
                </li>
              </ul>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button onClick={() => window.location.reload()} variant="outline" className="rounded-2xl h-14 px-8 font-black border-slate-200 w-full sm:w-auto">
                Check Status
              </Button>
              <Button onClick={handleSignOut} variant="ghost" className="text-slate-400 hover:text-red-600 hover:bg-red-50 font-black h-14 px-8 gap-2 w-full sm:w-auto rounded-2xl transition-all">
                <LogOut className="h-5 w-5" /> Sign Out
              </Button>
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
