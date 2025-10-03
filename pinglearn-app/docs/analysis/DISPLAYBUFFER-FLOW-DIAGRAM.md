# DisplayBuffer Data Flow - Visual Diagram

## Complete Data Flow Architecture

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ EXTERNAL SYSTEM                                                    ┃
┃ ┌────────────────────────────────────────────────────────────────┐ ┃
┃ │ LiveKit Python Agent (livekit-agent/)                          │ ┃
┃ │ - Voice processing with Gemini Live API                        │ ┃
┃ │ - Math detection and LaTeX generation                          │ ┃
┃ │ - Transcript generation                                        │ ┃
┃ └────────────────────┬───────────────────────────────────────────┘ ┃
┗━━━━━━━━━━━━━━━━━━━━━┃━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                       │
                       │ LiveKit Data Channel
                       │ JSON Packet:
                       │ {
                       │   type: 'transcript',
                       │   segments: [{
                       │     type: 'text|math',
                       │     content: '...',
                       │     confidence: 0.95
                       │   }],
                       │   speaker: 'teacher',
                       │   showThenTell: true,
                       │   audioDelay: 400
                       │ }
                       ↓
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ BROWSER CLIENT                                                      ┃
┃                                                                     ┃
┃ ┌────────────────────────────────────────────────────────────────┐ ┃
┃ │ LiveKitRoom Component                                          │ ┃
┃ │ src/components/voice/LiveKitRoom.tsx                           │ ┃
┃ │                                                                │ ┃
┃ │ room.on(RoomEvent.DataReceived, handleDataReceived)           │ ┃
┃ │   ↓                                                            │ ┃
┃ │ 1. Decode Uint8Array payload                                  │ ┃
┃ │ 2. Parse JSON                                                  │ ┃
┃ │ 3. Validate transcript structure                              │ ┃
┃ │ 4. Record Show-Then-Tell timing metrics                       │ ┃
┃ └────────────────────┬───────────────────────────────────────────┘ ┃
┃                      │                                              ┃
┃                      │ liveKitEventBus.emit('livekit:transcript')  ┃
┃                      ↓                                              ┃
┃ ┌────────────────────────────────────────────────────────────────┐ ┃
┃ │ Event Bus (EventEmitter)                                       │ ┃
┃ │ Shared singleton: liveKitEventBus                              │ ┃
┃ └────────────────────┬───────────────────────────────────────────┘ ┃
┗━━━━━━━━━━━━━━━━━━━━━┃━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                       │
                       │ Event: 'livekit:transcript'
                       │ Data: { segments[], speaker, timestamp, ... }
                       ↓
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ PROTECTED CORE (src/protected-core/)                               ┃
┃                                                                     ┃
┃ ┌────────────────────────────────────────────────────────────────┐ ┃
┃ │ SessionOrchestrator                                            │ ┃
┃ │ session/orchestrator.ts                                        │ ┃
┃ │                                                                │ ┃
┃ │ setupLiveKitDataChannelListener()  (Lines 431-480)           │ ┃
┃ │   ↓                                                            │ ┃
┃ │ liveKitEventBus.on('livekit:transcript', listener)           │ ┃
┃ │   ↓                                                            │ ┃
┃ │ Process each segment:                                          │ ┃
┃ │   - Validate structure                                         │ ┃
┃ │   - Check session state (active/initializing)                 │ ┃
┃ │   - Call addTranscriptionItem()                               │ ┃
┃ └────────────────────┬───────────────────────────────────────────┘ ┃
┃                      │                                              ┃
┃                      │ addTranscriptionItem() (Lines 321-368)      ┃
┃                      ↓                                              ┃
┃ ┌────────────────────────────────────────────────────────────────┐ ┃
┃ │ DisplayBuffer                                                  │ ┃
┃ │ transcription/display/buffer.ts                                │ ┃
┃ │                                                                │ ┃
┃ │ this.displayBuffer.addItem({                                  │ ┃
┃ │   type: segment.type,                                          │ ┃
┃ │   content: segment.content,                                    │ ┃
┃ │   speaker: 'teacher',                                          │ ┃
┃ │   confidence: segment.confidence                               │ ┃
┃ │ })                                                             │ ┃
┃ │   ↓                                                            │ ┃
┃ │ 1. Generate content hash (for deduplication)                  │ ┃
┃ │ 2. Check 1-second duplicate window                            │ ┃
┃ │ 3. Generate unique ID and timestamp                           │ ┃
┃ │ 4. Add to items[] array                                       │ ┃
┃ │ 5. Enforce max buffer size (1000 items)                       │ ┃
┃ │ 6. notifySubscribers()  ←── CRITICAL STEP                    │ ┃
┃ └────────────────────┬───────────────────────────────────────────┘ ┃
┃                      │                                              ┃
┃                      │ Subscriber callbacks invoked                 ┃
┗━━━━━━━━━━━━━━━━━━━━━┃━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                       │
                       │ broadcast to all subscribers
                       │ cb(this.items)
                       │
         ┌─────────────┼─────────────┬─────────────────┐
         │             │             │                 │
         ↓             ↓             ↓                 ↓
