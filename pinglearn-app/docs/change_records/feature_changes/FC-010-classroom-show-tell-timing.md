# Feature Change Record: Classroom Show-Then-Tell Timing Implementation

**Template Version**: 3.0
**Last Updated**: 2025-09-27
**Based On**: PingLearn Vision & Educational Methodology
**Compliance**: ISO 42001:2023, EU AI Act, NIST AI Risk Management Framework

---

## 🚨 CRITICAL: Pre-Change Safety Protocol

**MANDATORY BEFORE ANY CHANGES**: Create a git checkpoint commit
```bash
git add .
git commit -m "checkpoint: Before FC-010 - Show-Then-Tell timing implementation

CHECKPOINT: Safety rollback point before implementing FC-010
- Adding 400ms visual lead time to TeachingBoardSimple
- Implementing hybrid math rendering with timing
- All current changes staged and committed
- Can rollback to this point if implementation fails

🚨 This commit serves as the rollback point for FC-010"
```

**Checkpoint Hash**: [To be filled after commit]
**Rollback Command**: `git reset --hard [checkpoint-hash]`

---

## Section 1: Change Metadata

### 1.1 Basic Information
- **Change ID**: FC-010
- **Date**: 2025-09-27
- **Time**: 14:00 UTC
- **Severity**: CRITICAL
- **Type**: Feature
- **Affected Component**: TeachingBoardSimple.tsx, classroom display system
- **Related Change Records**: UI-001, FC-009

### 1.2 Approval Status
- **Approval Status**: PENDING
- **Approval Timestamp**: [To be filled on approval]
- **Approved By**: [To be filled on approval]
- **Review Comments**: [To be filled during review]

### 1.3 AI Agent Information
- **Primary Agent**: Claude 3.5 Opus (claude-opus-4-1-20250805)
- **Agent Version/Model**: Opus 4.1
- **Agent Capabilities**: Multi-agent orchestration, code analysis, web research
- **Context Provided**: Full codebase access, math rendering research, web research
- **Temperature/Settings**: Default with ultrathink mode
- **Prompt Strategy**: Deep multi-agent research with synthesis

---

## Section 2: Problem Statement

### 2.1 Issue Description
**CRITICAL FINDING**: The TeachingBoardSimple component currently displays content immediately upon transcription, violating PingLearn's core "show-then-tell" methodology where visual content must appear 400ms before audio for optimal learning comprehension.

### 2.2 Current State Analysis
```typescript
// CURRENT IMPLEMENTATION (TeachingBoardSimple.tsx)
// Content displays immediately with no timing control
useEffect(() => {
  const displayBuffer = getDisplayBuffer();
  const unsubscribe = displayBuffer.subscribe((items) => {
    processBufferItems(items as LiveDisplayItem[]); // Immediate display
  });
  return () => unsubscribe();
}, []);
```

### 2.3 Evidence from Research
1. **Codebase Analysis**: The 400ms timing exists only in the deprecated TeachingBoard.tsx, not in the active TeachingBoardSimple.tsx
2. **Math Rendering**: No hybrid renderer exists; only basic KaTeX with no fallback
3. **Timing Control**: No buffer management or predictive display mechanism

### 2.4 Impact Analysis
- **Learning Effectiveness**: Reduced comprehension without visual lead time
- **Cognitive Load**: Students struggle to process math and audio simultaneously
- **User Experience**: Jarring transitions between visual and audio content
- **Performance**: No optimization for complex equations

---

## Section 3: Proposed Solution

### 3.1 Technical Approach

#### A. Implement 400ms Visual Lead Time Buffer
```typescript
// NEW: PredictiveDisplayBuffer with timing control
class PredictiveDisplayBuffer {
  private displayQueue: QueueItem[] = [];
  private audioQueue: QueueItem[] = [];
  private readonly VISUAL_LEAD_TIME = 400; // ms

  addTranscription(content: string, audioTimestamp: number) {
    // Queue visual display 400ms before audio
    this.displayQueue.push({
      content,
      displayTime: audioTimestamp - this.VISUAL_LEAD_TIME,
      audioTime: audioTimestamp
    });
  }

  processQueue() {
    const now = Date.now();
    const readyToDisplay = this.displayQueue.filter(
      item => item.displayTime <= now && !item.displayed
    );
    readyToDisplay.forEach(this.displayContent);
  }
}
```

