import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth/actions'
import { WizardProvider } from '@/contexts/WizardContext'
import { SharedThemeProvider } from '@/providers/SharedThemeProvider'
import '../globals.css'

export default async function WizardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check authentication
  const user = await getUser()
  
  if (!user) {
    redirect('/auth/signin')
  }

  return (
    <SharedThemeProvider>
      <WizardProvider>
        {children}
      </WizardProvider>
    </SharedThemeProvider>
  )
}