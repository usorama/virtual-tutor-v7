# ERR-009 Implementation Plan: Error Boundary Enhancements
**Story ID**: ERR-009
**Wave**: Wave 2, Batch 1
**Date**: 2025-09-30
**Status**: ✅ COMPLETE

---

## Executive Summary

Detailed implementation plan for enhancing React Error Boundaries with recovery mechanisms, multiple fallback strategies, error reporting integration (ERR-006), user-friendly messages (ERR-008), HOC pattern, and nested boundary support. All implementation steps are sequenced with clear success criteria and rollback points.

---

## 1. ARCHITECTURE OVERVIEW

### 1.1 Component Structure

```
src/components/errors/
├── ErrorBoundary.tsx          (ENHANCE EXISTING - 315 → ~500 lines)
├── ErrorFallback.tsx          (NEW - ~250 lines)
├── withErrorBoundary.tsx      (NEW - ~150 lines)
├── ErrorBoundaryContext.tsx   (NEW - ~120 lines)
├── ErrorDisplay.tsx           (EXISTING - 370 lines, no changes)
├── index.ts                   (MODIFY - add exports)
└── __tests__/
    ├── ErrorBoundary.test.tsx         (NEW - ~200 lines)
    ├── ErrorFallback.test.tsx         (NEW - ~150 lines)
    ├── withErrorBoundary.test.tsx     (NEW - ~120 lines)
    └── nested-boundaries.test.tsx     (NEW - ~150 lines)

src/lib/errors/
├── error-boundary-utils.ts    (NEW - ~200 lines)
└── __tests__/
    └── error-boundary-utils.test.ts   (NEW - ~150 lines)
```

**Total New Lines**: ~1,840 lines
**Files Created**: 9 files (5 implementation + 4 tests + 1 utility)
**Files Modified**: 2 files (index.ts exports)

### 1.2 Integration Points

```
ErrorBoundary Component
├── ERR-008: User Messages
│   ├── getEnhancedUserMessage() - Get age-appropriate message
│   ├── ErrorDisplay component - Fallback UI
│   └── MessageContext - User personalization
├── ERR-005: Recovery Systems
│   ├── RecoveryOrchestrator - 7-step recovery
│   ├── IntelligentFallbackSystem - Fallback chains
│   └── SelfHealingSystem - Auto-healing
├── ERR-006: Monitoring
│   ├── captureError() - Sentry reporting
│   ├── addBreadcrumb() - Error trails
│   └── trackRecovery() - Recovery metrics
└── Existing Systems
    ├── useErrorHandler hook - Async error handling
    └── ErrorNotification - Toast notifications
```

### 1.3 Type System

```typescript
// New types for ERR-009

interface RecoveryAction {
  type: 'retry' | 'reset' | 'redirect' | 'degrade' | 'support';
  label: string;
  handler: () => void | Promise<void>;
  primary?: boolean;
}

interface EnhancedErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorCode: ErrorCode;
  errorInfo: ErrorInfo | null;
  attemptCount: number;
  isRecovering: boolean;
  recoveryStrategy: RecoveryStrategyType | null;
  errorId: string | null;
}

interface EnhancedErrorBoundaryProps {
  children: ReactNode;
  level?: 'app' | 'page' | 'feature' | 'component';
  fallback?: ComponentType<FallbackProps>;
  onError?: (error: EnrichedError, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
  resetKeys?: unknown[];
  isolateProtectedCore?: boolean;
  enableAutoRecovery?: boolean;
  maxRetries?: number;
  customRecoveryStrategy?: (error: Error, code: ErrorCode) => RecoveryStrategyType;
}

type RecoveryStrategyType =
  | 'retry-with-recovery'
  | 'component-reset'
  | 'redirect'
  | 'graceful-degradation'
  | 'manual-intervention';
```

---

## 2. IMPLEMENTATION PHASES

### Phase 3.1: Error Detection and Mapping Utilities ✓

**File**: `src/lib/errors/error-boundary-utils.ts`
**Duration**: 45 minutes

**Implementation Steps**:

1. **Error Code Detection** (~20 mins)
   ```typescript
   export function detectErrorCode(error: Error): ErrorCode {
     const message = error.message.toLowerCase();
     const stack = error.stack?.toLowerCase() || '';
     const name = error.name.toLowerCase();

     // Network errors
     if (message.includes('fetch') || message.includes('network')) {
       return ErrorCode.NETWORK_ERROR;
     }
     if (message.includes('timeout')) {
       return ErrorCode.API_TIMEOUT;
     }

     // Authentication/Authorization
     if (message.includes('unauthorized') || message.includes('401')) {
       return ErrorCode.AUTHENTICATION_ERROR;
     }
     if (message.includes('forbidden') || message.includes('403')) {
       return ErrorCode.AUTHORIZATION_ERROR;
     }
     if (message.includes('session') && message.includes('expired')) {
       return ErrorCode.SESSION_EXPIRED;
     }

     // Validation errors
     if (message.includes('validation') || message.includes('invalid')) {
       return ErrorCode.VALIDATION_ERROR;
     }
     if (message.includes('required')) {
       return ErrorCode.MISSING_REQUIRED_FIELD;
     }

     // Protected core errors
     if (stack.includes('protected-core')) {
       if (message.includes('websocket')) {
         return ErrorCode.WEBSOCKET_ERROR;
       }
       return ErrorCode.INTERNAL_SERVER_ERROR;
     }

     // Rate limits
     if (message.includes('rate limit') || message.includes('429')) {
       return ErrorCode.RATE_LIMIT_EXCEEDED;
     }

     // File errors
     if (message.includes('file') && message.includes('size')) {
       return ErrorCode.FILE_TOO_LARGE;
     }

     // Default
     return ErrorCode.UNKNOWN_ERROR;
   }
   ```

