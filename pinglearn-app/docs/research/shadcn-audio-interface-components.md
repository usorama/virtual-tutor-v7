# shadcn/ui Component Research: Audio Interface Components

## Overview

This document provides comprehensive research on shadcn/ui components suitable for creating a professional audio interface with real-time visualization, speaker indicators, mute states, and wizard navigation for the Virtual Tutor AI classroom.

## Installation Commands

### Required Components
```bash
# Core audio visualization components
pnpm dlx shadcn@latest add progress
pnpm dlx shadcn@latest add slider
pnpm dlx shadcn@latest add chart

# Indicator and state components
pnpm dlx shadcn@latest add badge
pnpm dlx shadcn@latest add avatar
pnpm dlx shadcn@latest add toggle

# Navigation components
pnpm dlx shadcn@latest add button
pnpm dlx shadcn@latest add pagination

# Animation and loading states
pnpm dlx shadcn@latest add skeleton

# Supporting components
pnpm dlx shadcn@latest add card
pnpm dlx shadcn@latest add tooltip
```

### Install All At Once
```bash
pnpm dlx shadcn@latest add progress slider chart badge avatar toggle button pagination skeleton card tooltip
```

## Component Analysis by Use Case

### 1. Audio Level Indicator ("Dancing with Audio")

#### Primary Component: Progress
- **Best for**: Real-time audio level visualization
- **Animation Potential**: High - can be animated with CSS transitions
- **Implementation**: Dynamic value updates with smooth transitions

```tsx
"use client"

import * as React from "react"
import { Progress } from "@/components/ui/progress"

export function AudioLevelIndicator({ audioLevel }: { audioLevel: number }) {
  return (
    <div className="space-y-2">
      <Progress 
        value={audioLevel} 
        className="w-full h-2 transition-all duration-150 ease-out" 
      />
      <div className="flex gap-1">
        {/* Multiple progress bars for frequency visualization */}
        {Array.from({ length: 8 }).map((_, i) => (
          <Progress
            key={i}
            value={Math.random() * audioLevel} // Replace with actual frequency data
            className="w-4 h-8 [&>div]:bg-gradient-to-t [&>div]:from-green-500 [&>div]:via-yellow-500 [&>div]:to-red-500"
            orientation="vertical"
          />
        ))}
      </div>
    </div>
  )
}
```

#### Alternative Component: Slider (Read-only)
- **Best for**: Clean, minimal audio level display
- **Animation Potential**: Medium - can be styled for visualization

```tsx
import { Slider } from "@/components/ui/slider"

export function AudioLevelSlider({ audioLevel }: { audioLevel: number }) {
  return (
    <Slider
      value={[audioLevel]}
      max={100}
      step={1}
      className="w-full pointer-events-none [&>span]:bg-gradient-to-r [&>span]:from-green-500 [&>span]:to-red-500"
      disabled
    />
  )
}
```

#### Advanced Option: Chart Component
- **Best for**: Sophisticated waveform visualization
- **Animation Potential**: Very High - recharts supports animations

```tsx
"use client"

import { Bar, BarChart } from "recharts"
import { ChartContainer, ChartConfig } from "@/components/ui/chart"

const chartConfig = {
  level: {
    label: "Audio Level",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

export function AudioWaveform({ audioData }: { audioData: number[] }) {
  const chartData = audioData.map((level, index) => ({
    time: index,
    level: level
  }))

  return (
    <ChartContainer config={chartConfig} className="h-[100px] w-full">
      <BarChart data={chartData}>
        <Bar 
          dataKey="level" 
          fill="var(--color-level)" 
          radius={2}
          className="animate-pulse"
        />
      </BarChart>
    </ChartContainer>
  )
}
```

### 2. Speaker Indicator (Student vs Teacher)

#### Primary Component: Badge
- **Best for**: Clear visual distinction between speakers
- **Variants**: Different colors and styles for student/teacher

```tsx
import { Badge } from "@/components/ui/badge"

export function SpeakerIndicator({ 
  speaker, 
  isActive 
}: { 
  speaker: 'student' | 'teacher', 
  isActive: boolean 
}) {
  const variants = {
    student: isActive ? "default" : "outline",
    teacher: isActive ? "secondary" : "outline"
  }

  const colors = {
    student: isActive ? "bg-blue-500 text-white" : "border-blue-500 text-blue-500",
    teacher: isActive ? "bg-purple-500 text-white" : "border-purple-500 text-purple-500"
  }

  return (
    <Badge 
      variant={variants[speaker]}
      className={`${colors[speaker]} transition-all duration-200 ${
        isActive ? 'animate-pulse' : ''
      }`}
    >
      {speaker === 'teacher' ? '👨‍🏫 Teacher' : '🎓 Student'}
      {isActive && ' Speaking...'}
    </Badge>
  )
}
```

#### Alternative Component: Avatar with Indicator
- **Best for**: More visual, personal representation

