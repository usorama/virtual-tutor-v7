'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { WizardState, WizardContextType, WIZARD_STEPS, LearningPurpose } from '@/types/wizard'

const STORAGE_KEY = 'vt_wizard_state'

const initialState: WizardState = {
  currentStep: WIZARD_STEPS.GRADE_SELECTION,
  grade: null,
  purpose: null,
  subjects: [],
  topics: {},
  isComplete: false,
}

const WizardContext = createContext<WizardContextType | undefined>(undefined)

export function useWizard() {
  const context = useContext(WizardContext)
  if (!context) {
    throw new Error('useWizard must be used within WizardProvider')
  }
  return context
}

interface WizardProviderProps {
  children: ReactNode
}

export function WizardProvider({ children }: WizardProviderProps) {
  const [state, setState] = useState<WizardState>(initialState)
  const [isHydrated, setIsHydrated] = useState(false)

  // Load state from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setState(parsed)
      } catch (error) {
        console.error('Failed to parse stored wizard state:', error)
      }
    }
    setIsHydrated(true)
  }, [])

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    }
  }, [state, isHydrated])

  const updateGrade = useCallback((grade: number) => {
    setState(prev => ({
      ...prev,
      grade,
      // Reset subsequent selections when grade changes
      purpose: null,
      subjects: [],
      topics: {},
    }))
  }, [])

  const updatePurpose = useCallback((purpose: LearningPurpose) => {
    setState(prev => ({ ...prev, purpose }))
  }, [])

  const updateSubjects = useCallback((subjects: string[]) => {
    setState(prev => {
      // Remove topics for deselected subjects
      const newTopics = { ...prev.topics }
      Object.keys(newTopics).forEach(subject => {
        if (!subjects.includes(subject)) {
          delete newTopics[subject]
        }
      })
      
      return {
        ...prev,
        subjects,
        topics: newTopics,
      }
    })
  }, [])

  const updateTopics = useCallback((subject: string, topics: string[]) => {
    setState(prev => ({
      ...prev,
      topics: {
        ...prev.topics,
        [subject]: topics,
      },
    }))
  }, [])

  const nextStep = useCallback(() => {
    setState(prev => {
      const nextStep = prev.currentStep + 1
      const isLastStep = nextStep === WIZARD_STEPS.SUMMARY
      
      return {
        ...prev,
        currentStep: nextStep,
        isComplete: isLastStep && prev.currentStep === WIZARD_STEPS.TOPIC_SELECTION,
      }
    })
  }, [])

  const previousStep = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStep: Math.max(0, prev.currentStep - 1),
      isComplete: false,
    }))
  }, [])

  const goToStep = useCallback((step: number) => {
    setState(prev => ({
      ...prev,
      currentStep: step,
      isComplete: false,
    }))
  }, [])

  const reset = useCallback(() => {
    setState(initialState)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const canGoNext = useCallback(() => {
    switch (state.currentStep) {
      case WIZARD_STEPS.GRADE_SELECTION:
        return state.grade !== null
      case WIZARD_STEPS.SUBJECT_SELECTION:
        return state.subjects.length > 0
      case WIZARD_STEPS.TOPIC_SELECTION:
        // Ensure all selected subjects have topics selected
        return state.subjects.every(subject =>
          state.topics[subject] && state.topics[subject].length > 0
        )
      case WIZARD_STEPS.PURPOSE_SELECTION:
        return state.purpose !== null
      case WIZARD_STEPS.SUMMARY:
        return true
      default:
        return false
    }
  }, [state])

  const canGoPrevious = useCallback(() => {
    return state.currentStep > WIZARD_STEPS.GRADE_SELECTION
  }, [state.currentStep])

  const canNavigateToStep = useCallback((targetStep: number) => {
    // Can always go back to previous steps
    if (targetStep < state.currentStep) {
      return true
    }

    // Can only go forward if all previous steps are completed
    if (targetStep > state.currentStep) {
      // Check if all steps up to target are valid
      for (let step = 0; step < targetStep; step++) {
        switch (step) {
          case WIZARD_STEPS.GRADE_SELECTION:
            if (state.grade === null) return false
            break
          case WIZARD_STEPS.SUBJECT_SELECTION:
            if (state.subjects.length === 0) return false
            break
          case WIZARD_STEPS.TOPIC_SELECTION:
            if (!state.subjects.every(subject =>
              state.topics[subject] && state.topics[subject].length > 0
            )) return false
            break
          case WIZARD_STEPS.PURPOSE_SELECTION:
            if (state.purpose === null) return false
            break
        }
      }
      return true
    }

    return true // Can navigate to current step
  }, [state])

  const value: WizardContextType = {
    state,
    updateGrade,
    updatePurpose,
    updateSubjects,
    updateTopics,
    nextStep,
    previousStep,
    goToStep,
    reset,
    canGoNext,
    canGoPrevious,
    canNavigateToStep,
  }

  // Don't render until hydrated to avoid hydration mismatch
  if (!isHydrated) {
    return null
  }

  return (
    <WizardContext.Provider value={value}>
      {children}
    </WizardContext.Provider>
  )
}