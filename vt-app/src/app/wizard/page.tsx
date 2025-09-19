'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWizard } from '@/contexts/WizardContext'
import { StepIndicator } from '@/components/wizard/StepIndicator'
import { NavigationButtons } from '@/components/wizard/NavigationButtons'
import { GradeSelector } from '@/components/wizard/GradeSelector'
import { SubjectSelector } from '@/components/wizard/SubjectSelector'
import { TopicSelector } from '@/components/wizard/TopicSelector'
import { WizardSummary } from '@/components/wizard/WizardSummary'
import { WIZARD_STEPS, CurriculumData } from '@/types/wizard'
import { 
  getCurriculumData, 
  saveWizardSelections,
  getUserProfile,
  completeWizard 
} from '@/lib/wizard/actions'
import { Card } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function WizardPage() {
  const router = useRouter()
  const {
    state,
    updateGrade,
    updateSubjects,
    updateTopics,
    nextStep,
    previousStep,
    canGoNext,
    canGoPrevious,
  } = useWizard()

  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [curriculumData, setCurriculumData] = useState<CurriculumData[]>([])
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)

  // Load user profile on mount to check if they already have selections
  useEffect(() => {
    async function loadProfile() {
      try {
        const { data } = await getUserProfile()
        if (data && data.grade) {
          // User already completed wizard, redirect to dashboard
          router.push('/dashboard')
        }
      } catch (error) {
        console.error('Error loading profile:', error)
      } finally {
        setIsLoadingProfile(false)
      }
    }
    
    loadProfile()
  }, [router])

  // Fetch curriculum data when grade is selected
  useEffect(() => {
    if (state.grade) {
      fetchCurriculumData(state.grade)
    }
  }, [state.grade])

  async function fetchCurriculumData(grade: number) {
    setIsLoading(true)
    try {
      const { data, error } = await getCurriculumData(grade)
      
      if (error) {
        toast.error('Failed to load curriculum data')
        console.error(error)
      } else if (data) {
        setCurriculumData(data)
      }
    } finally {
      setIsLoading(false)
    }
  }

  async function handleNext() {
    if (state.currentStep === WIZARD_STEPS.SUMMARY) {
      // Save selections and complete wizard
      setIsSaving(true)
      try {
        const { success, error } = await saveWizardSelections(state)
        
        if (success) {
          toast.success('Your preferences have been saved!')
          await completeWizard() // This will redirect to dashboard
        } else {
          toast.error(error || 'Failed to save preferences')
        }
      } finally {
        setIsSaving(false)
      }
    } else {
      nextStep()
    }
  }

  // Get available subjects for current grade
  const availableSubjects = Array.from(
    new Set(curriculumData.map(item => item.subject))
  )

  // Get available topics for selected subjects
  const availableTopics = state.subjects.reduce((acc, subject) => {
    const curriculum = curriculumData.find(item => item.subject === subject)
    if (curriculum) {
      acc[subject] = curriculum.topics
    }
    return acc
  }, {} as Record<string, string[]>)

  if (isLoadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Welcome to Virtual Tutor
        </h1>
        <p className="text-gray-600 text-lg">
          Let&apos;s personalize your learning journey
        </p>
      </div>

      {/* Step Indicator */}
      <StepIndicator currentStep={state.currentStep} />

      {/* Main Content Card */}
      <Card className="p-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <>
            {/* Step Content */}
            {state.currentStep === WIZARD_STEPS.GRADE_SELECTION && (
              <GradeSelector
                selectedGrade={state.grade}
                onGradeSelect={updateGrade}
              />
            )}

            {state.currentStep === WIZARD_STEPS.SUBJECT_SELECTION && (
              <SubjectSelector
                availableSubjects={availableSubjects}
                selectedSubjects={state.subjects}
                onSubjectsChange={updateSubjects}
              />
            )}

            {state.currentStep === WIZARD_STEPS.TOPIC_SELECTION && (
              <TopicSelector
                subjects={state.subjects}
                availableTopics={availableTopics}
                selectedTopics={state.topics}
                onTopicsChange={updateTopics}
              />
            )}

            {state.currentStep === WIZARD_STEPS.SUMMARY && (
              <WizardSummary
                grade={state.grade}
                subjects={state.subjects}
                topics={state.topics}
              />
            )}
          </>
        )}
      </Card>

      {/* Navigation */}
      <NavigationButtons
        canGoNext={canGoNext()}
        canGoPrevious={canGoPrevious()}
        onNext={handleNext}
        onPrevious={previousStep}
        isLastStep={state.currentStep === WIZARD_STEPS.SUMMARY}
        isLoading={isSaving}
        className="max-w-3xl mx-auto"
      />
    </div>
  )
}