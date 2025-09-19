# Complete File Structure - Virtual Tutor v7

## Directory Tree

```
vt-app/
├── src/
│   ├── app/                           # Next.js 15 app directory
│   │   ├── layout.tsx                 # Root layout with providers
│   │   ├── page.tsx                   # Landing page
│   │   ├── globals.css                # Global styles (Tailwind)
│   │   ├── (auth)/                    # Authentication route group
│   │   │   ├── login/
│   │   │   │   └── page.tsx           # Login page
│   │   │   ├── register/
│   │   │   │   └── page.tsx           # Registration page
│   │   │   ├── forgot-password/
│   │   │   │   └── page.tsx           # Password reset
│   │   │   └── layout.tsx             # Auth layout wrapper
│   │   ├── dashboard/
│   │   │   ├── page.tsx               # User dashboard
│   │   │   └── layout.tsx             # Dashboard layout
│   │   ├── wizard/
│   │   │   ├── page.tsx               # Wizard container
│   │   │   ├── layout.tsx             # Wizard layout
│   │   │   └── [step]/                # Dynamic step routing
│   │   │       └── page.tsx           # Step page
│   │   ├── classroom/
│   │   │   ├── [sessionId]/
│   │   │   │   └── page.tsx           # Classroom session page
│   │   │   └── layout.tsx             # Classroom layout
│   │   ├── progress/
│   │   │   ├── page.tsx               # Progress dashboard
│   │   │   ├── [subject]/
│   │   │   │   └── page.tsx           # Subject details
│   │   │   └── layout.tsx             # Progress layout
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── register/route.ts
│   │       │   ├── login/route.ts
│   │       │   ├── logout/route.ts
│   │       │   ├── refresh/route.ts
│   │       │   ├── forgot-password/route.ts
│   │       │   └── verify-email/route.ts
│   │       ├── wizard/
│   │       │   ├── grades/route.ts
│   │       │   ├── subjects/route.ts
│   │       │   ├── topics/route.ts
│   │       │   └── complete/route.ts
│   │       ├── classroom/
│   │       │   ├── create/route.ts
│   │       │   ├── join/route.ts
│   │       │   ├── leave/route.ts
│   │       │   ├── status/[sessionId]/route.ts
│   │       │   └── transcript/route.ts
│   │       ├── textbooks/
│   │       │   ├── process/route.ts
│   │       │   ├── list/route.ts
│   │       │   ├── [id]/route.ts
│   │       │   └── search/route.ts
│   │       └── progress/
│   │           ├── dashboard/route.ts
│   │           ├── subjects/route.ts
│   │           ├── sessions/route.ts
│   │           └── export/route.ts
│   │
│   ├── components/
│   │   ├── ui/                        # Base UI components (from shadcn/ui)
│   │   │   ├── button.tsx             # REUSE from legacy
│   │   │   ├── card.tsx               # REUSE from legacy
│   │   │   ├── input.tsx              # REUSE from legacy
│   │   │   ├── select.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── alert.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── toast.tsx
│   │   │   └── index.ts               # Barrel export
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx          # ADAPT from legacy
│   │   │   ├── RegisterForm.tsx       # ADAPT from legacy
│   │   │   ├── PasswordResetForm.tsx
│   │   │   └── AuthGuard.tsx
│   │   ├── wizard/
│   │   │   ├── StepIndicator.tsx
│   │   │   ├── GradeSelector.tsx
│   │   │   ├── SubjectSelector.tsx
│   │   │   ├── TopicSelector.tsx
│   │   │   ├── WizardNavigation.tsx
│   │   │   └── WizardSummary.tsx
│   │   ├── classroom/
│   │   │   ├── VoiceControls.tsx
│   │   │   ├── ConnectionStatus.tsx
│   │   │   ├── TranscriptDisplay.tsx
│   │   │   ├── SpeakingIndicator.tsx
│   │   │   ├── SessionTimer.tsx
│   │   │   └── AudioLevelMeter.tsx
│   │   ├── progress/
│   │   │   ├── ProgressChart.tsx
│   │   │   ├── SessionHistory.tsx
│   │   │   ├── TopicMastery.tsx
│   │   │   ├── StreakCounter.tsx
│   │   │   └── ExportButton.tsx
│   │   └── layout/
│   │       ├── Header.tsx
│   │       ├── Footer.tsx
│   │       ├── Sidebar.tsx
│   │       └── Navigation.tsx
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts              # REUSE from legacy
│   │   │   ├── server.ts              # REUSE from legacy
│   │   │   ├── middleware.ts          # REUSE from legacy
│   │   │   └── types.ts
│   │   ├── auth/
│   │   │   ├── actions.ts             # Server actions
│   │   │   ├── session.ts             # Session management
│   │   │   └── validation.ts          # Auth validation
│   │   ├── ai/
│   │   │   ├── gemini.ts              # ADAPT from legacy
│   │   │   ├── prompts.ts             # System prompts
│   │   │   ├── context.ts             # Context management
│   │   │   └── streaming.ts           # Response streaming
│   │   ├── livekit/
│   │   │   ├── client.ts              # ADAPT from legacy
│   │   │   ├── server.ts              # Token generation
│   │   │   ├── hooks.ts               # LiveKit hooks
│   │   │   └── types.ts
│   │   ├── pdf/
│   │   │   ├── parser.ts              # PDF parsing
│   │   │   ├── chunker.ts             # Content chunking
│   │   │   ├── embeddings.ts          # Vector embeddings
│   │   │   └── indexer.ts             # Search indexing
│   │   └── utils/
│   │       ├── validation.ts
│   │       ├── errors.ts
│   │       ├── formatting.ts
│   │       └── constants.ts
│   │
│   ├── hooks/
│   │   ├── useAuth.ts                 # ADAPT from legacy
│   │   ├── useWizard.ts
│   │   ├── useVoiceSession.ts
│   │   ├── useLiveKit.ts
│   │   ├── useProgress.ts
│   │   └── useTextbook.ts
│   │
│   ├── types/
│   │   ├── auth.ts
│   │   ├── wizard.ts
│   │   ├── classroom.ts
│   │   ├── textbook.ts
│   │   ├── progress.ts
│   │   ├── database.ts
│   │   └── api.ts
│   │
│   ├── stores/                        # Zustand stores
│   │   ├── authStore.ts
│   │   ├── wizardStore.ts
│   │   ├── classroomStore.ts
│   │   └── progressStore.ts
│   │
│   └── config/
│       ├── environment.ts
│       ├── database.ts
│       └── features.ts
│
├── public/                             # Static assets
│   ├── images/
│   ├── sounds/
│   └── favicon.ico
│
├── tests/
│   ├── unit/
│   │   ├── components/
│   │   ├── lib/
│   │   └── hooks/
│   ├── integration/
│   │   ├── auth/
│   │   ├── wizard/
│   │   └── classroom/
│   └── e2e/
│       ├── auth.spec.ts
│       ├── wizard.spec.ts
│       ├── classroom.spec.ts
│       └── progress.spec.ts
│
├── prisma/                            # Database schema
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
│
├── scripts/
│   ├── process-textbooks.ts
│   └── setup-db.ts
│
├── .env.example
├── .env.local
├── .gitignore
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── package.json
├── pnpm-lock.yaml
└── README.md
```

