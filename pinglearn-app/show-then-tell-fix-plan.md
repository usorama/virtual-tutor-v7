# Show-Then-Tell Audio Timing Fix - Implementation Plan

## 🎯 Mission: Fix Audio-Visual Synchronization

**PROBLEM**: Currently delays visual by 400ms, but we need to delay AUDIO by 400ms
**GOAL**: Show visual content FIRST, then play audio 400ms later

## 📋 Implementation Steps

### Step 1: Remove Incorrect Visual Delay ✅ READY
**File**: `src/components/classroom/TeachingBoardSimple.tsx`
**Change**: Remove 400ms setTimeout for visual display
**Line**: 242-245 (the setTimeout that delays processBufferItems)

### Step 2: Implement Audio Delay Buffer 🔧 MAIN TASK
**File**: `src/components/voice/LiveKitRoom.tsx`
**Strategy**:
- Prevent automatic audio attachment
- Create manual audio control with 400ms delay
- Buffer audio data and play with timing control

### Step 3: Coordinate Timing Events 🎯 CRITICAL
**Approach**: Use event-based communication
- Visual displays immediately when data received
- Audio delay triggers 400ms later
- Perfect show-then-tell methodology

## 🔧 Technical Implementation

### Audio Delay Mechanism Options:

**Option A: Frontend Audio Buffering** (RECOMMENDED)
- Capture audio stream before it plays
- Delay audio playback by 400ms
- Keep visual instant

**Option B: LiveKit Track Control**
- Use track mute/unmute with timing
- More complex but cleaner separation

**Option C: Python Agent Delay** (NOT RECOMMENDED)
- Would require coordinating with visual timing
- More complex cross-system timing

## 🎯 Success Criteria

1. Visual content appears immediately when data received
2. Audio starts playing 400ms after visual appears
3. Perfect show-then-tell methodology achieved
4. No regression in audio quality or functionality

## ⚠️ Risk Assessment

**LOW RISK**: Visual delay removal (just removing setTimeout)
**MEDIUM RISK**: Audio timing mechanism (requires careful testing)
**HIGH RISK**: Breaking existing audio functionality

## 🧪 Testing Plan

1. Remove visual delay first (safe change)
2. Test audio delay mechanism in isolation
3. Integration testing for perfect timing
4. Verify no regression in voice quality