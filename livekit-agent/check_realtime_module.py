#!/usr/bin/env python3
"""Check what's available in the Google beta realtime module"""

from livekit.plugins.google import beta
import inspect

print("Available in google.beta.realtime:")
print("-" * 40)

# Check realtime module
if hasattr(beta, 'realtime'):
    realtime = beta.realtime
    for attr in dir(realtime):
        if not attr.startswith("_"):
            obj = getattr(realtime, attr)
            if inspect.isclass(obj):
                print(f"  Class: {attr}")
                # Show more details for important classes
                if "Model" in attr or "Realtime" in attr:
                    print(f"    -> Found: {attr}")
                    try:
                        sig = inspect.signature(obj.__init__)
                        print(f"    -> Signature: {sig}")
                    except Exception as e:
                        print(f"    -> Could not get signature: {e}")
            elif inspect.isfunction(obj):
                print(f"  Function: {attr}")
            else:
                print(f"  {attr}: {type(obj).__name__}")

# Try importing RealtimeModel directly
print("\nTrying direct import:")
try:
    from livekit.plugins.google.beta import realtime
    print("  ✓ Imported realtime module")
    if hasattr(realtime, 'RealtimeModel'):
        print("  ✓ RealtimeModel found!")
        RealtimeModel = realtime.RealtimeModel
        sig = inspect.signature(RealtimeModel.__init__)
        print(f"  Signature: {sig}")
    else:
        print("  ✗ RealtimeModel not found in realtime module")
except Exception as e:
    print(f"  Error: {e}")