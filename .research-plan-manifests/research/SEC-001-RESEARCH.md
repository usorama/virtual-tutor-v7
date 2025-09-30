# SEC-001 Research Document: Input Sanitization for Transcription Components

**Story ID**: SEC-001
**Research Phase**: COMPLETE
**Date**: 2025-09-30
**Agent**: story_sec001_001
**Duration**: 90 minutes

---

## 1. CODEBASE ANALYSIS

### Current State Assessment

#### Existing Files Analyzed:
1. **`src/components/transcription/TranscriptionDisplay.tsx`** (474 lines)
   - **Current State**: Production component displaying transcribed content
   - **Security Concern**: Renders user content directly without sanitization
   - **Use of `dangerouslySetInnerHTML`**: NO (safe)
   - **Vulnerabilities**:
     - Raw content rendering in `renderContent()` function (lines 363-407)
     - Direct display of `item.content` without sanitization
     - No input validation on display items

2. **`src/components/transcription/MathRenderer.tsx`** (324 lines)
   - **Current State**: Renders LaTeX math using KaTeX library
   - **Security Concern**: Uses `dangerouslySetInnerHTML` for math rendering (line 144)
   - **Vulnerabilities**:
     - KaTeX-generated HTML injected directly into DOM
     - No sanitization of LaTeX input before rendering
     - Cache system stores unsanitized content (lines 13-25)
   - **Risk Level**: HIGH - Math input from AI/user could contain XSS

3. **`src/components/transcription/TranscriptionInput.tsx`**
   - **Current State**: **FILE DOES NOT EXIST**
   - **Action Required**: Create from scratch with security-first design

#### Existing Security Infrastructure:
1. **`src/lib/security/threat-detector.ts`** (873 lines)
   - Comprehensive threat detection system
   - Includes XSS detection patterns
   - SecurityErrorCode includes `XSS_ATTEMPT`
   - Ready for integration

2. **`src/tests/security/security-test-framework.ts`** (847 lines)
   - Complete security testing framework
   - Mock security threat detector available
   - Can be used for validation

3. **`src/lib/security/security-error-types.ts`**
   - Defines security error codes including XSS
   - ThreatAssessment types available
   - SecurityMetadata structure defined

#### Files Using `dangerouslySetInnerHTML`:
```
✓ src/components/transcription/MathRenderer.tsx (line 144) - NEEDS SANITIZATION
✓ src/components/classroom/ProgressiveMath.tsx - NEEDS REVIEW
✓ src/components/classroom/MessageBubble.tsx - NEEDS REVIEW
✓ src/components/classroom/TeachingBoardSimple.tsx - NEEDS REVIEW
✓ src/components/classroom/MathRenderer.tsx - NEEDS REVIEW
✓ src/app/layout.tsx - NEEDS REVIEW
```

**NOTE**: SEC-002 story is handling math rendering XSS protection (files locked by story_sec002_001)

---

## 2. CONTEXT7 RESEARCH

### DOMPurify Library

#### Installation Status:
- **Already installed**: `dompurify@3.2.7` (via mermaid dependency)
- **Location**: `node_modules/dompurify`
- **No additional installation required**

#### TypeScript Support:
```bash
# Need to install TypeScript types
npm install --save-dev @types/dompurify
```

#### Library Selection Rationale:
**DOMPurify** is the clear winner for our use case:

1. **OWASP Recommended**: Official OWASP recommendation for HTML sanitization
2. **Performance**: Optimized for real-time applications (< 5ms typical)
3. **Framework Agnostic**: Works perfectly with React
4. **MathML Support**: Handles mathematical content (important for our use case!)
5. **Configurable**: Extensive hooks and config options
6. **Actively Maintained**: Latest version 3.2.7 (January 2025)
7. **Zero Dependencies**: Lightweight footprint

vs. **sanitize-html**:
- More configuration overhead
- Server-side focused
- Not MathML-aware
- Larger bundle size

---

## 3. WEB SEARCH RESEARCH

### XSS Prevention Best Practices (2025)

#### Key Findings from OWASP:

1. **Defense in Depth**:
   - Sanitize on both client AND server
   - Never trust any input source (AI, user, external APIs)
   - Use allowlist validation over blocklist

2. **React-Specific Risks**:
   - `dangerouslySetInnerHTML` bypasses React's built-in escaping
   - URL props with `javascript:` scheme are attack vectors
   - Third-party components may introduce vulnerabilities

3. **OWASP Top Recommendations**:
   ```
   Priority 1: Use DOMPurify for all HTML sanitization
   Priority 2: Validate URLs before rendering (http/https only)
   Priority 3: Implement Content Security Policy (CSP)
   Priority 4: Sanitize at rendering time, not at input time
   Priority 5: Keep dependencies updated
   ```

