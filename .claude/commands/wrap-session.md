Wrap up the current development session for: $ARGUMENTS

Perform these final checks:

1. List what was accomplished this session
2. Check for any uncommitted changes
3. Run tests to ensure nothing is broken
4. Check for any forbidden patterns introduced:
   - Files with New/Copy suffixes
   - Console.log statements
   - Architecture violations
   - Memory unsafe patterns
5. Verify the build still works

Then provide:
- Summary of completed work
- Any issues that need attention
- Suggested commit message if changes are ready
- Next task for the next session
- Any notes to add to CLAUDE.local.md

If any critical issues are found, provide steps to fix them before ending the session.

Remember: Leave the codebase better than you found it.
