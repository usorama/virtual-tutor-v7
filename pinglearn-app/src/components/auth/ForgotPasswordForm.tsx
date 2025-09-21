'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Input } from '@/components/ui'
import { resetPassword } from '@/lib/auth/actions'
import { validateResetPasswordForm } from '@/lib/auth/validation'
import { AUTH_CONSTANTS } from '@/lib/auth/constants'
import { Loader2, Mail, CheckCircle, ArrowLeft } from 'lucide-react'

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [generalError, setGeneralError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setGeneralError('')

    // Client-side validation
    const validation = validateResetPasswordForm(email)
    if (!validation.isValid) {
      setErrors(validation.errors)
      return
    }

    setLoading(true)

    try {
      const response = await resetPassword({ email })
      
      if (response.error) {
        setGeneralError(response.error.message)
      } else {
        setSuccess(true)
      }
    } catch {
      setGeneralError(AUTH_CONSTANTS.ERRORS.NETWORK_ERROR)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CheckCircle className="w-12 h-12 text-primary mx-auto mb-4" />
          <CardTitle className="text-2xl font-bold">Check Your Email</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground">
            {AUTH_CONSTANTS.SUCCESS.PASSWORD_RESET_SENT}
          </p>
          <p className="mt-4 text-sm">
            We&apos;ve sent password reset instructions to <strong>{email}</strong>
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            If you don&apos;t see the email, check your spam folder.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Link href="/login" className="w-full">
            <Button className="w-full" variant="outline">
              Back to Login
            </Button>
          </Link>
          <button
            type="button"
            onClick={() => {
              setSuccess(false)
              setEmail('')
            }}
            className="text-sm text-primary hover:underline"
          >
            Try with a different email
          </button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Forgot Password?</CardTitle>
        <CardDescription>
          Enter your email address and we&apos;ll send you instructions to reset your password
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {generalError && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {generalError}
            </div>
          )}
          
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`pl-10 ${errors.email ? 'border-destructive' : ''}`}
                disabled={loading}
                autoComplete="email"
                autoFocus
              />
            </div>
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending instructions...
              </>
            ) : (
              'Send Reset Instructions'
            )}
          </Button>
          
          <Link href="/login" className="w-full">
            <Button variant="ghost" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Button>
          </Link>
        </CardFooter>
      </form>
    </Card>
  )
}