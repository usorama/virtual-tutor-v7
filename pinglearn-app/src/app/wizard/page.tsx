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
          // User has existing preferences - populate the wizard with current data
          updateGrade(data.grade)
          if (data.preferred_subjects && data.preferred_subjects.length > 0) {
            updateSubjects(data.preferred_subjects)
          }
          
          // Load selected topics for each subject
          if (data.selected_topics && data.preferred_subjects) {
            data.preferred_subjects.forEach(subject => {
              const topicsForSubject = data.selected_topics?.[subject]
              if (topicsForSubject && topicsForSubject.length > 0) {
                updateTopics(subject, topicsForSubject)
              }
            })
          }
          // Note: Allow user to modify preferences instead of redirecting
        }
      } catch (error) {
        console.error('Error loading profile:', error)
      } finally {
        setIsLoadingProfile(false)
      }
    }
    
    loadProfile()
  }, [router, updateGrade, updateSubjects, updateTopics])

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

  function handleCancel() {
    // Show confirmation if user has made changes
    if (state.grade || state.subjects.length > 0) {
      const confirmed = window.confirm(
        'Are you sure you want to cancel? Any unsaved changes will be lost.'
      )
      if (!confirmed) return
    }
    
    // Return to dashboard
    router.push('/dashboard')
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
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="max-w-6xl mx-auto space-y-8 p-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Welcome to Virtual Tutor
          </h1>
          <p className="text-muted-foreground text-lg">
            Let&apos;s personalize your learning journey
          </p>
        </div>

      {/* Step Indicator */}
      <StepIndicator currentStep={state.currentStep} />

      {/* Apple-Style Wizard Container */}
      <div className="relative">
        {/* Main Content Card */}
        <Card className="mx-16 p-8 min-h-[500px] relative">
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

        {/* Apple-Style Navigation - Floating over the card */}
        <NavigationButtons
          canGoNext={canGoNext()}
          canGoPrevious={canGoPrevious()}
          onNext={handleNext}
          onPrevious={previousStep}
          onCancel={handleCancel}
          isLastStep={state.currentStep === WIZARD_STEPS.SUMMARY}
          isLoading={isSaving}
          showCancel={true}
          className="absolute inset-0 pointer-events-none [&>*]:pointer-events-auto"
        />
      </div>
      </div>
    </div>
  )
}