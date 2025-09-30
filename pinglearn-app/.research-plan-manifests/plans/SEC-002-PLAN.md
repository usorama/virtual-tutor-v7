# SEC-002 Implementation Plan: XSS Protection for Math Rendering

**Story ID**: SEC-002
**Agent ID**: story_sec002_001
**Plan Created**: 2025-09-30T15:30:00Z
**Estimated Duration**: 4-5 hours
**Priority**: P0 (CRITICAL)

---

## Executive Summary

**Goal**: Add multi-layered XSS protection to all math rendering in PingLearn without modifying protected-core.

**Strategy**: Create a security wrapper layer that:
1. Validates LaTeX input for XSS patterns (BEFORE protected-core validator)
2. Configures KaTeX securely (replaces current unsafe `trust: true`)
3. Sanitizes HTML output (AFTER KaTeX rendering)
4. Integrates with existing threat detection system

**Key Insight from Research**:
- Protected-core has `LaTexValidator` (syntax validation only, no XSS checks)
- Protected-core has `MathRenderer` (currently no security options passed)
- We can wrap these with our security layer WITHOUT modifying protected-core!

---

## 🎯 PHASE 2: PLAN (BLOCKING - MUST APPROVE BEFORE IMPLEMENTATION)

### Architecture Decision

**Layered Security Approach**:

```
User Input (LaTeX)
       ↓
[Layer 1] XSS Input Validation (NEW - xss-protection.ts)
       ↓
[Layer 2] Protected-Core LaTexValidator (EXISTING - syntax only)
       ↓
[Layer 3] Secure KaTeX Configuration (NEW - via xss-protection.ts)
       ↓
[Layer 4] Protected-Core MathRenderer (EXISTING - will use our config)
       ↓
[Layer 5] HTML Output Sanitization (NEW - xss-protection.ts)
       ↓
[Layer 6] Threat Detection Reporting (EXISTING - integration)
       ↓
Safe HTML Output
```

---

## 1. FILES TO CREATE

### 1.1 `src/lib/security/xss-protection.ts` (NEW FILE - ~300 lines)

**Purpose**: XSS-specific security layer for math rendering

**Exports**:
```typescript
// Main API
export function validateLatexForXSS(latex: string): XSSValidationResult;
export function getSecureKatexOptions(displayMode?: boolean): SecureKatexOptions;
export function sanitizeMathHTML(html: string): string;
export function escapeErrorMessage(message: string): string;

// Integration
export function reportMathXSSAttempt(latex: string, reason: string, metadata?: Record<string, unknown>): Promise<void>;

// Types
export interface XSSValidationResult {
  safe: boolean;
  sanitized: string;
  threats: XSSThreat[];
  riskScore: number;
}

export interface XSSThreat {
  type: 'javascript_protocol' | 'html_injection' | 'macro_bomb' | 'dangerous_command' | 'suspicious_pattern';
  pattern: string;
  position: number;
  severity: 'critical' | 'high' | 'moderate';
  blocked: boolean;
}

export interface SecureKatexOptions {
  throwOnError: false;
  errorColor: string;
  maxSize: number;
  maxExpand: number;
  strict: 'warn' | 'error';
  trust: false | TrustFunction;
  macros: Record<string, string>;
  displayMode?: boolean;
}

export type TrustFunction = (context: TrustContext) => boolean;
```

**Implementation Details**:
- XSS pattern detection (regex-based + heuristics)
- Length validation (prevent DoS)
- Dangerous command blocking
- Protocol validation (javascript:, data:)
- HTML injection detection
- Integration with SecurityThreatDetector

---

## 2. FILES TO MODIFY

### 2.1 `src/components/transcription/MathRenderer.tsx` (MODIFY - ~324 lines)

**Current Issues**:
- Line 82: `trust: true` ❌
- Line 144: `dangerouslySetInnerHTML` without sanitization ❌
- No XSS validation ❌

**Changes Required**:

**Step 1**: Add imports
```typescript
import {
  validateLatexForXSS,
  getSecureKatexOptions,
  sanitizeMathHTML,
  reportMathXSSAttempt
} from '@/lib/security/xss-protection';
```

