import { Metadata } from 'next'
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm'

export const metadata: Metadata = {
  title: 'Forgot Password - Virtual Tutor',
  description: 'Reset your Virtual Tutor account password',
}

export default function ForgotPasswordPage() {
  return (
    <div className="flex justify-center">
      <ForgotPasswordForm />
    </div>
  )
}