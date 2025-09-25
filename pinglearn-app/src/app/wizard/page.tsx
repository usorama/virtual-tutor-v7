'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWizard } from '@/contexts/WizardContext'
import { NavigationButtons } from '@/components/wizard/NavigationButtons'
import { GradeSelector } from '@/components/wizard/GradeSelector'
import { PurposeSelector } from '@/components/wizard/PurposeSelector'
import { SubjectSelector } from '@/components/wizard/SubjectSelector'
import { TopicSelector } from '@/components/wizard/TopicSelector'
import { WizardSummary } from '@/components/wizard/WizardSummary'
import { WIZARD_STEPS, WIZARD_STEP_NAMES, CurriculumData } from '@/types/wizard'
import { 
  getCurriculumData, 
  saveWizardSelections,
  getUserProfile,
  completeWizard 
} from '@/lib/wizard/actions'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

// Helper functions for angled card display
function getStepDescription(stepIndex: number): string {
  const descriptions = [
    'Choose your current grade level',
    'Select subjects to focus on',
    'Pick specific topics to study',
    'Define your learning goals',
    'Review and confirm setup'
  ]
  return descriptions[stepIndex] || ''
}

function getStepProgress(stepIndex: number): number {
  const progressValues = [20, 40, 60, 80, 100]
  return progressValues[stepIndex] || 0
}

