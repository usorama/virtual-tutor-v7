# Audio Fix Usage Instructions - September 2025

## 🎯 Quick Start

### 1. Test Audio Configuration
```bash
# Run comprehensive audio test
python test_audio_output.py
```

### 2. Test Console Mode (Local Audio)
```bash
# Test audio without LiveKit server
python console_test_agent.py console
```

### 3. Run Fixed Agent
```bash
# Start the fixed AI teacher agent
python agent.py dev
```

## 🔧 Applied Fixes

### ✅ Critical Issues Resolved:
1. **google-genai Version**: Downgraded to 0.3.0 (fixed plugin compatibility)
2. **Audio Session Management**: Added AudioSessionManager for macOS
3. **Enhanced VAD Configuration**: Optimized for better turn detection
4. **Audio Output Configuration**: Explicit speaker enablement
5. **RealtimeModel Settings**: Improved audio quality and responsiveness
6. **Error Recovery**: Fallback mechanisms for audio failures

### 🎤 Audio Configuration Changes:
- **Sample Rate**: 48000 Hz (higher quality)
- **Channels**: Mono (optimized for voice)
- **Format**: PCM Float32 (better quality)
- **VAD Sensitivity**: Tuned for natural conversation
- **Endpointing Delays**: Reduced for faster response

## 🧪 Testing Protocol

### Level 1: Basic Test
```bash
python test_audio_output.py
```
**Expected**: All tests pass, especially "RealtimeModel Creation"

### Level 2: Console Test
```bash
python console_test_agent.py console
```
**Expected**: You can speak and hear AI responses locally

### Level 3: Full Agent Test
```bash
python agent.py dev
```
**Expected**: AI Teacher works with full LiveKit integration

## 🚨 Troubleshooting

### Audio Not Working?
1. Check microphone permissions in System Preferences
2. Verify speakers are set as default audio output
3. Test with different audio devices
4. Check for audio conflicts with other apps

### Console Mode Issues?
1. Ensure GOOGLE_API_KEY is set
2. Check internet connection
3. Try different voice commands
4. Verify google-genai version is 0.3.0

### LiveKit Connection Issues?
1. Verify LIVEKIT_* environment variables
2. Check network connectivity
3. Test with a different room name
4. Monitor logs for specific error messages

## 📋 Environment Requirements

### Required Variables:
- `GOOGLE_API_KEY`: Google Gemini API key
- `LIVEKIT_API_KEY`: LiveKit API key
- `LIVEKIT_API_SECRET`: LiveKit API secret
- `LIVEKIT_API_URL`: LiveKit server URL

### Optional Variables:
- `DEEPGRAM_API_KEY`: For enhanced STT
- `NEXT_PUBLIC_SUPABASE_URL`: For database features
- `SUPABASE_SERVICE_ROLE_KEY`: For backend integration

## 🔄 Rollback Instructions

If issues occur, restore the original:
```bash
# Find your backup file
ls agent_backup_*.py

# Restore original (replace YYYYMMDD_HHMMSS with your backup timestamp)
cp agent_backup_YYYYMMDD_HHMMSS.py agent.py
```

## 📞 Support

If audio issues persist:
1. Check the backup file: `agent_backup_*.py`
2. Review test outputs for specific errors
3. Compare working Phase 3 branch if needed
4. Verify macOS audio system settings

Generated: $(date)
