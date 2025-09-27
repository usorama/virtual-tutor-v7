# Feature Specification: SessionOrchestrator LiveKit Integration

## Document Metadata
| Field | Value |
|-------|-------|
| **Feature ID** | FS-00-AB-1 |
| **Feature Name** | SessionOrchestrator LiveKit Data Channel Integration |
| **Version** | 1.0.0 |
| **Status** | `DRAFT` |
| **Priority** | CRITICAL |
| **Estimated Effort** | 1-2 days |
| **Dependencies** | Protected Core Services, LiveKit Integration, DisplayBuffer |
| **Author** | Claude AI Assistant |
| **Created Date** | 2025-09-27 |
| **Parent Feature** | Data Flow Architecture Fix |

## Timestamps
| Event | Date | Notes |
|-------|------|-------|
| **Draft Created** | 2025-09-27 | Based on investigation findings |
| **Approved** | - | Pending approval |
| **Development Started** | - | Not started |
| **UAT Completed** | - | Not started |
| **Production Released** | - | Not started |

## Status Workflow
```
DRAFT → APPROVED → IN_DEVELOPMENT → UAT → PRODUCTION_READY → DEPLOYED
```

---

## Executive Summary

This feature fixes the broken data flow architecture in PingLearn by properly integrating SessionOrchestrator with LiveKit data channel events. Currently, the LiveKitRoom component has its data handler disabled, expecting SessionOrchestrator to process transcripts, but SessionOrchestrator is not receiving LiveKit data channel packets. This implementation establishes the proper event chain while maintaining architectural integrity and preventing duplicate data entries.

## Business Objectives

### Primary Goals
1. **Restore Data Flow**: Enable visual content display in TeachingBoardSimple
2. **Maintain Architecture**: Keep single source of truth in SessionOrchestrator
3. **Prevent Duplicates**: Ensure no duplicate transcript entries
4. **Enable Features**: Allow FC-010 and FS-00-AA to function properly
5. **Production Ready**: Clean architecture suitable for deployment

### Success Metrics
- 100% of transcript data reaches DisplayBuffer
- 0 duplicate entries in DisplayBuffer
- <100ms latency from LiveKit to DisplayBuffer
- All existing features function correctly
- No TypeScript errors

### Market Differentiation
- **Clean Architecture**: Proper separation of concerns
- **Maintainability**: Single source of truth for data flow
- **Scalability**: Ready for additional data sources
- **Reliability**: Robust error handling and recovery

## Technical Architecture

### Current Problem (Evidence-Based)
```typescript
// CURRENT BROKEN FLOW:
Python Agent
  → publish_data() [line 181]
  → LiveKit Data Channel
  → LiveKitRoom receives data [line 122]
  → Handler DISABLED [lines 123-130]
  → SessionOrchestrator NOT receiving
  → DisplayBuffer EMPTY
  → TeachingBoardSimple BLANK
```

### Proposed Solution
```typescript
// FIXED FLOW:
Python Agent
  → publish_data()
  → LiveKit Data Channel
  → LiveKitRoom receives data
  → Emits custom event
  → SessionOrchestrator listens
  → Processes and validates
  → Adds to DisplayBuffer
  → TeachingBoardSimple displays
```

### Implementation Details

#### 1. Modify LiveKitRoom Component
```typescript
// src/components/voice/LiveKitRoom.tsx

// Add event emitter at component level
import { EventEmitter } from 'events';

// Create shared event bus
export const liveKitEventBus = new EventEmitter();

// In handleDataReceived function:
const handleDataReceived = (payload: Uint8Array) => {
  try {
    const decoder = new TextDecoder();
    const data = JSON.parse(decoder.decode(payload));

    if (data.type === 'transcript') {
      console.log('[LiveKitRoom] Transcript received, emitting to SessionOrchestrator');

      // Emit event for SessionOrchestrator
      liveKitEventBus.emit('livekit:transcript', {
        segments: data.segments,
        speaker: data.speaker || 'teacher',
        timestamp: Date.now()
      });

      // Log but don't process here
      console.log(`[LiveKitRoom] Emitted transcript with ${data.segments.length} segments`);
    }
  } catch (error) {
    console.error('[LiveKitRoom] Error processing data packet:', error);
  }
};
```

