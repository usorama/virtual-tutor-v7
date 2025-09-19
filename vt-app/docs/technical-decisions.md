# Technical Decisions - Virtual Tutor v7

## Confirmed Technology Stack

### Core Framework
- **Next.js 15.0.4** - App Router, Server Components, Server Actions
- **React 19.0.0** - Latest stable with improved forms
- **TypeScript 5.7.0** - Strict mode enabled

### Database & Auth  
- **PostgreSQL** via Supabase
- **Supabase Auth** - Built-in authentication
- **Supabase Storage** - PDF storage
- **Row Level Security** - Data isolation

### Voice & AI
- **LiveKit Cloud** - WebRTC infrastructure
- **Google Gemini 2.0 Flash** - AI tutoring model
- **Web Speech API** - Backup STT/TTS

### UI & Styling
- **Tailwind CSS 3.4** - Utility-first CSS
- **shadcn/ui** - Component library
- **Radix UI** - Headless components
- **clsx + cva** - Dynamic styling

### State Management
- **Zustand** - Simple state management
- **React Context** - Auth state
- **Server State** - Via Server Components

### Testing
- **Vitest** - Unit testing
- **React Testing Library** - Component testing
- **Playwright** - E2E testing

### Development Tools
- **pnpm** - Package manager
- **ESLint** - Linting
- **Prettier** - Formatting
- **Husky** - Git hooks

### Deployment
- **Vercel** - Hosting platform
- **GitHub Actions** - CI/CD
- **Sentry** - Error tracking (future)

## Key Architecture Decisions

### 1. Framework-First Approach
**Decision**: Use Next.js conventions directly without abstraction layers
**Rationale**: 
- Reduces complexity
- Faster development
- Easier maintenance
- Better documentation

### 2. Supabase for Backend
**Decision**: Use Supabase for auth, database, and storage
**Rationale**:
- Integrated solution
- Built-in auth
- Real-time capabilities
- Cost-effective

### 3. LiveKit for Voice
**Decision**: Use LiveKit Cloud instead of self-hosted
**Rationale**:
- Proven reliability
- No infrastructure management
- Scalable pricing
- Better quality

### 4. Gemini 2.0 Flash
**Decision**: Use Gemini Flash over GPT-4
**Rationale**:
- Optimized for education
- Lower latency
- Cost-effective
- Good context window

### 5. Component Library Strategy
**Decision**: Use shadcn/ui with customization
**Rationale**:
- Copy-paste flexibility
- No dependency lock-in
- Full customization
- TypeScript support

### 6. Simple State Management
**Decision**: Zustand over Redux
**Rationale**:
- Simpler API
- Less boilerplate
- TypeScript-first
- Small bundle size

### 7. Server Components First
**Decision**: Use RSC wherever possible
**Rationale**:
- Better performance
- Reduced client bundle
- Direct database access
- SEO benefits

### 8. Monolithic Architecture
**Decision**: Single Next.js app over microservices
**Rationale**:
- Simpler deployment
- Easier development
- Lower complexity
- Cost-effective

## Implementation Guidelines

### Code Reuse from Legacy
1. **Direct Copy**: Supabase clients, UI components
2. **Adapt**: Auth forms, LiveKit setup
3. **Reference**: API patterns, validation logic
4. **Ignore**: Contracts, complex abstractions

### File Organization
```
/src/app - Pages and API routes
/src/components - React components
/src/lib - Utilities and services
/src/hooks - Custom hooks
/src/types - TypeScript types
/src/stores - Zustand stores
```

### Naming Conventions
- Components: PascalCase
- Files: kebab-case
- Functions: camelCase
- Constants: UPPER_SNAKE_CASE
- Types: PascalCase

### Error Handling
- Use Error Boundaries for UI
- Return consistent API errors
- Log errors to console (dev)
- Send to Sentry (production)

### Performance Targets
- First Contentful Paint: < 1s
- Time to Interactive: < 3s
- Voice session start: < 3s
- AI response time: < 2s

### Security Measures
- HTTPS everywhere
- Secure cookies for sessions
- Input validation on server
- Rate limiting on APIs
- CSRF protection
- Content Security Policy

## Deferred Decisions

These can be decided during implementation:

1. **PDF Processing Library**
   - Options: PDF.js, pdfjs-dist, pdf-parse
   - Decision point: Day 5

2. **Chart Library**
   - Options: Chart.js, Recharts, Victory
   - Decision point: Day 11

3. **Export Library**
   - Options: jsPDF, PDFKit, Puppeteer
   - Decision point: Day 12

4. **Monitoring Solution**
   - Options: Sentry, LogRocket, PostHog
   - Decision point: Post-MVP

## Risk Mitigations

| Risk | Mitigation |
|------|------------|
| LiveKit connection issues | Text chat fallback |
| PDF processing slow | Background jobs, progress indicators |
| AI hallucinations | Strict prompts, context limits |
| Auth failures | Supabase recovery flows |
| Poor voice quality | Pre-session audio test |

## Success Metrics

- TypeScript errors: 0
- Test coverage: > 80%
- Lighthouse score: > 90
- Build time: < 2 minutes
- Bundle size: < 500KB

## Next Steps

1. Execute Phase 0: Foundation Setup
2. Copy reusable code from legacy
3. Implement authentication
4. Build wizard flow
5. Integrate LiveKit
6. Add progress tracking
7. Test end-to-end
8. Deploy to Vercel