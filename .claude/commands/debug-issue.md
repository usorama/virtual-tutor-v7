---
description: Debug issues with strict 3-attempt limit
allowed-tools: Read, Edit, Bash, Grep
---

Debug the following issue with STRICT 3-attempt limit: $ARGUMENTS

## Attempt 1 (Minimal Fix)
- Read the EXACT error message
- Locate the SPECIFIC file and line number
- Make the minimal change needed to fix
- Test the fix

## Attempt 2 (Alternative Approach)
Only if Attempt 1 failed:
- Re-analyze the error from a different angle
- Check for typos or missing imports
- Try an alternative solution approach
- Test again

## Attempt 3 (Final Attempt)
Only if Attempt 2 failed:
- Document what you've tried so far
- Create minimal reproduction case
- Make one final, well-reasoned attempt
- Test thoroughly

## If All Attempts Fail
**STOP IMMEDIATELY** and provide:
- Clear summary of the issue
- All approaches attempted
- Why each approach failed
- Suggested fresh approach for human review
- Do NOT attempt a 4th fix

Remember: Black holes form after 3 attempts. Your restraint prevents project failure.