2. **Recovery Strategy Selection** (~15 mins)
   ```typescript
   export function selectRecoveryStrategy(
     error: Error,
     errorCode: ErrorCode,
     attemptCount: number,
     maxRetries: number = 3
   ): RecoveryStrategyType {
     // Max retries exceeded
     if (attemptCount >= maxRetries) {
       return 'manual-intervention';
     }

     // By error type
     switch (errorCode) {
       case ErrorCode.NETWORK_ERROR:
       case ErrorCode.API_TIMEOUT:
         return 'retry-with-recovery';

       case ErrorCode.AUTHENTICATION_ERROR:
       case ErrorCode.SESSION_EXPIRED:
         return 'redirect';

       case ErrorCode.AUTHORIZATION_ERROR:
         return 'redirect';

       case ErrorCode.VALIDATION_ERROR:
       case ErrorCode.INVALID_INPUT:
         return 'component-reset';

       case ErrorCode.RATE_LIMIT_EXCEEDED:
       case ErrorCode.QUOTA_EXCEEDED:
         return 'graceful-degradation';

       case ErrorCode.INTERNAL_SERVER_ERROR:
       case ErrorCode.WEBSOCKET_ERROR:
         return 'retry-with-recovery';

       default:
         return 'retry-with-recovery';
     }
   }
   ```

3. **Error Enrichment for Monitoring** (~10 mins)
   ```typescript
   export function enrichErrorForBoundary(
     error: Error,
     errorCode: ErrorCode,
     componentStack?: string,
     userContext?: { id?: string; name?: string }
   ): EnrichedError {
     return {
       code: errorCode,
       message: error.message,
       timestamp: new Date().toISOString(),
       errorId: generateErrorId(),
       severity: getErrorSeverity(errorCode),
       category: getErrorCategory(errorCode),
       context: {
         componentStack,
         userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
         url: typeof window !== 'undefined' ? window.location.href : undefined,
         userId: userContext?.id,
         userName: userContext?.name,
       },
       stack: error.stack,
     };
   }
   ```

**Success Criteria**:
- ✅ detectErrorCode() maps 15+ error patterns to ErrorCode
- ✅ selectRecoveryStrategy() returns appropriate strategy per error type
- ✅ enrichErrorForBoundary() creates valid EnrichedError
- ✅ All functions have JSDoc comments
- ✅ TypeScript 0 errors

**Git Checkpoint**: `git commit -m "feat(ERR-009): Create error boundary utilities"`

---

### Phase 3.2: Error Boundary Context (Nested Support) ✓

**File**: `src/components/errors/ErrorBoundaryContext.tsx`
**Duration**: 30 minutes

**Implementation Steps**:

1. **Context Definition** (~10 mins)
   ```typescript
   export interface ErrorBoundaryContextValue {
     level: 'app' | 'page' | 'feature' | 'component';
     errorCount: number;
     lastError: Error | null;
     parentContext: ErrorBoundaryContextValue | null;
     registerChild: (childLevel: string) => void;
     unregisterChild: (childLevel: string) => void;
     reportError: (error: Error, level: string) => void;
     resetErrorCount: () => void;
   }

   export const ErrorBoundaryContext = createContext<ErrorBoundaryContextValue | null>(null);
   ```

2. **Context Provider** (~10 mins)
   ```typescript
   export const ErrorBoundaryProvider: React.FC<{
     level: ErrorBoundaryContextValue['level'];
     children: ReactNode;
   }> = ({ level, children }) => {
     const [errorCount, setErrorCount] = useState(0);
     const [lastError, setLastError] = useState<Error | null>(null);
     const parentContext = useContext(ErrorBoundaryContext);
     const childLevels = useRef<Set<string>>(new Set());

     const value: ErrorBoundaryContextValue = {
       level,
       errorCount,
       lastError,
       parentContext,
       registerChild: (childLevel: string) => {
         childLevels.current.add(childLevel);
       },
       unregisterChild: (childLevel: string) => {
         childLevels.current.delete(childLevel);
       },
       reportError: (error: Error, errorLevel: string) => {
         setErrorCount(prev => prev + 1);
         setLastError(error);

         // Report to parent if exists
         if (parentContext) {
           parentContext.reportError(error, errorLevel);
         }

         // Log cascade warning if too many errors
         if (errorCount >= 3) {
           console.warn(`Error cascade detected at ${level} level`);
         }
       },
       resetErrorCount: () => {
         setErrorCount(0);
         setLastError(null);
       },
     };

     return (
       <ErrorBoundaryContext.Provider value={value}>
         {children}
       </ErrorBoundaryContext.Provider>
     );
   };
   ```

