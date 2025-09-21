'use client'

import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEffect } from 'react'

interface NavigationButtonsProps {
  canGoNext: boolean
  canGoPrevious: boolean
  onNext: () => void
  onPrevious: () => void
  onCancel?: () => void
  isLastStep?: boolean
  isLoading?: boolean
  className?: string
  showCancel?: boolean
}

export function NavigationButtons({
  canGoNext,
  canGoPrevious,
  onNext,
  onPrevious,
  onCancel,
  isLastStep = false,
  isLoading = false,
  className,
  showCancel = true,
}: NavigationButtonsProps) {
  // Keyboard navigation (Apple style)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isLoading) return
      
      if (event.key === 'ArrowLeft' && canGoPrevious) {
        event.preventDefault()
        onPrevious()
      } else if (event.key === 'ArrowRight' && canGoNext) {
        event.preventDefault()
        onNext()
      } else if (event.key === 'Escape' && onCancel) {
        event.preventDefault()
        onCancel()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [canGoNext, canGoPrevious, onNext, onPrevious, onCancel, isLoading])

  return (
    <div className={cn('relative w-full', className)}>
      {/* Apple-Style Side Navigation Arrows */}
      
      {/* Left Arrow - Floating on the left side */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onPrevious}
        disabled={!canGoPrevious || isLoading}
        className={cn(
          "absolute left-4 top-1/2 -translate-y-1/2 z-10",
          "w-12 h-12 rounded-full transition-all duration-200",
          "bg-background/90 backdrop-blur-sm border border-border/50",
          "hover:bg-background hover:border-border hover:shadow-lg",
          "disabled:opacity-30 disabled:cursor-not-allowed",
          "focus:outline-none focus:ring-2 focus:ring-primary/50",
          canGoPrevious && !isLoading && "hover:scale-105"
        )}
      >
        <ChevronLeft className={cn(
          "w-5 h-5 transition-transform duration-200",
          canGoPrevious && !isLoading && "group-hover:scale-110"
        )} />
        <span className="sr-only">Previous step</span>
      </Button>

      {/* Right Arrow - Floating on the right side */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onNext}
        disabled={!canGoNext || isLoading}
        className={cn(
          "absolute right-4 top-1/2 -translate-y-1/2 z-10",
          "w-12 h-12 rounded-full transition-all duration-200",
          "bg-background/90 backdrop-blur-sm border border-border/50",
          "hover:bg-background hover:border-border hover:shadow-lg",
          "disabled:opacity-30 disabled:cursor-not-allowed",
          "focus:outline-none focus:ring-2 focus:ring-primary/50",
          canGoNext && !isLoading && "hover:scale-105"
        )}
      >
        {isLastStep ? (
          <Check className={cn(
            "w-5 h-5 transition-transform duration-200",
            canGoNext && !isLoading ? "text-green-600" : ""
          )} />
        ) : (
          <ChevronRight className={cn(
            "w-5 h-5 transition-transform duration-200",
            canGoNext && !isLoading && "group-hover:scale-110"
          )} />
        )}
        <span className="sr-only">
          {isLastStep ? 'Complete setup' : 'Next step'}
        </span>
      </Button>

      {/* Bottom Corner Buttons - Apple style */}
      <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center">
        {/* Cancel Button - Bottom Left */}
        {showCancel && onCancel && (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={isLoading}
            className={cn(
              "gap-2 text-muted-foreground hover:text-foreground",
              "bg-background/60 backdrop-blur-sm border border-border/30",
              "hover:bg-background/80 hover:border-border/50",
              "transition-all duration-200"
            )}
          >
            <X className="w-4 h-4" />
            Cancel
          </Button>
        )}

        {/* Complete/Continue Button - Bottom Right */}
        <Button
          type="button"
          onClick={onNext}
          disabled={!canGoNext || isLoading}
          className={cn(
            "gap-2 min-w-[140px] transition-all duration-200",
            "shadow-lg backdrop-blur-sm",
            isLastStep 
              ? "bg-green-600 hover:bg-green-700 focus:ring-green-500/50" 
              : "bg-primary hover:bg-primary/90 focus:ring-primary/50"
          )}
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {isLastStep ? 'Completing...' : 'Loading...'}
            </>
          ) : isLastStep ? (
            <>
              Complete Setup
              <Check className="w-4 h-4" />
            </>
          ) : (
            <>
              Continue
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>
      
      {/* Keyboard Hints - Minimal Apple style */}
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
        <p className="text-xs text-muted-foreground/60 text-center">
          ← → keys to navigate{onCancel && ' • Esc to cancel'}
        </p>
      </div>
    </div>
  )
}