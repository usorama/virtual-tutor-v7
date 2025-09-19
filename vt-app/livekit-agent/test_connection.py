#!/usr/bin/env python3
"""
Test script for LiveKit Agent connection and basic functionality
"""

import asyncio
import os
import sys
import logging
from dotenv import load_dotenv
from livekit import api, rtc

# Load environment variables
load_dotenv("../.env.local")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# LiveKit configuration
LIVEKIT_URL = os.getenv("LIVEKIT_URL", "wss://ai-tutor-prototype-ny9l58vd.livekit.cloud")
LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY", "APIz7rWgBkZqPDq")
LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET", "kHLVuf6fCfcTdB8ClOT223Fn4npSckCXYyJkse8Op7VA")

# Gemini API
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "AIzaSyBcUGgObt--HCjBlXygu8iYMuI6PnPbeIY")

async def test_livekit_connection():
    """Test basic LiveKit connection"""
    logger.info("Testing LiveKit connection...")
    
    try:
        # Create API client
        lk_api = api.LiveKitAPI(
            LIVEKIT_URL.replace('wss://', 'https://').replace('.livekit.cloud', '.livekit.cloud'),
            LIVEKIT_API_KEY,
            LIVEKIT_API_SECRET
        )
        
        # List rooms (should be empty or contain existing rooms)
        rooms = await lk_api.room.list_rooms()
        logger.info(f"✓ Connected to LiveKit. Active rooms: {len(rooms)}")
        
        for room in rooms:
            logger.info(f"  - Room: {room.name}, Participants: {room.num_participants}")
        
        return True
    except Exception as e:
        logger.error(f"✗ LiveKit connection failed: {e}")
        return False

async def test_gemini_api():
    """Test Gemini API connection"""
    logger.info("Testing Gemini API...")
    
    try:
        import google.generativeai as genai
        
        # Configure Gemini
        genai.configure(api_key=GOOGLE_API_KEY)
        
        # List available models
        models = genai.list_models()
        audio_models = [m for m in models if 'gemini-2.0-flash-exp' in m.name]
        
        if audio_models:
            logger.info(f"✓ Gemini API connected. Audio model available: gemini-2.0-flash-exp")
            return True
        else:
            logger.warning("⚠ Gemini API connected but audio model not found")
            return False
    except Exception as e:
        logger.error(f"✗ Gemini API test failed: {e}")
        return False

async def test_agent_startup():
    """Test if agent can start properly"""
    logger.info("Testing agent startup...")
    
    try:
        # Import agent module
        import agent
        
        logger.info("✓ Agent module loaded successfully")
        
        # Check required functions exist
        if hasattr(agent, 'entrypoint'):
            logger.info("✓ Agent entrypoint function found")
            return True
        else:
            logger.error("✗ Agent entrypoint function not found")
            return False
    except ImportError as e:
        logger.error(f"✗ Failed to import agent module: {e}")
        return False
    except Exception as e:
        logger.error(f"✗ Agent startup test failed: {e}")
        return False

def check_environment():
    """Check environment variables"""
    logger.info("Checking environment configuration...")
    
    required_vars = {
        "LIVEKIT_URL": LIVEKIT_URL,
        "LIVEKIT_API_KEY": LIVEKIT_API_KEY,
        "LIVEKIT_API_SECRET": LIVEKIT_API_SECRET,
        "GOOGLE_API_KEY": GOOGLE_API_KEY
    }
    
    all_present = True
    for var_name, var_value in required_vars.items():
        if var_value:
            logger.info(f"✓ {var_name}: {'*' * 8}{var_value[-8:]}")
        else:
            logger.error(f"✗ {var_name}: Not set")
            all_present = False
    
    return all_present

async def main():
    """Run all tests"""
    logger.info("=" * 50)
    logger.info("Virtual Tutor LiveKit Agent - Connection Test")
    logger.info("=" * 50)
    
    results = []
    
    # Check environment
    logger.info("\n1. Environment Check")
    results.append(("Environment", check_environment()))
    
    # Test LiveKit
    logger.info("\n2. LiveKit Connection")
    results.append(("LiveKit", await test_livekit_connection()))
    
    # Test Gemini
    logger.info("\n3. Gemini API")
    results.append(("Gemini", await test_gemini_api()))
    
    # Test Agent
    logger.info("\n4. Agent Module")
    results.append(("Agent", await test_agent_startup()))
    
    # Summary
    logger.info("\n" + "=" * 50)
    logger.info("Test Summary")
    logger.info("=" * 50)
    
    all_passed = True
    for test_name, passed in results:
        status = "✓ PASSED" if passed else "✗ FAILED"
        logger.info(f"{test_name:15} {status}")
        if not passed:
            all_passed = False
    
    if all_passed:
        logger.info("\n🎉 All tests passed! Agent is ready to run.")
        logger.info("Start the agent with: python agent.py dev")
    else:
        logger.error("\n⚠️ Some tests failed. Please check the configuration.")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())