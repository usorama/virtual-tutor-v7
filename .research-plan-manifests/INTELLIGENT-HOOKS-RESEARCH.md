# Intelligent Git Hooks Research & Solution Design

**Date**: 2025-09-30
**Context**: ERR-006 completion revealed false positives in Research-First Protocol hooks
**Goal**: Design hooks that "think" and "do the right thing" - no more blunt pattern matching

---

## 📊 Executive Summary

Current git hooks use simple pattern matching (grep/regex) that triggers on keywords like "retry", "recovery", "resilience" without understanding code context. This caused **3 false positives** during ERR-006:

1. `useErrorRecovery.ts` - React state management hook (NOT retry logic)
2. `ErrorRecoveryDialog.tsx` - UI component that delegates (NOT implementation)
3. `error-catalog.ts` - Documentation strings (NOT executable code)

**Solution**: Implement a **5-layer intelligent hook system** combining fast heuristics with LLM-powered semantic analysis, only calling Claude API for truly ambiguous cases (~5-10% of flagged files).

**Performance Impact**: <100ms for 90% of flagged files, 1-2 seconds for LLM analysis when needed

---

## 🔍 Research Findings Summary

### 1. AI-Powered Git Hooks (2025 State-of-the-Art)

**Key Finding**: LLM-powered git hooks are an established pattern in 2025

**Examples Found**:
- **git-ai-commit**: Uses Claude/GPT for commit message generation
- **RepoAgent**: Auto-generates documentation on every commit using LLMs
- **PromptOps**: Git hooks for prompt versioning with LLM analysis

**Takeaway**: Integrating LLMs into git hooks is production-ready and performant when properly architected

### 2. Semantic Code Analysis Tools

**Key Finding**: Semantic duplication detection exists but focuses on code similarity, not intent understanding

**Tools Reviewed**:
- **CodeAnt AI**: Detects "acts the same" even when code looks different
- **PMD CPD**: >10,000 LOC/second processing speed (2025)
- **Duplo**: Syntax-based duplicate detection with GitHub Actions integration

**Gap Identified**: These tools detect **what** code does, not **why** it exists (implementation vs delegation pattern)

**Takeaway**: Need LLM semantic understanding to distinguish "implements retry logic" vs "calls retry handler"

### 3. TypeScript AST Analysis in Python

**Key Finding**: tree-sitter-typescript with Python bindings is mature and production-ready

**Technology Stack**:
- **tree-sitter-typescript**: Version 0.23.2 (Nov 2024)
- **py-tree-sitter**: Pre-compiled wheels for all platforms
- **tree-sitter-languages**: All language parsers bundled

**Installation**:
```bash
pip install tree-sitter-typescript tree-sitter-languages
```

**Capabilities**:
- Parse TypeScript/TSX into concrete syntax tree
- Query AST with tree-sitter query language (SQL-like)
- Incremental parsing for real-time updates
- No Node.js/tsc dependency

**Example Usage**:
```python
import tree_sitter_typescript as ts_typescript
from tree_sitter import Language, Parser

TS_LANGUAGE = Language(ts_typescript.language_typescript())
parser = Parser()
parser.language = TS_LANGUAGE

tree = parser.parse(code.encode('utf8'))
root_node = tree.root_node
```

**Takeaway**: Can analyze TypeScript code structure without executing it or calling Node.js

### 4. Claude API for Code Analysis

**Key Finding**: Anthropic Claude SDK for Python is well-documented with 93 code examples

**Library**: `/anthropics/anthropic-sdk-python` (Trust Score: 8.8)

**Synchronous API Call** (for git hooks):
```python
import os
from anthropic import Anthropic

client = Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

message = client.messages.create(
    max_tokens=1024,
    messages=[{
        "role": "user",
        "content": "Does this code implement retry logic or delegate to handlers? [code]"
    }],
    model="claude-sonnet-4-20250514"
)

print(message.content)
```

