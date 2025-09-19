# Legacy Code Reuse Plan

## Overview
This document identifies specific files and components from `vt-app-legacy` to reuse in the new v7 implementation.

## Reuse Categories

### 1. Direct Copy (Use As-Is)
These files work well and can be copied directly:

```bash
# Supabase Infrastructure
cp vt-app-legacy/src/infrastructure/supabase/client.ts → vt-app/src/lib/supabase/client.ts
cp vt-app-legacy/src/infrastructure/supabase/server.ts → vt-app/src/lib/supabase/server.ts
cp vt-app-legacy/src/infrastructure/supabase/middleware.ts → vt-app/src/lib/supabase/middleware.ts

# UI Components (with minor style updates)
cp vt-app-legacy/src/interface-adapters/components/ui/Button.tsx → vt-app/src/components/ui/button.tsx
cp vt-app-legacy/src/interface-adapters/components/ui/Card.tsx → vt-app/src/components/ui/card.tsx
cp vt-app-legacy/src/interface-adapters/components/ui/Input.tsx → vt-app/src/components/ui/input.tsx
cp vt-app-legacy/src/interface-adapters/components/ui/Modal.tsx → vt-app/src/components/ui/dialog.tsx
```

### 2. Adapt and Simplify
These files have good logic but need simplification:

#### Authentication Components
**From**: `vt-app-legacy/src/interface-adapters/components/auth/`
**To**: `vt-app/src/components/auth/`

Changes needed:
- Remove contract dependencies
- Simplify to use server actions
- Update for Next.js 15 patterns
- Remove unnecessary abstraction layers

#### LiveKit Integration
**From**: `vt-app-legacy/src/infrastructure/livekit/`
**To**: `vt-app/src/lib/livekit/`

Changes needed:
- Update to LiveKit SDK 2.6.5
- Simplify connection logic
- Remove over-engineered event handlers
- Use built-in LiveKit React components

#### Gemini AI Integration  
**From**: `vt-app-legacy/src/infrastructure/gemini/`
**To**: `vt-app/src/lib/ai/`

Changes needed:
- Update to Gemini 2.0 Flash API
- Simplify prompt management
- Remove complex context layers
- Streamline response handling

### 3. Reference for Logic (Rewrite)
These files have useful patterns but need complete rewrite:

#### Auth API Routes
**Reference**: `vt-app-legacy/api/auth/*.ts`
**New**: `vt-app/src/app/api/auth/*.ts`

What to keep:
- Basic flow patterns
- Error handling approaches
- Validation logic

What to change:
- Use Next.js 15 route handlers
- Simplify response patterns
- Remove contract validations

#### Wizard Components
**Reference**: `vt-app-legacy/src/interface-adapters/components/wizard/`
**New**: `vt-app/src/components/wizard/`

What to keep:
- Step progression logic
- Basic UI structure

What to change:
- Simplify state management
- Remove over-complex validation
- Use server actions for data fetching

### 4. Ignore Completely
Do NOT reuse these over-engineered parts:

- ❌ Anything in `/contracts/` directory
- ❌ Complex type hierarchies in `/src/lib/domain/`
- ❌ Service layer abstractions in `/src/lib/services/`
- ❌ Use case patterns in `/src/lib/use-cases/`
- ❌ Complex store patterns in `/src/lib/stores/`
- ❌ Over-abstracted interfaces in `/src/lib/interfaces/`

## Migration Commands

```bash
# Step 1: Copy UI components
mkdir -p vt-app/src/components/ui
cp vt-app-legacy/src/interface-adapters/components/ui/{Button,Card,Input,Modal}.tsx vt-app/src/components/ui/

# Step 2: Copy Supabase setup
mkdir -p vt-app/src/lib/supabase  
cp vt-app-legacy/src/infrastructure/supabase/*.ts vt-app/src/lib/supabase/

# Step 3: Extract auth logic (manual adaptation needed)
mkdir -p vt-app/src/components/auth
# Manually adapt LoginForm.tsx and RegisterForm.tsx

# Step 4: Reference LiveKit setup (rewrite needed)
mkdir -p vt-app/src/lib/livekit
# Use legacy as reference only
```

## File-by-File Decisions

| Legacy File | Action | New Location | Notes |
|------------|--------|--------------|-------|
| `/src/infrastructure/supabase/client.ts` | COPY | `/lib/supabase/client.ts` | Works as-is |
| `/src/interface-adapters/components/ui/Button.tsx` | COPY | `/components/ui/button.tsx` | Rename to lowercase |
| `/src/interface-adapters/components/auth/LoginForm.tsx` | ADAPT | `/components/auth/LoginForm.tsx` | Remove contracts |
| `/src/infrastructure/livekit/client.ts` | REWRITE | `/lib/livekit/client.ts` | Update SDK version |
| `/src/lib/domain/user/types.ts` | IGNORE | - | Over-engineered |
| `/contracts/*` | IGNORE | - | Not needed |

## Validation Checklist

Before reusing any file:
- [ ] Does it have contract dependencies? (Remove them)
- [ ] Does it use complex type hierarchies? (Simplify)
- [ ] Is it over-abstracted? (Make it direct)
- [ ] Does it work with Next.js 15? (Update if needed)
- [ ] Is it actually needed? (Don't copy if unsure)

## Priority Reuse for Week 1

Focus on these files first:
1. Supabase client setup (enables auth)
2. Basic UI components (speeds up development)
3. Auth forms (adapt for simplicity)
4. LiveKit connection logic (reference only)