# Protected Core Change Record PC-002

## Change Metadata
- **Change ID**: PC-002
- **Date**: 2025-09-21
- **Time**: 19:00 PST
- **Approval Status**: APPROVED
- **Approval Timestamp**: 2025-09-21 19:05 PST
- **Approved By**: Project Stakeholder
- **Severity**: CRITICAL
- **Type**: Constitutional Compliance Fix - TypeScript Strict Mode
- **Affected Component**: Entire Codebase - 'any' Type Elimination

## Change Summary
Eliminate all 24 'any' type violations to restore TypeScript strict mode compliance and prevent constitutional failure patterns from attempts 1-7.

## Problem Statement
Constitutional verification shows 24 files with 'any' type violations, directly violating CLAUDE.md rules:
- Line 282: "NEVER use `any` type"
- Line 353: "NEVER use `any` type"
- Line 694: "NEVER use `any` type in TypeScript"

### Critical Protected Core Violations (4 files)
These violations in protected core are ESPECIALLY dangerous:

1. **websocket.contract.ts:35** - `send(data: any): void;`
2. **livekit/session-manager.ts:276** - `quality: any`
3. **livekit/session-manager.ts:288** - `reason?: any`
4. **livekit/audio-manager.ts:205** - `stats: any[]`

### Feature Code Violations (20 files)
Additional violations across features, hooks, components, and lib files.

## Type Definitions Required

### 1. WebSocket Contract Types
```typescript
// File: src/types/websocket.ts
export interface WebSocketMessage {
  type: string;
  data?: unknown;
  timestamp?: number;
}

export interface WebSocketSendData extends WebSocketMessage {
  id?: string;
  metadata?: Record<string, unknown>;
}
```

### 2. LiveKit Types
```typescript
// File: src/types/livekit.ts
export interface ConnectionQuality {
  level: 'excellent' | 'good' | 'poor' | 'unknown';
  score: number;
  upstream: number;
  downstream: number;
}

export interface DisconnectionReason {
  code: number;
  reason: string;
  wasClean: boolean;
}

export interface AudioStats {
  bytesReceived: number;
  bytesSent: number;
  packetsLost: number;
  latency: number;
  jitter: number;
  timestamp: number;
}
```

### 3. Session & Transcript Types
```typescript
// File: src/types/session.ts
export interface SessionMetrics {
  duration: number;
  interactionCount: number;
  responseLatency: number;
  audioQuality: number;
  transcriptAccuracy: number;
}

export interface TranscriptEntry {
  id: string;
  text: string;
  timestamp: number;
  speaker: 'student' | 'tutor';
  confidence?: number;
  mathContent?: boolean;
}

export interface SessionEvent {
  type: 'start' | 'end' | 'error' | 'transcript';
  timestamp: number;
  data?: unknown;
}
```

### 4. AI Context Types
```typescript
// File: src/types/ai-context.ts
export interface LearningContext {
  studentId: string;
  subject: string;
  topic: string;
  difficulty: number;
  preferences: StudentPreferences;
  metadata?: Record<string, unknown>;
}

export interface StudentPreferences {
  learningStyle: 'visual' | 'auditory' | 'kinesthetic';
  pace: 'slow' | 'medium' | 'fast';
  mathNotation: 'standard' | 'latex' | 'simplified';
}

export interface CurriculumTopic {
  id: string;
  name: string;
  subject: string;
  grade: number;
  prerequisites: string[];
}
```

### 5. Performance & Memory Types
```typescript
// File: src/types/performance.ts
export interface DisplayBufferItem {
  id: string;
  content: string;
  timestamp: number;
  type: 'text' | 'math' | 'audio';
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
}

export interface MemoryEntry {
  key: string;
  data: unknown;
  size: number;
  accessed: number;
}
```

## Detailed Change Specifications

### Protected Core Changes (CRITICAL - Require Approval)

#### 1. websocket.contract.ts
**Before:**
```typescript
send(data: any): void;
```
**After:**
```typescript
send(data: WebSocketSendData): void;
```

#### 2. livekit/session-manager.ts
**Before:**
```typescript
private handleConnectionQualityChange(quality: any, participant?: Participant): void
private handleDisconnection(reason?: any): void
```
**After:**
```typescript
private handleConnectionQualityChange(quality: ConnectionQuality, participant?: Participant): void
private handleDisconnection(reason?: DisconnectionReason): void
```

#### 3. livekit/audio-manager.ts
**Before:**
```typescript
private processAudioStats(stats: any[]): void
```
**After:**
```typescript
private processAudioStats(stats: AudioStats[]): void
```

### Feature Code Changes (20 files)

#### 4. VoiceSessionManager.ts
**Before:**
```typescript
return transcripts.map((t: any) => ({
private emit(event: string, data?: any): void
```
**After:**
```typescript
return transcripts.map((t: TranscriptEntry) => ({
private emit(event: string, data?: SessionEvent): void
```

#### 5. Test Files (4 locations)
**Before:**
```typescript
let useVoiceSession: any;
let useSessionState: any;
let useSessionMetrics: any;
let useOptimizedDisplayBuffer: any;
```
**After:**
```typescript
let useVoiceSession: jest.MockedFunction<typeof import('../hooks/useVoiceSession').useVoiceSession>;
let useSessionState: jest.MockedFunction<typeof import('../hooks/useSessionState').useSessionState>;
let useSessionMetrics: jest.MockedFunction<typeof import('../hooks/useSessionMetrics').useSessionMetrics>;
let useOptimizedDisplayBuffer: jest.MockedFunction<typeof import('../hooks/useOptimizedDisplayBuffer').useOptimizedDisplayBuffer>;
```

[Additional 15 specific change specifications continue...]

## Implementation Strategy

### Phase 1: Create Type Definitions (5 minutes)
1. Create `src/types/` directory structure
2. Define all interface files listed above
3. Ensure proper exports and imports

### Phase 2: Protected Core Fixes (10 minutes)
1. Update WebSocket contract interface
2. Fix LiveKit session manager types
3. Fix audio manager types
4. Verify all protected core 'any' types eliminated

### Phase 3: Feature Code Fixes (15 minutes)
1. Update VoiceSessionManager and SessionRecovery
2. Fix test file type declarations
3. Update hooks and components
4. Fix lib utility functions

### Phase 4: Verification (5 minutes)
1. Run TypeScript compilation (must be 0 errors)
2. Run constitutional verification (must show 0 'any' types)
3. Run test suite (must pass)
4. Verify strict mode compliance

## Risk Assessment
- **Risk Level**: MEDIUM (comprehensive changes but well-defined types)
- **Rollback Strategy**: Git revert to current state
- **Testing Required**: Full TypeScript compilation + test suite
- **Dependencies**: None (purely type safety improvements)

## Success Criteria
1. Constitutional verification shows 0 'any' types (reduction from 24 to 0)
2. TypeScript compilation maintains 0 errors
3. All tests continue to pass
4. Type safety improved throughout codebase
5. Constitutional compliance score increases significantly

## Constitutional Impact
- **Current**: 24 'any' type violations (major constitutional violation)
- **Target**: 0 'any' type violations (full compliance)
- **Compliance Impact**: Major improvement toward 95%+ target

## Approval Required
This change affects protected core and 24 files across the codebase. Requires explicit approval for comprehensive type safety restoration.

**Approval Needed From**: Project Stakeholder
**Current Status**: APPROVED
**Implementation Authorization**: GRANTED 2025-09-21 19:05 PST

---

**Change Record Created**: 2025-09-21 19:00 PST
**Next Action**: Await approval for comprehensive 'any' type elimination
**Constitutional Impact**: Critical compliance violation resolution