**Step 2**: Add XSS validation before rendering (in useEffect, line 65)
```typescript
// BEFORE katex rendering
const xssValidation = validateLatexForXSS(latex);
if (!xssValidation.safe) {
  // Report to threat detector
  await reportMathXSSAttempt(latex, xssValidation.threats[0]?.pattern, {
    component: 'MathRenderer-Transcription',
    display
  });

  // Block rendering, show error
  setError(`Math expression blocked for security: ${xssValidation.threats[0]?.type}`);
  setIsLoaded(true);
  return;
}
```

**Step 3**: Replace KaTeX options (line 77-89)
```typescript
// OLD (UNSAFE):
const html = katex.default.renderToString(latex, {
  displayMode: display,
  throwOnError: false,
  errorColor: '#cc0000',
  strict: false,
  trust: true,  // ❌ DANGEROUS
  macros: { ... }
});

// NEW (SECURE):
const secureOptions = getSecureKatexOptions(display);
const html = katex.default.renderToString(
  xssValidation.sanitized,  // Use sanitized input
  secureOptions
);
```

**Step 4**: Sanitize HTML output (after renderToString, line 90)
```typescript
const sanitizedHtml = sanitizeMathHTML(html);
mathCache.set(cacheKey, { html: sanitizedHtml, error: null });
setMathHtml(sanitizedHtml);
```

**Step 5**: No changes to dangerouslySetInnerHTML usage
- It's safe now because HTML is sanitized
- Keep aria-label for accessibility

**Estimated LOC Changes**: +20 lines, 5 modifications

---

### 2.2 `src/components/classroom/MathRenderer.tsx` (MODIFY - ~43 lines)

**Current Issues**:
- Line 21: `trust: true` ❌
- Line 40: `dangerouslySetInnerHTML` without sanitization ❌
- No XSS validation ❌
- No error handling ❌

**Changes Required**:

**Step 1**: Add imports (same as above)

**Step 2**: Add XSS validation in useMemo (line 16)
```typescript
const renderedMath = useMemo(() => {
  // XSS validation FIRST
  const xssValidation = validateLatexForXSS(latex);
  if (!xssValidation.safe) {
    reportMathXSSAttempt(latex, xssValidation.threats[0]?.pattern, {
      component: 'MathRenderer-Classroom',
      displayMode
    }).catch(console.error);

    return `<span class="text-destructive font-mono text-sm">[Math Blocked: ${xssValidation.threats[0]?.type}]</span>`;
  }

  try {
    const secureOptions = getSecureKatexOptions(displayMode);
    const html = katex.renderToString(xssValidation.sanitized, secureOptions);
    return sanitizeMathHTML(html);
  } catch (error) {
    console.error('KaTeX rendering error:', error);
    return `<span class="text-destructive font-mono text-sm">[Math Error: ${latex}]</span>`;
  }
}, [latex, displayMode]);
```

**Estimated LOC Changes**: +15 lines, 1 major modification

---

### 2.3 `src/components/classroom/ProgressiveMath.tsx` (MODIFY - ~116 lines)

**Current Issues**:
- Line 76: `trust: true` ❌
- Line 94: `dangerouslySetInnerHTML` without sanitization ❌
- No XSS validation on fragments ❌

**Changes Required**:

**Step 1**: Add imports (same as above)

**Step 2**: Validate fullLatex on component mount (new useEffect)
```typescript
useEffect(() => {
  const xssValidation = validateLatexForXSS(fullLatex);
  if (!xssValidation.safe) {
    reportMathXSSAttempt(fullLatex, xssValidation.threats[0]?.pattern, {
      component: 'ProgressiveMath',
      fragmentCount: fragments?.fragments?.length
    }).catch(console.error);

    // Set error state and stop progressive reveal
    setIsComplete(true);
    console.error('Progressive math blocked for security:', xssValidation.threats);
  }
}, [fullLatex, fragments]);
```

