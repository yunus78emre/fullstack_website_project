'use client'

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import type { User, UserRole } from './types'
import * as api from './api-client'

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  updateUser: (updates: Partial<User>) => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * Maps the backend role string ("Student", "Advisor", "Admin")
 * to the frontend UserRole type ("student", "advisor", "admin").
 */
function mapBackendRole(role: string): UserRole {
  const lower = role.trim().toLowerCase()
  if (lower === 'student') return 'student'
  if (lower === 'advisor') return 'advisor'
  if (lower === 'admin') return 'admin'
  return 'student' // fallback
}

function mapStudentProfileToUser(profile: any): Partial<User> {
  return {
    id: String(profile?.id ?? ''),
    name: profile?.fullName ?? '',
    email: profile?.email ?? '',
    department: profile?.department ?? undefined,
    year: profile?.year ?? undefined,
    interests: profile?.interests ?? undefined,
    githubLink: profile?.githubLink ?? undefined,
    linkedinLink: profile?.linkedinLink ?? undefined,
    biography: profile?.bio ?? undefined,
    skills: Array.isArray(profile?.skills) ? profile.skills : undefined,
  }
}

function mapAdvisorProfileToUser(profileResponse: any): Partial<User> {
  const user = profileResponse?.user ?? {}
  const profile = profileResponse?.profile ?? {}
  return {
    id: String(user?.id ?? ''),
    name: user?.fullName ?? '',
    email: user?.email ?? '',
    department: profile?.department ?? undefined,
    academicTitle: profile?.academicTitle ?? undefined,
    areasOfExpertise: profile?.expertise ?? undefined,
    researchInterests: profile?.researchInterests ?? undefined,
    skills: Array.isArray(profile?.skills) ? profile.skills : undefined,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // On mount: restore from localStorage, then refresh display name from DB (UTF-8; fixes stale corrupt cache).
  useEffect(() => {
    let cancelled = false

    const run = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
      const savedUser = typeof window !== 'undefined' ? localStorage.getItem('auth_user') : null

      let restored: User | null = null
      if (token && savedUser) {
        try {
          restored = JSON.parse(savedUser) as User
          if (!cancelled) setUser(restored)
        } catch {
          api.clearToken()
          localStorage.removeItem('auth_user')
        }
      }

      if (token && restored) {
        const session = await api.fetchAuthSessionFromServer()
        if (!cancelled && session?.fullName?.trim()) {
          const role = mapBackendRole(session.role)
          const merged: User = {
            ...restored,
            name: session.fullName.trim(),
            email: (session.email || restored.email).trim(),
            role,
          }
          setUser(merged)
          localStorage.setItem('auth_user', JSON.stringify(merged))
        }
      }

      if (!cancelled) setIsLoading(false)
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true)

    try {
      // Call the real backend API
      const response = await api.login(email, password)

      if (!response.token?.trim()) {
        throw new Error('Invalid server response (missing token).')
      }
      if (!response.role?.trim()) {
        throw new Error('Invalid server response (missing role).')
      }

      // Store the JWT token
      api.setToken(response.token)

      const role = mapBackendRole(response.role)

      // Build initial frontend User object from login response
      let loggedInUser: User = {
        id: response.email, // Backend doesn't return ID in login response; use email as identifier
        email: response.email,
        name: response.fullName,
        role,
      }

      // Enrich with role profile details (including skills)
      if (role === 'student') {
        const studentProfile = await api.student.getProfile()
        loggedInUser = { ...loggedInUser, ...mapStudentProfileToUser(studentProfile), role }
      } else if (role === 'advisor') {
        const advisorProfile = await api.advisor.getProfile()
        loggedInUser = { ...loggedInUser, ...mapAdvisorProfileToUser(advisorProfile), role }
      }

      // Persist user info for page refreshes
      const serialized = JSON.stringify(loggedInUser)
      // Commit before navigation so /dashboard layout never sees a transient null user.
      flushSync(() => {
        localStorage.setItem('auth_user', serialized)
        setUser(loggedInUser)
        setIsLoading(false)
      })
      return { success: true }
    } catch (error: any) {
      setIsLoading(false)
      return {
        success: false,
        error: error.message || 'Login failed. Please try again.',
      }
    }
  }, [])

  const logout = useCallback(() => {
    api.clearToken()
    localStorage.removeItem('auth_user')
    setUser(null)
  }, [])

  const updateUser = useCallback(async (updates: Partial<User>) => {
    try {
      // API call to update the backend
      await api.updateProfile(updates)

      let refreshedPatch: Partial<User> = {}
      if (user?.role === 'student') {
        const studentProfile = await api.student.getProfile()
        refreshedPatch = mapStudentProfileToUser(studentProfile)
      } else if (user?.role === 'advisor') {
        const advisorProfile = await api.advisor.getProfile()
        refreshedPatch = mapAdvisorProfileToUser(advisorProfile)
      }

      setUser((prev) => {
        if (!prev) return prev
        const updated = { ...prev, ...updates, ...refreshedPatch }
        localStorage.setItem('auth_user', JSON.stringify(updated))
        return updated
      })
    } catch (error) {
      console.error('Failed to update profile in backend:', error)
      // We still update the UI optimistically or you could throw here
      setUser((prev) => {
        if (!prev) return prev
        const updated = { ...prev, ...updates }
        localStorage.setItem('auth_user', JSON.stringify(updated))
        return updated
      })
    }
  }, [user])

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