#### B. Hybrid Math Renderer Implementation
```typescript
// NEW: HybridMathRenderer.ts
export class HybridMathRenderer {
  private katexMacros = {
    "\\RR": "\\mathbb{R}",
    "\\NN": "\\mathbb{N}",
    "\\ZZ": "\\mathbb{Z}"
  };
  private complexityThreshold = 50;

  async render(latex: string, container: HTMLElement, options: RenderOptions = {}) {
    const complexity = this.assessComplexity(latex);

    if (complexity < this.complexityThreshold) {
      return this.renderKaTeX(latex, container, options);
    } else {
      return this.renderMathJax(latex, container, options);
    }
  }

  private assessComplexity(latex: string): number {
    const complexCommands = [
      '\\begin{align}', '\\multirow', '\\tikz',
      '\\xrightarrow', '\\mathcal', '\\operatorname'
    ];

    let score = latex.length / 10;
    complexCommands.forEach(cmd => {
      if (latex.includes(cmd)) score += 20;
    });

    return score;
  }
}
```

#### C. Enhanced TeachingBoardSimple Integration
```typescript
// MODIFIED: TeachingBoardSimple.tsx
const TeachingBoardSimple: React.FC<Props> = ({ sessionActive = false }) => {
  const predictiveBuffer = useRef(new PredictiveDisplayBuffer());
  const mathRenderer = useRef(new HybridMathRenderer());

  useEffect(() => {
    // Process display queue at 60fps for smooth updates
    const displayTimer = setInterval(() => {
      predictiveBuffer.current.processQueue();
    }, 16);

    // Subscribe to transcription updates
    const unsubscribe = displayBuffer.subscribe((items) => {
      items.forEach(item => {
        // Add to predictive buffer with timing
        predictiveBuffer.current.addTranscription(
          item.content,
          item.audioTimestamp || Date.now() + 400
        );
      });
    });

    return () => {
      clearInterval(displayTimer);
      unsubscribe();
    };
  }, []);

  // Render math content with hybrid approach
  const renderContent = useCallback((content: string, type: string) => {
    if (type === 'math') {
      const container = document.createElement('div');
      mathRenderer.current.render(content, container);
      return container.innerHTML;
    }
    return content;
  }, []);
};
```

### 3.2 Architecture Changes

#### Component Structure
```
TeachingBoardSimple (Modified)
├── PredictiveDisplayBuffer (NEW)
│   ├── Visual Queue (400ms lead)
│   └── Audio Queue (synchronized)
├── HybridMathRenderer (NEW)
│   ├── KaTeX (primary, <50ms)
│   └── MathJax (fallback, complex)
└── Performance Monitor (NEW)
    ├── Timing metrics
    └── Render performance
```

#### Data Flow
```
1. Transcription arrives →
2. PredictiveDisplayBuffer queues with timing →
3. Visual content displays (T-400ms) →
4. HybridMathRenderer processes math →
5. Audio plays at T →
6. Performance logged
```

### 3.3 Implementation Phases

#### Phase 1: Core Timing (Week 1)
- [ ] Create PredictiveDisplayBuffer class
- [ ] Integrate with TeachingBoardSimple
- [ ] Add 400ms visual lead time
- [ ] Test timing accuracy

#### Phase 2: Hybrid Rendering (Week 2)
- [ ] Implement HybridMathRenderer
- [ ] Add complexity assessment
- [ ] Integrate KaTeX/MathJax fallback
- [ ] Test with various equations

#### Phase 3: Optimization (Week 3)
- [ ] Add performance monitoring
- [ ] Implement caching
- [ ] Optimize render cycles
- [ ] Add analytics

---

## Section 4: Testing Requirements

### 4.1 Unit Tests
```typescript
describe('PredictiveDisplayBuffer', () => {
  it('should display content 400ms before audio', async () => {
    const buffer = new PredictiveDisplayBuffer();
    const audioTime = Date.now() + 1000;

    buffer.addTranscription('test', audioTime);

    // Wait 600ms (1000 - 400)
    await delay(600);

    expect(buffer.getDisplayedContent()).toContain('test');
    expect(buffer.getAudioContent()).toBeEmpty();
  });
});
```