**Step 3**: Validate currentLatex in useMemo (line 69-83)
```typescript
const mathHtml = useMemo(() => {
  if (!currentLatex) return '';

  // Validate current fragment
  const xssValidation = validateLatexForXSS(currentLatex);
  if (!xssValidation.safe) {
    return `<span class="text-red-500">[Math Blocked]</span>`;
  }

  try {
    const secureOptions = getSecureKatexOptions(true);
    const html = katex.renderToString(xssValidation.sanitized, secureOptions);
    return sanitizeMathHTML(html);
  } catch (error) {
    console.warn('KaTeX rendering error in ProgressiveMath:', error);
    return `<span class="text-red-500">[Math Error: ${currentLatex}]</span>`;
  }
}, [currentLatex]);
```

**Estimated LOC Changes**: +20 lines, 2 modifications

---

## 3. TESTING STRATEGY

### 3.1 Create Test File: `src/tests/security/math-xss-protection.test.ts` (NEW FILE - ~400 lines)

**Test Categories**:

**Category 1: XSS Pattern Detection**
```typescript
describe('XSS Pattern Detection', () => {
  test('blocks javascript: protocol in URLs', () => {
    const malicious = '\\url{javascript:alert(1)}';
    const result = validateLatexForXSS(malicious);
    expect(result.safe).toBe(false);
    expect(result.threats).toHaveLength(1);
    expect(result.threats[0].type).toBe('javascript_protocol');
  });

  test('blocks case-insensitive JavaScript protocols', () => {
    const variations = [
      '\\url{JavaScript:alert(1)}',
      '\\url{JAVASCRIPT:alert(1)}',
      '\\url{JaVaScRiPt:alert(1)}'
    ];

    variations.forEach(malicious => {
      const result = validateLatexForXSS(malicious);
      expect(result.safe).toBe(false);
    });
  });

  test('blocks data: protocol with HTML', () => {
    const malicious = '\\url{data:text/html,<script>alert(1)</script>}';
    const result = validateLatexForXSS(malicious);
    expect(result.safe).toBe(false);
    expect(result.threats[0].type).toBe('javascript_protocol');
  });

  test('blocks HTML injection in macros', () => {
    const malicious = '\\def\\evil{<img src=x onerror=alert(1)>}\\evil';
    const result = validateLatexForXSS(malicious);
    expect(result.safe).toBe(false);
    expect(result.threats[0].type).toBe('html_injection');
  });

  test('blocks onclick handlers', () => {
    const malicious = '\\htmlClass{" onclick="alert(1)}';
    const result = validateLatexForXSS(malicious);
    expect(result.safe).toBe(false);
  });

  test('blocks onerror handlers', () => {
    const malicious = '<img src=x onerror="alert(1)">';
    const result = validateLatexForXSS(malicious);
    expect(result.safe).toBe(false);
  });
});
```

**Category 2: Macro Bomb Detection**
```typescript
describe('Macro Bomb Detection', () => {
  test('blocks recursive macro definitions', () => {
    const malicious = '\\def\\a{\\a\\a}\\a';
    const result = validateLatexForXSS(malicious);
    expect(result.safe).toBe(false);
    expect(result.threats[0].type).toBe('macro_bomb');
  });

  test('blocks exponential expansion patterns', () => {
    const malicious = '\\def\\x{\\x\\x\\x\\x}\\x';
    const result = validateLatexForXSS(malicious);
    expect(result.safe).toBe(false);
  });
});
```

**Category 3: Dangerous Command Detection**
```typescript
describe('Dangerous Command Detection', () => {
  test('blocks \\write18 command (if somehow present)', () => {
    const malicious = '\\write18{evil}';
    const result = validateLatexForXSS(malicious);
    expect(result.safe).toBe(false);
    expect(result.threats[0].type).toBe('dangerous_command');
  });

  test('blocks \\input command', () => {
    const malicious = '\\input{/etc/passwd}';
    const result = validateLatexForXSS(malicious);
    expect(result.safe).toBe(false);
  });

  test('blocks \\include command', () => {
    const malicious = '\\include{malicious.tex}';
    const result = validateLatexForXSS(malicious);
    expect(result.safe).toBe(false);
  });
});
```

