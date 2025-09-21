#!/usr/bin/env python3
"""
Audio Output Test Script for macOS - September 2025
Tests audio functionality before running the full agent
"""

import asyncio
import logging
import os
import json
from datetime import datetime
from livekit.plugins.google.beta import realtime as google_realtime
from livekit.plugins import silero
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("audio-test")

# Test audio configuration
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")

async def test_basic_audio_config():
    """Test basic audio configuration"""
    logger.info("🧪 Testing basic audio configuration...")

    try:
        # Test google-genai version
        import google.genai as genai
        logger.info(f"✅ google-genai version: {genai.__version__}")

        # Test Gemini API key
        if GOOGLE_API_KEY:
            logger.info("✅ Google API key is configured")
        else:
            logger.error("❌ Google API key is missing")
            return False

        return True
    except Exception as e:
        logger.error(f"❌ Basic config test failed: {e}")
        return False

async def test_realtime_model_creation():
    """Test RealtimeModel creation"""
    logger.info("🧪 Testing RealtimeModel creation...")

    try:
        model = google_realtime.RealtimeModel(
            model="models/gemini-2.0-flash-exp",
            instructions="You are a test AI assistant.",
            voice="Aoede",
            temperature=0.8,
            modalities=["AUDIO"],
            language="en-IN",
            enable_affective_dialog=True,
            input_audio_transcription={"model": "IAMF"},
            output_audio_transcription={"model": "IAMF"},
        )
        logger.info("✅ RealtimeModel created successfully")
        return True
    except Exception as e:
        logger.error(f"❌ RealtimeModel creation failed: {e}")
        return False

async def test_vad_configuration():
    """Test Voice Activity Detection"""
    logger.info("🧪 Testing VAD configuration...")

    try:
        vad = silero.VAD.load(
            min_speech_duration=0.2,
            min_silence_duration=0.5,
            threshold=0.5,
        )
        logger.info("✅ VAD configured successfully")
        return True
    except Exception as e:
        logger.error(f"❌ VAD configuration failed: {e}")
        return False

async def test_audio_system_info():
    """Test and display audio system information"""
    logger.info("🧪 Gathering audio system information...")

    try:
        import platform
        import subprocess

        # Get system info
        system_info = {
            "platform": platform.system(),
            "version": platform.version(),
            "machine": platform.machine(),
            "python_version": platform.python_version(),
        }

        logger.info(f"🖥️ System: {system_info}")

        # macOS specific audio info
        if platform.system() == "Darwin":
            try:
                # Get audio devices
                result = subprocess.run(
                    ["system_profiler", "SPAudioDataType", "-json"],
                    capture_output=True,
                    text=True,
                    timeout=10
                )

                if result.returncode == 0:
                    audio_data = json.loads(result.stdout)
                    logger.info("🔊 macOS audio system detected")

                    # Extract audio devices info
                    if 'SPAudioDataType' in audio_data:
                        devices = audio_data['SPAudioDataType']
                        logger.info(f"📱 Found {len(devices)} audio devices")

                        for device in devices[:3]:  # Show first 3 devices
                            name = device.get('_name', 'Unknown Device')
                            logger.info(f"  🎵 {name}")
                else:
                    logger.warning("⚠️ Could not get detailed audio device info")

            except Exception as e:
                logger.warning(f"⚠️ Could not get macOS audio info: {e}")

        return True
    except Exception as e:
        logger.error(f"❌ Audio system info test failed: {e}")
        return False

async def test_environment_variables():
    """Test all required environment variables"""
    logger.info("🧪 Testing environment variables...")

    required_vars = [
        "LIVEKIT_API_URL",
        "LIVEKIT_API_KEY",
        "LIVEKIT_API_SECRET",
        "GOOGLE_API_KEY",
    ]

    optional_vars = [
        "DEEPGRAM_API_KEY",
        "NEXT_PUBLIC_SUPABASE_URL",
        "SUPABASE_SERVICE_ROLE_KEY",
    ]

    all_good = True

    for var in required_vars:
        value = os.getenv(var)
        if value:
            logger.info(f"✅ {var}: {'*' * min(len(value), 10)}...")
        else:
            logger.error(f"❌ {var}: Missing (REQUIRED)")
            all_good = False

    for var in optional_vars:
        value = os.getenv(var)
        if value:
            logger.info(f"✅ {var}: {'*' * min(len(value), 10)}...")
        else:
            logger.warning(f"⚠️ {var}: Missing (Optional)")

    return all_good

async def test_package_versions():
    """Test package versions for compatibility"""
    logger.info("🧪 Testing package versions...")

    try:
        # Test google-genai version
        import google.genai as genai
        genai_version = genai.__version__
        logger.info(f"📦 google-genai: {genai_version}")

        if genai_version.startswith("0.3.0"):
            logger.info("✅ google-genai version is correct (0.3.0)")
        else:
            logger.warning(f"⚠️ google-genai version may be incompatible: {genai_version}")

        # Test livekit versions
        import livekit
        logger.info(f"📦 livekit: {livekit.__version__}")

        # Test other key packages
        packages_to_check = [
            "websockets",
            "asyncio",
            "logging",
        ]

        for package in packages_to_check:
            try:
                module = __import__(package)
                version = getattr(module, '__version__', 'unknown')
                logger.info(f"📦 {package}: {version}")
            except ImportError:
                logger.warning(f"⚠️ {package}: Not available")

        return True
    except Exception as e:
        logger.error(f"❌ Package version test failed: {e}")
        return False

async def run_comprehensive_audio_test():
    """Run comprehensive audio test suite"""
    logger.info("🚀 Starting Comprehensive Audio Test Suite")
    logger.info("=" * 60)

    test_results = {}

    # Run all tests
    tests = [
        ("Basic Config", test_basic_audio_config),
        ("Environment Variables", test_environment_variables),
        ("Package Versions", test_package_versions),
        ("Audio System Info", test_audio_system_info),
        ("RealtimeModel Creation", test_realtime_model_creation),
        ("VAD Configuration", test_vad_configuration),
    ]

    for test_name, test_func in tests:
        logger.info(f"\n🧪 Running: {test_name}")
        logger.info("-" * 40)

        try:
            result = await test_func()
            test_results[test_name] = result
            if result:
                logger.info(f"✅ {test_name}: PASSED")
            else:
                logger.error(f"❌ {test_name}: FAILED")
        except Exception as e:
            logger.error(f"💥 {test_name}: CRASHED - {e}")
            test_results[test_name] = False

    # Summary
    logger.info("\n" + "=" * 60)
    logger.info("🎯 TEST SUMMARY")
    logger.info("=" * 60)

    passed = sum(1 for result in test_results.values() if result)
    total = len(test_results)

    for test_name, result in test_results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        logger.info(f"{status}: {test_name}")

    logger.info(f"\n🏆 Results: {passed}/{total} tests passed")

    if passed == total:
        logger.info("🎉 All tests passed! Audio system should work correctly.")
        return True
    else:
        logger.error("⚠️ Some tests failed. Audio may not work properly.")
        return False

async def main():
    """Main test function"""
    try:
        success = await run_comprehensive_audio_test()

        if success:
            logger.info("\n🚀 Ready to test with agent!")
            logger.info("Run: python agent_fixed.py dev")
        else:
            logger.error("\n🔧 Fix the failed tests before running agent")

        return success
    except Exception as e:
        logger.error(f"💥 Test suite crashed: {e}")
        return False

if __name__ == "__main__":
    # Run the test suite
    success = asyncio.run(main())
    exit(0 if success else 1)