## File Count Summary

- **Pages**: 14 route pages
- **API Routes**: 25 endpoints  
- **Components**: 38 components
- **Lib modules**: 22 utility files
- **Types**: 7 type definition files
- **Tests**: Multiple test files per category

## Reuse Strategy from Legacy

### Direct Reuse (Copy as-is):
- `/src/infrastructure/supabase/*` → `/lib/supabase/*`
- `/src/interface-adapters/components/ui/Button.tsx` → `/components/ui/button.tsx`
- `/src/interface-adapters/components/ui/Card.tsx` → `/components/ui/card.tsx`
- `/src/interface-adapters/components/ui/Input.tsx` → `/components/ui/input.tsx`

### Adapt with Modifications:
- `/src/interface-adapters/components/auth/*` → Simplify and update for Next.js 15
- `/src/infrastructure/livekit/*` → Update for latest LiveKit SDK
- `/src/infrastructure/gemini/*` → Streamline for Gemini 2.0 Flash

### Reference Only (Rewrite):
- Wizard components → New implementation with simpler flow
- Progress tracking → New implementation based on actual usage data
- Database schema → Simplified schema without over-engineering

### Ignore Completely:
- Contract system files
- Complex domain abstraction layers
- Over-engineered service patterns
- Unnecessary type hierarchies