#### Real-Time Application Considerations:

From DOMPurify documentation:
- **Don't sanitize every keystroke** - Performance killer
- **Sanitize at submission or before display** - Best balance
- **Batch updates in collaborative apps** - Debounce frequent changes
- **Cache sanitized content** - Avoid redundant processing

#### 2025 Security Context:

> "Attackers in 2025 have quietly evolved their injection techniques to exploit everything from prototype pollution to AI-generated code, bypassing frameworks designed to keep applications secure."

**Critical for PingLearn**: Our AI teacher generates content dynamically - we MUST sanitize AI output!

---

## 4. VULNERABILITY ANALYSIS

### Current Vulnerabilities in PingLearn:

#### High Risk:
1. **TranscriptionDisplay.tsx** (Lines 363-407):
   ```typescript
   case 'text':
     return (
       <div className="text-sm leading-relaxed">
         {item.content}  // ❌ NO SANITIZATION
       </div>
     );
   ```
   **Attack Vector**: AI teacher could generate `<script>alert('XSS')</script>`
   **Impact**: Immediate code execution in student's browser

2. **MathRenderer.tsx** (Line 144):
   ```typescript
   dangerouslySetInnerHTML={{ __html: mathHtml }}  // ❌ KaTeX output not verified
   ```
   **Attack Vector**: Malicious LaTeX could exploit KaTeX parser vulnerabilities
   **Impact**: DOM-based XSS

#### Medium Risk:
3. **Missing Input Component**:
   - No TranscriptionInput.tsx exists
   - No validation on incoming transcription data
   - No rate limiting on transcription submissions

#### Low Risk:
4. **URL rendering** in transcription items
   - No validation of URLs in content
   - Could allow `javascript:` protocol injection

---

## 5. SECURITY REQUIREMENTS

### Based on OWASP + PingLearn Context:

1. **Input Sanitization**:
   - ✅ Use DOMPurify for all HTML content
   - ✅ Sanitize at rendering time (not input time)
   - ✅ Allowlist HTML tags (only safe formatting tags)
   - ✅ Strip all `<script>`, `<iframe>`, `<object>`, `<embed>` tags
   - ✅ Validate URLs (http/https only, no javascript:)

2. **Configuration**:
   ```typescript
   const sanitizeConfig = {
     ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'span', 'div'],
     ALLOWED_ATTR: ['class', 'id'],
     KEEP_CONTENT: true,
     ALLOW_DATA_ATTR: false,
     RETURN_DOM: false,
     RETURN_DOM_FRAGMENT: false,
     RETURN_DOM_IMPORT: false
   };
   ```

3. **Performance Targets**:
   - Sanitization overhead: < 5ms per item
   - No impact on real-time transcription display
   - Cache sanitized results when possible

4. **Integration Points**:
   - Hook into existing error monitoring (ERR-006)
   - Use SecurityThreatDetector for XSS attempts
   - Log sanitization events for audit

---

## 6. IMPLEMENTATION STRATEGY

### Approach: **Render-Time Sanitization**

#### Why NOT input-time sanitization?
- Consensus from research: "Absolutely do not sanitize onSubmit"
- Reasoning: Allows malicious actors to test payloads
- Better: Sanitize at rendering, log attempts for threat detection

#### Where to Sanitize:

```
AI Output → Display Buffer → TranscriptionDisplay (SANITIZE HERE) → Render
                                            ↓
                                    SecurityThreatDetector
```

### Library Architecture:

```typescript
src/lib/security/
  ├── input-sanitization.ts         // Core sanitization logic
  │   ├── sanitizeText()           // Plain text sanitization
  │   ├── sanitizeHtml()           // HTML sanitization with DOMPurify
  │   ├── validateUrl()            // URL validation
  │   └── detectXssAttempt()       // XSS pattern detection
  │
  └── sanitization.test.ts          // Comprehensive security tests
```

### Component Integration:

1. **TranscriptionDisplay.tsx**:
   - Import sanitization utilities
   - Wrap `renderContent()` with sanitization
   - Add XSS detection logging

2. **TranscriptionInput.tsx** (NEW):
   - Create secure input component
   - Add rate limiting
   - Validate input length and format
   - Integrate with threat detection

---

## 7. TEST STRATEGY

### Test Categories:

1. **XSS Attack Vectors** (from OWASP):
   ```javascript
   '<script>alert("XSS")</script>'
   '<img src=x onerror=alert("XSS")>'
   '<iframe src="javascript:alert(\'XSS\')"></iframe>'
   '<svg onload=alert("XSS")>'
   '<body onload=alert("XSS")>'
   '<input onfocus=alert("XSS") autofocus>'
   'javascript:alert("XSS")'
   '<a href="javascript:alert(\'XSS\')">Click</a>'
   ```