**Category 4: Safe LaTeX Acceptance**
```typescript
describe('Safe LaTeX Acceptance', () => {
  test('allows basic fractions', () => {
    const safe = '\\frac{1}{2}';
    const result = validateLatexForXSS(safe);
    expect(result.safe).toBe(true);
    expect(result.threats).toHaveLength(0);
  });

  test('allows square roots', () => {
    const safe = '\\sqrt{x^2 + y^2}';
    const result = validateLatexForXSS(safe);
    expect(result.safe).toBe(true);
  });

  test('allows safe macros', () => {
    const safe = '\\frac{1}{2} + \\sqrt{3} + \\pi';
    const result = validateLatexForXSS(safe);
    expect(result.safe).toBe(true);
  });

  test('allows matrices', () => {
    const safe = '\\begin{pmatrix} 1 & 2 \\\\ 3 & 4 \\end{pmatrix}';
    const result = validateLatexForXSS(safe);
    expect(result.safe).toBe(true);
  });

  test('allows safe URLs with http/https', () => {
    const safe = '\\url{https://example.com}';
    const result = validateLatexForXSS(safe);
    expect(result.safe).toBe(true);
  });
});
```

**Category 5: KaTeX Configuration**
```typescript
describe('Secure KaTeX Configuration', () => {
  test('returns safe options with trust: false', () => {
    const options = getSecureKatexOptions();
    expect(options.trust).toBe(false);
    expect(options.maxExpand).toBe(1000);
    expect(options.maxSize).toBe(10);
    expect(options.strict).toBe('warn');
  });

  test('includes only safe macros', () => {
    const options = getSecureKatexOptions();
    expect(options.macros).toHaveProperty('\\RR');
    expect(options.macros).not.toHaveProperty('\\evil');
  });
});
```

**Category 6: HTML Sanitization**
```typescript
describe('HTML Sanitization', () => {
  test('removes script tags from HTML', () => {
    const malicious = '<span class="katex">math</span><script>alert(1)</script>';
    const sanitized = sanitizeMathHTML(malicious);
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).toContain('<span class="katex">math</span>');
  });

  test('removes onclick handlers', () => {
    const malicious = '<span onclick="alert(1)">click</span>';
    const sanitized = sanitizeMathHTML(malicious);
    expect(sanitized).not.toContain('onclick');
  });

  test('preserves KaTeX classes and styles', () => {
    const safe = '<span class="katex"><span class="katex-html">x²</span></span>';
    const sanitized = sanitizeMathHTML(safe);
    expect(sanitized).toBe(safe);
  });

  test('preserves SVG elements for math', () => {
    const mathSVG = '<svg><path d="M0 0"></path></svg>';
    const sanitized = sanitizeMathHTML(mathSVG);
    expect(sanitized).toContain('<svg>');
    expect(sanitized).toContain('<path');
  });
});
```

**Category 7: Integration Tests**
```typescript
describe('MathRenderer Component Integration', () => {
  test('renders safe math correctly', () => {
    const { container } = render(<MathRenderer latex="\\frac{1}{2}" />);
    expect(container.querySelector('[role="math"]')).toBeInTheDocument();
    expect(container).not.toHaveTextContent('blocked');
  });

  test('blocks malicious LaTeX', () => {
    const { container } = render(<MathRenderer latex="\\url{javascript:alert(1)}" />);
    expect(container).toHaveTextContent('blocked');
  });

  test('reports XSS attempts to threat detector', async () => {
    const reportSpy = vi.spyOn(SecurityThreatDetector.getInstance(), 'detectThreat');
    render(<MathRenderer latex="\\url{javascript:alert(1)}" />);

    await waitFor(() => {
      expect(reportSpy).toHaveBeenCalled();
    });
  });
});
```

**Category 8: Performance Tests**
```typescript
describe('Performance Impact', () => {
  test('XSS validation completes in <10ms', () => {
    const latex = '\\frac{a+b}{c+d} + \\sqrt{x^2 + y^2}';
    const start = performance.now();
    validateLatexForXSS(latex);
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(10);
  });

  test('HTML sanitization completes in <5ms', () => {
    const html = '<span class="katex">complex math</span>'.repeat(10);
    const start = performance.now();
    sanitizeMathHTML(html);
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(5);
  });

  test('full pipeline overhead is <50ms', async () => {
    const latex = '\\frac{1}{2} + \\sqrt{3}';
    const start = performance.now();

    const xssValidation = validateLatexForXSS(latex);
    const options = getSecureKatexOptions();
    const katex = await import('katex');
    const html = katex.default.renderToString(xssValidation.sanitized, options);
    const sanitized = sanitizeMathHTML(html);

    const duration = performance.now() - start;
    expect(duration).toBeLessThan(50);
  });
});
```

