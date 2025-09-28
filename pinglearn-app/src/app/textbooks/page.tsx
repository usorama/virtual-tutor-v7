import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth/actions'
import { getUserProfile, checkWizardCompletion } from '@/lib/wizard/actions'
import { getTextbooks } from '@/lib/textbook/actions'
// Use the enhanced client with hierarchical system integration
import { TextbooksClientEnhanced } from './textbooks-client-enhanced'

export default async function TextbooksPage() {
  const user = await getUser()
  
  if (!user) {
    redirect('/auth/signin')
  }
  
  // Check wizard completion
  const { needsWizard } = await checkWizardCompletion()
  if (needsWizard) {
    redirect('/wizard')
  }
  
  // Get user profile for grade and subject
  const { data: profile } = await getUserProfile()
  
  if (!profile || !profile.grade) {
    redirect('/wizard')
  }
  
  // Get existing textbooks
  const { data: textbooks } = await getTextbooks()
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Textbook Library</h1>
          <p className="text-muted-foreground mt-2">
            Upload and manage your study materials
          </p>
        </header>
        
        <TextbooksClientEnhanced
          initialTextbooks={textbooks || []}
          userGrade={profile.grade}
          userSubjects={profile.preferred_subjects || []}
        />
      </div>
    </div>
  )
}