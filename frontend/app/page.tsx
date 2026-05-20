'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GraduationCap, Mail, Lock, ArrowLeft, KeyRound, Eye, EyeOff } from 'lucide-react'
import Image from 'next/image'
import logoImg from '../logo2.png'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FieldGroup, Field, FieldLabel, FieldMessage } from '@/components/ui/field'
import { InputGroup, InputGroupInput, InputGroupAddon } from '@/components/ui/input-group'
import { Spinner } from '@/components/ui/spinner'
import { useAuth } from '@/lib/auth-context'
import * as api from '@/lib/api-client'

type PageView = 'login' | 'forgot-password' | 'reset-code'

export default function LoginPage() {
  const router = useRouter()
  const { login, isLoading } = useAuth()
  const [view, setView] = useState<PageView>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [resetCode, setResetCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Please enter both email and password')
      return
    }

    const result = await login(email, password)
    
    if (result.success) {
      router.push('/dashboard')
    } else {
      setError(result.error || 'Login failed')
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!email) {
      setError('Please enter your email address')
      return
    }

    try {
      await api.forgotPassword(email)
      setSuccess('If this email is registered, you will shortly receive a reset code.')
      setView('reset-code')
    } catch (err: any) {
      setError(err.message || 'Failed to send reset code.')
    }
  }

  const handleResetCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!resetCode) {
      setError('Please enter the reset code')
      return
    }

    if (resetCode.length !== 6) {
      setError('Please enter a valid 6-digit code')
      return
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
    if (!newPassword || !passwordRegex.test(newPassword)) {
      setError('Password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, and one number.')
      return
    }

    try {
      await api.resetPassword(email, resetCode, newPassword)
      setSuccess('Password reset successful! Please login with your new password.')
      setView('login')
      setResetCode('')
      setNewPassword('')
    } catch (err: any) {
      setError(err.message || 'Invalid or expired reset code.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg border-border/50">

        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-24 h-24 bg-white rounded-full flex items-center justify-center mb-2 overflow-hidden shadow-sm border border-border">
            <Image src={logoImg} alt="PROJEX Logo" className="w-full h-full object-cover scale-[2.2]" priority />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground flex items-center justify-center">
            {view === 'login' && (
              <span className="font-extrabold tracking-widest text-3xl -mr-[0.1em]">
                <span className="text-[#009B95]">PROJE</span>
                <span className="text-[#0055D4]">X</span>
              </span>
            )}
            {view === 'forgot-password' && 'Forgot Password'}
            {view === 'reset-code' && 'Enter Reset Code'}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {view === 'login' && 'Log in to access your student portal'}
            {view === 'forgot-password' && 'Enter your email to receive a reset code'}
            {view === 'reset-code' && 'Enter the 6-digit code sent to your email'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {view === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <InputGroup>
                    <InputGroupAddon>
                      <Mail className="w-4 h-4 text-muted-foreground" />
                    </InputGroupAddon>
                    <InputGroupInput
                      id="email"
                      type="email"
                      placeholder="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                    />
                  </InputGroup>
                </Field>
                <Field>
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <InputGroup>
                    <InputGroupAddon>
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    </InputGroupAddon>
                    <InputGroupInput
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      autoComplete="current-password"
                    />
                    <InputGroupAddon align="inline-end">
                      <button
                        type="button"
                        className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                        onClick={() => setShowPassword((v) => !v)}
                        disabled={isLoading}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <EyeOff className="size-4" aria-hidden />
                        ) : (
                          <Eye className="size-4" aria-hidden />
                        )}
                      </button>
                    </InputGroupAddon>
                  </InputGroup>
                </Field>
              </FieldGroup>

              {error && (
                <FieldMessage className="text-destructive text-sm">{error}</FieldMessage>
              )}
              {success && (
                <FieldMessage className="text-accent text-sm">{success}</FieldMessage>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Spinner className="mr-2" /> : null}
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>

              <Button
                type="button"
                variant="link"
                className="w-full text-muted-foreground"
                onClick={() => {
                  setView('forgot-password')
                  setError('')
                  setSuccess('')
                }}
              >
                Forgot Password?
              </Button>
            </form>
          )}

          {view === 'forgot-password' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="reset-email">Email</FieldLabel>
                  <InputGroup>
                    <InputGroupAddon>
                      <Mail className="w-4 h-4 text-muted-foreground" />
                    </InputGroupAddon>
                    <InputGroupInput
                      id="reset-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </InputGroup>
                </Field>
              </FieldGroup>

              {error && (
                <FieldMessage className="text-destructive text-sm">{error}</FieldMessage>
              )}

              <Button type="submit" className="w-full">
                Send Reset Code
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setView('login')
                  setError('')
                  setSuccess('')
                }}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
            </form>
          )}

          {view === 'reset-code' && (
            <form onSubmit={handleResetCode} className="space-y-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="code">Reset Code</FieldLabel>
                  <InputGroup>
                    <InputGroupAddon>
                      <KeyRound className="w-4 h-4 text-muted-foreground" />
                    </InputGroupAddon>
                    <InputGroupInput
                      id="code"
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      maxLength={6}
                    />
                  </InputGroup>
                </Field>
                <Field>
                  <FieldLabel htmlFor="new-password">New Password</FieldLabel>
                  <InputGroup>
                    <InputGroupAddon>
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    </InputGroupAddon>
                    <InputGroupInput
                      id="new-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <InputGroupAddon align="inline-end">
                      <button
                        type="button"
                        className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <EyeOff className="size-4" aria-hidden />
                        ) : (
                          <Eye className="size-4" aria-hidden />
                        )}
                      </button>
                    </InputGroupAddon>
                  </InputGroup>
                  <p className="text-xs text-muted-foreground mt-1">
                    At least 8 chars, 1 uppercase, 1 lowercase, 1 number.
                  </p>
                </Field>
              </FieldGroup>

              {error && (
                <FieldMessage className="text-destructive text-sm">{error}</FieldMessage>
              )}

              <Button type="submit" className="w-full">
                Verify Code
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setView('forgot-password')
                  setError('')
                }}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </form>
          )}

          <div className="mt-6 pt-4 border-t border-border">
            <p className="text-xs text-center text-muted-foreground">
              Use your university email to log in:
            </p>
            <ul className="text-xs text-center text-muted-foreground mt-2 space-y-1">
              <li><span className="font-medium">Advisor:</span> @ad.uskudar.edu.tr</li>
              <li><span className="font-medium">Student:</span> @st.uskudar.edu.tr</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