#### 2. Update SessionOrchestrator
```typescript
// src/protected-core/session/orchestrator.ts

import { liveKitEventBus } from '@/components/voice/LiveKitRoom';

class SessionOrchestrator {
  private liveKitDataListener: any = null;

  private setupLiveKitDataChannelListener(): void {
    console.log('[SessionOrchestrator] Setting up LiveKit data channel listener');

    // Remove old listener if exists
    if (this.liveKitDataListener) {
      liveKitEventBus.off('livekit:transcript', this.liveKitDataListener);
    }

    // Create new listener
    this.liveKitDataListener = (data: any) => {
      console.log('[SessionOrchestrator] Received transcript from LiveKit data channel');

      if (!data.segments || !Array.isArray(data.segments)) {
        console.warn('[SessionOrchestrator] Invalid transcript data structure');
        return;
      }

      // Process each segment
      data.segments.forEach((segment: any) => {
        // Validate segment
        if (!segment.content) {
          console.warn('[SessionOrchestrator] Segment missing content');
          return;
        }

        // Add to display buffer with deduplication check
        const itemId = this.addTranscriptionItem({
          type: segment.type || 'text',
          content: segment.content,
          speaker: data.speaker || 'teacher',
          confidence: segment.confidence || 1.0
        });

        console.log('[SessionOrchestrator] Added transcript item to DisplayBuffer:', {
          id: itemId,
          type: segment.type,
          contentLength: segment.content.length
        });
      });
    };

    // Attach listener
    liveKitEventBus.on('livekit:transcript', this.liveKitDataListener);
    console.log('[SessionOrchestrator] LiveKit data channel listener attached');
  }

  // Call this in initialize() or startSession()
  async startSession(studentId: string, topic: string): Promise<void> {
    // ... existing code ...

    // Setup data channel listener BEFORE connecting
    this.setupLiveKitDataChannelListener();

    // ... rest of connection code ...
  }

  // Clean up on session end
  async endSession(): Promise<void> {
    // Remove listener
    if (this.liveKitDataListener) {
      liveKitEventBus.off('livekit:transcript', this.liveKitDataListener);
      this.liveKitDataListener = null;
    }

    // ... existing cleanup code ...
  }
}
```

#### 3. Add Deduplication Logic
```typescript
// src/protected-core/transcription/display/buffer.ts

class DisplayBuffer {
  private recentItems = new Map<string, number>(); // content hash → timestamp
  private DEDUP_WINDOW_MS = 1000; // 1 second window

  addItem(item: Omit<DisplayItem, 'id' | 'timestamp'>): string {
    // Generate content hash for deduplication
    const contentHash = this.hashContent(item.content);
    const now = Date.now();

    // Check for recent duplicate
    const lastSeen = this.recentItems.get(contentHash);
    if (lastSeen && (now - lastSeen) < this.DEDUP_WINDOW_MS) {
      console.log('[DisplayBuffer] Duplicate item detected, skipping');
      return ''; // Return empty ID for duplicate
    }

    // Update recent items map
    this.recentItems.set(contentHash, now);

    // Clean old entries
    this.cleanRecentItems(now);

    // Add item as normal
    const id = crypto.randomUUID();
    const newItem: DisplayItem = {
      id,
      ...item,
      timestamp: now
    };

    this.items.push(newItem);
    this.notifySubscribers();
    return id;
  }

  private hashContent(content: string): string {
    // Simple hash for deduplication
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
  }

  private cleanRecentItems(now: number): void {
    // Remove entries older than dedup window
    for (const [hash, timestamp] of this.recentItems.entries()) {
      if (now - timestamp > this.DEDUP_WINDOW_MS) {
        this.recentItems.delete(hash);
      }
    }
  }
}
```

### Testing Strategy

#### Unit Tests
```typescript
describe('SessionOrchestrator LiveKit Integration', () => {
  test('receives and processes LiveKit data channel events');
  test('adds transcript items to DisplayBuffer');
  test('handles malformed data gracefully');
  test('cleans up listeners on session end');
});

describe('DisplayBuffer Deduplication', () => {
  test('prevents duplicate entries within time window');
  test('allows same content after time window');
  test('cleans up old deduplication entries');
});
```

#### Integration Tests
```typescript
describe('End-to-End Data Flow', () => {
  test('data flows from LiveKit to TeachingBoardSimple');
  test('no duplicate entries in DisplayBuffer');
  test('maintains proper timing and order');
  test('handles connection drops and reconnects');
});
```