```tsx
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

export function SpeakerAvatar({ 
  speaker, 
  isActive, 
  avatarUrl 
}: { 
  speaker: 'student' | 'teacher', 
  isActive: boolean,
  avatarUrl?: string 
}) {
  return (
    <div className="relative">
      <Avatar className={`transition-all duration-200 ${
        isActive ? 'ring-2 ring-green-500 ring-offset-2' : ''
      }`}>
        <AvatarImage src={avatarUrl} />
        <AvatarFallback>
          {speaker === 'teacher' ? 'T' : 'S'}
        </AvatarFallback>
      </Avatar>
      {isActive && (
        <Badge className="absolute -bottom-1 -right-1 bg-green-500 text-white animate-pulse">
          🎤
        </Badge>
      )}
    </div>
  )
}
```

### 3. Mute State Indicator

#### Primary Component: Toggle
- **Best for**: Interactive mute/unmute functionality
- **Clear States**: Visual distinction between muted/unmuted

```tsx
import { Mic, MicOff } from "lucide-react"
import { Toggle } from "@/components/ui/toggle"

export function MuteToggle({ 
  isMuted, 
  onToggle 
}: { 
  isMuted: boolean, 
  onToggle: () => void 
}) {
  return (
    <Toggle
      pressed={isMuted}
      onPressedChange={onToggle}
      aria-label="Toggle mute"
      className={`${
        isMuted 
          ? 'bg-red-500 text-white hover:bg-red-600' 
          : 'bg-green-500 text-white hover:bg-green-600'
      } transition-colors duration-200`}
    >
      {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
      {isMuted ? 'Muted' : 'Unmuted'}
    </Toggle>
  )
}
```

#### Alternative Component: Badge (Status Only)
- **Best for**: Read-only mute status display

```tsx
import { Badge } from "@/components/ui/badge"
import { MicOff, Mic } from "lucide-react"

export function MuteStatus({ isMuted }: { isMuted: boolean }) {
  return (
    <Badge 
      variant={isMuted ? "destructive" : "secondary"}
      className={`transition-all duration-200 ${
        isMuted ? 'animate-pulse' : ''
      }`}
    >
      {isMuted ? (
        <>
          <MicOff className="h-3 w-3 mr-1" />
          Muted
        </>
      ) : (
        <>
          <Mic className="h-3 w-3 mr-1" />
          Unmuted
        </>
      )}
    </Badge>
  )
}
```

### 4. Wizard Navigation (Apple Photos Style)

#### Primary Component: Pagination (Modified)
- **Best for**: Step-by-step navigation with arrows
- **Apple-style**: Clean, minimal arrow navigation

```tsx
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function WizardNavigation({ 
  currentStep, 
  totalSteps, 
  onPrevious, 
  onNext,
  canGoBack,
  canGoForward
}: {
  currentStep: number,
  totalSteps: number,
  onPrevious: () => void,
  onNext: () => void,
  canGoBack: boolean,
  canGoForward: boolean
}) {
  return (
    <div className="flex items-center justify-between w-full">
      <Button
        variant="ghost"
        size="sm"
        onClick={onPrevious}
        disabled={!canGoBack}
        className="h-8 w-8 p-0 rounded-full hover:bg-gray-100 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="flex items-center gap-2">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <div
            key={index}
            className={`h-2 w-2 rounded-full transition-all duration-200 ${
              index === currentStep - 1
                ? 'bg-blue-500 scale-125'
                : index < currentStep - 1
                ? 'bg-blue-300'
                : 'bg-gray-300'
            }`}
          />
        ))}
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={onNext}
        disabled={!canGoForward}
        className="h-8 w-8 p-0 rounded-full hover:bg-gray-100 transition-colors"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
```

#### Alternative: Button Variants
- **Best for**: More prominent navigation controls

```tsx
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight } from "lucide-react"

export function WizardButtons({ 
  onPrevious, 
  onNext, 
  canGoBack, 
  canGoForward,
  previousLabel = "Previous",
  nextLabel = "Next"
}: {
  onPrevious: () => void,
  onNext: () => void,
  canGoBack: boolean,
  canGoForward: boolean,
  previousLabel?: string,
  nextLabel?: string
}) {
  return (
    <div className="flex justify-between w-full">
      <Button
        variant="outline"
        onClick={onPrevious}
        disabled={!canGoBack}
        className="flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        {previousLabel}
      </Button>

      <Button
        onClick={onNext}
        disabled={!canGoForward}
        className="flex items-center gap-2"
      >
        {nextLabel}
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
```

### 5. Animation and "Dancing" Effects

#### Primary Component: Skeleton (For Loading States)
- **Best for**: Smooth loading animations that can be adapted for audio

