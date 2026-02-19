"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUserProfile } from '@/hooks/use-user-profile';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarRail,
  SidebarTrigger
} from '@/components/ui/sidebar';
import { 
  LayoutDashboard, 
  FilePlus, 
  History, 
  Users, 
  LogOut, 
  UserCircle,
  ShieldCheck,
  Settings,
  Loader2
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { Button } from './ui/button';

export function AppSidebar() {
  const pathname = usePathname();
  const { isAdmin, profile, user, isLoading } = useUserProfile();
  const auth = useAuth();

  const handleSignOut = () => signOut(auth);

  if (!user) return null;

  return (
    <Sidebar collapsible="icon" className="bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-xl">
      <SidebarHeader className="p-4 bg-transparent border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="bg-primary p-2 rounded-lg shadow-lg shadow-primary/20 shrink-0">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <span className="font-black text-lg tracking-tighter text-slate-900 dark:text-white group-data-[collapsible=icon]:hidden truncate">Report Master</span>
        </div>
        <SidebarTrigger className="hidden md:flex" />
      </SidebarHeader>

      <SidebarContent className="bg-transparent px-2">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
            <span className="text-[8px] font-black uppercase text-slate-300 tracking-widest group-data-[collapsible=icon]:hidden">Loading Profile</span>
          </div>
        ) : (
          <>
            <SidebarGroup>
              <SidebarGroupLabel className="text-[10px] uppercase font-black tracking-widest text-slate-400 py-4">Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === '/'} className="h-11 rounded-xl">
                      <Link href="/">
                        <LayoutDashboard className="h-4 w-4" />
                        <span className="font-bold">Dashboard</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === '/daily/new'} className="h-11 rounded-xl">
                      <Link href="/daily/new">
                        <FilePlus className="h-4 w-4" />
                        <span className="font-bold">New Report</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === '/reports'} className="h-11 rounded-xl">
                      <Link href="/reports">
                        <History className="h-4 w-4" />
                        <span className="font-bold">Archive</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel className="text-[10px] uppercase font-black tracking-widest text-slate-400 py-4">User Settings</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === '/settings'} className="h-11 rounded-xl">
                      <Link href="/settings">
                        <Settings className="h-4 w-4" />
                        <span className="font-bold">Security Settings</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {isAdmin && (
              <SidebarGroup>
                <SidebarGroupLabel className="text-[10px] uppercase font-black tracking-widest text-slate-400 py-4">Administration</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={pathname === '/users'} className="h-11 rounded-xl">
                        <Link href="/users">
                          <Users className="h-4 w-4" />
                          <span className="font-bold">User Management</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-transparent">
        <div className="flex flex-col gap-4 group-data-[collapsible=icon]:items-center">
          <div className="flex items-center gap-3 px-2">
            <UserCircle className="h-6 w-6 text-slate-400" />
            {!isLoading && (
              <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                <span className="text-xs font-black text-slate-900 dark:text-white truncate max-w-[120px] leading-tight">{profile?.displayName}</span>
                <span className="text-[10px] text-primary uppercase font-black tracking-tighter">
                  {isAdmin ? 'System Admin' : profile?.role}
                </span>
              </div>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="w-full justify-start text-slate-500 hover:text-destructive hover:bg-destructive/5 rounded-xl transition-colors">
            <LogOut className="h-4 w-4 mr-2" />
            <span className="group-data-[collapsible=icon]:hidden font-bold">Sign Out</span>
          </Button>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