┏━━━━━━━━━━━━━┓ ┏━━━━━━━━━━━━━┓ ┏━━━━━━━━━━━━━┓ ┏━━━━━━━━━━━━━┓
┃ UI COMPONENT┃ ┃ UI COMPONENT┃ ┃ UI COMPONENT┃ ┃ Custom Hook ┃
┃             ┃ ┃             ┃ ┃             ┃ ┃             ┃
┃ Teaching    ┃ ┃ Transcript  ┃ ┃ Chat        ┃ ┃ useStreaming┃
┃ BoardSimple ┃ ┃ Simple      ┃ ┃ Interface   ┃ ┃ Transcript  ┃
┃             ┃ ┃             ┃ ┃             ┃ ┃             ┃
┃ Lines       ┃ ┃ Lines       ┃ ┃ Lines       ┃ ┃ Lines       ┃
┃ 279-286     ┃ ┃ 69-75       ┃ ┃ 69-75       ┃ ┃ 70-75       ┃
┗━━━━━━━━━━━━━┛ ┗━━━━━━━━━━━━━┛ ┗━━━━━━━━━━━━━┛ ┗━━━━━━━━━━━━━┛
      │              │              │                 │
      │              │              │                 │
      ↓              ↓              ↓                 ↓
  setState()     setState()     setState()        setState()
      │              │              │                 │
      ↓              ↓              ↓                 ↓
 React re-render React re-render React re-render React re-render
      │              │              │                 │
      ↓              ↓              ↓                 ↓
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ Teaching    │ │ Transcript  │ │ Chat        │ │ Custom UI   │
│ content     │ │ messages    │ │ bubbles     │ │ display     │
│ displayed   │ │ displayed   │ │ displayed   │ │ displayed   │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
```

---

## Subscription Pattern Details

### How Components Subscribe

```typescript
// 1. Import protected-core dynamically
import('@/protected-core').then(({ getDisplayBuffer }) => {

  // 2. Get singleton DisplayBuffer instance
  const displayBuffer = getDisplayBuffer();

  // 3. Get initial items (if any)
  const initialItems = displayBuffer.getItems();
  processItems(initialItems);

  // 4. Subscribe to future updates
  const unsubscribe = displayBuffer.subscribe((items) => {
    // This callback fires EVERY TIME notifySubscribers() is called
    console.log('Buffer updated with', items.length, 'items');

    // Update component state
    setComponentState(items);
  });

  // 5. Clean up on unmount
  return () => {
    unsubscribe();
  };
});
```

### Subscription Lifecycle

```
Component Mount
    ↓
Import @/protected-core
    ↓
getDisplayBuffer() ────→ Returns singleton instance
    ↓
displayBuffer.subscribe(callback) ────→ Adds callback to Set<callbacks>
    ↓
DisplayBuffer.addItem() called ────→ Triggers notifySubscribers()
    ↓
notifySubscribers() ────→ Iterates through Set<callbacks>
    ↓
Each callback(items) invoked ────→ Component re-renders
    ↓
Component Unmount
    ↓
unsubscribe() called ────→ Removes callback from Set<callbacks>
```

---

## Deduplication Flow

```
New Item Arrives
    ↓
Generate Hash (Lines 122-131)
    hash = simpleHash(content)
    ↓