3. **Custom Hook** (~10 mins)
   ```typescript
   export function useErrorBoundaryContext(): ErrorBoundaryContextValue | null {
     return useContext(ErrorBoundaryContext);
   }

   export function useIsInsideErrorBoundary(): boolean {
     return useContext(ErrorBoundaryContext) !== null;
   }
   ```

**Success Criteria**:
- ✅ Context tracks error count and last error
- ✅ Parent-child communication works
- ✅ Cascade detection (3+ errors warning)
- ✅ Hooks exported for component use
- ✅ TypeScript 0 errors

**Git Checkpoint**: `git commit -m "feat(ERR-009): Add error boundary context for nesting"`

---

### Phase 3.3: Enhanced ErrorBoundary Component ✓

**File**: `src/components/errors/ErrorBoundary.tsx` (ENHANCE EXISTING)
**Duration**: 90 minutes

**Implementation Steps**:

1. **Enhance State and Props** (~15 mins)
   - Add new state fields (attemptCount, isRecovering, recoveryStrategy)
   - Add new props (level, enableAutoRecovery, maxRetries, customRecoveryStrategy)
   - Keep backward compatibility (all new props optional)

2. **Integrate Error Detection** (~15 mins)
   ```typescript
   static getDerivedStateFromError(error: Error): Partial<EnhancedErrorBoundaryState> {
     const errorCode = detectErrorCode(error);
     const errorId = generateErrorId();

     return {
       hasError: true,
       error,
       errorCode,
       errorInfo: null,
       attemptCount: 0,
       isRecovering: false,
       recoveryStrategy: null,
       errorId,
     };
   }
   ```

3. **Integrate ERR-006 Monitoring** (~15 mins)
   ```typescript
   componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
     const { errorCode, errorId } = this.state;
     const { onError, level } = this.props;

     // Enrich error for monitoring
     const enrichedError = enrichErrorForBoundary(
       error,
       errorCode!,
       errorInfo.componentStack,
       { id: getUserId(), name: getUserName() }
     );

     // Capture in Sentry (ERR-006)
     const sentryEventId = captureError(enrichedError);
     addBreadcrumb(`Error caught by ${level} boundary`, {
       errorCode,
       errorId,
       sentryEventId,
     });

     // Report to context (nested boundaries)
     this.context?.reportError(error, level || 'component');

     // Call custom onError handler
     onError?.(enrichedError, errorInfo);

     // Log in development
     if (process.env.NODE_ENV === 'development') {
       console.group(`🚨 Error Boundary (${level}) Caught Error`);
       console.error('Error:', error);
       console.error('Error Code:', errorCode);
       console.error('Error Info:', errorInfo);
       console.groupEnd();
     }
   }
   ```

4. **Implement Auto-Recovery with ERR-005** (~25 mins)
   ```typescript
   async attemptAutoRecovery(): Promise<boolean> {
     const { error, errorCode, attemptCount } = this.state;
     const { enableAutoRecovery, level } = this.props;

     if (!enableAutoRecovery || !error || !errorCode) {
       return false;
     }

     // Check if ERR-005 is enabled
     if (!isResilienceEnabled('recoveryOrchestrator')) {
       return false;
     }

     this.setState({ isRecovering: true });
     addBreadcrumb('Attempting auto-recovery', { errorCode, attemptCount });

     try {
       const orchestrator = RecoveryOrchestrator.getInstance();
       const result = await orchestrator.orchestrateRecovery(
         { code: errorCode, message: error.message },
         { attemptNumber: attemptCount + 1 },
         'error-boundary' // operation context
       );

       if (result.success) {
         // Recovery succeeded!
         addBreadcrumb('Auto-recovery succeeded', { errorCode });
         trackRecovery({
           errorCode,
           strategy: 'auto-recovery',
           success: true,
           attemptCount: attemptCount + 1,
         });

         // Show success notification (ERR-008)
         showRecoverySuccessNotification('All fixed! You can continue now.');

         // Reset boundary state
         this.setState({
           hasError: false,
           error: null,
           errorCode: ErrorCode.UNKNOWN_ERROR,
           errorInfo: null,
           attemptCount: 0,
           isRecovering: false,
           recoveryStrategy: null,
         });

         return true;
       } else {
         // Recovery failed
         addBreadcrumb('Auto-recovery failed', { errorCode, reason: result.error });
         return false;
       }
     } catch (recoveryError) {
       addBreadcrumb('Auto-recovery threw error', {
         errorCode,
         recoveryError: String(recoveryError),
       });
       return false;
     } finally {
       this.setState({ isRecovering: false });
     }
   }
   ```