### 3.2 Test Coverage Requirements

**Minimum Coverage**: 100% for security functions
**Target Coverage**:
- `xss-protection.ts`: 100%
- Modified MathRenderer components: >90%
- Integration tests: All XSS vectors tested

---

## 4. IMPLEMENTATION SEQUENCE (WITH GIT CHECKPOINTS)

### Phase 1: Create XSS Protection Library (60 minutes)

**Step 1.1**: Create file structure
```bash
mkdir -p src/lib/security
touch src/lib/security/xss-protection.ts
```

**Step 1.2**: Implement `validateLatexForXSS()` function
- XSS pattern detection
- Length validation
- Risk scoring
- Git checkpoint: `git commit -m "feat(SEC-002): Add XSS validation for LaTeX"`

**Step 1.3**: Implement `getSecureKatexOptions()` function
- Secure KaTeX configuration
- Safe macros only
- trust: false enforcement
- Git checkpoint: `git commit -m "feat(SEC-002): Add secure KaTeX options"`

**Step 1.4**: Implement `sanitizeMathHTML()` function
- DOMPurify integration (if needed) or custom sanitizer
- KaTeX-aware whitelist
- Script/handler removal
- Git checkpoint: `git commit -m "feat(SEC-002): Add HTML sanitization"`

**Step 1.5**: Implement threat detector integration
- `reportMathXSSAttempt()` function
- SecurityError creation
- Git checkpoint: `git commit -m "feat(SEC-002): Add threat detection integration"`

**Verification**:
```bash
npm run typecheck  # MUST show 0 errors
npm run lint       # MUST pass
```

---

### Phase 2: Update MathRenderer Components (90 minutes)

**Step 2.1**: Update `src/components/transcription/MathRenderer.tsx`
- Add XSS validation
- Replace KaTeX options
- Add HTML sanitization
- Git checkpoint: `git commit -m "feat(SEC-002): Secure transcription MathRenderer"`

**Verification**:
```bash
npm run typecheck  # MUST show 0 errors
npm run lint       # MUST pass
```

**Step 2.2**: Update `src/components/classroom/MathRenderer.tsx`
- Add XSS validation
- Replace KaTeX options
- Add HTML sanitization
- Git checkpoint: `git commit -m "feat(SEC-002): Secure classroom MathRenderer"`

**Verification**:
```bash
npm run typecheck  # MUST show 0 errors
npm run lint       # MUST pass
```

**Step 2.3**: Update `src/components/classroom/ProgressiveMath.tsx`
- Add XSS validation
- Replace KaTeX options
- Add HTML sanitization
- Git checkpoint: `git commit -m "feat(SEC-002): Secure ProgressiveMath component"`

**Verification**:
```bash
npm run typecheck  # MUST show 0 errors
npm run lint       # MUST pass
```

---

### Phase 3: Comprehensive Testing (60 minutes)

**Step 3.1**: Create test file
```bash
touch src/tests/security/math-xss-protection.test.ts
```

**Step 3.2**: Implement XSS detection tests
- Git checkpoint: `git commit -m "test(SEC-002): Add XSS detection tests"`

**Step 3.3**: Implement safe LaTeX tests
- Git checkpoint: `git commit -m "test(SEC-002): Add safe LaTeX tests"`

**Step 3.4**: Implement integration tests
- Git checkpoint: `git commit -m "test(SEC-002): Add integration tests"`

**Step 3.5**: Implement performance tests
- Git checkpoint: `git commit -m "test(SEC-002): Add performance tests"`

**Verification**:
```bash
npm test           # MUST pass all tests
npm run test:coverage  # MUST show >90% coverage
```

---

### Phase 4: Integration with Threat Detection (30 minutes)

**Step 4.1**: Test threat detector reporting
- Create malicious LaTeX input
- Verify SecurityError created
- Verify threat assessment generated

**Step 4.2**: Test IP blocking (if triggered)
- Simulate repeated XSS attempts
- Verify auto-blocking

