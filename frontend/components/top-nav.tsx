'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bell, LogOut, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { useAuth } from '@/lib/auth-context'
import { useNotifications } from '@/lib/notifications-context'
import { cn } from '@/lib/utils'
import { resolveCategoryColor } from '@/components/category-label'

export function TopNav() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const { notifications, unreadCount, markAsRead } = useNotifications()

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const sorted = [...notifications].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 gap-4">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="text-foreground" />
      </div>

      <div className="flex items-center gap-3">
        {user?.role !== 'admin' && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative shrink-0"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5 text-muted-foreground" />
              {unreadCount > 0 ? (
                <span className="absolute -top-1 -right-1 min-h-4 min-w-4 px-1 rounded-full bg-destructive text-[10px] font-semibold leading-none text-destructive-foreground flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              ) : null}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="w-[min(100vw-2rem,28rem)] max-h-[min(70vh,26rem)] p-0 flex flex-col"
          >
            <div className="border-b border-border px-4 py-3">
              <p className="text-sm font-semibold text-foreground">Notifications</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Click a notification to read it; the counter updates.
              </p>
            </div>
            <ScrollArea className="h-[min(60vh,22rem)]">
              <div className="p-2">
                {sorted.length === 0 ? (
                  <p className="text-sm text-muted-foreground px-2 py-6 text-center">
                    No notifications.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-1">
                    {sorted.slice(0, 10).map((n) => (
                      <li key={n.id}>
                        <button
                          type="button"
                          onClick={() => markAsRead(n.id)}
                          className={cn(
                            'relative w-full overflow-hidden rounded-md border border-transparent pl-4 pr-3 py-2.5 text-left transition-colors hover:bg-muted/80',
                            !n.read && 'bg-muted/50 border-border/60',
                          )}
                        >
                          {n.projectCategory ? (
                            <span
                              aria-hidden
                              className={cn(
                                'pointer-events-none absolute left-0 top-0 h-full w-1.5 rounded-l-md',
                                resolveCategoryColor(n.projectCategory),
                              )}
                              title={n.projectCategory}
                            />
                          ) : null}
                          <div className="flex items-start justify-between gap-2">
                            <span
                              className={cn(
                                'text-sm',
                                !n.read ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground',
                              )}
                            >
                              {n.title}
                            </span>
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap tabular-nums shrink-0">
                              {new Date(n.createdAt).toLocaleString('en-US', {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })}
                            </span>
                          </div>
                          <p className="mt-1.5 text-sm text-foreground whitespace-pre-wrap break-words leading-snug">
                            {n.body}
                          </p>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </ScrollArea>
            <div className="border-t border-border px-4 py-2">
              <Link
                href="/dashboard/notifications"
                className="block text-center text-xs font-medium text-primary hover:underline"
              >
                View all notifications
              </Link>
            </div>
          </PopoverContent>
        </Popover>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user?.avatar} alt={user?.name} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {user?.name ? getInitials(user.name) : 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
