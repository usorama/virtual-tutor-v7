#!/usr/bin/env python3
"""
Quick test to verify agent transcript generation
"""

import asyncio
import logging
import os
from datetime import datetime
from livekit import rtc, agents
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_agent_connectivity():
    """Test if we can connect to the LiveKit room and check for agent presence"""
    try:
        # Create a simple room connection
        room = rtc.Room()

        # Connect to the LiveKit cloud
        url = os.getenv("LIVEKIT_URL", "wss://ai-tutor-prototype-ny9l58vd.livekit.cloud")
        api_key = os.getenv("LIVEKIT_API_KEY", "APIz7rWgBkZqPDq")
        api_secret = os.getenv("LIVEKIT_API_SECRET", "kHLVuf6fCfcTdB8ClOT223Fn4npSckCXYyJkse8Op7VA")

        # Generate a simple token (this is a basic test token)
        from livekit import api
        token = api.AccessToken(api_key, api_secret) \
            .with_identity("test-user") \
            .with_name("Test User") \
            .with_grants(api.VideoGrants(
                room_join=True,
                room="test-session-room"
            )).to_jwt()

        print(f"Connecting to {url} with token...")
        await room.connect(url, token)

        print("Connected successfully!")
        print(f"Room participants: {len(room.remote_participants)}")

        # Check for agent in room
        for participant in room.remote_participants.values():
            print(f"Participant: {participant.identity} - {participant.name}")
            if "agent" in participant.identity.lower():
                print("✅ Found agent in room!")

        # Listen for data messages for 10 seconds
        data_received = False

        def on_data_received(data, participant):
            nonlocal data_received
            data_received = True
            try:
                import json
                decoded = json.loads(data.decode('utf-8'))
                print(f"📨 Data received from {participant.identity}:")
                print(f"   Type: {decoded.get('type', 'unknown')}")
                print(f"   Speaker: {decoded.get('speaker', 'unknown')}")
                if decoded.get('segments'):
                    for seg in decoded.get('segments', []):
                        print(f"   Content: {seg.get('content', '')[:100]}...")
            except Exception as e:
                print(f"❌ Error parsing data: {e}")
                print(f"   Raw data: {data.decode('utf-8', errors='ignore')[:200]}...")

        room.on("data_received", on_data_received)

        print("Listening for data messages for 10 seconds...")
        await asyncio.sleep(10)

        if data_received:
            print("✅ Agent is sending data!")
        else:
            print("❌ No data received from agent")

        await room.disconnect()

    except Exception as e:
        logger.error(f"Test failed: {e}")
        return False

    return True

if __name__ == "__main__":
    asyncio.run(test_agent_connectivity())