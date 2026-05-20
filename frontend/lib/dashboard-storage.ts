import type {
  NewUserNotificationInput,
  UserNotification,
} from '@/lib/types'

const KEYS = {
  userNotifications: 'dashboard.user-notifications',
} as const

export const USER_NOTIFICATIONS_KEY = KEYS.userNotifications

function hasWindow() {
  return typeof window !== 'undefined'
}

function readJson<T>(key: string, fallback: T): T {
  if (!hasWindow()) return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJson<T>(key: string, value: T) {
  if (!hasWindow()) return
  window.localStorage.setItem(key, JSON.stringify(value))
}

/* ------------------------------------------------------------------ */
/*  Per-user notifications (inbox)                                    */
/* ------------------------------------------------------------------ */

type UserNotificationsMap = Record<string, UserNotification[]>

export function getUserNotifications(userId: string): UserNotification[] {
  const all = readJson<UserNotificationsMap>(KEYS.userNotifications, {})
  return all[userId] ?? []
}

export function setUserNotifications(userId: string, notifications: UserNotification[]) {
  const all = readJson<UserNotificationsMap>(KEYS.userNotifications, {})
  all[userId] = notifications
  writeJson(KEYS.userNotifications, all)
}

export function pushUserNotification(
  userId: string,
  input: NewUserNotificationInput,
): UserNotification {
  const notification: UserNotification = {
    id: input.id ?? `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: input.title,
    body: input.body,
    read: false,
    createdAt: new Date().toISOString(),
    kind: input.kind,
    projectCategory: input.projectCategory,
  }
  const current = getUserNotifications(userId)
  setUserNotifications(userId, [notification, ...current])
  return notification
}