2. **Edge Cases**:
   - Null/undefined input
   - Empty strings
   - Very long strings (DOS attack)
   - Unicode characters
   - Mixed content (text + HTML)

3. **Performance Tests**:
   - Sanitization speed < 5ms
   - Memory usage (cache efficiency)
   - Concurrent sanitization requests

4. **Integration Tests**:
   - Works with MathRenderer
   - Works with DisplayBuffer
   - Triggers SecurityThreatDetector on XSS attempts

---

## 8. RISKS AND MITIGATION

### Identified Risks:

1. **Performance Impact**:
   - **Risk**: Sanitization slows down real-time display
   - **Mitigation**: Cache sanitized results, benchmark < 5ms
   - **Severity**: LOW

2. **False Positives**:
   - **Risk**: Legitimate content flagged as XSS
   - **Mitigation**: Carefully tune sanitization config
   - **Severity**: MEDIUM

3. **KaTeX Bypass**:
   - **Risk**: Malicious LaTeX could exploit KaTeX parser
   - **Mitigation**: Sanitize KaTeX output (SEC-002 story)
   - **Severity**: HIGH (handled by SEC-002)

4. **Breaking Existing Content**:
   - **Risk**: Over-aggressive sanitization breaks display
   - **Mitigation**: Comprehensive testing, gradual rollout
   - **Severity**: MEDIUM

---

## 9. INTEGRATION POINTS

### Existing Systems to Integrate:

1. **Error Monitoring System** (ERR-006):
   - Use `ErrorTracker` to log XSS attempts
   - Use `ErrorEnricher` to add context
   - Use `RecoveryManager` for graceful fallback

2. **Security Threat Detector**:
   - Trigger `SecurityErrorCode.XSS_ATTEMPT` on detection
   - Use `ThreatAssessment` for risk scoring
   - Auto-block repeat offenders

3. **Display Buffer** (Protected Core):
   - Read-only access via public API
   - No modification to protected core
   - Use getItems() for display data

4. **Testing Infrastructure** (TEST-001 to TEST-004):
   - Use existing test framework
   - Leverage security test scenarios
   - Integrate with protected-core test suite

---

## 10. SUCCESS CRITERIA

### Definition of Done:

✅ **Functional**:
- [ ] All transcription content sanitized before rendering
- [ ] XSS attack vectors blocked (100% of OWASP test cases)
- [ ] TranscriptionInput.tsx component created with validation
- [ ] URL validation prevents javascript: protocol

✅ **Performance**:
- [ ] Sanitization overhead < 5ms per item
- [ ] No impact on transcription real-time display
- [ ] Cache hit rate > 80% for repeated content

✅ **Quality**:
- [ ] 0 TypeScript errors
- [ ] All tests passing (unit + integration)
- [ ] >80% code coverage for new code
- [ ] No protected-core violations

✅ **Security**:
- [ ] XSS attempts logged to SecurityThreatDetector
- [ ] Integration with error monitoring (ERR-006)
- [ ] Security test suite passing (TEST-003)

✅ **Documentation**:
- [ ] Code comments explaining sanitization approach
- [ ] Evidence document created
- [ ] Integration guide for other components

---

## 11. DEPENDENCY ANALYSIS

### Required Before Implementation:

✅ **No Blocking Dependencies**:
- DOMPurify already installed
- Security infrastructure exists (ERR-006, TEST-003)
- Display components exist and functional

### Required During Implementation:

1. **Install TypeScript types**:
   ```bash
   npm install --save-dev @types/dompurify
   ```

2. **No breaking changes to protected-core**

3. **Coordinate with SEC-002** (Math XSS protection):
   - Avoid duplicate sanitization
   - Share sanitization utilities
   - Consistent error handling

---

## 12. RESEARCH COMPLETION CHECKLIST

- [x] Codebase analysis complete
- [x] Context7 research complete (DOMPurify)
- [x] Web search research complete (OWASP + 2025 best practices)
- [x] Current vulnerabilities identified
- [x] Security requirements defined
- [x] Implementation strategy decided
- [x] Test strategy created
- [x] Risks identified with mitigations
- [x] Integration points mapped
- [x] Success criteria defined
- [x] Dependencies analyzed

---

## RESEARCH SIGNATURES

**[RESEARCH-COMPLETE-SEC-001]**

**Research Quality**: COMPREHENSIVE
**Confidence Level**: HIGH
**Ready for Planning Phase**: YES

---

**Next Step**: Proceed to PHASE 2 - Create detailed implementation plan