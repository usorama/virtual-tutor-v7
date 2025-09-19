# Virtual Tutor v7 - Tech Stack (Validated January 2025)

## Core Technologies

### Frontend
- **Next.js**: 15.0.4 (App Router, Server Components)
- **React**: 19.0.0 (Stable release)
- **TypeScript**: 5.7.0
- **Tailwind CSS**: 3.4.20
- **shadcn/ui**: Latest components

### Voice & AI
- **LiveKit**: 
  - livekit-client: 2.6.5
  - @livekit/components-react: 2.9.1
  - livekit-server-sdk: 2.9.1
- **Google Gemini**: @google/genai 0.24.0

### Database & Auth
- **Supabase**: @supabase/supabase-js 2.57.4
- **PostgreSQL**: via Supabase
- **Auth**: Supabase Auth (built-in)

### Testing
- **Vitest**: 2.1.8
- **React Testing Library**: 16.1.0
- **Playwright**: 1.49.0

### Build & Dev Tools
- **pnpm**: 9.15.0
- **ESLint**: 9.18.0
- **Prettier**: 3.4.2
- **Turbopack**: Built into Next.js 15

## Priority 0 Feature Support

### 1. Class Selection Wizard ✅
- Next.js App Router for navigation
- React Server Components for performance
- Supabase for data persistence

### 2. AI Classroom ✅
- LiveKit for real-time voice
- Gemini 2.0 Flash for AI responses
- WebRTC audio processing

### 3. Textbook Processing ✅
- PDF.js for PDF parsing
- Supabase Storage for file handling
- Server-side processing with Next.js API routes

### 4. One-on-One Tutoring ✅
- LiveKit Room API for 1:1 sessions
- Session recording capabilities
- Real-time transcription

## Compatibility Matrix

| Component | Version | Priority 0 Support | Notes |
|-----------|---------|-------------------|-------|
| Next.js 15 | ✅ | Full | App Router ready |
| React 19 | ✅ | Full | Stable release |
| LiveKit | ✅ | Full | Voice chat ready |
| Gemini | ✅ | Full | Multimodal support |
| Supabase | ✅ | Full | Auth + DB + Storage |

## Known Issues & Mitigations

1. **React 19 Breaking Changes**
   - useFormState → useActionState
   - Solution: Use new API patterns

2. **Next.js 15 Async APIs**
   - cookies(), headers() are async
   - Solution: await all API calls

3. **LiveKit + React 19**
   - Some components may need updates
   - Solution: Use compatibility layer

## Recommended Package Manager

**pnpm** - For better monorepo support and disk efficiency

## Development Environment

```bash
node --version  # v20.11.0 or higher
pnpm --version  # 9.0.0 or higher
```

## Framework-First Approach

Instead of complex contracts and abstractions:
1. Use Next.js conventions directly
2. Leverage React Server Components
3. Utilize Supabase built-in features
4. Follow LiveKit component patterns

## Validation Status

✅ All technologies support Priority 0 requirements
✅ No conflicting dependencies identified
✅ Production-ready versions selected
✅ Framework patterns prioritized over custom architecture