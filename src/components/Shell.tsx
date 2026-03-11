
'use client';

import { useUser, useAuth } from '@/firebase';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { LogIn, ShieldCheck, Menu, Loader2, Lock, LogOut, Clock } from 'lucide-react';
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
            <span className="font-bold text-lg text-slate-900">Report Master</span>
          </div>
          <Button asChild variant="outline" size="sm" className="rounded-xl font-bold">
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
        <div className="bg-white p-10 md:p-16 rounded-[2.5rem] shadow-2xl border border-slate-100 max-w-xl w-full space-y-8 animate-in zoom-in-95 duration-500">
          <div className="bg-amber-100 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
            <Lock className="text-amber-600 h-10 w-10" />
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Terminal Locked</h1>
            <div className="flex items-center justify-center gap-2 text-amber-600 font-black text-[10px] uppercase tracking-widest bg-amber-50 px-4 py-1.5 rounded-full w-fit mx-auto border border-amber-100">
              <Clock className="h-3 w-3" /> Awaiting Authorization
            </div>
          </div>
          <p className="text-slate-500 font-bold text-sm md:text-base leading-relaxed">
            Your account has been successfully registered in the registry. For security, mission-critical terminals require manual authorization by a Command Administrator.
          </p>
          <div className="pt-4 space-y-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">What happens next?</p>
              <p className="text-xs text-slate-600 font-medium">An administrator will review your credentials and assign you to a specific deployment unit and command role. You will gain full access once your profile is verified.</p>
            </div>
            <Button onClick={handleSignOut} variant="ghost" className="text-slate-400 hover:text-slate-900 font-bold gap-2">
              <LogOut className="h-4 w-4" /> Sign Out
            </Button>
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
              <span className="font-bold text-slate-900">Report Master</span>
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
