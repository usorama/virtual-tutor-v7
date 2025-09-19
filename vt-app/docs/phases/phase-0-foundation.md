# Phase 0: Foundation Setup

**Duration**: 2 days  
**Dependencies**: None  
**Goal**: Establish project foundation with Next.js 15, database, and base components

## Tasks (Total: 4 SP)

### 0.1 Next.js Setup (1 SP)
- 0.1.1: Initialize Next.js 15 with TypeScript (0.1 SP)
- 0.1.2: Configure ESLint and Prettier (0.1 SP)
- 0.1.3: Setup folder structure per architecture doc (0.1 SP)
- 0.1.4: Install core dependencies (0.1 SP)
- 0.1.5: Configure TypeScript paths in tsconfig (0.1 SP)
- 0.1.6: Setup environment variables (.env.local) (0.1 SP)
- 0.1.7: Configure Tailwind CSS (0.1 SP)
- 0.1.8: Setup git hooks with husky (0.1 SP)
- 0.1.9: Configure build and dev scripts (0.1 SP)
- 0.1.10: Verify development server runs (0.1 SP)

### 0.2 Supabase Setup (1 SP)
- 0.2.1: Create Supabase project (0.1 SP)
- 0.2.2: Copy Supabase client from legacy (0.1 SP)
- 0.2.3: Configure environment variables (0.1 SP)
- 0.2.4: Setup database schema (0.1 SP)
- 0.2.5: Create initial migration (0.1 SP)
- 0.2.6: Enable Row Level Security (0.1 SP)
- 0.2.7: Setup auth schema (0.1 SP)
- 0.2.8: Test database connection (0.1 SP)
- 0.2.9: Create seed data script (0.1 SP)
- 0.2.10: Document database setup (0.1 SP)

### 0.3 Base UI Components (1 SP)
- 0.3.1: Setup shadcn/ui CLI (0.1 SP)
- 0.3.2: Copy Button component from legacy (0.1 SP)
- 0.3.3: Copy Card component from legacy (0.1 SP)
- 0.3.4: Copy Input component from legacy (0.1 SP)
- 0.3.5: Add Dialog component (0.1 SP)
- 0.3.6: Add Toast component (0.1 SP)
- 0.3.7: Add Select component (0.1 SP)
- 0.3.8: Add Progress component (0.1 SP)
- 0.3.9: Create component index file (0.1 SP)
- 0.3.10: Test all components render (0.1 SP)

### 0.4 Project Configuration (1 SP)
- 0.4.1: Setup middleware.ts for auth (0.1 SP)
- 0.4.2: Create root layout with providers (0.1 SP)
- 0.4.3: Configure global CSS (0.1 SP)
- 0.4.4: Setup error boundaries (0.1 SP)
- 0.4.5: Create loading states (0.1 SP)
- 0.4.6: Setup metadata configuration (0.1 SP)
- 0.4.7: Configure CORS and headers (0.1 SP)
- 0.4.8: Setup logging utility (0.1 SP)
- 0.4.9: Create constants file (0.1 SP)
- 0.4.10: Verify all configurations work (0.1 SP)

## Success Criteria
- [ ] Next.js dev server runs without errors
- [ ] Supabase connection established
- [ ] All UI components render correctly
- [ ] TypeScript compilation succeeds
- [ ] Environment variables configured
- [ ] Folder structure matches architecture doc

## Files to Create
- `/src/app/layout.tsx`
- `/src/app/page.tsx`
- `/src/app/globals.css`
- `/src/lib/supabase/client.ts`
- `/src/lib/supabase/server.ts`
- `/src/components/ui/button.tsx`
- `/src/components/ui/card.tsx`
- `/src/components/ui/input.tsx`
- `/src/components/ui/select.tsx`
- `/src/components/ui/progress.tsx`
- `/src/components/ui/dialog.tsx`
- `/src/components/ui/toast.tsx`
- `/src/components/ui/index.ts`
- `/src/lib/utils/constants.ts`
- `/src/lib/utils/errors.ts`
- `/src/config/environment.ts`
- `/middleware.ts`
- `/next.config.js`
- `/tailwind.config.js`
- `/tsconfig.json`
- `/.env.example`
- `/.env.local`
- `/package.json`

## Commands to Run
```bash
# Initialize project
pnpm create next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"

# Install dependencies
pnpm add @supabase/supabase-js @supabase/ssr
pnpm add @radix-ui/react-dialog @radix-ui/react-select
pnpm add class-variance-authority clsx tailwind-merge
pnpm add -D @types/node

# Setup shadcn/ui
pnpm dlx shadcn-ui@latest init

# Copy files from legacy
cp ../vt-app-legacy/src/infrastructure/supabase/* src/lib/supabase/
cp ../vt-app-legacy/src/interface-adapters/components/ui/* src/components/ui/
```