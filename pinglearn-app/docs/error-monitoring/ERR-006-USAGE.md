# Error Monitoring Usage Guide
**ERR-006: Error Monitoring Integration**

Complete guide for using the error monitoring system in PingLearn.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Error Tracking](#error-tracking)
3. [Error Recovery UI](#error-recovery-ui)
4. [Custom Hooks](#custom-hooks)
5. [Testing](#testing)
6. [Best Practices](#best-practices)

---

## Quick Start

### 1. Track an Error

```typescript
import { trackError } from '@/lib/monitoring';

try {
  await riskyOperation();
} catch (error) {
  trackError(error, {
    context: {
      component: 'MyComponent',
      feature: 'user-action',
    },
  });
}
```

### 2. Show Error Recovery Dialog

```typescript
import { useState } from 'react';
import { ErrorRecoveryDialog } from '@/components/error';
import { trackError } from '@/lib/monitoring';

function MyComponent() {
  const [error, setError] = useState(null);
  const [showDialog, setShowDialog] = useState(false);

  const handleError = (err) => {
    const errorId = trackError(err);
    setError(err);
    setShowDialog(true);
  };

  return (
    <>
      {/* Your component */}

      <ErrorRecoveryDialog
        error={error}
        open={showDialog}
        onClose={() => setShowDialog(false)}
        onRetry={async () => {
          await retryOperation();
        }}
      />
    </>
  );
}
```

### 3. Use Error Monitoring Hook

```typescript
import { useErrorMonitoring } from '@/hooks';

function MyComponent() {
  const { trackError, addBreadcrumb } = useErrorMonitoring({
    component: 'MyComponent',
    feature: 'data-fetch',
  });

  const fetchData = async () => {
    addBreadcrumb('Starting data fetch');

    try {
      const data = await api.fetchData();
      addBreadcrumb('Data fetch successful');
      return data;
    } catch (error) {
      trackError(error);
      throw error;
    }
  };

  // ...
}
```

---

## Error Tracking

### Basic Error Tracking

```typescript
import { trackError } from '@/lib/monitoring';

// Simple error tracking
trackError(error);

// With context
trackError(error, {
  context: {
    component: 'VoiceSession',
    feature: 'audio-init',
    sessionId: session.id,
    studentId: student.id,
  },
});

// With severity override
trackError(error, {
  severity: 'critical',
  tags: {
    environment: 'production',
    version: '1.0.0',
  },
});
```

### Adding Breadcrumbs

Breadcrumbs provide context leading up to an error:

```typescript
import { addBreadcrumb } from '@/lib/monitoring';

// Add navigation breadcrumb
addBreadcrumb('User navigated to profile page', {
  url: '/profile',
  previousUrl: '/dashboard',
});

// Add action breadcrumb
addBreadcrumb('User clicked save button', {
  formValid: true,
  fieldCount: 5,
});

// Add state change breadcrumb
addBreadcrumb('Session state changed', {
  from: 'connecting',
  to: 'connected',
  duration: 1250,
});
```

### User Context

Set user context for all errors:

```typescript
import { setUserContext, clearUserContext } from '@/lib/monitoring';

// On login
setUserContext(user.id, user.email, {
  role: user.role,
  subscription: user.subscriptionTier,
});

// On logout
clearUserContext();
```

### Performance Tracking

```typescript
import { trackPerformance } from '@/lib/monitoring';

const startTime = performance.now();
await heavyOperation();
const duration = performance.now() - startTime;

trackPerformance({
  name: 'heavy-operation',
  value: duration,
  unit: 'milliseconds',
  timestamp: Date.now(),
  context: {
    dataSize: data.length,
    cacheHit: false,
  },
});
```

---

## Error Recovery UI

### ErrorRecoveryDialog

Main recovery dialog with retry and fallback options:

```typescript
import { ErrorRecoveryDialog } from '@/components/error';

<ErrorRecoveryDialog
  error={enrichedError}
  open={showDialog}
  onClose={() => setShowDialog(false)}
  onRetry={async () => {
    // Your retry logic
    await reconnectSession();
  }}
  onFallback={() => {
    // Alternative action
    navigateToManualMode();
  }}
  showSupport={true}
  retryLabel="Reconnect"
  fallbackLabel="Manual Mode"
/>
```

### ErrorNotification

Toast notifications for non-blocking errors:

```typescript
import { showErrorNotification } from '@/components/error';

try {
  await saveData();
} catch (error) {
  showErrorNotification({
    error: enrichedError,
    duration: 5000,
    dismissible: true,
  });
}
```

### RecoveryProgress

Progress tracking during recovery:

```typescript
import { RecoveryProgress } from '@/components/error';
import type { RecoveryStep } from '@/components/error';

const [steps, setSteps] = useState<RecoveryStep[]>([
  { id: 'diagnose', label: 'Diagnosing issue...', status: 'pending' },
  { id: 'reconnect', label: 'Reconnecting...', status: 'pending' },
  { id: 'verify', label: 'Verifying...', status: 'pending' },
]);

<RecoveryProgress
  steps={steps}
  currentStepIndex={currentStep}
  onComplete={() => console.log('Recovery complete!')}
  onFailed={(step) => console.log('Failed at:', step.id)}
/>
```

### ErrorHistoryPanel

View and manage error history:

```typescript
import { ErrorHistoryPanel } from '@/components/error';

<ErrorHistoryPanel
  errors={errorHistory}
  maxErrors={50}
  onClear={() => setErrorHistory([])}
  onExport={(errors) => downloadErrorReport(errors)}
/>
```

---

## Custom Hooks

### useErrorMonitoring

Hook for error tracking with automatic context:

```typescript
import { useErrorMonitoring } from '@/hooks';

function MyComponent() {
  const {
    trackError,
    addBreadcrumb,
    setUser,
    clearUser,
    trackPerformance,
  } = useErrorMonitoring({
    component: 'MyComponent',
    feature: 'data-sync',
    trackNavigation: true,
    trackInteractions: true,
  });

  // Use trackError, addBreadcrumb, etc.
}
```

### useAsyncErrorTracking

Track async operations with automatic error handling:

```typescript
import { useAsyncErrorTracking } from '@/hooks';

function MyComponent() {
  const { execute, isLoading, error } = useAsyncErrorTracking(
    async () => {
      return await fetchData();
    },
    {
      component: 'MyComponent',
      operation: 'data-fetch',
      onError: (error) => {
        // Handle error
      },
    }
  );

  return (
    <button onClick={execute} disabled={isLoading}>
      {isLoading ? 'Loading...' : 'Fetch Data'}
    </button>
  );
}
```

### useErrorRecovery

Manage error recovery state:

```typescript
import { useErrorRecovery } from '@/hooks';

function MyComponent() {
  const {
    error,
    isRecovering,
    recoveryAttempts,
    startRecovery,
    showRecoveryDialog,
    setShowRecoveryDialog,
    recoverySteps,
  } = useErrorRecovery({
    component: 'VoiceSession',
    onRetry: async () => {
      await reconnectSession();
    },
    autoRetry: true,
    maxAutoRetries: 3,
    retryDelay: 2000,
  });

  // Trigger recovery when error occurs
  useEffect(() => {
    if (sessionError) {
      startRecovery(sessionError);
    }
  }, [sessionError]);
}
```

### useErrorHistory

Track error history:

```typescript
import { useErrorHistory } from '@/hooks';

function ErrorHistoryView() {
  const { errors, addError, clearErrors, removeError } = useErrorHistory({
    maxErrors: 100,
  });

  return (
    <ErrorHistoryPanel
      errors={errors}
      onClear={clearErrors}
    />
  );
}
```

---

## Testing

### Error Fixtures

```typescript
import {
  createMockError,
  connectionErrors,
  voiceErrors,
} from '@/__tests__/helpers/error-fixtures';

// Create custom mock error
const mockError = createMockError({
  code: 'TEST_ERROR',
  category: 'api',
  severity: 'high',
});

// Use predefined fixtures
const timeoutError = connectionErrors.timeout;
const micError = voiceErrors.microphoneAccess;
```

### Error Injection

```typescript
import {
  enableErrorInjection,
  queueError,
  simulateNetworkError,
} from '@/__tests__/helpers/error-injection';

describe('Error Recovery', () => {
  beforeEach(() => {
    enableErrorInjection();
  });

  it('should recover from network error', async () => {
    queueError(simulateNetworkError('timeout'));

    await expect(fetchData()).rejects.toThrow();
  });
});
```

### Sentry Mocks

```typescript
import {
  mockSentry,
  getCapturedExceptions,
  expectErrorSentToSentry,
} from '@/__tests__/helpers/sentry-mocks';

jest.mock('@sentry/nextjs', () => mockSentry);

describe('Error Tracking', () => {
  it('should send error to Sentry', () => {
    trackError(new Error('Test error'));

    expectErrorSentToSentry('Test error');

    const exceptions = getCapturedExceptions();
    expect(exceptions).toHaveLength(1);
  });
});
```

---

## Best Practices

### 1. Always Add Context

```typescript
// ❌ Bad - No context
trackError(error);

// ✅ Good - Rich context
trackError(error, {
  context: {
    component: 'VoiceSession',
    feature: 'audio-init',
    sessionId: session.id,
    action: 'start-recording',
    audioDevice: deviceInfo.label,
  },
});
```

### 2. Use Breadcrumbs

```typescript
// Add breadcrumbs leading up to potential errors
addBreadcrumb('User clicked start button');
addBreadcrumb('Requesting microphone permission');
addBreadcrumb('Initializing audio context');

try {
  await startRecording();
} catch (error) {
  // Breadcrumbs provide context
  trackError(error);
}
```

### 3. Handle Recovery Gracefully

```typescript
// Provide multiple recovery options
<ErrorRecoveryDialog
  error={error}
  open={true}
  onRetry={async () => {
    // Primary recovery: retry
    await retryOperation();
  }}
  onFallback={() => {
    // Alternative: use fallback mode
    enableFallbackMode();
  }}
  showSupport={true}
/>
```

### 4. Don't Track Expected Errors

```typescript
// ❌ Bad - Tracking validation errors
try {
  validateForm();
} catch (error) {
  trackError(error); // Don't track expected validation failures
}

// ✅ Good - Only track unexpected errors
try {
  await submitToAPI();
} catch (error) {
  if (isNetworkError(error)) {
    trackError(error); // Track unexpected failures
  }
}
```

### 5. Set Appropriate Severity

```typescript
// Critical - System is unusable
trackError(error, { severity: 'critical' });

// High - Important functionality broken
trackError(error, { severity: 'high' });

// Medium - Degraded experience
trackError(error, { severity: 'medium' });

// Low - Minor issue
trackError(error, { severity: 'low' });
```

### 6. Clean Up Sensitive Data

The system automatically sanitizes:
- Email addresses → `[EMAIL]`
- SSN → `[SSN]`
- Credit cards → `[CARD]`
- Passwords, tokens, API keys

But you should still avoid including sensitive data in error context.

### 7. Use Error Catalog

```typescript
import { getErrorDocumentation, getSuggestedSolution } from '@/lib/monitoring';

// Get error documentation
const docs = getErrorDocumentation(error.code);
if (docs) {
  console.log('Solutions:', docs.solutions);
  console.log('Prevention:', docs.prevention);
}

// Get quick solution
const solution = getSuggestedSolution(error.code);
showToUser(solution);
```

---

## Environment Variables

Required Sentry configuration in `.env`:

```bash
# Sentry DSN (get from sentry.io project settings)
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
SENTRY_DSN=your_sentry_dsn_here

# Sentry Organization & Project
SENTRY_ORG=your_sentry_organization
SENTRY_PROJECT=your_sentry_project

# Sentry Auth Token (for source map uploads)
SENTRY_AUTH_TOKEN=your_sentry_auth_token

# Development mode (set to true for local development)
SENTRY_DEV_MODE=false
```

---

## Troubleshooting

### Errors not appearing in Sentry

1. Check DSN is set correctly in `.env`
2. Verify Sentry is initialized in `sentry.client.config.ts`
3. Check `defaultConfig.enabled` is `true`
4. Look for console logs in debug mode

### Recovery dialog not showing

1. Ensure `showRecoveryDialog` state is `true`
2. Verify error object has `errorId` property
3. Check Dialog component is rendered

### Breadcrumbs not captured

1. Verify Sentry is initialized before breadcrumbs are added
2. Check breadcrumb limit (Sentry keeps last 100)
3. Ensure `addBreadcrumb` is called correctly

---

## Additional Resources

- [Error Catalog](./error-catalog.ts) - Complete list of error codes
- [Sentry Documentation](https://docs.sentry.io)
- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [ERR-006 Research](../../.research-plan-manifests/research/ERR-006-RESEARCH.md)
- [ERR-006 Plan](../../.research-plan-manifests/plans/ERR-006-PLAN.md)