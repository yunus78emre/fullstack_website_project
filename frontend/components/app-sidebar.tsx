'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  GraduationCap,
  LayoutDashboard,
  FolderKanban,
  Megaphone,
  FileText,
  UserCog,
  Bell,
  ClipboardList,
  Search,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { useAuth } from '@/lib/auth-context'

import Image from 'next/image'
import logoImg from '../logo2.png'

const adminNavItems = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Project Categories', href: '/dashboard/categories', icon: FolderKanban },
  { title: 'Announcements', href: '/dashboard/announcements', icon: Megaphone },
]

const advisorNavItems = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Advised Projects', href: '/dashboard/projects', icon: FolderKanban },
  { title: 'Project Requests', href: '/dashboard/requests', icon: ClipboardList },
  { title: 'Announcements', href: '/dashboard/announcements', icon: Megaphone },
  { title: 'Notifications', href: '/dashboard/notifications', icon: Bell },
]

const studentNavItems = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { title: 'My Projects', href: '/dashboard/projects', icon: FolderKanban },
  { title: 'My Advisor Requests', href: '/dashboard/requests', icon: FileText },
  { title: 'Incoming Student Requests', href: '/dashboard/student-requests', icon: ClipboardList },
  { title: 'Search', href: '/dashboard/search-projects', icon: Search },
  { title: 'Announcements', href: '/dashboard/announcements', icon: Megaphone },
  { title: 'Notifications', href: '/dashboard/notifications', icon: Bell },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { user } = useAuth()

  const navItems = user?.role === 'admin' 
    ? adminNavItems 
    : user?.role === 'advisor' 
      ? advisorNavItems 
      : studentNavItems

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center overflow-hidden shrink-0 shadow-sm border border-border">
            <Image src={logoImg} alt="PROJEX Logo" className="w-full h-full object-cover scale-[2.2]" priority />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-widest -mr-[0.1em]">
              <span className="text-[#009B95]">PROJE</span>
              <span className="text-[#0055D4]">X</span>
            </h1>
            <p className="text-xs font-medium text-sidebar-foreground/60 capitalize">{user?.role} Panel</p>
          </div>
        </Link>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.title}
                  >
                    <Link href={item.href}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === '/dashboard/settings'}
              tooltip="Settings"
            >
              <Link href="/dashboard/settings">
                <UserCog className="w-4 h-4" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
