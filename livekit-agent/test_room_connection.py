#!/usr/bin/env python3
"""
Test creating a LiveKit room to trigger the agent
"""

import os
import asyncio
from dotenv import load_dotenv
from livekit.api import LiveKitAPI
from livekit.api.room_service import CreateRoomRequest

# Load environment variables
load_dotenv()

async def test_room_creation():
    """Create a test room to trigger the agent"""

    print("=" * 60)
    print("Testing LiveKit Room Creation for Agent Trigger")
    print("=" * 60)

    # Get credentials
    url = os.getenv("LIVEKIT_API_URL", "wss://ai-tutor-prototype-ny9l58vd.livekit.cloud")
    api_key = os.getenv("LIVEKIT_API_KEY")
    api_secret = os.getenv("LIVEKIT_API_SECRET")

    if not api_key or not api_secret:
        print("❌ LiveKit credentials not found!")
        return False

    print(f"✅ LiveKit URL: {url}")
    print(f"✅ API Key: {'*' * 8}{api_key[-4:]}")
    print(f"✅ API Secret: {'*' * 8}{api_secret[-4:]}")

    try:
        # Create LiveKit API client
        # Replace wss:// with https:// for API endpoint
        api_url = url.replace("wss://", "https://")
        print(f"\nConnecting to API: {api_url}")

        # Create room service client
        lkapi = LiveKitAPI(api_url, api_key, api_secret)

        # Create a test room
        room_name = "test_voice_room_12345"
        print(f"\nCreating test room: {room_name}")

        request = CreateRoomRequest(
            name=room_name,
            empty_timeout=300,  # 5 minutes
            max_participants=2,
            metadata="test_user_Mathematics_10"  # User metadata for agent context
        )

        room = await lkapi.room.create_room(request)
        print(f"✅ Room created successfully!")
        print(f"   Room SID: {room.sid}")
        print(f"   Room Name: {room.name}")
        print(f"   Created At: {room.creation_time}")

        print("\n⏳ Agent should now connect to this room...")
        print("   Check agent logs for connection activity")

        # Wait a bit to see if agent connects
        print("\nWaiting 5 seconds for agent to connect...")
        await asyncio.sleep(5)

        # List participants to see if agent joined
        from livekit.api.room_service import ListParticipantsRequest
        participants_request = ListParticipantsRequest(room=room_name)
        participants = await lkapi.room.list_participants(participants_request)

        if participants.participants:
            print(f"\n✅ Participants in room:")
            for p in participants.participants:
                print(f"   - {p.identity} (SID: {p.sid})")
                if "agent" in p.identity.lower():
                    print(f"     ✅ Agent detected!")
        else:
            print("\n⚠️ No participants yet. Agent may need a human participant first.")

        # Clean up - delete the room
        from livekit.api.room_service import DeleteRoomRequest
        print("\nCleaning up - deleting test room...")
        delete_request = DeleteRoomRequest(room=room_name)
        await lkapi.room.delete_room(delete_request)
        print("✅ Room deleted")

        return True

    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Run the test"""
    success = asyncio.run(test_room_creation())

    if success:
        print("\n" + "=" * 60)
        print("✅ LIVEKIT CONNECTION TEST COMPLETE!")
        print("=" * 60)
    else:
        print("\n⚠️ Connection test failed. Please check configuration.")

    return 0 if success else 1

if __name__ == "__main__":
    import sys
    sys.exit(main())