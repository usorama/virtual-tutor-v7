import { Metadata } from 'next'
import { RegisterForm } from '@/components/auth/RegisterForm'

export const metadata: Metadata = {
  title: 'Register - Virtual Tutor',
  description: 'Create your Virtual Tutor account',
}

export default function RegisterPage() {
  return (
    <div className="flex justify-center">
      <RegisterForm />
    </div>
  )
}