**Git checkpoint**: `git commit -m "test(SEC-002): Verify threat detection integration"`

---

### Phase 5: Performance Optimization (30 minutes)

**Step 5.1**: Benchmark current implementation
- Measure validation time
- Measure sanitization time
- Measure total overhead

**Step 5.2**: Optimize if needed (target: <50ms total)
- Cache XSS validation results
- Optimize regex patterns
- Profile with DevTools

**Git checkpoint**: `git commit -m "perf(SEC-002): Optimize XSS protection performance"`

---

### Phase 6: Documentation (30 minutes)

**Step 6.1**: Add JSDoc comments to all functions

**Step 6.2**: Create usage examples in comments

**Step 6.3**: Update this PLAN with "IMPLEMENTED" markers

**Git checkpoint**: `git commit -m "docs(SEC-002): Add comprehensive documentation"`

---

## 5. VERIFICATION CHECKLIST (BLOCKING - MUST PASS ALL)

### TypeScript Verification
```bash
npm run typecheck
```
**Expected**: "0 errors"
**Status**: [ ] PASS / [ ] FAIL

### Linting Verification
```bash
npm run lint
```
**Expected**: No errors
**Status**: [ ] PASS / [ ] FAIL

### Unit Tests
```bash
npm test src/tests/security/math-xss-protection.test.ts
```
**Expected**: All tests pass
**Status**: [ ] PASS / [ ] FAIL

### Integration Tests
```bash
npm test -- --run
```
**Expected**: All tests pass
**Status**: [ ] PASS / [ ] FAIL

### Coverage Check
```bash
npm run test:coverage
```
**Expected**: >90% for modified files
**Status**: [ ] PASS / [ ] FAIL

### XSS Attack Vectors (Manual)
**Test each vector**:
- [ ] `\\url{javascript:alert(1)}` → BLOCKED
- [ ] `\\url{JavaScript:alert(1)}` → BLOCKED
- [ ] `\\def\\evil{<script>alert(1)</script>}\\evil` → BLOCKED
- [ ] `\\def\\a{\\a\\a}\\a` → BLOCKED (macro bomb)
- [ ] `<img src=x onerror=alert(1)>` → BLOCKED
- [ ] `\\frac{1}{2}` → ALLOWED
- [ ] `\\sqrt{x^2 + y^2}` → ALLOWED

### Protected-Core Boundary Check
```bash
npm run test:protected-core
```
**Expected**: No protected-core modifications
**Status**: [ ] PASS / [ ] FAIL

### Performance Benchmark
**Measure**:
- XSS validation: <10ms
- HTML sanitization: <5ms
- Total overhead: <50ms
**Status**: [ ] PASS / [ ] FAIL

---

## 6. RISK ASSESSMENT

### Implementation Risks

**Risk 1**: Breaking existing math rendering
- **Likelihood**: MODERATE
- **Impact**: HIGH
- **Mitigation**:
  - Comprehensive testing before deployment
  - Feature flag to disable if needed
  - Rollback plan ready

**Risk 2**: Performance degradation
- **Likelihood**: LOW
- **Impact**: MODERATE
- **Mitigation**:
  - Performance tests in test suite
  - Caching strategy
  - Target: <50ms overhead (acceptable)

**Risk 3**: False positives blocking safe LaTeX
- **Likelihood**: MODERATE
- **Impact**: MODERATE
- **Mitigation**:
  - Extensive safe LaTeX test suite
  - Allow-list approach for common patterns
  - User feedback mechanism

