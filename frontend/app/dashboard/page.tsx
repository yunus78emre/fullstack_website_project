'use client'

import { useAuth } from '@/lib/auth-context'
import { AdminDashboard } from '@/components/dashboards/admin-dashboard'
import { AdvisorDashboard } from '@/components/dashboards/advisor-dashboard'
import { StudentDashboard } from '@/components/dashboards/student-dashboard'

export default function DashboardPage() {
  const { user } = useAuth()

  if (!user) return null

  switch (user.role) {
    case 'admin':
      return <AdminDashboard user={user} />
    case 'advisor':
      return <AdvisorDashboard user={user} />
    case 'student':
      return <StudentDashboard user={user} />
    default:
      return (
        <div className="rounded-lg border border-border p-6 text-center text-muted-foreground">
          Tanınmayan kullanıcı rolü. Oturumu kapatıp tekrar deneyin veya yönetici ile iletişime geçin.
        </div>
      )
  }
}
