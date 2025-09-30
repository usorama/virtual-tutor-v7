# ERR-008 Implementation Plan
## User-friendly Error Messages

**Story ID**: ERR-008
**Agent**: story_err008_001
**Plan Date**: 2025-09-30
**Phase**: 2 - Plan (BLOCKING)
**Estimated Effort**: 4 hours

---

## Implementation Overview

### Goal
Transform generic error messages into age-appropriate, encouraging, actionable messages for students aged 10-16, with enhanced visual display and retry functionality.

### Scope
1. Enhanced message utilities with age-appropriate tone
2. Visual error display component with retry UI
3. Comprehensive test coverage
4. Backward compatibility with existing error system (ERR-001 through ERR-007)

### Out of Scope
- Multi-language translation (design for future i18n)
- Animation/motion effects (keep simple)
- Voice error announcements (future enhancement)
- Custom error recovery flows per error type (use existing RecoveryStrategy)

---

## Architecture Design

### Component Structure
```
src/lib/errors/
├── error-types.ts                 [EXISTING - No changes]
├── api-error-handler.ts           [EXISTING - No changes]
├── user-messages.ts               [NEW - Message utilities]
└── index.ts                       [UPDATE - Export new utilities]

src/components/errors/
├── ErrorDisplay.tsx               [NEW - Visual error component]
├── ErrorDisplay.test.tsx          [NEW - Component tests]
└── index.ts                       [UPDATE - Export new component]

src/lib/errors/__tests__/
└── user-messages.test.ts          [NEW - Message utility tests]
```

### Data Flow
```
Error Occurs
    ↓
api-error-handler.createAPIError()
    ↓
ErrorCode extracted
    ↓
user-messages.getEnhancedUserMessage(ErrorCode, context)
    ↓
ErrorDisplay component OR ErrorNotification toast
    ↓
User sees age-appropriate message + retry option
    ↓
User clicks retry → Recovery strategy executed
```

---

## Detailed Implementation Plan

### File 1: `src/lib/errors/user-messages.ts` (~400 lines)

**Purpose**: Enhanced message utilities with age-appropriate, context-aware messages

**Exports**:
```typescript
// Core function
export function getEnhancedUserMessage(
  code: ErrorCode,
  context?: MessageContext
): EnhancedErrorMessage

// Types
export interface EnhancedErrorMessage {
  title: string;           // Short, friendly heading
  message: string;         // Main explanation (what+why)
  action: string;          // What user should do
  icon: MessageIcon;       // Visual icon type
  severity: 'info' | 'warning' | 'error' | 'critical';
}

export interface MessageContext {
  userName?: string;       // For personalization
  attemptCount?: number;   // For retry-specific messages
  resourceName?: string;   // For specific resource errors
  maxRetries?: number;     // For rate limiting
  retryAfter?: number;     // Seconds to wait
}

export type MessageIcon =
  | 'alert-circle'
  | 'wifi-off'
  | 'lock'
  | 'file-x'
  | 'clock'
  | 'info';
```

**Message Structure** (All 24 ErrorCodes):

1. **Network Errors** (5):
   ```typescript
   [ErrorCode.NETWORK_ERROR]: {
     title: "Connection Lost",
     message: "Oops! We lost connection to the internet. This happens sometimes when your WiFi is unstable.",
     action: "Check your internet connection and tap 'Try Again' when ready.",
     icon: "wifi-off",
     severity: "warning"
   }
   ```

2. **Authentication Errors** (4):
   ```typescript
   [ErrorCode.SESSION_EXPIRED]: {
     title: "Session Timed Out",
     message: "You've been away for a while, so we logged you out to keep your account safe.",
     action: "Just sign in again to continue learning!",
     icon: "lock",
     severity: "info"
   }
   ```

3. **Validation Errors** (3):
   ```typescript
   [ErrorCode.MISSING_REQUIRED_FIELD]: {
     title: "Missing Information",
     message: "Some required fields are empty. We need all the information to continue.",
     action: "Please fill in the highlighted fields and try again.",
     icon: "alert-circle",
     severity: "warning"
   }
   ```

4. **File Errors** (4):
   ```typescript
   [ErrorCode.FILE_TOO_LARGE]: {
     title: "File Too Big",
     message: "The file you selected is too large. We can only handle files up to 10MB.",
     action: "Try choosing a smaller file or compressing this one.",
     icon: "file-x",
     severity: "warning"
   }
   ```