5. **Implement Recovery Actions** (~20 mins)
   ```typescript
   getRecoveryActions(): RecoveryAction[] {
     const { errorCode, attemptCount, recoveryStrategy } = this.state;
     const { maxRetries = 3, customRecoveryStrategy } = this.props;

     // Determine strategy
     const strategy = customRecoveryStrategy
       ? customRecoveryStrategy(this.state.error!, errorCode!)
       : recoveryStrategy || selectRecoveryStrategy(this.state.error!, errorCode!, attemptCount, maxRetries);

     const actions: RecoveryAction[] = [];

     switch (strategy) {
       case 'retry-with-recovery':
         actions.push({
           type: 'retry',
           label: 'Try Again',
           handler: this.handleRetry,
           primary: true,
         });
         actions.push({
           type: 'redirect',
           label: 'Go Home',
           handler: this.handleGoHome,
         });
         break;

       case 'component-reset':
         actions.push({
           type: 'reset',
           label: 'Start Over',
           handler: this.handleReset,
           primary: true,
         });
         break;

       case 'redirect':
         const redirectUrl = getRedirectUrl(errorCode!);
         actions.push({
           type: 'redirect',
           label: getRedirectLabel(errorCode!),
           handler: () => this.handleRedirect(redirectUrl),
           primary: true,
         });
         break;

       case 'graceful-degradation':
         actions.push({
           type: 'retry',
           label: 'Try Again Later',
           handler: this.handleRetry,
         });
         actions.push({
           type: 'redirect',
           label: 'Go Home',
           handler: this.handleGoHome,
           primary: true,
         });
         break;

       case 'manual-intervention':
         actions.push({
           type: 'support',
           label: 'Contact Support',
           handler: this.handleContactSupport,
           primary: true,
         });
         actions.push({
           type: 'redirect',
           label: 'Go Home',
           handler: this.handleGoHome,
         });
         break;
     }

     return actions;
   }
   ```

6. **Update Render Logic** (~15 mins)
   - Use ErrorFallback component (Phase 3.4)
   - Pass recovery actions
   - Show recovery loading state
   - Support custom fallback prop

**Success Criteria**:
- ✅ Auto-recovery with ERR-005 working
- ✅ Sentry integration (ERR-006) complete
- ✅ Recovery actions per strategy
- ✅ Context integration for nesting
- ✅ Backward compatible with existing error-boundary.tsx
- ✅ TypeScript 0 errors

**Git Checkpoint**: `git commit -m "feat(ERR-009): Enhance ErrorBoundary with recovery"`

---

### Phase 3.4: Error Fallback Component ✓

**File**: `src/components/errors/ErrorFallback.tsx` (NEW)
**Duration**: 60 minutes

**Implementation Steps**:

1. **Component Props and Types** (~10 mins)
   ```typescript
   export interface ErrorFallbackProps {
     error: Error;
     errorCode: ErrorCode;
     errorId: string | null;
     errorInfo: ErrorInfo | null;
     attemptCount: number;
     isRecovering: boolean;
     recoveryActions: RecoveryAction[];
     onAction: (action: RecoveryAction) => void;
     level?: 'app' | 'page' | 'feature' | 'component';
     showDetails?: boolean;
     userContext?: { name?: string };
   }
   ```

2. **Integrate ERR-008 ErrorDisplay** (~30 mins)
   ```typescript
   export function ErrorFallback({
     error,
     errorCode,
     errorId,
     errorInfo,
     attemptCount,
     isRecovering,
     recoveryActions,
     onAction,
     level = 'component',
     showDetails = false,
     userContext,
   }: ErrorFallbackProps) {
     const enhancedMessage = getEnhancedUserMessage(errorCode, {
       userName: userContext?.name,
       attemptCount,
     });

     // Create pseudo-APIError for ErrorDisplay
     const displayError: APIError = {
       code: errorCode,
       message: error.message,
       timestamp: new Date().toISOString(),
     };

     // Primary action (first in array)
     const primaryAction = recoveryActions.find(a => a.primary) || recoveryActions[0];

     return (
       <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
         <div className="w-full max-w-2xl space-y-4">
           {/* Use ERR-008 ErrorDisplay */}
           <ErrorDisplay
             error={displayError}
             context={{
               userName: userContext?.name,
               attemptCount,
             }}
             onRetry={primaryAction?.handler}
             isRetrying={isRecovering}
             showDetails={showDetails}
           />

           {/* Additional Actions */}
           {recoveryActions.length > 1 && (
             <Card>
               <CardContent className="pt-6">
                 <div className="space-y-2">
                   {recoveryActions.slice(1).map((action, index) => (
                     <Button
                       key={index}
                       onClick={() => onAction(action)}
                       variant="outline"
                       className="w-full"
                       disabled={isRecovering}
                     >
                       {action.label}
                     </Button>
                   ))}
                 </div>
               </CardContent>
             </Card>
           )}

           {/* Error ID for Support */}
           {errorId && (
             <Card>
               <CardContent className="pt-6">
                 <div className="space-y-2">
                   <p className="text-sm text-muted-foreground">
                     If you need help, share this error ID with support:
                   </p>
                   <div className="flex items-center gap-2">
                     <code className="flex-1 rounded bg-muted px-3 py-2 text-xs font-mono">
                       {errorId}
                     </code>
                     <Button
                       onClick={() => {
                         navigator.clipboard.writeText(errorId);
                         toast.success('Error ID copied!');
                       }}
                       variant="ghost"
                       size="sm"
                     >
                       Copy
                     </Button>
                   </div>
                 </div>
               </CardContent>
             </Card>
           )}

           {/* Boundary Level Badge (Development Only) */}
           {process.env.NODE_ENV === 'development' && (
             <div className="text-center">
               <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                 {level} boundary
               </span>
             </div>
           )}
         </div>
       </div>
     );
   }
   ```

