'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { TopNav } from '@/components/top-nav'
import { useAuth } from '@/lib/auth-context'

// Admin is strictly limited to category & announcement management.
// These routes are for student/advisor workflows — admin should be redirected out.
const ADMIN_FORBIDDEN_PREFIXES = [
  '/dashboard/projects',
  '/dashboard/requests',
  '/dashboard/search-projects',
  '/dashboard/student-requests',
  '/dashboard/notifications',
]

// Only admins manage categories; students/advisors must be blocked.
const ADMIN_ONLY_PREFIXES = [
  '/dashboard/categories',
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isLoading } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || isLoading) return

    if (!user) {
      router.push('/')
      return
    }

    const isAdmin = user.role === 'admin'

    if (isAdmin && ADMIN_FORBIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) {
      router.replace('/dashboard')
      return
    }

    if (!isAdmin && ADMIN_ONLY_PREFIXES.some((p) => pathname.startsWith(p))) {
      router.replace('/dashboard')
      return
    }
  }, [user, router, mounted, isLoading, pathname])

  if (!mounted || isLoading || !user) {
    return null
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-w-0">
        <TopNav />
        <div className="min-w-0 flex-1 overflow-auto p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
