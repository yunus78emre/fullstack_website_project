'use client'

/**
 * Notifications — per-user client inbox backed by localStorage.
 * When the backend is connected:
 * - Initial load: GET /api/notifications (scoped to current user) → setItems
 * - Mark read: PATCH /api/notifications/:id/read
 * - New entries: addNotification (self) / pushUserNotification (any user)
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { UserNotification } from '@/lib/types'
import { useAuth } from '@/lib/auth-context'
import { notificationsApi } from '@/lib/api-client'

interface NotificationsContextValue {
  notifications: UserNotification[]
  unreadCount: number
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  refreshNotifications: () => Promise<void>
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined)

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<UserNotification[]>([])

  // Use a stable primitive value instead of the user object reference
  // to prevent the callback from being re-created on every render.
  const userEmail = user?.email

  const loadNotifications = useCallback(async () => {
    if (!userEmail) {
      setNotifications([])
      return
    }
    try {
      const data = await notificationsApi.getMyNotifications()
      // Backend returns id as number, map it to string for frontend compatibility
      const mapped = data.map((n: any) => ({
        ...n,
        id: String(n.id)
      }))
      setNotifications(mapped)
    } catch (error) {
      console.error('Failed to load notifications:', error)
    }
  }, [userEmail])

  useEffect(() => {
    let active = true
    loadNotifications()
    
    // Auto-refresh interval (every 30 seconds)
    const interval = setInterval(() => {
      if (active) loadNotifications()
    }, 30000)
    
    return () => {
      active = false
      clearInterval(interval)
    }
  }, [loadNotifications])

  // React to tab focus
  useEffect(() => {
    const onFocus = () => loadNotifications()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [loadNotifications])

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  )

  const markAsRead = useCallback(
    async (id: string) => {
      if (!user) return
      try {
        await notificationsApi.markAsRead(Number(id))
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        )
      } catch (error) {
        console.error('Failed to mark notification as read:', error)
      }
    },
    [user],
  )

  const markAllAsRead = useCallback(async () => {
    if (!user) return
    try {
      await notificationsApi.markAllAsRead()
      setNotifications((prev) => prev.map((n) => (n.read ? n : { ...n, read: true })))
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  }, [user])

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      refreshNotifications: loadNotifications,
    }),
    [notifications, unreadCount, markAsRead, markAllAsRead, loadNotifications],
  )

  return (
    <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext)
  if (!ctx) {
    throw new Error('useNotifications must be used within NotificationsProvider')
  }
  return ctx
}