3. **Create Variants for Different Levels** (~20 mins)
   ```typescript
   // Compact fallback for feature-level boundaries
   export function CompactErrorFallback({
     error,
     errorCode,
     onRetry,
     isRecovering,
   }: Omit<ErrorFallbackProps, 'recoveryActions' | 'onAction'> & {
     onRetry?: () => void;
   }) {
     return (
       <ErrorDisplayCompact
         error={{ code: errorCode, message: error.message, timestamp: new Date().toISOString() }}
         onRetry={onRetry}
         className="my-4"
       />
     );
   }
   ```

**Success Criteria**:
- ✅ Uses ERR-008 ErrorDisplay component
- ✅ Shows all recovery actions
- ✅ Copy error ID to clipboard
- ✅ Loading state during recovery
- ✅ Responsive design
- ✅ Dark mode support
- ✅ Accessibility (ARIA)
- ✅ TypeScript 0 errors

**Git Checkpoint**: `git commit -m "feat(ERR-009): Create ErrorFallback component"`

---

### Phase 3.5: HOC Implementation ✓

**File**: `src/components/errors/withErrorBoundary.tsx` (NEW)
**Duration**: 45 minutes

**Implementation Steps**:

1. **Basic HOC Function** (~20 mins)
   ```typescript
   export interface WithErrorBoundaryOptions {
     fallback?: ComponentType<ErrorFallbackProps>;
     level?: 'app' | 'page' | 'feature' | 'component';
     onError?: (error: EnrichedError, errorInfo: ErrorInfo) => void;
     onReset?: () => void;
     resetKeys?: unknown[];
     isolateProtectedCore?: boolean;
     enableAutoRecovery?: boolean;
     maxRetries?: number;
   }

   export function withErrorBoundary<P extends object>(
     Component: ComponentType<P>,
     options: WithErrorBoundaryOptions = {}
   ): ComponentType<P> {
     const WrappedComponent = (props: P) => (
       <ErrorBoundary {...options}>
         <Component {...props} />
       </ErrorBoundary>
     );

     // Preserve display name for debugging
     const componentName = Component.displayName || Component.name || 'Component';
     WrappedComponent.displayName = `WithErrorBoundary(${componentName})`;

     // Hoist non-react statics (if needed)
     // hoistNonReactStatics(WrappedComponent, Component);

     return WrappedComponent;
   }
   ```

2. **Factory Functions for Common Configs** (~15 mins)
   ```typescript
   // App-level error boundary (top-level catch-all)
   export function withAppLevelErrorBoundary<P extends object>(
     Component: ComponentType<P>
   ): ComponentType<P> {
     return withErrorBoundary(Component, {
       level: 'app',
       enableAutoRecovery: true,
       maxRetries: 3,
       onError: (error) => {
         captureError(error);
         addBreadcrumb('App-level error caught', { code: error.code });
       },
     });
   }

   // Page-level error boundary
   export function withPageErrorBoundary<P extends object>(
     Component: ComponentType<P>
   ): ComponentType<P> {
     return withErrorBoundary(Component, {
       level: 'page',
       enableAutoRecovery: true,
       maxRetries: 2,
       onError: (error) => {
         captureError(error);
       },
     });
   }

   // Feature-level error boundary (critical features)
   export function withFeatureErrorBoundary<P extends object>(
     Component: ComponentType<P>,
     featureName: string
   ): ComponentType<P> {
     return withErrorBoundary(Component, {
       level: 'feature',
       fallback: CompactErrorFallback,
       enableAutoRecovery: true,
       maxRetries: 2,
       onError: (error) => {
         captureError(error);
         addBreadcrumb(`${featureName} feature error`, { code: error.code });
       },
     });
   }

   // Protected-core error boundary
   export function withProtectedCoreErrorBoundary<P extends object>(
     Component: ComponentType<P>
   ): ComponentType<P> {
     return withErrorBoundary(Component, {
       level: 'component',
       isolateProtectedCore: true,
       enableAutoRecovery: false, // Don't auto-recover protected-core
       onError: (error) => {
         captureError(error);
         addBreadcrumb('Protected-core error', {
           code: error.code,
           critical: true,
         });
       },
     });
   }
   ```

3. **TypeScript Generics and Type Safety** (~10 mins)
   - Preserve component props type
   - Handle ref forwarding (if needed)
   - Export all types

**Success Criteria**:
- ✅ HOC wraps component correctly
- ✅ Props preserved and type-safe
- ✅ Display name set for debugging
- ✅ Factory functions for common configs
- ✅ TypeScript 0 errors
- ✅ Works with functional and class components

