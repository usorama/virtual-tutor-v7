# Feature Specification: AI Safety & Teaching Guidelines Service

## Document Metadata
| Field | Value |
|-------|-------|
| **Feature ID** | FS-005 |
| **Feature Name** | AI Safety & Teaching Guidelines Service |
| **Version** | 1.0.0 |
| **Status** | `APPROVAL_PENDING` |
| **Priority** | High |
| **Estimated Effort** | 1-2 weeks |
| **Dependencies** | Gemini API integration, Protected Core |
| **Author** | Claude AI Assistant |
| **Created Date** | 2025-09-23 |
| **Last Modified** | 2025-09-23 |

## Timestamps
| Event | Date | Notes |
|-------|------|-------|
| **Draft Created** | 2025-09-23 | Initial specification drafted |
| **Review Requested** | - | Pending |
| **Approved** | - | Awaiting approval |
| **Development Started** | - | Not started |
| **UAT Completed** | - | Not started |
| **Production Released** | - | Not started |

## Status Workflow
```
DRAFT → APPROVAL_PENDING → APPROVED → IN_DEVELOPMENT → UAT → PRODUCTION_READY → DEPLOYED
```

**Implementation Gate**: This feature MUST NOT be implemented until status is `APPROVED`

---

## Executive Summary

The AI Safety & Teaching Guidelines Service provides essential safety controls and educational quality assurance for PingLearn's AI tutor without over-engineering. This lightweight service enhances the existing Gemini integration with safety filters, content validation, and adaptive response guidelines that ensure appropriate, accurate, and encouraging interactions with students.

## Business Objectives

### Primary Goals
1. **Student Safety**: Prevent inappropriate or harmful AI responses
2. **Educational Accuracy**: Ensure mathematically correct content
3. **Emotional Support**: Provide appropriate encouragement without therapy
4. **Consistency**: Maintain reliable teaching quality
5. **Simplicity**: Enhance without rebuilding the working system

### Success Metrics
- Zero safety incidents or inappropriate responses
- Math accuracy rate >99.5%
- Student satisfaction >4.5/5
- Implementation time <2 weeks
- No performance degradation

## Detailed Feature Requirements

### 1. Content Safety Framework

#### 1.1 Input/Output Filtering
```typescript
interface SafetyFilter {
  input: {
    profanityCheck: boolean;
    personalInfoDetection: boolean; // Block sharing of addresses, phone numbers
    topicAppropriateness: boolean; // Math/education only
    harmfulIntentDetection: boolean;
  };

  output: {
    contentModeration: {
      inappropriate: 'block';
      medical: 'redirect_to_adult';
      relationship: 'redirect_to_adult';
      violence: 'block';
      academic_dishonesty: 'educate_about_learning';
    };

    mathematicalAccuracy: {
      verification: 'symbolic_computation';
      confidence_threshold: 0.95;
      fallback: 'acknowledge_uncertainty';
    };
  };

  realTimeFlags: {
    severity: 'low' | 'medium' | 'high' | 'critical';
    action: 'allow' | 'modify' | 'block' | 'escalate';
    logging: boolean;
  };
}
```

#### 1.2 Emergency Response Protocols
```typescript
interface EmergencyProtocols {
  triggers: {
    selfHarm: 'immediate_escalation';
    bullying: 'support_and_report';
    abuse: 'support_and_report';
    crisis: 'provide_helpline';
  };

  responses: {
    supportiveMessage: string;
    helplineInfo: {
      india: {
        childline: '1098';
        student_helpline: '080-2354-8130';
      };
    };
    parentNotification: boolean;
    sessionPause: boolean;
  };
}
```

### 2. Teaching Quality Assurance

#### 2.1 Response Enhancement System
```typescript
interface ResponseEnhancement {
  teachingStyle: {
    mode: 'encouraging' | 'patient' | 'celebratory';

    // Simple emotional awareness
    emotionalContext: {
      detected: 'frustrated' | 'confused' | 'confident' | 'neutral';
      response: 'adapt_tone'; // Not personality change
    };

    // Consistent voice
    consistency: {
      name: 'PingLearn Tutor';
      personality: 'friendly_teacher'; // Single, consistent personality
      traits: ['patient', 'encouraging', 'knowledgeable'];
    };
  };

  pedagogicalGuidelines: {
    explanation: {
      structure: 'simple_to_complex';
      examples: 'multiple_approaches';
      visualization: 'when_helpful';
    };

    mistakes: {
      handling: 'gentle_correction';
      learning: 'emphasize_process';
      encouragement: 'always_present';
    };

    pacing: {
      studentLed: true;
      checkUnderstanding: true;
      allowThinkingTime: true;
    };
  };
}
```