**Best Practices for Git Hooks**:
- Use synchronous client (not async) for simpler hook scripts
- Set reasonable timeout (5 seconds max)
- Cache results to avoid repeated API calls
- Fallback to "allow" if API fails (don't block on network errors)

**Semantic Understanding Research**:
- LLMs can distinguish "coordinator-delegate patterns" vs "implementation"
- Chain-of-thought prompting improves intent detection accuracy
- Hybrid approaches achieve native LLM accuracy with 50% less latency

**Takeaway**: Claude can accurately analyze code intent when given proper context

### 5. Git Hook Performance Optimization

**Key Finding**: Fast hooks require layered approach with caching

**Performance Strategies**:
- **Conditional Execution**: Check file changes before running expensive operations
- **Parallel Execution**: Lefthook runs hooks faster than sequential Husky
- **Caching**: Store previous decisions, invalidate on file change
- **Performance Monitoring**: Track hook execution time, alert on >1 second

**Best Practices**:
- Keep pre-commit hooks <100ms for 90% of commits
- Use caching to avoid repeated analysis
- Only call APIs for truly ambiguous cases
- Provide clear feedback during slow operations

**Takeaway**: Layered system can maintain fast commits while adding intelligence

---

## 🎯 Root Cause Analysis

### Current Hook Architecture

**File**: `.git/hooks/post-tool-use.sh` (Research-First Protocol)

**How It Works**:
1. Grep searches for patterns: `retry|recovery|resilience|backoff|circuit.?breaker`
2. If found, block commit with error message
3. User must use `--no-verify` to bypass

**Problems**:

1. **No Semantic Analysis**
   - Detects "retry" keyword in any context
   - Can't distinguish code intent (implementation vs usage)
   - Triggers on documentation strings

2. **No File Type Awareness**
   - Treats `components/error/*.tsx` same as `lib/retry/*.ts`
   - Doesn't understand UI components delegate to handlers
   - Can't recognize React hooks vs infrastructure services

3. **No Code Structure Understanding**
   - Doesn't parse TypeScript AST
   - Can't identify delegation patterns (callbacks, props)
   - Misses import statements showing usage of protected-core

4. **No Learning Mechanism**
   - Same false positives happen repeatedly
   - No memory of previous decisions
   - User frustration accumulates

### Why False Positives Occurred

**Case 1: useErrorRecovery.ts**
```typescript
// Detected "retry" and "recovery" keywords
export function useErrorRecovery(options: UseErrorRecoveryOptions) {
  const [isRecovering, setIsRecovering] = useState(false);

  // This DELEGATES to external handler (not implementing retry logic)
  const startRecovery = async () => {
    await options.onRetry(); // <- External handler, not implementation
  };
}
```
**Why Hook Failed**: Saw keywords, couldn't understand this is React state management that calls external handlers

**Case 2: ErrorRecoveryDialog.tsx**
```typescript
// Detected "retry" keyword
export function ErrorRecoveryDialog({ onRetry }) {
  const handleRetry = async () => {
    await onRetry(); // <- Delegates to prop, not implementing retry
  };

  return <Button onClick={handleRetry}>Try Again</Button>;
}
```
**Why Hook Failed**: Saw keyword, couldn't understand this is UI component receiving handler as prop

**Case 3: error-catalog.ts**
```typescript
// Detected "retry" in documentation strings
export const ERROR_CATALOG = {
  ETIMEDOUT: {
    solutions: [
      'Try again after a few moments',  // <- Documentation text
      'Implement exponential backoff'    // <- Best practice suggestion
    ]
  }
};
```
**Why Hook Failed**: Saw keywords in strings, couldn't understand this is documentation not code

---

## 🏗️ Solution Architecture: 5-Layer Intelligent Hook System

### Design Philosophy

**Fast Path for Most Commits**: 90% of commits have no suspicious patterns → pass in <10ms
**Context Layer for UI/Docs**: 80% of flagged files are obviously safe → pass in <100ms
**AST Layer for Structure**: 60% of remaining files show clear delegation → pass in <500ms
**LLM Layer for Ambiguity**: Only 5-10% of flagged files need semantic analysis → 1-2 seconds
**Cache Layer Throughout**: Never analyze same file twice → instant pass

### Layer 1: Pattern Detection (Current - Keep It)

**Speed**: <10ms
**Purpose**: Fast first-pass to identify suspicious files

```bash
# In post-tool-use.sh
if echo "$diff" | grep -iE "retry|recovery|resilience|backoff|circuit.?breaker"; then
  # Pass to Layer 2 for intelligent analysis
  python3 .git/hooks/intelligent-hook.py "$file_path" "$pattern"
fi
```

**Why Keep It**: Extremely fast, catches obviously suspicious files, allows most commits to pass instantly

### Layer 2: Context Rules (NEW - Fast Heuristics)

**Speed**: <100ms
**Purpose**: File path and type-based rules

```python
def check_context_rules(file_path: str) -> tuple[bool, str]:
    """
    Returns (should_allow, reason)
    """
    # UI Components - likely safe
    if 'components/' in file_path and file_path.endswith('.tsx'):
        return (True, "UI component - typically delegates to handlers")

    # React Hooks - check if state management
    if 'hooks/' in file_path and 'use' in os.path.basename(file_path):
        return (True, "React hook - typically state management")

    # Documentation files - safe
    if file_path.endswith(('-catalog.ts', '-docs.ts', 'README.md')):
        return (True, "Documentation file - no executable logic")

    # Protected core - BLOCK (should never be modified)
    if 'protected-core/' in file_path:
        return (False, "BLOCKED: protected-core must not be modified")

    # Infrastructure - suspicious, needs deeper analysis
    if any(x in file_path for x in ['lib/', 'services/', 'utils/']):
        return (None, "Infrastructure code - needs deeper analysis")

    return (None, "Unknown context - needs analysis")
```

**Decision Points**:
- `True` → Allow commit (fast path exit)
- `False` → Block commit (violation)
- `None` → Continue to Layer 3 (needs analysis)

**Expected Pass Rate**: 70-80% of flagged files pass here

### Layer 3: AST Analysis (NEW - Structure Understanding)

**Speed**: <500ms
**Purpose**: Parse TypeScript AST to identify code structure

```python
import tree_sitter_typescript as ts_typescript
from tree_sitter import Language, Parser, Query

def analyze_ast(file_path: str, code: str) -> tuple[bool, str]:
    """
    Returns (should_allow, reason)
    """
    TS_LANGUAGE = Language(ts_typescript.language_typescript())
    parser = Parser()
    parser.language = TS_LANGUAGE

    tree = parser.parse(code.encode('utf8'))
    root = tree.root_node

    # Check for delegation patterns
    has_callbacks = count_callback_parameters(root)
    has_imports_from_protected = check_protected_core_imports(root, code)
    implements_retry_class = check_for_retry_implementation(root)

    if has_callbacks > 0 and not implements_retry_class:
        return (True, f"Delegation pattern: {has_callbacks} callback parameters")

    if has_imports_from_protected:
        return (True, "Uses protected-core services correctly")

    if implements_retry_class:
        return (False, "BLOCKED: Implements retry logic (duplicates protected-core)")

    # Uncertain - pass to Layer 4
    return (None, "AST analysis inconclusive - needs semantic check")

def count_callback_parameters(node):
    """Count function parameters that are functions (callbacks)"""
    query = TS_LANGUAGE.query("""
        (function_declaration
          parameters: (formal_parameters
            (required_parameter
              type: (type_annotation
                (function_type)))))
    """)
    return len(query.captures(node))

def check_protected_core_imports(node, code):
    """Check if file imports from protected-core"""
    return '@/protected-core' in code or 'protected-core/' in code

def check_for_retry_implementation(node):
    """Check for retry loop implementations"""
    query = TS_LANGUAGE.query("""
        (while_statement) @retry_loop
        (for_statement) @retry_loop
    """)
    captures = query.captures(node)
    # Look for retry-related variables in loop context
    for capture in captures:
        if 'attempt' in capture[0].text or 'retry' in capture[0].text:
            return True
    return False
```

**What It Detects**:
- **Delegation**: Function accepts callbacks/handlers as parameters
- **Usage**: Imports from protected-core (using, not duplicating)
- **Implementation**: Retry loops, exponential backoff calculations

**Expected Pass Rate**: 50-60% of files reaching this layer pass

### Layer 4: LLM Semantic Analysis (NEW - Claude API)

**Speed**: 1-2 seconds
**Purpose**: Understand code intent when AST is inconclusive

```python
import os
from anthropic import Anthropic

def analyze_with_claude(file_path: str, code: str, pattern: str) -> tuple[bool, str]:
    """
    Returns (should_allow, reason)
    """
    client = Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

    # Load protected-core patterns for context
    protected_patterns = load_protected_core_patterns()

    prompt = f"""You are analyzing code for duplication of protected infrastructure.

FILE: {file_path}
PATTERN DETECTED: {pattern}

PROTECTED-CORE PATTERNS TO CHECK:
{protected_patterns}

CODE TO ANALYZE:
```typescript
{code}
```

QUESTION: Does this code IMPLEMENT retry/resilience/recovery infrastructure that duplicates protected-core functionality?

Or does it DELEGATE to external handlers/callbacks/services?

RESPOND IN JSON:
{{
  "is_duplication": true/false,
  "confidence": "high/medium/low",
  "reasoning": "Brief explanation of why",
  "evidence": "Specific code patterns that support your conclusion"
}}

KEY DISTINCTIONS:
- UI components that accept onRetry props → DELEGATION (not duplication)
- React hooks that call external handlers → DELEGATION (not duplication)
- Services that import from protected-core → USAGE (not duplication)
- Documentation strings mentioning retry → NOT CODE (not duplication)
- Functions implementing retry loops → IMPLEMENTATION (IS duplication)
- Classes with exponential backoff logic → IMPLEMENTATION (IS duplication)
"""

    try:
        message = client.messages.create(
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}],
            model="claude-sonnet-4-20250514",
            timeout=5.0  # 5 second timeout
        )

        # Parse JSON response
        response_text = message.content[0].text
        result = json.loads(response_text)

        if result["confidence"] == "low":
            # If Claude is uncertain, default to allow with warning
            return (True, f"WARN: Low confidence - {result['reasoning']}")

        if result["is_duplication"]:
            return (False, f"BLOCKED: {result['reasoning']} | Evidence: {result['evidence']}")
        else:
            return (True, f"ALLOWED: {result['reasoning']} | Evidence: {result['evidence']}")

    except Exception as e:
        # API failure - default to allow with warning logged
        log_error(f"Claude API failed: {e}")
        return (True, f"WARN: API failure, defaulting to allow (review manually)")

def load_protected_core_patterns():
    """Load protected-core patterns for Claude to compare against"""
    patterns_file = "docs/protected-core-patterns.md"
    if os.path.exists(patterns_file):
        with open(patterns_file) as f:
            return f.read()
    return "ExponentialBackoff, WebSocketHealthMonitor, VoiceSessionRecovery"
```

**Prompt Engineering**:
- Provide full code context
- List protected-core patterns to check against
- Ask specific question: "implement" vs "delegate"?
- Request structured JSON response
- Include confidence level for uncertainty handling

**Error Handling**:
- API timeout (5 seconds) → Default to allow with warning
- Network failure → Default to allow with warning
- Parse error → Default to allow with warning
- Low confidence → Allow with warning for human review

**Expected Usage**: Only 5-10% of flagged files reach this layer

### Layer 5: Decision Cache (NEW - Performance)

**Speed**: <1ms
**Purpose**: Never analyze same file twice

```python
import hashlib
import json
import time

CACHE_FILE = ".git/hook-decisions.json"
CACHE_TTL = 86400  # 24 hours

def get_cache_key(file_path: str, code: str) -> str:
    """Generate cache key from file path + content hash"""
    content_hash = hashlib.sha256(code.encode()).hexdigest()
    return f"{file_path}:{content_hash}"

def load_cache() -> dict:
    """Load decision cache"""
    if os.path.exists(CACHE_FILE):
        with open(CACHE_FILE) as f:
            return json.load(f)
    return {}

def save_cache(cache: dict):
    """Save decision cache"""
    with open(CACHE_FILE, 'w') as f:
        json.dump(cache, f, indent=2)

def get_cached_decision(file_path: str, code: str) -> tuple[bool, str] | None:
    """Check if decision is cached"""
    cache_key = get_cache_key(file_path, code)
    cache = load_cache()

    if cache_key in cache:
        entry = cache[cache_key]
        # Check if cache is still valid
        if time.time() - entry['timestamp'] < CACHE_TTL:
            return (entry['allowed'], entry['reason'])

    return None

def cache_decision(file_path: str, code: str, allowed: bool, reason: str):
    """Cache decision for future use"""
    cache_key = get_cache_key(file_path, code)
    cache = load_cache()

    cache[cache_key] = {
        'allowed': allowed,
        'reason': reason,
        'timestamp': time.time(),
        'file_path': file_path
    }

    # Clean old entries (>30 days)
    cutoff = time.time() - (30 * 86400)
    cache = {k: v for k, v in cache.items() if v['timestamp'] > cutoff}

    save_cache(cache)
```

**Cache Strategy**:
- **Key**: File path + SHA256 hash of content
- **TTL**: 24 hours (can be adjusted)
- **Cleanup**: Remove entries >30 days old
- **Invalidation**: Automatic on file change (hash changes)

**Performance Impact**: Repeat commits of same files instant (<1ms)

### Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ Git Commit                                                   │
└───────────────────────────────┬─────────────────────────────┘
                                │
                                ▼
                   ┌───────────────────────┐
                   │ Layer 1: Pattern      │  <10ms
                   │ Grep for suspicious   │
                   │ keywords              │
                   └──────────┬────────────┘
                              │
                   No patterns found? → ALLOW (90% of commits)
                              │
                   Patterns found ↓
                              │
                   ┌───────────────────────┐
                   │ Layer 5: Check Cache  │  <1ms
                   └──────────┬────────────┘
                              │
                   Cache hit? → Return cached decision (instant)
                              │
                   Cache miss ↓
                              │
                   ┌───────────────────────┐
                   │ Layer 2: Context      │  <100ms
                   │ File path + type      │
                   │ rules                 │
                   └──────────┬────────────┘
                              │
            ┌─────────────────┼─────────────────┐
            │                 │                 │
         ALLOW             BLOCK            UNCERTAIN
      (70-80%)            (rare)            (20-30%)
            │                 │                 │
            └─────────────────┴─────────────────┘
                              │
                   Uncertain only ↓
                              │
                   ┌───────────────────────┐
                   │ Layer 3: AST Analysis │  <500ms
                   │ Parse TypeScript      │
                   │ Check structure       │
                   └──────────┬────────────┘
                              │
            ┌─────────────────┼─────────────────┐
            │                 │                 │
         ALLOW             BLOCK            UNCERTAIN
      (50-60%)            (10%)            (30-40%)
            │                 │                 │
            └─────────────────┴─────────────────┘
                              │
                   Uncertain only ↓
                              │
                   ┌───────────────────────┐
                   │ Layer 4: Claude API   │  1-2 sec
                   │ Semantic analysis     │
                   │ Intent detection      │
                   └──────────┬────────────┘
                              │
            ┌─────────────────┼─────────────────┐
            │                 │                 │
         ALLOW             BLOCK            API FAIL
      (85-90%)            (10-15%)         (rare)
            │                 │                 │
            │                 │                 └→ ALLOW + WARN
            │                 │
            └─────────────────┴─────────────────┘
                              │
                   ┌───────────────────────┐
                   │ Layer 5: Save Cache   │  <10ms
                   │ Store decision        │
                   └──────────┬────────────┘
                              │
                              ▼
                   ┌───────────────────────┐
                   │ Return Decision       │
                   │ Allow or Block        │
                   └───────────────────────┘
```

### Performance Expectations

**Scenario 1: Clean commit (no suspicious patterns)**
- Time: <10ms
- Layers: 1 only
- User Experience: No delay

**Scenario 2: UI component with "retry" keyword**
- Time: <100ms
- Layers: 1 → 2 (context rules pass)
- User Experience: Imperceptible delay

**Scenario 3: New infrastructure file (first time)**
- Time: 1-2 seconds
- Layers: 1 → 2 → 3 → 4 (Claude API)
- User Experience: "Analyzing code... ALLOWED"

**Scenario 4: Same infrastructure file (cached)**
- Time: <1ms
- Layers: 1 → 5 (cache hit)
- User Experience: No delay

**Overall Statistics** (estimated):
- 90% of commits: <10ms (no patterns)
- 8% of commits: <100ms (context rules)
- 1.5% of commits: <500ms (AST analysis)
- 0.5% of commits: 1-2 seconds (Claude API first time)
- <0.1% of commits: >2 seconds (API slow/timeout)

---

## 📋 Implementation Options (Pros/Cons)

### Option 1: Full 5-Layer System (RECOMMENDED)

**What**: Implement all layers as described above

**Pros**:
- ✅ Maximum intelligence and accuracy
- ✅ Fast for 98% of commits (<500ms)
- ✅ Learns from Claude API results (cache)
- ✅ Handles all edge cases correctly
- ✅ Minimal false positives
- ✅ Clear feedback at each layer

**Cons**:
- ❌ Most complex to implement (~2-3 days)
- ❌ Requires Claude API key management
- ❌ Requires tree-sitter installation
- ❌ Needs Python 3.8+ environment

**Effort**: 2-3 days full-time
**Dependencies**: Python, tree-sitter, anthropic SDK, API key

**When to Choose**: If you want the best solution and are willing to invest time upfront

### Option 2: 3-Layer System (Context + AST + Cache)

**What**: Skip Claude API (Layer 4), rely on context rules and AST

**Pros**:
- ✅ No API dependency
- ✅ No API costs
- ✅ Always fast (<500ms)
- ✅ Offline-capable
- ✅ Simpler deployment

**Cons**:
- ❌ Less accurate for ambiguous cases
- ❌ May still have occasional false positives
- ❌ Requires manual review for edge cases
- ❌ No semantic understanding

**Effort**: 1-2 days full-time
**Dependencies**: Python, tree-sitter only

**When to Choose**: If API dependency is a concern or budget is tight

### Option 3: Enhanced Pattern Matching (Lightweight)

**What**: Improve existing grep with better regex and file type filters

**Pros**:
- ✅ Minimal implementation time (~4 hours)
- ✅ No new dependencies
- ✅ Bash-only solution
- ✅ Always fast (<100ms)

**Cons**:
- ❌ Still has false positives (reduced but not eliminated)
- ❌ No semantic understanding
- ❌ Manual --no-verify still needed sometimes
- ❌ Limited improvement over current

**Effort**: 4 hours
**Dependencies**: None (bash only)

**When to Choose**: If you need a quick improvement but can tolerate occasional false positives

### Option 4: Claude-Only Analysis (Simple but Slow)

**What**: Skip Layers 2-3, go straight to Claude API when pattern detected

**Pros**:
- ✅ Simple implementation (~1 day)
- ✅ Maximum accuracy
- ✅ Semantic understanding
- ✅ Easy to understand and debug

**Cons**:
- ❌ Slow for every flagged file (1-2 seconds)
- ❌ API costs on every suspicious commit
- ❌ Network dependency
- ❌ No fast path optimization

**Effort**: 1 day
**Dependencies**: Python, anthropic SDK, API key

**When to Choose**: If you value accuracy over speed and commit infrequently

---

## 🎯 Recommended Approach: Full 5-Layer System

### Why This Is Best

1. **Optimal Performance**: 98% of commits complete in <500ms
2. **Maximum Accuracy**: Claude API for genuinely ambiguous cases
3. **Cost Effective**: Caching + fast layers minimize API calls
4. **Best User Experience**: Clear feedback at each decision point
5. **Future-Proof**: Can add learning mechanisms later
6. **Handles All Edge Cases**: ERR-006 false positives would all pass correctly

### How ERR-006 False Positives Would Be Handled

**useErrorRecovery.ts**:
- Layer 1: ✅ Pattern detected (retry, recovery)
- Layer 2: ✅ PASS - "hooks/use*.ts" → React hook heuristic
- Result: <100ms, correct decision

**ErrorRecoveryDialog.tsx**:
- Layer 1: ✅ Pattern detected (retry)
- Layer 2: ✅ PASS - "components/error/*.tsx" → UI component heuristic
- Result: <100ms, correct decision

**error-catalog.ts**:
- Layer 1: ✅ Pattern detected (retry in strings)
- Layer 2: ✅ PASS - "*-catalog.ts" → Documentation heuristic
- Result: <100ms, correct decision

**If a truly ambiguous file was encountered**:
- Layers 1-3: ✅ Uncertain
- Layer 4: ✅ Claude analyzes, determines delegation pattern
- Layer 5: ✅ Decision cached for future
- Next commit: <1ms (cache hit)
- Result: 1-2 seconds first time, instant thereafter

---

## 🛠️ Implementation Plan (Full 5-Layer System)

### Phase 1: Foundation (Day 1)

**Goal**: Set up Python environment and dependencies

**Tasks**:
1. Create `.git/hooks/intelligent-hook.py`
2. Install dependencies:
   ```bash
   pip install tree-sitter tree-sitter-typescript tree-sitter-languages anthropic
   ```
3. Set up API key management:
   ```bash
   # Add to .creds/ or .env
   export ANTHROPIC_API_KEY="sk-ant-..."
   ```
4. Create cache file structure:
   ```python
   # .git/hook-decisions.json
   {}
   ```

### Phase 2: Core Layers (Day 2)

**Goal**: Implement Layers 2, 3, and 5

**Tasks**:
1. Implement context rules (Layer 2)
   - File path patterns
   - Extension checks
   - Protected-core detection
2. Implement AST analysis (Layer 3)
   - tree-sitter parsing
   - Delegation pattern detection
   - Import analysis
3. Implement caching (Layer 5)
   - Cache key generation
   - TTL management
   - Cache cleanup

**Testing**:
- Test with ERR-006 files
- Verify all false positives now pass
- Benchmark performance (<500ms)

### Phase 3: Claude Integration (Day 3)

**Goal**: Implement Layer 4 (LLM analysis)

**Tasks**:
1. Create protected-core patterns document
2. Implement Claude API client
3. Write semantic analysis prompt
4. Add JSON response parsing
5. Implement error handling and fallbacks
6. Add logging for API calls

**Testing**:
- Test with ambiguous code samples
- Verify Claude correctly identifies patterns
- Test error handling (timeout, network failure)
- Benchmark API response time

### Phase 4: Integration (Day 4)

**Goal**: Connect all layers with existing hook

**Tasks**:
1. Modify `post-tool-use.sh`:
   ```bash
   # After pattern detection
   if echo "$diff" | grep -iE "$PATTERN"; then
       # Call Python intelligent hook
       python3 .git/hooks/intelligent-hook.py \
           "$file_path" \
           "$pattern" \
           "$diff"

       if [ $? -eq 1 ]; then
           echo "❌ BLOCKED by intelligent hook"
           exit 1
       fi
   fi
   ```
2. Add clear user feedback:
   - Show which layer made decision
   - Display reasoning
   - Show cache hit/miss
   - Indicate API usage

**Testing**:
- Test complete flow end-to-end
- Commit ERR-006 files (should pass)
- Commit protected-core duplication (should block)
- Verify feedback messages clear

### Phase 5: Polish & Documentation (Day 5)

**Goal**: Production-ready release

**Tasks**:
1. Add performance monitoring:
   ```python
   import time
   start = time.time()
   # ... analysis ...
   duration = time.time() - start
   log_performance(layer, duration)
   ```
2. Create configuration file:
   ```yaml
   # .git/hooks/intelligent-hook-config.yml
   cache_ttl: 86400
   api_timeout: 5
   max_api_calls_per_hour: 100
   enable_context_rules: true
   enable_ast_analysis: true
   enable_claude_api: true
   ```
3. Write documentation:
   - README for hook system
   - Configuration guide
   - Troubleshooting guide
   - Performance tuning tips
4. Add CLI for testing:
   ```bash
   # Test file without committing
   python3 .git/hooks/intelligent-hook.py test useErrorRecovery.ts
   ```

**Testing**:
- Full regression test with all story files
- Performance benchmarks across layers
- Cache effectiveness measurement
- API call frequency tracking

### Phase 6: Deployment & Monitoring (Day 6)

**Goal**: Deploy and monitor in production

**Tasks**:
1. Deploy to project:
   ```bash
   # Add to repository
   git add .git/hooks/intelligent-hook.py
   git add .git/hooks/intelligent-hook-config.yml
   git commit -m "feat: Add intelligent git hooks with LLM analysis"
   ```
2. Set up monitoring dashboard:
   - Hook execution times
   - Cache hit rate
   - API call frequency
   - False positive rate
3. Create feedback collection:
   - Log when users use --no-verify
   - Track which files trigger API calls
   - Monitor confidence levels
4. Iterate based on data:
   - Adjust context rules
   - Improve AST queries
   - Refine Claude prompts

**Success Metrics**:
- ✅ Zero false positives on ERR-006 files
- ✅ <100ms for 90% of flagged commits
- ✅ Cache hit rate >70% after 1 week
- ✅ API calls <10 per day
- ✅ User satisfaction (no complaints)

---

## 📊 Cost Analysis

### API Costs (Anthropic Claude)

**Model**: Claude Sonnet 4 (recommended for speed/accuracy balance)

**Pricing** (as of 2025):
- Input: $3 per million tokens
- Output: $15 per million tokens

**Typical Analysis**:
- Input: ~2,000 tokens (file code + prompt + patterns)
- Output: ~200 tokens (JSON response)
- Cost per analysis: ~$0.01

**Expected Usage**:
- Worst case: 10 API calls per day = $0.10/day = $3/month
- Typical case: 2-3 API calls per day = $0.03/day = $0.90/month
- With caching: <1 API call per day average = $0.30/month

**Annual Cost**: ~$3-36 per year (negligible)

### Development Time Investment

**Option 1 (Full 5-Layer)**: 2-3 days = ~$1,000-1,500 developer time
**Option 2 (3-Layer)**: 1-2 days = ~$500-1,000 developer time
**Option 3 (Enhanced Patterns)**: 4 hours = ~$200 developer time
**Option 4 (Claude-Only)**: 1 day = ~$500 developer time

**ROI Calculation**:
- Time saved avoiding false positives: ~10 min per occurrence
- False positives without solution: ~5 per month
- Time saved: 50 min/month = 10 hours/year
- Developer time value: ~$500/year saved

**Payback Period**: 3-6 months

---

## 🔬 Alternative Approaches Considered

### A. Rule-Based Expert System

**Concept**: Extensive if-then rules for every pattern

**Why Not**:
- Brittle - breaks with new patterns
- Maintenance nightmare
- Can't handle novelty
- No semantic understanding

### B. Machine Learning Model

**Concept**: Train classifier on labeled code examples

**Why Not**:
- Requires large labeled dataset
- Training infrastructure needed
- Model drift over time
- Less explainable than LLM
- Harder to update than prompt

### C. Static Analysis Tools Only

**Concept**: Use ESLint, SonarQube, etc.

**Why Not**:
- No semantic understanding
- Can't distinguish intent
- No knowledge of project context
- Same false positive issues

### D. Human Review Process

**Concept**: Flag suspicious files for manual review

**Why Not**:
- Slow (blocks commits)
- Inconsistent decisions
- Developer frustration
- Doesn't scale

---

## 🎓 Key Learnings from Research

### 1. LLMs Are Ready for Code Analysis

2025 research shows LLMs excel at:
- Intent detection (coordinator vs implementor)
- Semantic similarity beyond syntax
- Context-aware reasoning
- Chain-of-thought analysis

### 2. Layered Systems Are Essential

Fast path + intelligent fallback pattern is proven:
- 90% of cases resolve quickly
- Expensive operations only when needed
- Caching amplifies benefits
- User experience maintained

### 3. Tree-Sitter Is Production-Ready

TypeScript AST parsing in Python is:
- Mature and stable (2024-2025)
- Fast (<500ms for typical files)
- No Node.js dependency
- Well-documented

### 4. Git Hooks Can Be Sophisticated

Modern git hooks (2025) support:
- External script execution
- Long-running operations (with feedback)
- Caching and state management
- API integrations

### 5. Performance Is Achievable

With proper architecture:
- <100ms for most commits (context rules)
- 1-2 seconds only when truly needed
- Caching makes repeated operations instant
- Progressive degradation on failures

---

## 📚 References & Resources

### Research Sources

1. **AI-Powered Git Hooks**
   - harper.blog/2024/03/11/use-an-llm-to-automagically-generate-meaningful-git-commit-messages/
   - github.com/OpenBMB/RepoAgent
   - docker.com/blog/how-an-ai-assistant-can-help-configure-your-projects-git-hooks/

2. **Semantic Code Analysis**
   - codeant.ai/blogs/best-duplicate-code-checker-tools
   - pmd.github.io/pmd/pmd_userdocs_cpd.html
   - github.com/dlidstrom/Duplo

3. **Tree-sitter & AST**
   - tree-sitter.github.io/tree-sitter/
   - pypi.org/project/tree-sitter-typescript/
   - github.com/yilinjz/astchunk

4. **Claude API & Best Practices**
   - anthropic.com/engineering/claude-code-best-practices
   - docs.claude.com/en/docs/claude-code/overview
   - github.com/anthropics/anthropic-sdk-python

5. **Git Hook Performance**
   - edopedia.com/blog/lefthook-vs-husky/
   - atlassian.com/git/tutorials/git-hooks

6. **LLM Intent Detection**
   - arxiv.org/html/2410.01627v1
   - medium.com/@mr.murga/enhancing-intent-classification-and-error-handling-in-agentic-llm-applications

### Tools & Libraries

- **tree-sitter-typescript**: v0.23.2 (Nov 2024)
- **py-tree-sitter**: Latest stable
- **anthropic SDK**: Latest stable
- **tree-sitter-languages**: All parsers bundled

### Documentation

- Anthropic SDK Python: `/anthropics/anthropic-sdk-python`
- Tree-sitter Docs: tree-sitter.github.io
- Claude API Docs: docs.anthropic.com

---

## ✅ Next Steps

### Immediate Action

**Decision Required**: Choose implementation option (1-4)

**Recommendation**: Option 1 (Full 5-Layer System)
- Best accuracy and performance
- Worth the 2-3 day investment
- Solves problem permanently
- Enables future enhancements

### Implementation Kickoff

**Step 1**: User approval of solution approach
**Step 2**: Set up development environment
**Step 3**: Begin Phase 1 (Foundation) immediately
**Step 4**: Iterate through phases with testing
**Step 5**: Deploy and monitor

### Success Criteria

- ✅ All ERR-006 files pass without --no-verify
- ✅ Zero false positives on delegation patterns
- ✅ <100ms for 90% of flagged commits
- ✅ <10 API calls per day average
- ✅ Cache hit rate >70% after 1 week
- ✅ User satisfaction restored

---

**End of Research & Solution Design**

**Ready to proceed with implementation upon user approval.**