```tsx
import { Skeleton } from "@/components/ui/skeleton"

export function AudioLoadingEffect() {
  return (
    <div className="flex items-center space-x-4">
      <Skeleton className="h-12 w-12 rounded-full animate-pulse" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[250px] animate-pulse" />
        <Skeleton className="h-4 w-[200px] animate-pulse" />
      </div>
    </div>
  )
}
```

#### Custom Animation Component
- **Best for**: Advanced "dancing" audio visualizations

```tsx
"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"

export function DancingAudioVisualization({ audioData }: { audioData: number[] }) {
  return (
    <Card className="p-4">
      <div className="flex items-end justify-center space-x-1 h-20">
        {audioData.map((level, index) => (
          <motion.div
            key={index}
            className="bg-gradient-to-t from-blue-500 to-purple-500 w-2 rounded-t-sm"
            animate={{
              height: `${level}%`,
              backgroundColor: [
                "rgb(59, 130, 246)", // blue-500
                "rgb(147, 51, 234)", // purple-500
                "rgb(59, 130, 246)", // blue-500
              ]
            }}
            transition={{
              duration: 0.2,
              ease: "easeOut",
              backgroundColor: {
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse"
              }
            }}
          />
        ))}
      </div>
    </Card>
  )
}
```

## Complete Audio Interface Example

Here's how all components work together:

```tsx
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AudioLevelIndicator } from "./AudioLevelIndicator"
import { SpeakerIndicator } from "./SpeakerIndicator"
import { MuteToggle } from "./MuteToggle"
import { WizardNavigation } from "./WizardNavigation"

export function AudioInterface() {
  const [audioLevel, setAudioLevel] = useState(0)
  const [activeSpeaker, setActiveSpeaker] = useState<'student' | 'teacher' | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)

  // Simulate real-time audio data
  useEffect(() => {
    const interval = setInterval(() => {
      setAudioLevel(Math.random() * 100)
    }, 100)

    return () => clearInterval(interval)
  }, [])

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">AI Classroom Audio</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Audio Level Visualization */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Audio Level</h4>
          <AudioLevelIndicator audioLevel={audioLevel} />
        </div>

        {/* Speaker Indicators */}
        <div className="flex justify-between items-center">
          <SpeakerIndicator 
            speaker="student" 
            isActive={activeSpeaker === 'student'} 
          />
          <SpeakerIndicator 
            speaker="teacher" 
            isActive={activeSpeaker === 'teacher'} 
          />
        </div>

        {/* Mute Control */}
        <div className="flex justify-center">
          <MuteToggle 
            isMuted={isMuted} 
            onToggle={() => setIsMuted(!isMuted)} 
          />
        </div>

        {/* Wizard Navigation */}
        <WizardNavigation
          currentStep={currentStep}
          totalSteps={5}
          onPrevious={() => setCurrentStep(Math.max(1, currentStep - 1))}
          onNext={() => setCurrentStep(Math.min(5, currentStep + 1))}
          canGoBack={currentStep > 1}
          canGoForward={currentStep < 5}
        />
      </CardContent>
    </Card>
  )
}
```

## Key Props and API Documentation

### Progress Component
- `value: number` - Current progress value (0-100)
- `max?: number` - Maximum value (default: 100)
- `className?: string` - Additional CSS classes

### Badge Component
- `variant?: "default" | "secondary" | "destructive" | "outline"`
- `className?: string` - Additional CSS classes
- `asChild?: boolean` - Render as child component

### Button Component
- `variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"`
- `size?: "default" | "sm" | "lg" | "icon"`
- `disabled?: boolean` - Disable button
- `asChild?: boolean` - Render as child component

### Toggle Component
- `pressed?: boolean` - Controlled pressed state
- `onPressedChange?: (pressed: boolean) => void` - Callback for state change
- `disabled?: boolean` - Disable toggle
- `variant?: "default" | "outline"`
- `size?: "default" | "sm" | "lg"`

## Integration Notes

### Combining Components from Different Registries
- All components are from the official @shadcn registry
- No conflicts between components
- Consistent theming through CSS variables
- Easy customization with Tailwind classes

### Theming Options
- Built-in dark/light mode support
- Customizable color schemes through CSS variables
- Consistent animation timings
- Responsive design patterns

### Accessibility Considerations
- All components include proper ARIA labels
- Keyboard navigation support
- Screen reader compatibility
- Focus management

### Performance Notes
- Lightweight components with minimal dependencies
- Efficient re-rendering with React optimizations
- CSS-based animations for smooth performance
- Tree-shakeable imports

## Recommended Implementation Order

1. **Start with Progress** - Basic audio level visualization
2. **Add Badge** - Speaker indicators with basic states
3. **Implement Toggle** - Mute functionality
4. **Add Button/Pagination** - Navigation controls
5. **Enhance with Skeleton** - Loading states and smooth transitions
6. **Advanced: Chart** - Sophisticated audio visualizations

This research provides a solid foundation for building a professional, accessible, and visually appealing audio interface for the Virtual Tutor AI classroom.