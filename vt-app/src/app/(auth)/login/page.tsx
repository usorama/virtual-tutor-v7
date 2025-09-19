import { Metadata } from 'next'
import { LoginForm } from '@/components/auth/LoginForm'

export const metadata: Metadata = {
  title: 'Login - Virtual Tutor',
  description: 'Sign in to your Virtual Tutor account',
}

export default function LoginPage() {
  return (
    <div className="flex justify-center">
      <LoginForm />
    </div>
  )
}