### 4.2 Integration Tests
- Test WebSocket → Buffer → Display pipeline
- Verify math rendering fallback
- Validate timing synchronization
- Check memory management

### 4.3 E2E Tests
- Complete tutoring session with timing verification
- Math-heavy content rendering
- Long session memory stability
- Network disruption recovery

---

## Section 5: Risk Assessment

### 5.1 Technical Risks
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Timing drift over long sessions | MEDIUM | HIGH | Periodic sync recalibration |
| MathJax loading delays | LOW | MEDIUM | Lazy loading with preload hints |
| WebSocket buffering issues | MEDIUM | HIGH | Implement reconnection logic |
| Memory leaks from buffers | LOW | HIGH | Buffer size limits & cleanup |

### 5.2 Breaking Changes
- **None expected** - Changes are additive and backward compatible
- Existing functionality preserved with enhanced timing

### 5.3 Rollback Strategy
```bash
# If issues occur:
git reset --hard [checkpoint-hash]
npm run build
npm run test
# Deploy previous version
```

---

## Section 6: Performance Metrics

### 6.1 Success Criteria
- **Visual Lead Time**: 400ms ± 50ms accuracy
- **KaTeX Rendering**: <50ms for simple equations
- **MathJax Fallback**: <500ms for complex equations
- **Memory Usage**: <100MB increase over 1-hour session
- **Frame Rate**: Maintain 60fps during updates

### 6.2 Monitoring Plan
```typescript
// Performance monitoring integration
const performanceMonitor = {
  trackTiming: (visual: number, audio: number) => {
    const leadTime = audio - visual;
    analytics.track('visual_lead_time', { leadTime });
  },

  trackRenderPerformance: (method: string, duration: number) => {
    analytics.track('math_render', { method, duration });
  }
};
```

---

## Section 7: Documentation Requirements

### 7.1 Code Documentation
```typescript
/**
 * PredictiveDisplayBuffer - Implements show-then-tell methodology
 *
 * Manages visual content display 400ms before audio playback to optimize
 * learning comprehension through dual-channel processing.
 *
 * @example
 * const buffer = new PredictiveDisplayBuffer();
 * buffer.addTranscription(content, audioTimestamp);
 */
```

### 7.2 User Documentation
- Update classroom feature documentation
- Add timing configuration guide
- Document math rendering capabilities

---

## Section 8: Implementation Checklist

### Pre-Implementation
- [ ] Create git checkpoint commit
- [ ] Review with stakeholders
- [ ] Set up feature flag
- [ ] Prepare rollback plan

### Implementation
- [ ] Implement PredictiveDisplayBuffer
- [ ] Create HybridMathRenderer
- [ ] Modify TeachingBoardSimple
- [ ] Add performance monitoring
- [ ] Write unit tests
- [ ] Write integration tests

### Post-Implementation
- [ ] Run full test suite
- [ ] Verify timing accuracy
- [ ] Check memory usage
- [ ] Update documentation
- [ ] Deploy to staging
- [ ] Monitor metrics

---

## Section 9: Decision Log

| Date | Decision | Rationale | Made By |
|------|----------|-----------|---------|
| 2025-09-27 | Use hybrid KaTeX/MathJax | Balance speed and compatibility | AI Research |
| 2025-09-27 | 400ms visual lead time | Optimal for comprehension | Research validated |
| 2025-09-27 | Direct DOM updates for timing | React state too slow | Performance testing |

---

## Section 10: Appendix

### A. Research References
1. Math Rendering Research Document: `/docs/research/math-rendering-research.md`
2. Audio-Visual Sync Standards: EBU Recommendation R37
3. Khan Academy KaTeX Architecture
4. ChatGPT Streaming Implementation Patterns

### B. Code Snippets
Full implementation examples available in:
- `/src/features/math/HybridMathRenderer.ts` (to be created)
- `/src/features/transcription/PredictiveDisplayBuffer.ts` (to be created)
- `/src/components/classroom/TeachingBoardSimple.tsx` (to be modified)

### C. Performance Benchmarks
- Current: 0ms lead time, KaTeX only
- Target: 400ms ± 50ms lead time, hybrid rendering
- Measured: [To be filled after implementation]

---

**Document Status**: READY FOR REVIEW
**Next Steps**: Obtain stakeholder approval before implementation
**Estimated Timeline**: 3 weeks (1 week per phase)