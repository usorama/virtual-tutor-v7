#!/bin/bash

# Audio Fix Application Script - September 2025
# Applies comprehensive fixes for AI Teacher audio output on macOS

set -e  # Exit on any error

echo "🔧 Virtual Tutor Audio Fix Application Script"
echo "=============================================="
echo "📅 Date: $(date)"
echo "🎯 Target: macOS audio output for AI Teacher"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [[ ! -f "agent.py" ]]; then
    print_error "agent.py not found in current directory"
    print_error "Please run this script from the livekit-agent directory"
    exit 1
fi

print_status "Current directory: $(pwd)"

# Step 1: Backup original agent.py
print_status "Creating backup of original agent.py..."
BACKUP_FILE="agent_backup_$(date +%Y%m%d_%H%M%S).py"
cp agent.py "$BACKUP_FILE"
print_success "Backup created: $BACKUP_FILE"

# Step 2: Apply the fixed version
print_status "Applying fixed agent implementation..."
if [[ -f "agent_fixed.py" ]]; then
    cp agent_fixed.py agent.py
    print_success "Fixed agent.py applied successfully"
else
    print_error "agent_fixed.py not found!"
    print_error "Please ensure the fixed version was created properly"
    exit 1
fi

# Step 3: Verify google-genai version
print_status "Checking google-genai version..."
GENAI_VERSION=$(./venv/bin/pip show google-genai | grep Version | cut -d' ' -f2)
print_status "Current google-genai version: $GENAI_VERSION"

if [[ "$GENAI_VERSION" == "0.3.0" ]]; then
    print_success "google-genai version is correct (0.3.0)"
else
    print_warning "google-genai version is $GENAI_VERSION, should be 0.3.0"
    print_status "Applying version fix..."
    ./venv/bin/pip install google-genai==0.3.0
    print_success "google-genai downgraded to 0.3.0"
fi

# Step 4: Verify environment variables
print_status "Checking environment variables..."
source .env 2>/dev/null || print_warning "No .env file found"

required_vars=("GOOGLE_API_KEY" "LIVEKIT_API_KEY" "LIVEKIT_API_SECRET" "LIVEKIT_API_URL")
missing_vars=()

for var in "${required_vars[@]}"; do
    if [[ -z "${!var}" ]]; then
        missing_vars+=("$var")
    else
        print_success "$var is set"
    fi
done

if [[ ${#missing_vars[@]} -gt 0 ]]; then
    print_error "Missing required environment variables:"
    for var in "${missing_vars[@]}"; do
        print_error "  - $var"
    done
    print_warning "Please set these variables before running the agent"
fi

# Step 5: Create test scripts permissions
print_status "Setting up test scripts..."
chmod +x test_audio_output.py 2>/dev/null || print_warning "test_audio_output.py not found"
chmod +x console_test_agent.py 2>/dev/null || print_warning "console_test_agent.py not found"

# Step 6: Audio system check (macOS specific)
print_status "Checking macOS audio system..."
if [[ "$(uname)" == "Darwin" ]]; then
    # Check audio devices
    AUDIO_DEVICES=$(system_profiler SPAudioDataType -json 2>/dev/null | jq '.SPAudioDataType | length' 2>/dev/null || echo "unknown")
    if [[ "$AUDIO_DEVICES" != "unknown" ]] && [[ "$AUDIO_DEVICES" -gt 0 ]]; then
        print_success "Found $AUDIO_DEVICES audio devices"
    else
        print_warning "Could not detect audio devices"
    fi

    # Check for system audio permission issues
    if [[ -x /usr/bin/tccutil ]]; then
        print_status "Checking microphone permissions..."
        print_warning "If prompted, please grant microphone access to Python/Terminal"
    fi
else
    print_warning "Not running on macOS - some audio checks skipped"
fi

# Step 7: Generate usage instructions
print_status "Generating usage instructions..."

cat > AUDIO_FIX_USAGE.md << 'EOF'
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
EOF

print_success "Usage instructions created: AUDIO_FIX_USAGE.md"

# Final status
echo ""
echo "🎉 Audio Fix Application Complete!"
echo "=================================="
print_success "✅ Original agent.py backed up as: $BACKUP_FILE"
print_success "✅ Fixed agent.py applied"
print_success "✅ google-genai version verified/fixed"
print_success "✅ Test scripts prepared"
print_success "✅ Usage instructions created"
echo ""
print_status "Next Steps:"
echo "1. 🧪 Run: python test_audio_output.py"
echo "2. 🎮 Test: python console_test_agent.py console"
echo "3. 🚀 Deploy: python agent.py dev"
echo ""
print_status "📖 Read AUDIO_FIX_USAGE.md for detailed instructions"