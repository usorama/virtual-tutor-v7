# Virtual Tutor Implementation Guide

## 🎯 Mission Critical Information

You are building a virtual tutor app that has failed 5 times before due to AI-induced code degradation. This guide ensures success by implementing strict controls and evidence-based development practices.

## ⚡ Quick Start Checklist

```bash
# 1. Initialize the project
cd ~/Projects/vt-new-2
./scripts/init-project.sh

# 2. Set up credentials
cp .env.example .env.local
# Edit .env.local with your actual keys

# 3. Install dependencies
npm install

# 4. Initialize Git
git init
git add .
git commit -m "stable: initial project setup"

# 5. Run first validation
npm run detect:issues
```

## 🏗️ Phase-by-Phase Implementation

### Phase 1: Foundation (Days 1-3)
**Goal:** Stable Next.js base with authentication

#### Manual Tasks (No AI):
1. Set up Next.js App Router structure
2. Configure Supabase authentication
3. Create base layouts and error boundaries
4. Set up TypeScript strict mode

#### Validation Checkpoint:
```bash
npm run build
npm run test:ci
git commit -m "stable: foundation complete"
```

### Phase 2: LiveKit Integration (Days 4-6)
**Goal:** Working WebRTC video/audio

#### Constrained AI Tasks:
```bash
# Use specific prompts for each component
cat ai-prompts/templates/livekit-room.md | pbcopy
# Then ask AI to implement ONLY the room component

cat ai-prompts/templates/livekit-token.md | pbcopy
# Then ask AI to implement ONLY token generation
```

#### Critical Implementation:
```typescript
// lib/config/livekit.config.ts
export const LIVEKIT_CONFIG = {
  serverUrl: process.env.NEXT_PUBLIC_LIVEKIT_URL!,
  apiKey: process.env.LIVEKIT_API_KEY!,
  apiSecret: process.env.LIVEKIT_API_SECRET!,
  roomSettings: {
    videoCaptureDefaults: {
      resolution: VideoPresets.h720.resolution,
      facingMode: 'user'
    },
    audioCaptureDefaults: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    }
  }
} as const;
```

#### Test in Isolation:
```bash
# Create test room
npm run test -- src/infrastructure/livekit/
```

### Phase 3: Gemini Integration (Days 7-10)
**Goal:** AI responses via audio pipeline

#### Critical Technical Requirements:
- **Audio Format:** 16kHz PCM (Gemini requirement)
- **Connection:** Via LiveKit data channels
- **Latency:** < 500ms target

#### Implementation Order:
1. Audio converter service (16kHz PCM)
2. Gemini session manager
3. Audio bridge between LiveKit and Gemini
4. Response handler

#### Key Code Structure:
```typescript
// infrastructure/gemini/AudioBridge.ts
export class AudioBridge {
  private readonly SAMPLE_RATE = 16000; // Gemini requirement
  
  async bridgeAudio(
    liveKitTrack: RemoteAudioTrack,
    geminiSession: GeminiLiveSession
  ): Promise<void> {
    // Implementation with proper error handling
  }
}
```

### Phase 4: Tutoring Features (Days 11-14)
**Goal:** Educational interactions

Only implement after core pipeline works:
- Lesson management
- Q&A system
- Progress tracking
- Session recordings

## 🚨 Black Hole Prevention Protocol

### Early Warning Signs:
1. **Duplication Detected:**
   ```bash
   npm run check:duplicates
   # If > 0, STOP and clean up
   ```

2. **Context Growing:**
   ```bash
   npm run ai:context
   # If > 1500 tokens, trim immediately
   ```

3. **Multiple Debug Attempts:**
   - After 2 failed attempts: Stop
   - After 3 failed attempts: Run recovery
   ```bash
   npm run recover:stable
   ```

### When Working with AI:

#### DO:
- Give ONE specific task at a time
- Provide full file path and layer
- Include working examples
- Test immediately after generation
- Commit working code with "validated:" prefix

#### DON'T:
- Ask for "fixes" without specific error
- Let AI modify tests
- Accept code without testing
- Continue after 3 debug attempts
- Allow architecture changes

## 📊 Daily Workflow

### Morning (5 min):
```bash
npm run morning:setup
git pull
npm run detect:issues
```

### During Development:
```bash
# Before AI request
npm run ai:context

# After AI generates code
npm run test:isolated -- [new-file]
npm run check:duplicates

# If all good
git add [specific-files]
git commit -m "validated: [feature]"
```

### Evening (5 min):
```bash
npm run evening:validate
npm run detect:issues
git push
```

## 🔧 Troubleshooting Guide

### Problem: Build Fails
```bash
# Don't ask AI to fix generally
# Instead:
npm run build 2>&1 | head -20  # Get specific error
# Fix only that specific error
```

### Problem: Duplicate Services
```bash
# Identify duplicates
find src -name "*Service.ts" | sort
# Keep best implementation
# Delete others
# Update imports
```

### Problem: Tests Failing
```bash
# Never let AI modify test expectations
# Fix the implementation instead
npm test -- --verbose
# Identify root cause
# Fix implementation, not test
```

### Problem: Context Pollution
```bash
# Reset context
echo "" > ai-context/TEMP_CONTEXT.md
npm run ai:context
# Remove unnecessary details
```

## 📈 Success Metrics

Track these daily:
- [ ] Zero duplicates (jscpd)
- [ ] Context < 2000 tokens
- [ ] All tests passing
- [ ] Successful build
- [ ] No console.logs in src/

## 🎓 Lessons from Previous Failures

1. **Failure 1-2:** No architecture → chaos
   - **Solution:** Clean architecture enforced

2. **Failure 3:** AI created multiple frontends
   - **Solution:** Single app/ directory rule

3. **Failure 4:** Debugging spiral
   - **Solution:** 3-attempt limit

4. **Failure 5:** Context explosion
   - **Solution:** 2000 token limit

## 🚀 Path to Success

1. **Week 1:** Foundation + LiveKit ✓
2. **Week 2:** Gemini Integration ✓
3. **Week 3:** Core Features ✓
4. **Week 4:** Polish & Deploy ✓

## 📞 Emergency Contacts

- LiveKit Support: https://livekit.io/support
- Gemini API: https://ai.google.dev/gemini-api/support
- Supabase: https://supabase.com/support

## ✅ Final Checklist Before Production

- [ ] All phases validated
- [ ] Zero code duplication
- [ ] 80%+ test coverage
- [ ] Security audit passed
- [ ] Performance < 500ms latency
- [ ] Documentation complete
- [ ] Recovery procedures tested

---

**Remember:** This is attempt #6. We will succeed by maintaining discipline, validating everything, and never letting AI operate without constraints. When in doubt, implement manually.