5. **Resource Errors** (3):
   ```typescript
   [ErrorCode.NOT_FOUND]: {
     title: "Can't Find That",
     message: "We couldn't find what you're looking for. It might have been moved or deleted.",
     action: "Try going back or searching for something else.",
     icon: "alert-circle",
     severity: "info"
   }
   ```

6. **Rate/Quota Errors** (2):
   ```typescript
   [ErrorCode.RATE_LIMIT_EXCEEDED]: {
     title: "Slow Down a Bit!",
     message: "You're clicking too fast! We need a moment to catch up.",
     action: "Wait ${retryAfter} seconds and try again.",
     icon: "clock",
     severity: "warning"
   }
   ```

7. **System Errors** (3):
   ```typescript
   [ErrorCode.INTERNAL_SERVER_ERROR]: {
     title: "Something Went Wrong",
     message: "We ran into a technical problem on our end. Don't worry, it's not your fault!",
     action: "Try refreshing the page. If this keeps happening, let us know!",
     icon: "alert-circle",
     severity: "error"
   }
   ```

**Context-Awareness**:
```typescript
function getEnhancedUserMessage(
  code: ErrorCode,
  context?: MessageContext
): EnhancedErrorMessage {
  const baseMessage = ERROR_MESSAGES[code];

  // Personalize with user name
  if (context?.userName) {
    baseMessage.message = `Hey ${context.userName}! ${baseMessage.message}`;
  }

  // Adapt for retry attempts
  if (context?.attemptCount && context.attemptCount > 1) {
    baseMessage.message += ` This is attempt ${context.attemptCount}.`;
  }

  // Interpolate variables (retryAfter, maxRetries, resourceName)
  baseMessage.action = interpolateVariables(baseMessage.action, context);

  return baseMessage;
}
```

**Translation-Ready Design**:
```typescript
// Each message stored as template for future i18n
const ERROR_MESSAGE_TEMPLATES: Record<ErrorCode, EnhancedErrorMessage> = {
  // Messages with ${variable} placeholders for interpolation
  // Structure consistent across all codes for easy translation
};

// Helper for variable interpolation
function interpolateVariables(
  template: string,
  context?: MessageContext
): string {
  return template
    .replace('${retryAfter}', String(context?.retryAfter || 0))
    .replace('${maxRetries}', String(context?.maxRetries || 3))
    .replace('${resourceName}', context?.resourceName || 'resource');
}
```

---

### File 2: `src/components/errors/ErrorDisplay.tsx` (~300 lines)

**Purpose**: Visual error display component with retry functionality

**Component Structure**:
```typescript
interface ErrorDisplayProps {
  error: APIError | EnrichedError;
  context?: MessageContext;
  onRetry?: () => void | Promise<void>;
  onDismiss?: () => void;
  isRetrying?: boolean;
  showDetails?: boolean;  // Toggle for error ID/code
  className?: string;
}

export function ErrorDisplay({
  error,
  context,
  onRetry,
  onDismiss,
  isRetrying = false,
  showDetails = false,
  className
}: ErrorDisplayProps)
```

**Visual Design** (shadcn/ui components):
```tsx
<Card className="border-l-4 border-l-red-500">
  <CardHeader>
    <div className="flex items-start gap-3">
      {/* Icon based on message.icon */}
      <div className="shrink-0">
        <AlertCircle className="h-6 w-6 text-red-600" />
      </div>

      <div className="flex-1">
        {/* Title */}
        <CardTitle className="text-lg font-semibold">
          {enhancedMessage.title}
        </CardTitle>

        {/* Message */}
        <CardDescription className="mt-2 text-base">
          {enhancedMessage.message}
        </CardDescription>
      </div>

      {/* Dismiss button */}
      {onDismiss && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  </CardHeader>

  <CardContent>
    {/* Action guidance */}
    <div className="mb-4 flex items-start gap-2 rounded-lg bg-muted p-3">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <p className="text-sm">
        {enhancedMessage.action}
      </p>
    </div>

    {/* Retry button */}
    {onRetry && (
      <Button
        onClick={onRetry}
        disabled={isRetrying}
        className="w-full"
      >
        {isRetrying ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Trying again...
          </>
        ) : (
          <>
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </>
        )}
      </Button>
    )}

    {/* Optional error details (for debugging/support) */}
    {showDetails && (
      <Collapsible className="mt-4">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full">
            <ChevronDown className="mr-2 h-4 w-4" />
            Technical Details
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 space-y-1 text-xs text-muted-foreground">
          {error.code && (
            <div>Error Code: <code>{error.code}</code></div>
          )}
          {error.errorId && (
            <div>Error ID: <code>{error.errorId}</code></div>
          )}
        </CollapsibleContent>
      </Collapsible>
    )}
  </CardContent>
</Card>
```