#### 2.2 Math Content Validation
```typescript
interface MathValidation {
  accuracy: {
    symbolicCheck: boolean; // Verify mathematical correctness
    numericalValidation: boolean;
    unitConsistency: boolean;

    commonErrors: {
      divisionByZero: 'catch_and_explain';
      signErrors: 'highlight_carefully';
      orderOfOperations: 'emphasize_PEMDAS';
    };
  };

  presentation: {
    katexRendering: boolean;
    stepByStep: boolean;
    multipleMethodsShown: boolean;
    visualAids: 'when_applicable';
  };

  gradeAppropriate: {
    vocabularyLevel: 'grade_aligned';
    conceptComplexity: 'curriculum_matched';
    exampleDifficulty: 'progressive';
  };
}
```

### 3. Contextual Memory (Simple)

#### 3.1 Session Context
```typescript
interface SimpleSessionContext {
  // What to remember during a session
  currentSession: {
    topic: string;
    strugglingWith: string[];
    understoodConcepts: string[];
    attemptCount: number;
    emotionalState: 'positive' | 'neutral' | 'needs_encouragement';
  };

  // Simple preferences (no complex personality matching)
  studentPreferences: {
    explanationDepth: 'brief' | 'detailed';
    exampleTypes: 'visual' | 'numerical' | 'word_problems';
    encouragementLevel: 'minimal' | 'moderate' | 'high';
  };

  // No complex personality system needed
  // Just track what works for the student
}
```

### 4. Prompt Engineering Templates

#### 4.1 Enhanced System Prompt
```typescript
const SYSTEM_PROMPT = `You are PingLearn's friendly AI math tutor. You are patient, encouraging, and knowledgeable.

CRITICAL SAFETY RULES:
1. You ONLY discuss mathematics and education
2. You NEVER provide medical, relationship, or personal advice
3. You redirect non-academic questions to parents/teachers
4. You ALWAYS verify mathematical accuracy before responding
5. You NEVER help with cheating or provide direct test answers

TEACHING APPROACH:
- Be encouraging and patient with all students
- Celebrate successes, no matter how small
- Guide through mistakes without judgment
- Break complex problems into simple steps
- Use grade-appropriate language
- Provide multiple examples when needed

EMOTIONAL SUPPORT:
- If a student seems frustrated, acknowledge it and encourage them
- Provide breaks when needed
- Always end on a positive note
- Focus on effort over results

Remember: You are a tutor, not a therapist, friend, or parent.`;
```

#### 4.2 Dynamic Prompt Modifiers
```typescript
interface PromptModifiers {
  // Add to prompt based on context
  contextual: {
    struggling: "+ Be extra patient and break down steps more";
    confident: "+ Challenge with follow-up questions";
    confused: "+ Provide different explanation approaches";
  };

  // Simple adaptations (not personality changes)
  style: {
    visual_learner: "+ Include more diagrams and visual descriptions";
    practice_needed: "+ Provide additional practice problems";
    conceptual_gap: "+ Review prerequisites first";
  };
}
```

### 5. Monitoring & Reporting

#### 5.1 Safety Monitoring Dashboard
```typescript
interface SafetyMonitoring {
  metrics: {
    blockedContent: number;
    modifiedResponses: number;
    escalations: number;
    accuracyRate: number;
  };

  alerts: {
    realTime: {
      criticalSafety: 'immediate_notification';
      repeatedIssues: 'pattern_detection';
      systemErrors: 'technical_alert';
    };
  };

  reporting: {
    daily: SafetyReport;
    weekly: QualityReport;
    monthly: ImprovementRecommendations;
  };
}
```

### 6. Implementation (Simplified)

#### 6.1 Service Architecture
```typescript
// SIMPLE ENHANCEMENT TO EXISTING SYSTEM
class AISSafetyService {
  constructor(
    private geminiService: ExistingGeminiService,
    private mathValidator: MathValidator
  ) {}

  async procesMessage(message: string, context: SessionContext) {
    // 1. Safety check input
    const safeInput = await this.checkInputSafety(message);
    if (!safeInput.safe) return this.getSafetyResponse(safeInput.reason);

    // 2. Enhance prompt
    const enhancedPrompt = this.enhancePrompt(message, context);

    // 3. Get AI response
    const response = await this.geminiService.generate(enhancedPrompt);

    // 4. Validate output
    const validated = await this.validateOutput(response);

    // 5. Return safe, accurate response
    return validated;
  }
}
```

