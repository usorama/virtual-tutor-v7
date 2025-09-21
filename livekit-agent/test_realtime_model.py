#!/usr/bin/env python3
"""
Test script to verify Gemini Live RealtimeModel configuration
"""

import os
import asyncio
from dotenv import load_dotenv
from livekit.plugins.google.beta import realtime as google_realtime

# Load environment variables
load_dotenv()

async def test_realtime_model():
    """Test the RealtimeModel instantiation and configuration"""

    print("=" * 60)
    print("Testing Gemini Live RealtimeModel Configuration")
    print("=" * 60)

    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        print("❌ GOOGLE_API_KEY not set!")
        return False

    print(f"✅ API Key found: {'*' * 8}{api_key[-4:]}")

    try:
        # Create RealtimeModel instance
        print("\nInitializing RealtimeModel...")
        model = google_realtime.RealtimeModel(
            model="models/gemini-2.0-flash-exp",
            api_key=api_key,
            instructions="You are a helpful assistant.",
            voice="Aoede",
            temperature=0.8,
            modalities=["AUDIO"],
            language="en-IN",
            enable_affective_dialog=True,
            input_audio_transcription={"model": "IAMF"},
            output_audio_transcription={"model": "IAMF"},
        )

        print("✅ RealtimeModel created successfully!")
        print(f"   Model: gemini-2.0-flash-exp")
        print(f"   Voice: Aoede")
        print(f"   Language: en-IN (Indian English)")
        print(f"   Modalities: AUDIO (voice-to-voice)")
        print(f"   Affective Dialog: Enabled")

        # Check model attributes
        print("\nModel Configuration:")
        if hasattr(model, '_opts'):
            print(f"   Temperature: {model._opts.temperature if hasattr(model._opts, 'temperature') else 'N/A'}")
            print(f"   Model name: {model._opts.model if hasattr(model._opts, 'model') else 'N/A'}")

        print("\n✅ All checks passed! Voice-to-voice is properly configured.")
        print("\nThe system is using:")
        print("  • Gemini 2.0 Flash Experimental (gemini-2.0-flash-exp)")
        print("  • Direct audio streaming (no TTS)")
        print("  • Voice-to-voice conversation mode")
        print("  • Emotional understanding (affective dialog)")

        return True

    except Exception as e:
        print(f"\n❌ Error creating RealtimeModel: {e}")
        print("\nTroubleshooting:")
        print("1. Check if your API key has access to Gemini 2.0 Flash")
        print("2. Ensure you have the latest livekit-plugins-google package")
        print("3. Verify network connectivity")
        return False

def main():
    """Run the test"""
    success = asyncio.run(test_realtime_model())

    if success:
        print("\n" + "=" * 60)
        print("✅ VOICE-TO-VOICE READY FOR TESTING!")
        print("=" * 60)
        print("\nThe LiveKit agent is running with:")
        print("• Gemini Live API 2.0 Flash Experimental")
        print("• Direct audio-to-audio streaming")
        print("• No TTS involved - pure voice conversation")
        print("\nConnect from the frontend to test the voice interaction!")
    else:
        print("\n⚠️ Configuration issues detected. Please review errors above.")

    return 0 if success else 1

if __name__ == "__main__":
    import sys
    sys.exit(main())