**Severity Styling**:
```typescript
function getSeverityStyles(severity: EnhancedErrorMessage['severity']) {
  switch (severity) {
    case 'critical':
      return {
        borderColor: 'border-l-red-600',
        iconColor: 'text-red-600',
        bgColor: 'bg-red-50'
      };
    case 'error':
      return {
        borderColor: 'border-l-red-500',
        iconColor: 'text-red-500',
        bgColor: 'bg-red-50'
      };
    case 'warning':
      return {
        borderColor: 'border-l-yellow-500',
        iconColor: 'text-yellow-600',
        bgColor: 'bg-yellow-50'
      };
    case 'info':
      return {
        borderColor: 'border-l-blue-500',
        iconColor: 'text-blue-600',
        bgColor: 'bg-blue-50'
      };
  }
}
```

**Icon Mapping**:
```typescript
function getIconComponent(icon: MessageIcon) {
  const iconMap = {
    'alert-circle': AlertCircle,
    'wifi-off': WifiOff,
    'lock': Lock,
    'file-x': FileX,
    'clock': Clock,
    'info': Info
  };
  return iconMap[icon] || AlertCircle;
}
```

**Retry Integration**:
```typescript
const [isRetrying, setIsRetrying] = useState(false);

const handleRetry = async () => {
  if (!onRetry) return;

  setIsRetrying(true);
  addBreadcrumb('User initiated retry', { errorCode: error.code });

  try {
    await onRetry();
    showRecoverySuccessNotification('Success! Everything is working now.');
  } catch (retryError) {
    showErrorNotification({
      error: createAPIError(retryError),
      duration: 5000
    });
  } finally {
    setIsRetrying(false);
  }
};
```

---

### File 3: Tests

#### `src/lib/errors/__tests__/user-messages.test.ts` (~200 lines)

**Test Coverage**:
```typescript
describe('getEnhancedUserMessage', () => {
  describe('All Error Codes', () => {
    it('should have messages for all 24 error codes', () => {
      Object.values(ErrorCode).forEach(code => {
        const message = getEnhancedUserMessage(code);
        expect(message.title).toBeDefined();
        expect(message.message).toBeDefined();
        expect(message.action).toBeDefined();
        expect(message.icon).toBeDefined();
        expect(message.severity).toBeDefined();
      });
    });
  });

  describe('Message Quality', () => {
    it('should use age-appropriate language', () => {
      const networkError = getEnhancedUserMessage(ErrorCode.NETWORK_ERROR);
      expect(networkError.message).toMatch(/oops|don't worry|happens sometimes/i);
      expect(networkError.message).not.toMatch(/ERROR|FAIL|technical/i);
    });

    it('should provide actionable guidance', () => {
      Object.values(ErrorCode).forEach(code => {
        const message = getEnhancedUserMessage(code);
        // Action should contain verbs
        expect(message.action).toMatch(/try|check|wait|contact|refresh|sign/i);
      });
    });

    it('should follow what+why+how structure', () => {
      const message = getEnhancedUserMessage(ErrorCode.SESSION_EXPIRED);
      // Message should explain what happened and why
      expect(message.message.length).toBeGreaterThan(20);
      // Action should tell them what to do
      expect(message.action.length).toBeGreaterThan(10);
    });
  });

  describe('Context Awareness', () => {
    it('should personalize with user name', () => {
      const message = getEnhancedUserMessage(
        ErrorCode.NETWORK_ERROR,
        { userName: 'Alex' }
      );
      expect(message.message).toContain('Alex');
    });

    it('should adapt for retry attempts', () => {
      const message = getEnhancedUserMessage(
        ErrorCode.API_TIMEOUT,
        { attemptCount: 3 }
      );
      expect(message.message).toContain('attempt 3');
    });

    it('should interpolate retry timing', () => {
      const message = getEnhancedUserMessage(
        ErrorCode.RATE_LIMIT_EXCEEDED,
        { retryAfter: 60 }
      );
      expect(message.action).toContain('60');
    });
  });

  describe('Translation Readiness', () => {
    it('should support variable interpolation', () => {
      const message = getEnhancedUserMessage(
        ErrorCode.FILE_TOO_LARGE,
        { resourceName: 'homework.pdf' }
      );
      // Message structure should be consistent for translation
      expect(message).toHaveProperty('title');
      expect(message).toHaveProperty('message');
      expect(message).toHaveProperty('action');
    });
  });

  describe('Severity Assignment', () => {
    it('should assign critical severity to authentication errors', () => {
      const message = getEnhancedUserMessage(ErrorCode.AUTHENTICATION_ERROR);
      expect(['error', 'critical']).toContain(message.severity);
    });

    it('should assign warning severity to network errors', () => {
      const message = getEnhancedUserMessage(ErrorCode.NETWORK_ERROR);
      expect(message.severity).toBe('warning');
    });

    it('should assign info severity to session expired', () => {
      const message = getEnhancedUserMessage(ErrorCode.SESSION_EXPIRED);
      expect(message.severity).toBe('info');
    });
  });
});
```