#### 6.2 Database Schema (Minimal)
```sql
-- Only essential safety tables
CREATE TABLE ai_safety_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  student_id UUID REFERENCES auth.users(id),
  input_text TEXT,
  output_text TEXT,
  safety_flags JSONB,
  blocked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE student_preferences (
  student_id UUID PRIMARY KEY REFERENCES auth.users(id),
  explanation_depth TEXT DEFAULT 'moderate',
  encouragement_level TEXT DEFAULT 'moderate',
  visual_preference BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Simple indexes
CREATE INDEX idx_safety_logs_session ON ai_safety_logs(session_id);
CREATE INDEX idx_safety_logs_blocked ON ai_safety_logs(blocked);
```

### 7. Integration Points

#### 7.1 Existing System Enhancement
```typescript
// Minimal changes to existing code
interface Integration {
  geminiService: {
    before: 'Direct Gemini API calls';
    after: 'Gemini → Safety Service → Response';
    changes: 'Wrapper function only';
  };

  protectedCore: {
    changes: 'NONE'; // No changes to protected core
    interaction: 'Service layer only';
  };

  frontend: {
    changes: 'NONE'; // Transparent to frontend
    benefits: 'Safer, better responses';
  };
}
```

## Implementation Phases

### Phase 1: Core Safety (Days 1-3)
- [ ] Input/output filtering
- [ ] Math accuracy validation
- [ ] Emergency protocols
- [ ] Safety logging

### Phase 2: Teaching Enhancement (Days 4-5)
- [ ] Enhanced prompts
- [ ] Simple context tracking
- [ ] Encouragement system
- [ ] Response quality checks

### Phase 3: Integration & Testing (Days 6-7)
- [ ] Wrap existing Gemini service
- [ ] Test safety filters
- [ ] Validate math accuracy
- [ ] Performance testing

## Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Over-filtering legitimate content | Medium | Low | Tunable thresholds |
| Performance impact | Low | Medium | Caching, async processing |
| Math validation errors | Low | High | Multiple validation methods |
| Integration complexity | Low | Low | Wrapper pattern |

## Why This Approach Works

### Compared to Enhanced Teacher Persona Architecture
| Aspect | Complex Architecture | This Approach |
|--------|---------------------|---------------|
| **Dev Time** | 12+ weeks | 1-2 weeks |
| **Database** | 15+ tables | 2 tables |
| **Services** | 6 interconnected | 1 wrapper |
| **Risk** | Very High | Very Low |
| **Value** | Theoretical | Practical |
| **Maintenance** | Nightmare | Simple |

### Key Advantages
1. **Works with existing system** - No rebuild required
2. **Addresses real safety needs** - Not theoretical ones
3. **Simple to implement** - Can ship on time
4. **Easy to maintain** - Minimal complexity
5. **Provides immediate value** - Better responses today

## Success Criteria

### Must Have (Week 1)
- Zero inappropriate responses
- Math accuracy >99%
- Emergency protocol handling
- Basic encouragement

### Nice to Have (Week 2)
- Context awareness
- Enhanced encouragement
- Performance metrics
- Parent notifications

## Dependencies

### Technical Dependencies
- Existing Gemini service operational
- KaTeX rendering working
- Basic session management
- Error logging system

### No New Dependencies
- Uses existing infrastructure
- No new databases needed
- No new services required
- No architectural changes

## Testing Requirements

### Safety Testing
- Inappropriate content blocking
- Math accuracy validation
- Emergency response triggers
- Edge case handling

### Integration Testing
- Performance impact <100ms
- Existing features unaffected
- Error handling robust
- Logging functional

## Approval Requirements

This feature specification requires approval from:
1. Product Owner
2. Technical Lead
3. Safety Officer (if applicable)

**Current Status**: `APPROVAL_PENDING`

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2025-09-23 | Claude AI | Initial specification created |

## Notes

- This is a pragmatic alternative to the over-engineered personality system
- Focuses on safety and quality without complexity
- Can be implemented within the deadline
- Provides foundation for future enhancements
- Maintains system stability (critical for attempt #8)