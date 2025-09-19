# Phase 1: Authentication System

**Duration**: 2 days  
**Dependencies**: Phase 0 Complete  
**Goal**: Implement complete authentication flow with Supabase Auth

## Tasks (Total: 5 SP)

### 1.1 Auth Pages Setup (1 SP)
- 1.1.1: Create login page layout (0.1 SP)
- 1.1.2: Create register page layout (0.1 SP)
- 1.1.3: Create forgot password page (0.1 SP)
- 1.1.4: Create auth route group layout (0.1 SP)
- 1.1.5: Add auth page metadata (0.1 SP)
- 1.1.6: Setup auth page routing (0.1 SP)
- 1.1.7: Add loading states (0.1 SP)
- 1.1.8: Add error boundaries (0.1 SP)
- 1.1.9: Style auth pages (0.1 SP)
- 1.1.10: Test page navigation (0.1 SP)

### 1.2 Auth Components (1 SP)
- 1.2.1: Adapt LoginForm from legacy (0.1 SP)
- 1.2.2: Adapt RegisterForm from legacy (0.1 SP)
- 1.2.3: Create PasswordResetForm (0.1 SP)
- 1.2.4: Create AuthGuard component (0.1 SP)
- 1.2.5: Add form validation (0.1 SP)
- 1.2.6: Add password strength indicator (0.1 SP)
- 1.2.7: Add error message display (0.1 SP)
- 1.2.8: Add success notifications (0.1 SP)
- 1.2.9: Add loading spinners (0.1 SP)
- 1.2.10: Test all form interactions (0.1 SP)

### 1.3 Auth API Routes (1 SP)
- 1.3.1: Create register endpoint (0.1 SP)
- 1.3.2: Create login endpoint (0.1 SP)
- 1.3.3: Create logout endpoint (0.1 SP)
- 1.3.4: Create refresh token endpoint (0.1 SP)
- 1.3.5: Create forgot password endpoint (0.1 SP)
- 1.3.6: Create verify email endpoint (0.1 SP)
- 1.3.7: Add rate limiting (0.1 SP)
- 1.3.8: Add input sanitization (0.1 SP)
- 1.3.9: Add error handling (0.1 SP)
- 1.3.10: Test all endpoints (0.1 SP)

### 1.4 Session Management (1 SP)
- 1.4.1: Setup auth middleware (0.1 SP)
- 1.4.2: Create session storage (0.1 SP)
- 1.4.3: Implement token refresh (0.1 SP)
- 1.4.4: Add remember me functionality (0.1 SP)
- 1.4.5: Setup auto logout on inactivity (0.1 SP)
- 1.4.6: Create useAuth hook (0.1 SP)
- 1.4.7: Add auth context provider (0.1 SP)
- 1.4.8: Setup protected routes (0.1 SP)
- 1.4.9: Handle auth redirects (0.1 SP)
- 1.4.10: Test session persistence (0.1 SP)

### 1.5 Auth Testing & Polish (1 SP)
- 1.5.1: Write unit tests for auth utils (0.1 SP)
- 1.5.2: Write integration tests for API (0.1 SP)
- 1.5.3: Write E2E tests for auth flow (0.1 SP)
- 1.5.4: Test email verification flow (0.1 SP)
- 1.5.5: Test password reset flow (0.1 SP)
- 1.5.6: Test session expiry (0.1 SP)
- 1.5.7: Add auth analytics events (0.1 SP)
- 1.5.8: Optimize auth performance (0.1 SP)
- 1.5.9: Add security headers (0.1 SP)
- 1.5.10: Final auth flow validation (0.1 SP)

## Success Criteria
- [ ] User can register with email/password
- [ ] User can login and receive session
- [ ] User can reset forgotten password
- [ ] Sessions persist across page refreshes
- [ ] Protected routes redirect to login
- [ ] Logout clears session completely
- [ ] All forms have proper validation
- [ ] Error messages are user-friendly

## Files to Create
- `/src/app/(auth)/login/page.tsx`
- `/src/app/(auth)/register/page.tsx`
- `/src/app/(auth)/forgot-password/page.tsx`
- `/src/app/(auth)/layout.tsx`
- `/src/app/api/auth/register/route.ts`
- `/src/app/api/auth/login/route.ts`
- `/src/app/api/auth/logout/route.ts`
- `/src/app/api/auth/refresh/route.ts`
- `/src/app/api/auth/forgot-password/route.ts`
- `/src/app/api/auth/verify-email/route.ts`
- `/src/components/auth/LoginForm.tsx`
- `/src/components/auth/RegisterForm.tsx`
- `/src/components/auth/PasswordResetForm.tsx`
- `/src/components/auth/AuthGuard.tsx`
- `/src/lib/auth/actions.ts`
- `/src/lib/auth/session.ts`
- `/src/lib/auth/validation.ts`
- `/src/hooks/useAuth.ts`
- `/src/stores/authStore.ts`
- `/src/types/auth.ts`
- `/tests/integration/auth/`
- `/tests/e2e/auth.spec.ts`

## Dependencies from Legacy
```bash
# Copy and adapt from legacy
cp ../vt-app-legacy/src/interface-adapters/components/auth/LoginForm.tsx src/components/auth/
cp ../vt-app-legacy/src/interface-adapters/components/auth/RegisterForm.tsx src/components/auth/
cp ../vt-app-legacy/api/auth/login/route.ts src/app/api/auth/ # As reference
cp ../vt-app-legacy/api/auth/register/route.ts src/app/api/auth/ # As reference
```

## Key Implementation Notes
- Use Supabase Auth for all authentication
- Implement proper CSRF protection
- Use secure httpOnly cookies for sessions
- Add rate limiting to prevent brute force
- Validate all inputs on both client and server
- Use Next.js 15 server actions where appropriate
- Keep forms simple and user-friendly
- Test with real email flows