**Git Checkpoint**: `git commit -m "feat(ERR-009): Add withErrorBoundary HOC"`

---

### Phase 3.6: Update Exports ✓

**Files**: `src/components/errors/index.ts`, `src/lib/errors/index.ts`
**Duration**: 10 minutes

**Implementation Steps**:

1. **Update Component Exports** (~5 mins)
   ```typescript
   // src/components/errors/index.ts

   // Existing exports (keep)
   export { ErrorDisplay, ErrorDisplayCompact } from './ErrorDisplay';
   export type { ErrorDisplayProps } from './ErrorDisplay';

   // ERR-009 exports (add)
   export { ErrorBoundary } from './ErrorBoundary';
   export type {
     EnhancedErrorBoundaryProps,
     EnhancedErrorBoundaryState,
     RecoveryAction,
     RecoveryStrategyType,
   } from './ErrorBoundary';

   export { ErrorFallback, CompactErrorFallback } from './ErrorFallback';
   export type { ErrorFallbackProps } from './ErrorFallback';

   export {
     withErrorBoundary,
     withAppLevelErrorBoundary,
     withPageErrorBoundary,
     withFeatureErrorBoundary,
     withProtectedCoreErrorBoundary,
   } from './withErrorBoundary';
   export type { WithErrorBoundaryOptions } from './withErrorBoundary';

   export {
     ErrorBoundaryProvider,
     ErrorBoundaryContext,
     useErrorBoundaryContext,
     useIsInsideErrorBoundary,
   } from './ErrorBoundaryContext';
   export type { ErrorBoundaryContextValue } from './ErrorBoundaryContext';
   ```

2. **Update Utilities Exports** (~5 mins)
   ```typescript
   // src/lib/errors/index.ts

   // Add ERR-009 utility exports
   export {
     detectErrorCode,
     selectRecoveryStrategy,
     enrichErrorForBoundary,
     generateErrorId,
   } from './error-boundary-utils';
   ```

**Success Criteria**:
- ✅ All new components/utilities exported
- ✅ Types exported for TypeScript consumers
- ✅ No duplicate exports
- ✅ TypeScript 0 errors

**Git Checkpoint**: `git commit -m "feat(ERR-009): Update exports"`

---

## 3. TESTING STRATEGY

### 3.1 Unit Tests

#### Test File 1: `error-boundary-utils.test.ts`

**Coverage**: ~150 lines

```typescript
describe('detectErrorCode', () => {
  it('detects network errors', () => {
    const error = new Error('Failed to fetch data');
    expect(detectErrorCode(error)).toBe(ErrorCode.NETWORK_ERROR);
  });

  it('detects authentication errors', () => {
    const error = new Error('Unauthorized access (401)');
    expect(detectErrorCode(error)).toBe(ErrorCode.AUTHENTICATION_ERROR);
  });

  it('detects protected-core errors', () => {
    const error = new Error('WebSocket connection failed');
    error.stack = 'at protected-core/websocket/manager.ts:42';
    expect(detectErrorCode(error)).toBe(ErrorCode.WEBSOCKET_ERROR);
  });

  it('defaults to UNKNOWN_ERROR for unrecognized errors', () => {
    const error = new Error('Something weird happened');
    expect(detectErrorCode(error)).toBe(ErrorCode.UNKNOWN_ERROR);
  });
});

describe('selectRecoveryStrategy', () => {
  it('returns retry for network errors', () => {
    const error = new Error('Network error');
    const strategy = selectRecoveryStrategy(error, ErrorCode.NETWORK_ERROR, 0);
    expect(strategy).toBe('retry-with-recovery');
  });

  it('returns redirect for auth errors', () => {
    const error = new Error('Unauthorized');
    const strategy = selectRecoveryStrategy(error, ErrorCode.AUTHENTICATION_ERROR, 0);
    expect(strategy).toBe('redirect');
  });

  it('returns manual-intervention after max retries', () => {
    const error = new Error('Network error');
    const strategy = selectRecoveryStrategy(error, ErrorCode.NETWORK_ERROR, 3, 3);
    expect(strategy).toBe('manual-intervention');
  });
});

describe('enrichErrorForBoundary', () => {
  it('creates enriched error with all fields', () => {
    const error = new Error('Test error');
    const enriched = enrichErrorForBoundary(
      error,
      ErrorCode.NETWORK_ERROR,
      'ComponentStack...',
      { id: 'user123', name: 'Alex' }
    );

    expect(enriched.code).toBe(ErrorCode.NETWORK_ERROR);
    expect(enriched.message).toBe('Test error');
    expect(enriched.errorId).toBeDefined();
    expect(enriched.context?.userId).toBe('user123');
  });
});
```

#### Test File 2: `ErrorBoundary.test.tsx`

**Coverage**: ~200 lines

