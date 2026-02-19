'use client';

import { useUser } from '@/firebase';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { LogIn, ShieldCheck, Menu } from 'lucide-react';

/**
 * Shell component that manages the global layout based on authentication state.
 * Handles the sidebar visibility and provides a guest header for signed-out users.
 */
export function Shell({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();

  // Show a blank loading state while checking auth to prevent layout shift
  if (isUserLoading) {
    return <div className="min-h-screen bg-[#f8fafc]" />;
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