#### `src/components/errors/ErrorDisplay.test.tsx` (~150 lines)

**Test Coverage**:
```typescript
describe('ErrorDisplay', () => {
  const mockError: APIError = {
    code: ErrorCode.NETWORK_ERROR,
    message: 'Network error',
    timestamp: new Date().toISOString()
  };

  describe('Rendering', () => {
    it('should render enhanced message', () => {
      render(<ErrorDisplay error={mockError} />);
      expect(screen.getByText(/Connection Lost/i)).toBeInTheDocument();
      expect(screen.getByText(/lost connection/i)).toBeInTheDocument();
    });

    it('should display appropriate icon', () => {
      render(<ErrorDisplay error={mockError} />);
      // Check for WifiOff icon (network error)
      expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
    });

    it('should show action guidance', () => {
      render(<ErrorDisplay error={mockError} />);
      expect(screen.getByText(/Check your internet/i)).toBeInTheDocument();
    });
  });

  describe('Retry Functionality', () => {
    it('should show retry button when onRetry provided', () => {
      const onRetry = jest.fn();
      render(<ErrorDisplay error={mockError} onRetry={onRetry} />);
      expect(screen.getByText(/Try Again/i)).toBeInTheDocument();
    });

    it('should call onRetry when button clicked', async () => {
      const onRetry = jest.fn();
      render(<ErrorDisplay error={mockError} onRetry={onRetry} />);

      const retryButton = screen.getByText(/Try Again/i);
      await userEvent.click(retryButton);

      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('should show loading state during retry', () => {
      render(<ErrorDisplay error={mockError} isRetrying={true} />);
      expect(screen.getByText(/Trying again/i)).toBeInTheDocument();
    });

    it('should disable button during retry', () => {
      render(<ErrorDisplay error={mockError} isRetrying={true} />);
      const button = screen.getByRole('button', { name: /Trying again/i });
      expect(button).toBeDisabled();
    });
  });

  describe('Severity Styling', () => {
    it('should apply critical error styles', () => {
      const criticalError = {
        ...mockError,
        code: ErrorCode.INTERNAL_SERVER_ERROR
      };
      const { container } = render(<ErrorDisplay error={criticalError} />);
      expect(container.querySelector('.border-l-red-600')).toBeInTheDocument();
    });

    it('should apply warning styles', () => {
      const { container } = render(<ErrorDisplay error={mockError} />);
      expect(container.querySelector('.border-l-yellow-500')).toBeInTheDocument();
    });
  });

  describe('Dismissal', () => {
    it('should show dismiss button when onDismiss provided', () => {
      const onDismiss = jest.fn();
      render(<ErrorDisplay error={mockError} onDismiss={onDismiss} />);
      expect(screen.getByRole('button', { name: /dismiss/i })).toBeInTheDocument();
    });

    it('should call onDismiss when button clicked', async () => {
      const onDismiss = jest.fn();
      render(<ErrorDisplay error={mockError} onDismiss={onDismiss} />);

      const dismissButton = screen.getByRole('button', { name: /dismiss/i });
      await userEvent.click(dismissButton);

      expect(onDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe('Technical Details', () => {
    it('should hide details by default', () => {
      render(<ErrorDisplay error={mockError} />);
      expect(screen.queryByText(/Error Code:/i)).not.toBeInTheDocument();
    });

    it('should show details when showDetails=true', () => {
      render(<ErrorDisplay error={mockError} showDetails={true} />);
      expect(screen.getByText(/Technical Details/i)).toBeInTheDocument();
    });

    it('should toggle details on click', async () => {
      render(<ErrorDisplay error={mockError} showDetails={true} />);

      const toggleButton = screen.getByText(/Technical Details/i);
      await userEvent.click(toggleButton);

      expect(screen.getByText(/Error Code:/i)).toBeInTheDocument();
    });
  });

  describe('Context Awareness', () => {
    it('should personalize message with context', () => {
      render(
        <ErrorDisplay
          error={mockError}
          context={{ userName: 'Sarah' }}
        />
      );
      expect(screen.getByText(/Sarah/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<ErrorDisplay error={mockError} />);
      expect(screen.getByRole('region')).toHaveAttribute('aria-label', 'Error message');
    });

    it('should be keyboard navigable', async () => {
      const onRetry = jest.fn();
      render(<ErrorDisplay error={mockError} onRetry={onRetry} />);

      const retryButton = screen.getByText(/Try Again/i);
      retryButton.focus();
      expect(retryButton).toHaveFocus();
    });
  });
});
```

