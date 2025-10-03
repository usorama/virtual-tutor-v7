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
import { WIZARD_STEPS, WIZARD_STEP_NAMES, CurriculumData, LearningPurpose } from '@/types/wizard'
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
import { Component as EtheralShadow } from '@/components/ui/etheral-shadow'

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

// Type guard to check if a string is a valid LearningPurpose
function isValidLearningPurpose(value: string): value is LearningPurpose {
  return value === 'new_class' || value === 'revision' || value === 'exam_prep';
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
          if (data.learning_purpose && isValidLearningPurpose(data.learning_purpose)) {
            updatePurpose(data.learning_purpose)
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
  }, [updateGrade, updatePurpose, updateSubjects, updateTopics])

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
    <div className="relative h-screen overflow-hidden bg-black">
      {/* Ethereal shadow background with subtle vibrant colors */}
      <EtheralShadow
        color="rgba(60, 60, 70, 0.5)"
        animation={{ scale: 50, speed: 80 }}
        noise={{ opacity: 30, scale: 0.5 }}
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0
        }}
      />

      {/* Additional color gradients for depth - more visible and distinct */}
      {/* Cyan gradient - top center - STRONGER */}
      <div
        style={{
          position: 'absolute',
          top: '5%',
          left: '35%',
          width: '350px',
          height: '350px',
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.35) 0%, rgba(6, 182, 212, 0.15) 30%, transparent 60%)',
          filter: 'blur(40px)',
          zIndex: 0,
          pointerEvents: 'none'
        }}
      />
      {/* Green gradient - left side - VISIBLE */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '-5%',
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(34, 197, 94, 0.3) 0%, rgba(34, 197, 94, 0.1) 40%, transparent 65%)',
          filter: 'blur(50px)',
          zIndex: 0,
          pointerEvents: 'none'
        }}
      />
      {/* Yellow gradient - bottom right - WARM ACCENT */}
      <div
        style={{
          position: 'absolute',
          bottom: '10%',
          right: '5%',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(234, 179, 8, 0.25) 0%, rgba(234, 179, 8, 0.1) 35%, transparent 60%)',
          filter: 'blur(60px)',
          zIndex: 0,
          pointerEvents: 'none'
        }}
      />
      {/* Cyan accent - bottom left - VISIBLE */}
      <div
        style={{
          position: 'absolute',
          bottom: '25%',
          left: '10%',
          width: '250px',
          height: '250px',
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.28) 0%, transparent 55%)',
          filter: 'blur(45px)',
          zIndex: 0,
          pointerEvents: 'none'
        }}
      />
      {/* Orange gradient - right side - SUBTLE but VISIBLE */}
      <div
        style={{
          position: 'absolute',
          top: '45%',
          right: '15%',
          width: '200px',
          height: '200px',
          background: 'radial-gradient(circle, rgba(251, 146, 60, 0.2) 0%, transparent 55%)',
          filter: 'blur(50px)',
          transform: 'translateY(-50%)',
          zIndex: 0,
          pointerEvents: 'none'
        }}
      />

      {/* Main wizard container with relative positioning */}
      <div className="relative z-10">
        {/* Main Content Container */}
        <div className="relative z-10 h-full flex justify-center px-4 pt-20 pb-12">
          {/* Professional Dialog Container - Fixed top position, centered horizontally */}
          <div className="w-full max-w-4xl mx-auto relative" style={{
            maxHeight: 'calc(100vh - 8rem)', // 5rem top (pt-20) + 3rem bottom (pb-12) = 8rem
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Unified Wizard Component with Tab Navigation */}
            <div className="relative w-full flex flex-col" style={{
              maxHeight: '100%',
              overflow: 'visible'
            }}>
          {/* Desktop Tab Navigation - Hidden on mobile */}
          <div className="relative hidden md:flex gap-0 w-full overflow-hidden">
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
                          ? 'bg-white/5 border border-white/[8%] border-b-0 opacity-80 hover:opacity-100 hover:bg-white/10 cursor-pointer rounded-t-[32px]'
                          : 'bg-white/5 border border-white/[8%] border-b-0 opacity-40 cursor-not-allowed rounded-t-[32px]'
                      }
                    `}
                    style={isActive ? {
                      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                      borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRight: '1px solid rgba(255, 255, 255, 0.08)',
                      borderBottom: 'none',
                      backgroundColor: 'rgba(6, 182, 212, 0.05)',
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                      marginBottom: '-2px',
                      paddingBottom: '2px',
                      width: '100%',
                      position: 'relative',
                      zIndex: 21
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

          {/* Mobile Dots Navigation - Hidden on desktop */}
          <div className="flex md:hidden flex-col items-center py-4 px-6 bg-transparent">
            {/* Current Step Name */}
            <h2 className="text-xl font-bold text-white mb-2">
              {WIZARD_STEP_NAMES[state.currentStep]}
            </h2>

            {/* Current Step Description */}
            <p className="text-sm text-white/70 mb-4">
              {getStepDescription(state.currentStep)}
            </p>

            {/* Dots Container */}
            <div className="flex items-center gap-3">
              {WIZARD_STEP_NAMES.map((_, index) => {
                const isActive = index === state.currentStep;
                const isClickable = canNavigateToStep(index);
                const isCompleted = index < state.currentStep;

                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      if (isClickable && index !== state.currentStep) {
                        goToStep(index);
                      }
                    }}
                    disabled={!isClickable || isLoading || isSaving}
                    className={`
                      transition-all duration-300
                      ${isActive
                        ? 'w-8 h-2 rounded-full bg-accent'
                        : isCompleted
                          ? 'w-2 h-2 rounded-full bg-accent/60'
                          : isClickable
                            ? 'w-2 h-2 rounded-full bg-white/30 hover:bg-white/50'
                            : 'w-2 h-2 rounded-full bg-white/10 cursor-not-allowed'
                      }
                    `}
                    aria-label={`Step ${index + 1}: ${WIZARD_STEP_NAMES[index]}`}
                  />
                );
              })}
            </div>
          </div>

          {/* Main Wizard Card - Seamlessly connected to active tab on desktop */}
          <div className="relative">
            <Card className="p-6 overflow-hidden relative z-10 w-full flex flex-col md:rounded-t-none"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRight: '1px solid rgba(255, 255, 255, 0.08)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  borderTop: 'none',
                  borderRadius: '0 0 40px 40px',
                  marginTop: '0',
                  width: '100%',
                  boxShadow: `
                    inset 0 -2px 7px rgba(255, 255, 255, 0.95),
                    inset -2px 0 7px rgba(0, 0, 0, 0.1),
                    0 10px 36px -6px rgba(34, 197, 94, 0.06),
                    0 6px 24px -4px rgba(0, 0, 0, 0.15)
                  `,
                  position: 'relative',
                  overflow: 'hidden'
                }}>
              {/* Pure White Corner Highlight - Bottom Right Only */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: '60px',
                  height: '55px',
                  background: 'radial-gradient(ellipse at 100% 100%, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 1) 15%, rgba(255, 255, 255, 0.7) 25%, rgba(255, 255, 255, 0.3) 35%, rgba(255, 255, 255, 0.05) 45%, rgba(0, 0, 0, 0) 55%)',
                  pointerEvents: 'none',
                  opacity: 1,
                  mixBlendMode: 'screen',
                  filter: 'blur(3px)',
                  borderBottomRightRadius: '40px'
                }}
              />


          {/* Content Area with dynamic height */}
          <div className="flex flex-col" style={{
            height: 'auto',
            maxHeight: '400px', // Fixed max height for content area
            minHeight: '300px'
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
              <div className="flex-1 overflow-y-auto scrollbar-hover">
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
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/10">
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
      </div>
    </div>
  )
}
