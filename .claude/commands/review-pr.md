Review the code changes for: $ARGUMENTS

Check for these CRITICAL issues:
1. Any files with New/Copy/backup suffixes
2. Console.log statements
3. Tests modified to pass (instead of fixing code)
4. Memory unsafe patterns (setInterval without cleanup, etc.)
5. Architecture boundary violations
6. Duplicate implementations

Also review for:
- Type safety (no 'any' types)
- Error handling completeness
- Test coverage
- Clear variable/function names
- Comments for complex logic only

Provide:
- List of critical issues that MUST be fixed
- Suggestions for improvements
- Overall assessment (Safe to merge / Needs work / Dangerous)

Be strict - this is attempt #6 and we cannot afford another failure.
