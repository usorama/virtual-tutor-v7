#!/usr/bin/env python3
"""Check what's available in the Google plugin"""

from livekit.plugins import google
import inspect

print("Available in google plugin:")
print("-" * 40)

# List all attributes
for attr in dir(google):
    if not attr.startswith("_"):
        obj = getattr(google, attr)
        if inspect.isclass(obj):
            print(f"  Class: {attr}")
        elif inspect.isfunction(obj):
            print(f"  Function: {attr}")
        else:
            print(f"  {attr}: {type(obj).__name__}")

# Check specifically for RealtimeModel
print("\nChecking for RealtimeModel:")
if hasattr(google, 'RealtimeModel'):
    print("  ✓ RealtimeModel exists")
    print(f"  Signature: {inspect.signature(google.RealtimeModel.__init__)}")
else:
    print("  ✗ RealtimeModel not found")

# Check for LLM model capabilities
print("\nChecking LLM capabilities:")
if hasattr(google, 'LLM'):
    print("  ✓ LLM exists")
    try:
        # Try to see init params
        sig = inspect.signature(google.LLM.__init__)
        print(f"  Signature: {sig}")
    except:
        print("  Could not get signature")

# Check for STT
print("\nChecking STT capabilities:")
if hasattr(google, 'STT'):
    print("  ✓ STT exists")

# Check for TTS
print("\nChecking TTS capabilities:")
if hasattr(google, 'TTS'):
    print("  ✓ TTS exists")