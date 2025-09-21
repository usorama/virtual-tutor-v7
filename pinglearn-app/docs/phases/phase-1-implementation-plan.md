# Phase 1: Authentication Implementation Plan

## Overview
Implementing complete authentication system using Supabase Auth with Next.js 15 App Router and SSR.

## Implementation Strategy

### 1. Auth Types & Utilities (30 min)
- Create `/src/types/auth.ts` with User, Session, AuthError types
- Create `/src/lib/auth/validation.ts` for email/password validation
- Create `/src/lib/auth/constants.ts` for auth configuration

### 2. Supabase Auth Helpers (45 min)
- Update `/src/lib/supabase/server.ts` for auth operations
- Create `/src/lib/auth/actions.ts` for server actions
- Create `/src/hooks/useAuth.ts` for client-side auth state
- Create `/src/providers/AuthProvider.tsx` for context

### 3. Auth UI Components (1 hour)
- Create `/src/components/auth/LoginForm.tsx`
- Create `/src/components/auth/RegisterForm.tsx`
- Create `/src/components/auth/ForgotPasswordForm.tsx`
- Create `/src/components/auth/AuthGuard.tsx`
- Add form validation with error messages
- Add loading states and success notifications

### 4. Auth Pages (45 min)
- Create `/src/app/(auth)/layout.tsx` for auth layout
- Create `/src/app/(auth)/login/page.tsx`
- Create `/src/app/(auth)/register/page.tsx`
- Create `/src/app/(auth)/forgot-password/page.tsx`
- Create `/src/app/auth/confirm/route.ts` for email confirmation

### 5. API Routes (1 hour)
- Create `/src/app/api/auth/login/route.ts`
- Create `/src/app/api/auth/register/route.ts`
- Create `/src/app/api/auth/logout/route.ts`
- Create `/src/app/api/auth/reset-password/route.ts`
- Add rate limiting and input validation

### 6. Protected Routes & Session (30 min)
- Update middleware for auth protection
- Create dashboard page as protected route example
- Implement session persistence
- Add auto-refresh for tokens

### 7. Testing & Verification (30 min)
- Test registration flow
- Test login/logout flow
- Test password reset flow
- Test protected route access
- Verify session persistence

## Key Implementation Details

### Security Measures
- PKCE flow for SSR authentication
- httpOnly cookies for session storage
- CSRF protection via SameSite cookies
- Rate limiting: 5 attempts per hour
- Input validation on both client and server

### Supabase Configuration Needed
- Enable email authentication (default)
- Configure redirect URLs in Supabase dashboard
- Set up email templates for confirmation and reset
- Configure SMTP for production (using default for dev)

### Environment Variables Required
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

### Email Templates (Supabase Dashboard)
1. Sign-up Confirmation:
```html
<h2>Confirm your signup</h2>
<p>Follow this link to confirm your user:</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next={{ .RedirectTo }}">Confirm your email</a></p>
```

2. Password Reset:
```html
<h2>Reset Password</h2>
<p>Follow this link to reset your password:</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next={{ .RedirectTo }}">Reset Password</a></p>
```

## Success Criteria
- [x] Research completed
- [ ] User can register with email/password
- [ ] User can login and receive session
- [ ] User can reset forgotten password
- [ ] Sessions persist across refreshes
- [ ] Protected routes redirect to login
- [ ] Logout clears session completely
- [ ] All forms have validation
- [ ] TypeScript: 0 errors
- [ ] ESLint: All checks pass

## Next Steps
1. Start with auth types and utilities
2. Build forms and pages
3. Implement API routes
4. Test all flows
5. Run verification suite