export default function WizardPage() {
  const router = useRouter()
  const {
    state,
    updateGrade,
    updatePurpose,
    updateSubjects,
    updateTopics,
    nextStep,
    previousStep,
    goToStep,
    canGoNext,
    canGoPrevious,
    canNavigateToStep,
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
          if (data.learning_purpose) {
            updatePurpose(data.learning_purpose as any) // Type assertion needed since DB returns string
          }
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
    if (state.grade || state.purpose || state.subjects.length > 0) {
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
    <div className="h-screen bg-background flex items-center justify-center px-4 py-8 overflow-hidden">
      {/* Professional Dialog Container */}
      <div className="w-full max-w-4xl relative">
        {/* Unified Wizard Component with Tab Navigation */}
        <div className="relative w-full">
          {/* Tab Navigation Row - Full width to match card */}
          <div className="relative flex gap-0 w-full overflow-hidden">
            {/* All Step Tabs */}
            {WIZARD_STEP_NAMES.map((stepName, index) => {
              const isActive = index === state.currentStep;
              const isClickable = canNavigateToStep(index);
              const tabWidth = `${100 / WIZARD_STEP_NAMES.length}%`;

              return (
                <div
                  key={index}
                  className="relative flex"
                  style={{ width: tabWidth }}
                >
                  {/* Tab */}
                  <button
                    type="button"
                    onClick={() => {
                      if (isClickable && index !== state.currentStep) {
                        goToStep(index);
                      }
                    }}
                    disabled={!isClickable || isLoading || isSaving}
                    className={`
                      flex-1 relative h-16 px-4 py-3 transition-all duration-300
                      ${isActive
                        ? 'bg-transparent rounded-t-[40px] z-20'
                        : isClickable
                          ? 'bg-white/5 border border-white/10 border-b-0 opacity-80 hover:opacity-100 hover:bg-white/10 cursor-pointer rounded-t-[32px]'
                          : 'bg-white/5 border border-white/10 border-b-0 opacity-40 cursor-not-allowed rounded-t-[32px]'
                      }
                    `}
                    style={isActive ? {
                      border: '1px solid rgba(6, 182, 212, 0.6)',
                      borderBottom: 'none',
                      backgroundColor: 'transparent',
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                      marginBottom: '-1px',
                      width: '100%'
                    } : {}}
                  >
                    {/* Tab Content */}
                    <div className="flex items-center gap-3 h-full px-4">
                      {/* Step Number Circle - Left Aligned */}
                      <div className={`flex items-center justify-center min-w-[24px] w-6 h-6 rounded-full text-xs font-bold flex-shrink-0 ${
                        isActive
                          ? 'bg-accent text-black'
                          : isClickable
                            ? 'bg-white/10 text-white/70'
                            : 'bg-white/5 text-white/30'
                      }`}>
                        {index + 1}
                      </div>

                      {/* Tab Text - Two Lines */}
                      <div className={`flex-1 text-right`}>
                        {(() => {
                          // Smart text splitting - keep '&' with previous word
                          const words = stepName.split(' ');
                          const lines = [];
                          let currentLine = '';

                          for (let i = 0; i < words.length; i++) {
                            const word = words[i];
                            if (word === '&' && currentLine) {
                              // Add '&' to current line
                              currentLine += ` ${word}`;
                            } else if (currentLine && word !== '&') {
                              // Push current line and start new one
                              lines.push(currentLine);
                              currentLine = word;
                            } else {
                              // Start or continue current line
                              currentLine = currentLine ? `${currentLine} ${word}` : word;
                            }
                          }
                          if (currentLine) lines.push(currentLine);

                          return lines.map((line, lineIndex) => (
                            <div
                              key={lineIndex}
                              className={`text-xs font-medium uppercase tracking-wider leading-tight ${
                                isActive
                                  ? 'text-accent'
                                  : isClickable
                                    ? 'text-white/70'
                                    : 'text-white/30'
                              }`}
                            >
                              {line}
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Main Wizard Card - Seamlessly connected to active tab */}
          <div className="relative">
            {/* Top border cover - hides the border where active tab connects */}
            <div
              className="absolute top-0 h-[2px] z-15"
              style={{
                left: `${(state.currentStep * 100) / WIZARD_STEP_NAMES.length}%`,
                width: `${100 / WIZARD_STEP_NAMES.length}%`,
                marginTop: '-1px',
                backgroundColor: 'transparent' // Make it transparent to avoid visible line
              }}
            />

            <Card className="p-8 overflow-hidden relative z-10 w-full"
                style={{
                  backgroundColor: 'transparent',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid rgba(6, 182, 212, 0.6)',
                  borderTop: '1px solid rgba(6, 182, 212, 0.6)',
                  borderRadius: '0 0 40px 40px',
                  marginTop: '-1px',
                  width: '100%',
                  boxShadow: '0 8px 24px rgba(6, 182, 212, 0.2)'
                }}>

          {/* Content Area with dynamic height */}
          <div className="flex flex-col" style={{
            minHeight: '300px',
            maxHeight: '500px'
          }}>
            {/* Progress Indicator at top of content */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
              <div className="text-sm text-white/60">
                Step {state.currentStep + 1} of {WIZARD_STEP_NAMES.length}
              </div>
              <div className="flex items-center gap-4">
                <div className="text-2xl font-bold text-accent">
                  {getStepProgress(state.currentStep)}%
                </div>
                <div className="text-sm text-white/60">
                  Complete
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-accent" />
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto scrollbar-hover" style={{
                minHeight: '200px'
              }}>
                {/* Dynamic Title and Description based on step */}
                <div className="text-center space-y-2 mb-8">
                  <h1 className="text-3xl font-bold text-white">
                    {WIZARD_STEP_NAMES[state.currentStep]}
                  </h1>
                  <p className="text-white/70 text-lg">
                    {getStepDescription(state.currentStep)}
                  </p>
                </div>

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

                {state.currentStep === WIZARD_STEPS.PURPOSE_SELECTION && (
                  <PurposeSelector
                    selected={state.purpose}
                    onSelect={updatePurpose}
                  />
                )}

                {state.currentStep === WIZARD_STEPS.SUMMARY && (
                  <WizardSummary
                    grade={state.grade}
                    purpose={state.purpose}
                    subjects={state.subjects}
                    topics={state.topics}
                    className="h-full"
                  />
                )}
              </div>
            )}
          </div>

          {/* Bottom Navigation - Three Button Layout */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-white/10">
            {/* Cancel Button */}
            <Button
              type="button"
              variant="ghost"
              onClick={handleCancel}
              disabled={isSaving}
              className="text-white/70 hover:text-white hover:bg-white/5"
            >
              Cancel
            </Button>

            {/* Navigation Buttons */}
            <div className="flex items-center space-x-3">
              {/* Back Button */}
              {canGoPrevious() && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={previousStep}
                  disabled={isSaving}
                  className="glass-interactive border-white/20 text-white hover:bg-white/5"
                >
                  Back
                </Button>
              )}

              {/* Continue/Finish Button */}
              <Button
                type="button"
                onClick={handleNext}
                disabled={!canGoNext() || isSaving}
                className="glass-button min-w-[120px]"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {state.currentStep === WIZARD_STEPS.SUMMARY ? 'Finishing...' : 'Saving...'}
                  </>
                ) : state.currentStep === WIZARD_STEPS.SUMMARY ? (
                  'Finish Setup'
                ) : (
                  'Continue'
                )}
              </Button>
            </div>
          </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}