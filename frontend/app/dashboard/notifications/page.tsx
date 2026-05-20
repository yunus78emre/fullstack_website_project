'use client'

import { useMemo, useState } from 'react'
import { Bell, Check, CheckCheck, Filter, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useNotifications } from '@/lib/notifications-context'
import { useAuth } from '@/lib/auth-context'
import { cn } from '@/lib/utils'
import { resolveCategoryColor } from '@/components/category-label'

type StatusFilter = 'all' | 'unread' | 'read'
type KindFilter = 'all' | 'project' | 'system' | 'announcement'

export default function NotificationsPage() {
  const { user, isLoading } = useAuth()
  const { notifications, unreadCount, markAsRead, markAllAsRead, refreshNotifications } =
    useNotifications()

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [kindFilter, setKindFilter] = useState<KindFilter>('all')
  const [busy, setBusy] = useState(false)

  const filtered = useMemo(() => {
    return notifications
      .filter((n) => {
        if (statusFilter === 'unread' && n.read) return false
        if (statusFilter === 'read' && !n.read) return false
        if (kindFilter !== 'all' && n.kind !== kindFilter) return false
        return true
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [notifications, statusFilter, kindFilter])

  const handleMarkAll = async () => {
    setBusy(true)
    try {
      await markAllAsRead()
    } finally {
      setBusy(false)
    }
  }

  const handleRefresh = async () => {
    setBusy(true)
    try {
      await refreshNotifications()
    } finally {
      setBusy(false)
    }
  }

  if (isLoading || user?.role === 'admin') {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-3 text-muted-foreground">Loading notifications...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            All your updates in one place
            {unreadCount > 0 ? (
              <> — <span className="font-medium text-foreground">{unreadCount} unread</span></>
            ) : null}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={busy}>
            {busy ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Bell className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
          <Button onClick={handleMarkAll} disabled={busy || unreadCount === 0}>
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark all as read
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Inbox</CardTitle>
              <CardDescription>
                Showing {filtered.length} of {notifications.length}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as StatusFilter)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                </SelectContent>
              </Select>
              <Select value={kindFilter} onValueChange={(v) => setKindFilter(v as KindFilter)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="project">Project</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="announcement">Announcement</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Bell className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">
                {notifications.length === 0
                  ? "You don't have any notifications yet."
                  : 'No notifications match the current filters.'}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map((n) => (
                <li
                  key={n.id}
                  className={cn(
                    'relative flex items-start gap-4 px-5 py-4 transition-colors hover:bg-muted/40',
                    !n.read && 'bg-muted/30',
                  )}
                >
                  {n.projectCategory ? (
                    <span
                      aria-hidden
                      className={cn(
                        'pointer-events-none absolute left-0 top-0 h-full w-1',
                        resolveCategoryColor(n.projectCategory),
                      )}
                      title={n.projectCategory}
                    />
                  ) : null}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          'text-sm',
                          !n.read
                            ? 'font-semibold text-foreground'
                            : 'font-medium text-muted-foreground',
                        )}
                      >
                        {n.title}
                      </span>
                      {n.kind ? (
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {n.kind}
                        </Badge>
                      ) : null}
                      {!n.read ? (
                        <Badge variant="destructive" className="text-[10px]">
                          New
                        </Badge>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-foreground whitespace-pre-wrap break-words leading-snug">
                      {n.body}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground tabular-nums">
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {!n.read ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0"
                      onClick={() => markAsRead(n.id)}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Mark read
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