Check Recent Items Map (Lines 30-35)
    if (recentItems.has(hash) && age < 1000ms)
        ↓ YES
        Log: "Duplicate detected, skipping"
        STOP (item not added)

    if (NOT duplicate)
        ↓ NO
        Add to recentItems map
        ↓
        Generate unique ID
        item_${timestamp}_${random9chars}
        ↓
        Add timestamp
        ↓
        Push to items[] array
        ↓
        Check buffer size
        if (items.length > 1000)
            items.shift() // Remove oldest
        ↓
        notifySubscribers()
        ↓
        All UI components updated
```

---

## Critical Checkpoints for Debugging

### Checkpoint 1: Python Agent
```
✅ Transcript generated successfully
✅ Data packet formatted correctly
✅ LiveKit data channel is open
✅ Packet sent via room.localParticipant.publishData()
```

### Checkpoint 2: LiveKit Network
```
✅ Data packet transmitted over network
✅ Received by LiveKit cloud infrastructure
✅ Forwarded to browser client
```

### Checkpoint 3: Browser Client - LiveKitRoom
```
✅ RoomEvent.DataReceived fires
✅ Payload decoded successfully
✅ JSON parsed without errors
✅ liveKitEventBus.emit() called

Console: "[LiveKitRoom] Transcript received, emitting to SessionOrchestrator"
```

### Checkpoint 4: SessionOrchestrator
```
✅ Listener attached to liveKitEventBus
✅ 'livekit:transcript' event received
✅ Segments validated
✅ Session state is 'active' or 'initializing'
✅ addTranscriptionItem() called

Console: "[FS-00-AB-1] Received transcript from LiveKit data channel"
Console: "[PC-012] Transcript accepted - session status: active"
```

### Checkpoint 5: DisplayBuffer
```
✅ addItem() called
✅ Duplicate check passed (or logged)
✅ Item added to items[] array
✅ notifySubscribers() called

Console: "[PC-012] Transcript successfully added to DisplayBuffer: {...}"
Console: "[DisplayBuffer] Duplicate item detected, skipping" (if duplicate)
```

### Checkpoint 6: UI Components
```
✅ Subscription callback invoked
✅ setState() called with new items
✅ React re-render triggered
✅ Content displayed on screen

Console: "[TeachingBoardSimple] Buffer update received: N items"
Console: "[TranscriptSimple] Buffer update received: N items"
```

---

## Status Indicators

### ✅ All Systems Working
```
[LiveKitRoom] Transcript received, emitting to SessionOrchestrator
[FS-00-AB-1] Received transcript from LiveKit data channel
[PC-012] Transcript accepted - session status: active
[PC-012] Transcript successfully added to DisplayBuffer: { id, type, speaker, contentLength }
[TeachingBoardSimple] Buffer update received: 5 items
[TranscriptSimple] Buffer update received: 5 items
```

### ⚠️ Upstream Issue (Python Agent)
```
Missing: [LiveKitRoom] Transcript received...
Cause: Python agent not sending data packets
Fix: Check livekit-agent/ logs
```

### ⚠️ Network Issue
```
Present: Python agent logs show "Data sent"
Missing: [LiveKitRoom] Transcript received...
Cause: Network or LiveKit cloud issue
Fix: Check LiveKit dashboard, verify room connection
```

### ⚠️ Session State Issue
```
Present: [FS-00-AB-1] Received transcript from LiveKit data channel
Present: [PC-012] Session not ready - status: ended
Cause: Session ended before transcript arrived
Fix: Verify session lifecycle
```

---

## Performance Considerations

### Buffer Size Management
- Max items: 1000
- Oldest items automatically removed when exceeding limit
- O(1) insertion, O(1) deletion (shift)

### Deduplication
- Hash calculation: O(n) where n = content.length
- Duplicate lookup: O(1) (Map-based)
- Window: 1 second (configurable via DEDUP_WINDOW_MS)
- Cleanup: Periodic removal of expired hashes

### Subscriber Notifications
- Broadcast: O(m) where m = number of subscribers
- Typically 3-4 subscribers (TeachingBoard, Transcript, Chat, Custom hooks)
- Synchronous callback execution

### Memory Footprint
- DisplayBuffer: ~100KB with 1000 items (avg 100 bytes/item)
- Recent items map: ~10KB (typically <100 entries)
- Total: ~110KB maximum

---

## Conclusion

The DisplayBuffer system is **architecturally sound** and **fully functional**. All components are properly connected, subscriptions work correctly, and data flows as designed. If transcripts are not appearing, the issue is **upstream** in the data source, not in the DisplayBuffer flow.