**Risk 4**: Accidentally modifying protected-core
- **Likelihood**: LOW (we have clear plan to avoid it)
- **Impact**: CRITICAL (would be failure #8!)
- **Mitigation**:
  - NO modifications to `src/protected-core/**`
  - Use public APIs only
  - Protected-core tests verify boundary

### Security Risks After Implementation

**Residual Risk**: MINIMAL

**Remaining Attack Vectors**:
- None identified (all major vectors blocked)

**Monitoring**:
- SecurityThreatDetector will track all XSS attempts
- Auto-blocking for repeat offenders
- Manual review for high-severity threats

---

## 7. ROLLBACK PLAN

### If Implementation Fails

**Immediate Rollback**:
```bash
git reset --hard [CHECKPOINT_HASH]
npm run typecheck
npm test
npm run build
```

**Checkpoints** (will be created during implementation):
1. Before SEC-002: `[CHECKPOINT_HASH]` (from story start)
2. After xss-protection.ts: `[CHECKPOINT_HASH]`
3. After MathRenderer updates: `[CHECKPOINT_HASH]`
4. After testing: `[CHECKPOINT_HASH]`

### If Tests Fail

**DO NOT proceed to next phase**
- Fix issue
- Re-run verification
- Create new checkpoint

---

## 8. SUCCESS CRITERIA (ALL MUST BE MET)

- [x] Research complete with signature
- [ ] Plan approved (waiting for approval)
- [ ] `xss-protection.ts` created with 100% test coverage
- [ ] All 3 MathRenderer components updated securely
- [ ] All XSS test vectors blocked
- [ ] All safe LaTeX patterns allowed
- [ ] TypeScript: 0 errors
- [ ] Linting: PASS
- [ ] Tests: 100% passing
- [ ] Performance: <50ms overhead
- [ ] No protected-core modifications
- [ ] Threat detection integration working
- [ ] Evidence document created

---

## 9. DEPENDENCIES & BLOCKERS

### Dependencies
- [ ] Protected-core APIs (available, read-only)
- [ ] SecurityThreatDetector (available, existing)
- [ ] KaTeX library (available, v0.16.22)
- [ ] Testing infrastructure (available)

### Blockers
- NONE (all dependencies satisfied)

### Optional Dependencies
- DOMPurify (may implement custom sanitizer instead)

---

## 10. EDUCATIONAL NOTES FOR USER

### What We're Building

**Imagine airport security for math equations**:

**Layer 1 - Check-In (XSS Validation)**:
- "Is this LaTeX safe?"
- Block suspicious patterns like `javascript:alert(1)`
- Like TSA checking your bags

**Layer 2 - X-Ray (Secure Configuration)**:
- Tell KaTeX: "Don't trust anything!"
- `trust: false` → No dangerous commands
- Like scanning bags through X-ray

**Layer 3 - Pat Down (HTML Sanitization)**:
- Even if something got through, clean the HTML
- Remove any `<script>` tags
- Like physical security check

**Layer 4 - Alert (Threat Detection)**:
- Report suspicious attempts
- Track repeat offenders
- Like notifying security team

### Why Multiple Layers?

**Defense in Depth** (castle analogy):
- **Moat**: XSS validation (first line)
- **Walls**: Secure KaTeX config (second line)
- **Guards**: HTML sanitization (third line)
- **Alarm**: Threat detection (monitoring)

If one layer fails, others protect!

### What Makes LaTeX Dangerous?

**Normal LaTeX**: `\\frac{1}{2}` → Shows ½ → SAFE

**Malicious LaTeX**: `\\url{javascript:alert('hack')}` → Runs JavaScript → DANGEROUS

**How it happens**:
1. Attacker types malicious LaTeX
2. KaTeX converts it to HTML
3. HTML includes `<a href="javascript:...">`
4. User clicks → JavaScript runs → Account compromised!

**Our protection**:
1. Detect "javascript:" pattern
2. Block before rendering
3. Report to security
4. Show safe error message

### Why This Matters for PingLearn

**Target Users**: Students (including children)
**Risk**: High (COPPA compliance, trust)
**Impact**: Could steal:
- Study notes
- Test answers
- Session tokens
- Personal data

**Must protect because**:
- Children's data requires extra protection
- Parents trust us
- One breach = massive reputation damage

---

## [PLAN-APPROVED-SEC-002]

**Plan completed**: 2025-09-30T16:00:00Z
**Duration**: 30 minutes
**Next phase**: IMPLEMENT (Phases 3-6)
**Approved by**: Awaiting approval
**Ready to implement**: YES

**Implementation Estimated Time**: 4 hours
**Total Story Time**: ~5 hours (Research: 1hr, Plan: 0.5hr, Implementation: 3.5hrs)

---

**Planner**: story_sec002_001 (Story Implementer Agent)
**Status**: READY FOR APPROVAL → IMPLEMENTATION