#### E2E Tests
```typescript
describe('Complete Learning Session', () => {
  test('visual content displays when teacher speaks');
  test('400ms show-then-tell timing works');
  test('Smart Learning Notes populate correctly');
  test('no visual glitches or duplicates');
});
```

## Implementation Phases

### Phase 1: Core Integration (Day 1)
```typescript
const phase1Tasks = {
  1: 'Implement event bus in LiveKitRoom',
  2: 'Add listener in SessionOrchestrator',
  3: 'Test basic data flow',
  4: 'Add comprehensive logging',
  5: 'Verify no TypeScript errors'
};
```

### Phase 2: Robustness (Day 2)
```typescript
const phase2Tasks = {
  1: 'Add deduplication logic',
  2: 'Implement error handling',
  3: 'Add connection recovery',
  4: 'Create unit tests',
  5: 'Performance optimization',
  6: 'Documentation update'
};
```

## Performance Requirements

### Technical Metrics
- **Event Processing**: <10ms per transcript
- **Memory Usage**: <1MB for event bus
- **Deduplication Check**: <1ms
- **DisplayBuffer Update**: <5ms
- **No Memory Leaks**: Proper listener cleanup

### Quality Metrics
- **Zero Duplicates**: 100% deduplication accuracy
- **Data Integrity**: 100% of valid data processed
- **Error Recovery**: Automatic reconnection
- **TypeScript**: 0 errors, strict mode

## Risk Mitigation

### Technical Risks
| Risk | Mitigation |
|------|------------|
| Event bus memory leak | Proper listener cleanup on unmount |
| Race conditions | Initialize listeners before connection |
| Duplicate data | Deduplication with time window |
| Lost events | Implement event acknowledgment |

### User Experience Risks
| Risk | Mitigation |
|------|------------|
| Data lag | Keep processing under 10ms |
| Visual glitches | Smooth transitions in UI |
| Connection drops | Automatic reconnection logic |

## Testing Requirements

### Pre-Deployment Checklist
- [ ] TypeScript compilation passes (0 errors)
- [ ] All unit tests pass
- [ ] Integration tests pass
- [ ] No console errors in browser
- [ ] Data flows correctly in test session
- [ ] No duplicate entries in DisplayBuffer
- [ ] Memory usage stable over time
- [ ] Handles connection drops gracefully

### UAT Scenarios
1. Complete 10-minute tutoring session
2. Test with poor network conditions
3. Verify all features work (FC-010, FS-00-AA)
4. Test rapid transcript generation
5. Verify session cleanup

## Success Criteria

### Launch Readiness
- [ ] Data flows from Python to display
- [ ] No duplicate transcript entries
- [ ] All features functional
- [ ] Performance meets requirements
- [ ] Error handling comprehensive
- [ ] Documentation complete
- [ ] Tests passing

### Post-Launch Success
- Week 1: 0 data flow issues reported
- Week 2: System stability confirmed
- Month 1: Ready for additional features

## Migration Path

### From Temporary Fix to Permanent Solution
1. **Current State**: LiveKitRoom directly updates DisplayBuffer (temporary fix)
2. **Migration Step 1**: Deploy SessionOrchestrator integration in parallel
3. **Migration Step 2**: Test both paths simultaneously
4. **Migration Step 3**: Disable direct LiveKitRoom updates
5. **Final State**: SessionOrchestrator as single source of truth

### Rollback Strategy
```bash
# If issues occur:
1. Re-enable LiveKitRoom direct updates
2. Disable SessionOrchestrator listener
3. Investigate and fix issues
4. Retry deployment
```

## Future Enhancements

### Version 2.0 Possibilities
1. **Multi-Source Integration**: Handle data from multiple agents
2. **Advanced Deduplication**: Content-aware duplicate detection
3. **Replay System**: Record and replay sessions
4. **Analytics Integration**: Track data flow metrics
5. **Load Balancing**: Distribute processing across workers

## Conclusion

This implementation fixes the critical data flow issue in PingLearn by properly connecting LiveKit data channels to SessionOrchestrator, maintaining architectural integrity while ensuring all features function correctly. The solution is production-ready, maintainable, and sets the foundation for future enhancements.

---

*This specification addresses the root cause identified through evidence-based investigation and provides a clean, maintainable solution suitable for production deployment.*