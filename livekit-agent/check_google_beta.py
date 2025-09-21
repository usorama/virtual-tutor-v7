#!/usr/bin/env python3
"""Check what's available in the Google beta module"""

from livekit.plugins import google
import inspect

print("Available in google.beta:")
print("-" * 40)

# Check beta module
if hasattr(google, 'beta'):
    beta = google.beta
    for attr in dir(beta):
        if not attr.startswith("_"):
            obj = getattr(beta, attr)
            if inspect.isclass(obj):
                print(f"  Class: {attr}")
                # If it's RealtimeModel, show more details
                if "Realtime" in attr or "realtime" in attr:
                    print(f"    -> Found realtime-related: {attr}")
                    try:
                        sig = inspect.signature(obj.__init__)
                        print(f"    -> Signature: {sig}")
                    except:
                        pass
            elif inspect.isfunction(obj):
                print(f"  Function: {attr}")
            else:
                print(f"  {attr}: {type(obj).__name__}")

# Also check for multimodal capabilities in LLM
print("\n\nChecking LLM model support:")
try:
    llm = google.LLM(model="gemini-2.0-flash-exp")
    print(f"  Model created with: gemini-2.0-flash-exp")
except Exception as e:
    print(f"  Error creating model: {e}")