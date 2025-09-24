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
        <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
          <div className="container mx-auto px-4 py-8">
            {children}
          </div>
        </div>
      </WizardProvider>
    </SharedThemeProvider>
  )
}