```typescript
describe('ErrorBoundary', () => {
  it('catches errors from child components', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/test error/i)).toBeInTheDocument();
  });

  it('calls onError callback when error occurs', () => {
    const onError = vi.fn();
    const ThrowError = () => {
      throw new Error('Test error');
    };

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('attempts auto-recovery if enabled', async () => {
    const ThrowError = () => {
      throw new Error('Network error');
    };

    render(
      <ErrorBoundary enableAutoRecovery={true}>
        <ThrowError />
      </ErrorBoundary>
    );

    // Wait for auto-recovery attempt
    await waitFor(() => {
      expect(screen.queryByText(/trying again/i)).not.toBeInTheDocument();
    });
  });

  it('shows retry button for recoverable errors', () => {
    const ThrowError = () => {
      throw new Error('Network error');
    };

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('integrates with Sentry monitoring', () => {
    const captureError = vi.fn();
    vi.mock('@/lib/monitoring', () => ({
      captureError,
    }));

    const ThrowError = () => {
      throw new Error('Test error');
    };

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(captureError).toHaveBeenCalled();
  });
});
```

#### Test File 3: `withErrorBoundary.test.tsx`

**Coverage**: ~120 lines

```typescript
describe('withErrorBoundary HOC', () => {
  it('wraps component with error boundary', () => {
    const Component = () => <div>Test Component</div>;
    const WrappedComponent = withErrorBoundary(Component);

    render(<WrappedComponent />);

    expect(screen.getByText('Test Component')).toBeInTheDocument();
  });

  it('preserves component display name', () => {
    const Component = () => <div>Test</div>;
    Component.displayName = 'TestComponent';

    const WrappedComponent = withErrorBoundary(Component);

    expect(WrappedComponent.displayName).toBe('WithErrorBoundary(TestComponent)');
  });

  it('passes props correctly to wrapped component', () => {
    const Component = ({ name }: { name: string }) => <div>{name}</div>;
    const WrappedComponent = withErrorBoundary(Component);

    render(<WrappedComponent name="Alex" />);

    expect(screen.getByText('Alex')).toBeInTheDocument();
  });

  it('catches errors from wrapped component', () => {
    const Component = () => {
      throw new Error('Component error');
    };
    const WrappedComponent = withErrorBoundary(Component);

    render(<WrappedComponent />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
```

#### Test File 4: `nested-boundaries.test.tsx`

**Coverage**: ~150 lines

```typescript
describe('Nested Error Boundaries', () => {
  it('child boundary catches error first', () => {
    const childOnError = vi.fn();
    const parentOnError = vi.fn();

    const ThrowError = () => {
      throw new Error('Test error');
    };

    render(
      <ErrorBoundary level="app" onError={parentOnError}>
        <ErrorBoundary level="feature" onError={childOnError}>
          <ThrowError />
        </ErrorBoundary>
      </ErrorBoundary>
    );

    expect(childOnError).toHaveBeenCalledTimes(1);
    expect(parentOnError).not.toHaveBeenCalled();
  });

  it('parent boundary catches error if child boundary fails', () => {
    const parentOnError = vi.fn();

    const ChildBoundary = () => {
      throw new Error('Boundary error');
    };

    const ThrowError = () => {
      throw new Error('Component error');
    };

    render(
      <ErrorBoundary level="app" onError={parentOnError}>
        <ChildBoundary>
          <ThrowError />
        </ChildBoundary>
      </ErrorBoundary>
    );

    expect(parentOnError).toHaveBeenCalled();
  });

  it('tracks error count in context', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    const { rerender } = render(
      <ErrorBoundaryProvider level="app">
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      </ErrorBoundaryProvider>
    );

    // Context should track error count
    // (Test via context consumer component)
  });
});
```

### 3.2 Integration Tests

**Test ERR-005 Integration**:
```typescript
describe('ERR-005 Integration', () => {
  it('calls RecoveryOrchestrator on auto-recovery', async () => {
    const orchestrateRecovery = vi.fn().mockResolvedValue({ success: true });
    vi.mock('@/lib/resilience', () => ({
      RecoveryOrchestrator: {
        getInstance: () => ({ orchestrateRecovery }),
      },
    }));

    const ThrowError = () => {
      throw new Error('Network error');
    };

    render(
      <ErrorBoundary enableAutoRecovery={true}>
        <ThrowError />
      </ErrorBoundary>
    );

    await waitFor(() => {
      expect(orchestrateRecovery).toHaveBeenCalled();
    });
  });
});
```

**Test ERR-006 Integration**:
```typescript
describe('ERR-006 Integration', () => {
  it('captures error in Sentry', () => {
    const captureError = vi.fn();
    const addBreadcrumb = vi.fn();

    vi.mock('@/lib/monitoring', () => ({
      captureError,
      addBreadcrumb,
    }));

    const ThrowError = () => {
      throw new Error('Test error');
    };

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(captureError).toHaveBeenCalled();
    expect(addBreadcrumb).toHaveBeenCalled();
  });
});
```

**Test ERR-008 Integration**:
```typescript
describe('ERR-008 Integration', () => {
  it('uses ErrorDisplay component for fallback', () => {
    const ThrowError = () => {
      throw new Error('Network error');
    };

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    // ErrorDisplay has specific styling
    expect(screen.getByRole('region', { name: /error message/i })).toBeInTheDocument();
  });

  it('shows age-appropriate message from ERR-008', () => {
    const ThrowError = () => {
      throw new Error('Network error');
    };

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    // Age-appropriate message (from ERR-008)
    expect(screen.getByText(/connection/i)).toBeInTheDocument();
  });
});
```

