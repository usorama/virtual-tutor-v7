Validate that the architectural layer boundaries are being respected for: $ARGUMENTS

Check the following:
1. Are imports following the layer rules?
   - app/ can import from lib/ and interface-adapters/
   - lib/ can ONLY import from lib/
   - infrastructure/ can import from lib/ ONLY
   - interface-adapters/ can import from lib/ and infrastructure/
2. Is the code in the correct layer?
3. Are there any circular dependencies?
4. Is the single responsibility principle maintained?

Report any violations found and suggest corrections.