---

## Integration Strategy

### Phase 3.1: Create Message Utilities
1. Create `src/lib/errors/user-messages.ts`
2. Define all 24 error messages with age-appropriate tone
3. Implement context-aware personalization
4. Export from `src/lib/errors/index.ts`
5. Run `npm run typecheck` (MUST: 0 errors)

### Phase 3.2: Build Visual Component
1. Create `src/components/errors/ErrorDisplay.tsx`
2. Implement retry functionality with loading states
3. Add severity-based styling
4. Export from `src/components/errors/index.ts`
5. Run `npm run typecheck` (MUST: 0 errors)

### Phase 3.3: Write Tests
1. Create `src/lib/errors/__tests__/user-messages.test.ts`
2. Create `src/components/errors/ErrorDisplay.test.tsx`
3. Run tests: `npm test` (MUST: 100% passing)
4. Verify coverage: >80% for new files

### Phase 3.4: Integration Verification
1. Test with existing ErrorNotification component
2. Verify backward compatibility with ERR-001 through ERR-007
3. Manual testing with different error scenarios
4. Run full test suite

---

## Risk Mitigation

### Risk 1: Breaking Existing Error System
**Mitigation**:
- No changes to `error-types.ts` or `api-error-handler.ts`
- New utilities are additive only
- Maintain backward compatibility
- All existing tests must still pass

### Risk 2: TypeScript Errors
**Mitigation**:
- Use strict types from existing error system
- Define all interfaces upfront
- Run `typecheck` after each file
- Target: 0 errors always

### Risk 3: Test Coverage Below 80%
**Mitigation**:
- Write tests in parallel with implementation
- Cover all 24 error codes
- Test edge cases (no context, missing props)
- Use snapshot testing for messages

### Risk 4: Message Tone Misalignment
**Mitigation**:
- Follow research guidelines (what+why+how)
- Review all messages for age-appropriateness
- Avoid technical jargon
- Use encouraging language consistently

---

## Success Criteria

### Phase 3 (Implementation)
✅ `user-messages.ts` created with 70+ enhanced messages
✅ `ErrorDisplay.tsx` created with retry UI
✅ All 24 error codes have age-appropriate messages
✅ Messages follow what+why+how structure
✅ Retry button integration works
✅ Loading states during recovery

### Phase 4 (Verification)
✅ TypeScript: 0 errors
✅ Lint: Passes
✅ No modifications to protected-core

### Phase 5 (Testing)
✅ All tests pass (100%)
✅ Coverage >80% for new files
✅ All 24 error codes tested
✅ Age-appropriate language verified

### Phase 6 (Confirmation)
✅ Evidence document created
✅ FILE-REGISTRY.json updated
✅ AGENT-COORDINATION.json updated
✅ Git commits properly formatted

---

## Git Checkpoint Strategy

```bash
# After Phase 3.1 (Message utilities)
git add src/lib/errors/user-messages.ts src/lib/errors/index.ts
git commit -m "feat(ERR-008): Create age-appropriate message utilities"

# After Phase 3.2 (Visual component)
git add src/components/errors/ErrorDisplay.tsx src/components/errors/index.ts
git commit -m "feat(ERR-008): Create ErrorDisplay component with retry UI"

# After Phase 3.3 (Tests)
git add src/lib/errors/__tests__/ src/components/errors/ErrorDisplay.test.tsx
git commit -m "test(ERR-008): Add comprehensive error message tests"

# After Phase 3.4 (Integration)
git add .
git commit -m "feat(ERR-008): Complete user-friendly error messages implementation"
```

---

## Timeline

- **Phase 3.1** (Message utilities): 1.5 hours
- **Phase 3.2** (Visual component): 1 hour
- **Phase 3.3** (Tests): 1 hour
- **Phase 3.4** (Integration): 0.5 hours
- **Total**: ~4 hours (matches estimate)

---

**[PLAN-APPROVED-ERR-008]**

**Ready to Proceed**: Phase 3 (IMPLEMENT)
**Signature**: story_err008_001
**Timestamp**: 2025-09-30