# Claude Code Agents

## Available Agents

### safety-reviewer
**Purpose**: Reviews code for dangerous patterns that caused previous project failures

**When to use**:
- Before committing any code
- After AI generates significant code
- When you see warning signs (duplicates, console.logs, etc.)
- End of each work session

**How to invoke**:
```
Use the safety-reviewer agent to check my changes
Use safety-reviewer to review for memory leaks
Have safety-reviewer check the LiveKit implementation
```

**What it checks**:
- Duplicate files (New, Copy, backup suffixes)
- Console.log statements
- Test manipulation
- Memory leaks
- Architecture violations

**Tools granted**: Read, Grep, Glob (read-only for safety)

## Creating New Agents

Agents must follow this format:

```markdown
---
name: agent-name
description: When this agent should be used
tools: Tool1, Tool2, Tool3
---

System prompt content here...
```

Place new agents in this directory (`.claude/agents/`) for project-specific agents.

## Tips

1. Agents operate in their own context (doesn't pollute main conversation)
2. Claude will automatically use agents when appropriate
3. You can explicitly request an agent with "Use [agent-name] to..."
4. Agents can have restricted tools for safety

## Related

- See `.claude/commands/` for command files
- See `CLAUDE.md` for main project context
- See `.claude/rules/` for forbidden actions
