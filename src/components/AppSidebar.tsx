
'use client';

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
  SidebarGroupContent
} from '@/components/ui/sidebar';
import { 
  LayoutDashboard, 
  FilePlus, 
  History, 
  Users, 
  LogOut, 
  UserCircle,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { Button } from './ui/button';

export function AppSidebar() {
  const pathname = usePathname();
  const { isAdmin, isLeader, profile, isLoading } = useUserProfile();
  const auth = useAuth();

  const handleSignOut = () => signOut(auth);

  if (isLoading) return null;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-2 rounded-lg">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-lg group-data-[collapsible=icon]:hidden">Report Master</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/'}>
                  <Link href="/">
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {isLeader && (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === '/daily/new'}>
                      <Link href="/daily/new">
                        <FilePlus className="h-4 w-4" />
                        <span>New Report</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === '/reports'}>
                      <Link href="/reports">
                        <History className="h-4 w-4" />
                        <span>Archive</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === '/users'}>
                    <Link href="/users">
                      <Users className="h-4 w-4" />
                      <span>User Management</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t">
        <div className="flex flex-col gap-4 group-data-[collapsible=icon]:items-center">
          <div className="flex items-center gap-3 px-2">
            <UserCircle className="h-5 w-5 text-slate-400" />
            <div className="flex flex-col group-data-[collapsible=icon]:hidden">
              <span className="text-xs font-bold truncate max-w-[120px]">{profile?.displayName}</span>
              <span className="text-[10px] text-primary uppercase font-black tracking-tighter">
                {isAdmin ? 'Admin' : profile?.role}
              </span>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="w-full justify-start text-muted-foreground hover:text-destructive">
            <LogOut className="h-4 w-4 mr-2" />
            <span className="group-data-[collapsible=icon]:hidden">Sign Out</span>
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
