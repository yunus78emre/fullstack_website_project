/**
 * Centralized API client for communicating with the ASP.NET Core backend.
 *
 * All HTTP requests go through this module so that:
 *  - JWT tokens are automatically attached
 *  - 401 responses trigger a logout / redirect
 *  - The base URL is configurable via NEXT_PUBLIC_API_URL
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5048/api'

// ─── Token helpers ────────────────────────────────────────────────────────────

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('auth_token')
}

export function setToken(token: string): void {
  localStorage.setItem('auth_token', token)
}

export function clearToken(): void {
  localStorage.removeItem('auth_token')
  localStorage.removeItem('auth_user')
}

// ─── Core request function ────────────────────────────────────────────────────

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  // If the server returns 401, clear the token and redirect to login
  if (response.status === 401) {
    clearToken()
    if (typeof window !== 'undefined' && window.location.pathname !== '/') {
      window.location.href = '/'
    }
    throw new Error('Unauthorized')
  }

  // For non-OK responses, try to extract the error message from the body
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))

    if (body.errors && typeof body.errors === 'object') {
      const errorMessages = Object.values(body.errors).flat().join(' ')
      throw new Error(errorMessages || body.title || `HTTP ${response.status}`)
    }

    throw new Error(body.message || body.title || `HTTP ${response.status}`)
  }

  // Some endpoints may return 204 No Content
  if (response.status === 204) {
    return undefined as unknown as T
  }

  return response.json() as Promise<T>
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface LoginResponse {
  token: string
  fullName: string
  email: string
  role: string // "Student" | "Advisor" | "Admin"
}

export function login(email: string, password: string) {
  return request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }).then((raw: unknown) => {
    const r = raw as Record<string, unknown>
    return {
      token: String(r.token ?? r.Token ?? ''),
      fullName: String(r.fullName ?? r.FullName ?? ''),
      email: String(r.email ?? r.Email ?? ''),
      role: String(r.role ?? r.Role ?? ''),
    }
  })
}

export function forgotPassword(email: string) {
  return request<{ message: string }>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export function resetPassword(email: string, token: string, newPassword: string) {
  return request<{ message: string }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email, token, newPassword }),
  })
}

export function updateProfile(data: any) {
  return request<{ message: string }>('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

/** Sunucudan güncel ad/e-posta/rol (DB UTF-8). 401’de yönlendirme yapmaz — oturum yenileme için. */
export async function fetchAuthSessionFromServer(): Promise<{
  fullName: string
  email: string
  role: string
} | null> {
  if (typeof window === 'undefined') return null
  const token = localStorage.getItem('auth_token')
  if (!token) return null

  const res = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  })

  if (res.status === 401 || res.status === 403) return null
  if (!res.ok) return null

  const raw = (await res.json()) as Record<string, unknown>
  return {
    fullName: String(raw.fullName ?? raw.FullName ?? ''),
    email: String(raw.email ?? raw.Email ?? ''),
    role: String(raw.role ?? raw.Role ?? ''),
  }
}

// ─── Generic CRUD helpers ─────────────────────────────────────────────────────

export function get<T>(endpoint: string) {
  return request<T>(endpoint)
}

export function post<T>(endpoint: string, data: unknown) {
  return request<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function put<T>(endpoint: string, data: unknown) {
  return request<T>(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function del<T>(endpoint: string) {
  return request<T>(endpoint, { method: 'DELETE' })
}

// ─── Student Endpoints ────────────────────────────────────────────────────────

export const student = {
  getProfile: () => get<any>('/student/profile/me'),
  getMyProjects: () => get<any[]>('/student/projects/my-projects'),
  createProject: (data: { title: string; description: string; categoryId: number; teamSize?: number }) =>
    post<any>('/student/projects/create', data),
  updateProject: (projectId: number, data: { title?: string; description?: string; categoryId?: number; teamSize?: number }) =>
    put<any>(`/student/projects/${projectId}`, data),
  deleteProject: (projectId: number) =>
    del<any>(`/student/projects/${projectId}`),
  getIncomingRequests: () => get<any[]>('/student/requests/incoming'),
  getMyAdvisorRequests: () => get<any[]>('/student/advisor-requests/my'),
  respondToRequest: (requestId: number, data: { approved: boolean }) =>
    post<any>(`/student/requests/${requestId}/respond`, data),
  sendAdvisorRequest: (data: { projectId: number; advisorId: number; message?: string }) =>
    post<any>('/student/advisor-requests/send', data),
  sendJoinRequest: (data: { projectId: number; message?: string }) =>
    post<any>('/student/requests/send', data),
  getAnnouncementsFeed: () => get<{ items: any[] }>('/student/announcements/feed'),
  searchAdvisors: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return get<{ items: any[]; totalCount: number; page: number; pageSize: number; totalPages: number }>(`/student/search/advisors${qs}`)
  },
  searchProjects: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return get<{ items: any[]; totalCount: number }>(`/student/search/projects${qs}`)
  },
}

// ─── Advisor Endpoints ────────────────────────────────────────────────────────

export const advisor = {
  getProfile: () => get<any>('/advisor/profile/me'),
  getAvailability: () => get<any>('/advisor/profile/availability'),
  updateAvailability: (selectedCategoryIds: number[]) =>
    post<{ message: string; items: any[] }>('/advisor/profile/availability', { selectedCategoryIds }),
  getMyProjects: () => get<any[]>('/advisor/projects/my-projects'),
  // Backend wraps the payload as `{ requests: [...] }`; normalize to a plain array
  // so the UI (filters, maps, length, etc.) can use it uniformly.
  // Backend DTO uses `advisorRequestId`; alias it to `requestId` so the shared
  // requests page (and its respond/cancel handlers) can use one consistent key.
  getIncomingRequests: async () => {
    const res = await get<any>('/advisor/requests/incoming')
    const items: any[] = Array.isArray(res) ? res : (res?.requests ?? [])
    return items.map((r) => ({
      ...r,
      requestId: r.requestId ?? r.advisorRequestId,
    }))
  },
  respondToRequest: (requestId: number, data: { approved: boolean }) =>
    post<any>(`/advisor/requests/${requestId}/respond`, data),
  sendRequest: (data: { projectId: number; message?: string }) =>
    post<any>('/advisor/requests/send', data),
  getAnnouncementsFeed: () => get<any>('/advisor/announcements/feed'),
  searchProjects: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return get<{ items: any[]; totalCount: number }>(`/advisor/search/projects${qs}`)
  },
}

// ─── Admin Endpoints ──────────────────────────────────────────────────────────

export const admin = {
  // Categories
  getCategories: () => get<any[]>('/admin/categories'),
  createCategory: (data: any) => post<any>('/admin/categories', data),
  updateCategory: (id: number, data: any) => put<any>(`/admin/categories/${id}`, data),
  deleteCategory: (id: number) => del<any>(`/admin/categories/${id}`),

  // Announcements
  getAnnouncements: () => get<any[]>('/admin/announcements'),
  createAnnouncement: (data: any) => post<any>('/admin/announcements', data),
  updateAnnouncement: (id: number, data: any) => put<any>(`/admin/announcements/${id}`, data),
  deleteAnnouncement: (id: number) => del<any>(`/admin/announcements/${id}`),
}

// ─── Notifications Endpoints ──────────────────────────────────────────────────

export const notificationsApi = {
  getMyNotifications: () => get<any[]>('/notifications'),
  markAsRead: (id: number) => request<any>(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllAsRead: () =>
    request<{ message: string; updated: number }>(`/notifications/read-all`, { method: 'PATCH' }),
}