### 3.3 Test Coverage Goals

- **error-boundary-utils.ts**: 100% coverage
- **ErrorBoundary.tsx**: >85% coverage
- **ErrorFallback.tsx**: >80% coverage
- **withErrorBoundary.tsx**: >90% coverage
- **ErrorBoundaryContext.tsx**: >80% coverage

**Overall Target**: >80% coverage for ERR-009 files

---

## 4. VERIFICATION CHECKLIST

### 4.1 TypeScript Verification

```bash
npm run typecheck
# Expected: 0 new errors
# Check only ERR-009 files:
npm run typecheck | grep "src/components/errors\|src/lib/errors"
```

### 4.2 Lint Verification

```bash
npm run lint
# Expected: No new lint errors in ERR-009 files
```

### 4.3 Test Verification

```bash
# Run all ERR-009 tests
npm test -- src/components/errors/__tests__/ src/lib/errors/__tests__/error-boundary-utils.test.ts

# Expected: All tests passing, >80% coverage
```

### 4.4 Protected-Core Verification

```bash
git log --since="1 day ago" -- pinglearn-app/src/protected-core/
# Expected: No commits (no protected-core modifications)
```

### 4.5 Integration Verification

- [ ] ErrorBoundary catches errors
- [ ] Auto-recovery works (ERR-005 integration)
- [ ] Errors logged to Sentry (ERR-006 integration)
- [ ] User-friendly messages displayed (ERR-008 integration)
- [ ] HOC wraps components correctly
- [ ] Nested boundaries work (parent-child)
- [ ] Recovery actions work (retry, reset, redirect)
- [ ] Accessibility features work (ARIA, keyboard)

---

## 5. ROLLBACK PLAN

### 5.1 Git Checkpoints

Each phase has a git checkpoint. If issues arise, rollback to last checkpoint:

```bash
# View checkpoints
git log --oneline --grep="ERR-009"

# Rollback to specific checkpoint
git reset --hard <commit-hash>

# Rollback one phase
git reset --hard HEAD~1
```

### 5.2 Feature Flag

If deployed but causing issues:

```json
// feature-flags.json
{
  "errorHandling": {
    "enhancedBoundaries": false,  // ← Disable ERR-009
    "autoRecovery": false          // ← Disable ERR-005 integration
  }
}
```

---

## 6. SUCCESS CRITERIA

### 6.1 Functional Requirements ✓

- [ ] Enhanced ErrorBoundary with recovery mechanisms
- [ ] Multiple fallback strategies (5 types)
- [ ] Error reporting integration (Sentry/ERR-006)
- [ ] User-friendly messages (ERR-008)
- [ ] Error boundary HOC for easy wrapping
- [ ] Nested error boundary support

### 6.2 Quality Requirements ✓

- [ ] TypeScript: 0 new errors
- [ ] Tests: >80% coverage, all passing
- [ ] Protected-Core: No modifications
- [ ] Backward Compatible: Existing code unaffected
- [ ] Accessibility: ARIA labels, keyboard navigation

### 6.3 Integration Requirements ✓

- [ ] ERR-008: ErrorDisplay component used
- [ ] ERR-005: RecoveryOrchestrator integrated
- [ ] ERR-006: Sentry captureError() called
- [ ] ERR-001: ErrorCode enum used

### 6.4 Documentation Requirements ✓

- [ ] JSDoc comments on all public APIs
- [ ] Usage examples in code comments
- [ ] Evidence manifest created (Phase 6)

---

## 7. ESTIMATED DURATION

- **Phase 3.1**: Error Utilities (45 mins)
- **Phase 3.2**: Context (30 mins)
- **Phase 3.3**: Enhanced ErrorBoundary (90 mins)
- **Phase 3.4**: ErrorFallback (60 mins)
- **Phase 3.5**: HOC (45 mins)
- **Phase 3.6**: Exports (10 mins)
- **Testing**: (90 mins)
- **Verification**: (30 mins)

**Total**: ~6 hours

---

## 8. RISK MITIGATION

### 8.1 Risk: Breaking Existing Error Boundary

**Mitigation**:
- Keep old error-boundary.tsx in `src/lib/error-handling/` (don't delete)
- New ErrorBoundary in `src/components/errors/` (different location)
- Gradual migration (optional)

### 8.2 Risk: ERR-005 Overhead

**Mitigation**:
- Make auto-recovery optional (`enableAutoRecovery` prop, default false)
- Feature flag for ERR-005 integration
- Timeout for recovery attempts (3 seconds max)

### 8.3 Risk: Context Complexity

**Mitigation**:
- Clear documentation on context usage
- Optional context (boundaries work without it)
- Simple API (registerChild, reportError)

---

## [PLAN-APPROVED-ERR-009]

**Signature**: ERR-009 implementation plan approved
**Date**: 2025-09-30
**Status**: ✅ READY FOR IMPLEMENTATION
**Agent**: story_err009_001

---

**END OF PLAN DOCUMENT**
