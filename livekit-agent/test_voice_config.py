#!/usr/bin/env python3
"""
Test script to verify Gemini Live API voice-to-voice configuration
"""

import os
import sys
import asyncio
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def check_credentials():
    """Check if all required credentials are set"""
    missing = []

    credentials = {
        "GOOGLE_API_KEY": os.getenv("GOOGLE_API_KEY"),
        "LIVEKIT_API_KEY": os.getenv("LIVEKIT_API_KEY"),
        "LIVEKIT_API_SECRET": os.getenv("LIVEKIT_API_SECRET"),
        "DEEPGRAM_API_KEY": os.getenv("DEEPGRAM_API_KEY"),
    }

    for key, value in credentials.items():
        if not value:
            missing.append(key)
        else:
            print(f"✓ {key}: {'*' * 8}{value[-4:] if len(value) > 4 else '****'}")

    if missing:
        print(f"\n⚠️  Missing credentials: {', '.join(missing)}")
        print("\nNote: DEEPGRAM_API_KEY is optional but recommended for turn detection")

    return len(missing) == 0 or (len(missing) == 1 and missing[0] == "DEEPGRAM_API_KEY")

async def test_imports():
    """Test if all required imports work"""
    try:
        from livekit.plugins import google, deepgram, silero
        from livekit.plugins.turn_detector.english import EnglishModel
        print("✓ All plugin imports successful")

        # Test RealtimeModel availability
        if hasattr(google, 'RealtimeModel'):
            print("✓ google.RealtimeModel is available")
        else:
            print("⚠️  google.RealtimeModel not found - using fallback configuration")

        return True
    except ImportError as e:
        print(f"✗ Import error: {e}")
        return False

async def test_gemini_connection():
    """Test basic Gemini API connection"""
    try:
        import google.generativeai as genai

        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            print("⚠️  Cannot test Gemini connection - API key missing")
            return False

        genai.configure(api_key=api_key)

        # List available models
        models = genai.list_models()
        gemini_flash_found = False

        for model in models:
            if "gemini-2.0-flash" in model.name.lower():
                gemini_flash_found = True
                print(f"✓ Found Gemini 2.0 Flash model: {model.name}")
                break

        if not gemini_flash_found:
            print("⚠️  Gemini 2.0 Flash model not found in available models")

        return True
    except Exception as e:
        print(f"✗ Gemini connection error: {e}")
        return False

def main():
    """Run all tests"""
    print("=" * 60)
    print("Virtual Tutor Voice-to-Voice Configuration Test")
    print("=" * 60)
    print()

    print("1. Checking credentials...")
    print("-" * 40)
    creds_ok = check_credentials()
    print()

    print("2. Testing imports...")
    print("-" * 40)
    imports_ok = asyncio.run(test_imports())
    print()

    print("3. Testing Gemini connection...")
    print("-" * 40)
    gemini_ok = asyncio.run(test_gemini_connection())
    print()

    print("=" * 60)
    print("Test Results Summary:")
    print("=" * 60)

    if creds_ok and imports_ok and gemini_ok:
        print("✅ All tests passed! Voice-to-voice configuration is ready.")
        print("\nNext steps:")
        print("1. Ensure DEEPGRAM_API_KEY is set for optimal turn detection")
        print("2. Run the agent with: python agent.py dev")
        print("3. Connect from the frontend classroom interface")
    else:
        print("⚠️  Some tests failed. Please review the issues above.")
        print("\nTroubleshooting:")
        print("- Check your .env file has all required API keys")
        print("- Ensure all dependencies are installed: pip install -r requirements.txt")
        print("- Verify your Google API key has access to Gemini 2.0 Flash")

    return 0 if (creds_ok and imports_ok and gemini_ok) else 1

if __name__ == "__main__":
    sys.exit(main())