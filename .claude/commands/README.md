# Claude Code Commands Guide

## 🎯 Purpose
These custom commands are designed to prevent the issues that caused 5 previous project failures. Use them to maintain code quality and architectural integrity.

## 📋 Available Commands

### Project Status Commands

#### `/check-phase [area]`
**Purpose**: Review current development phase and progress  
**When to use**: 
- Starting a new session
- After completing a task
- When unsure what to work on next
**Example**: `/check-phase LiveKit integration`

#### `/validate-layer [file/component]`
**Purpose**: Verify architectural boundaries are respected  
**When to use**:
- After creating new files
- When adding imports
- Before committing changes
**Example**: `/validate-layer src/infrastructure/livekit/RoomService.ts`

### Quality Assurance Commands

#### `/detect-duplicates [feature/service]`
**Purpose**: Find duplicate implementations  
**When to use**:
- Before implementing new features
- After AI generates code
- During code review
**Example**: `/detect-duplicates authentication`

#### `/check-memory [file/component]`
**Purpose**: Review code for memory safety issues  
**When to use**:
- After implementing event handlers
- When using timers or intervals
- Before deploying
**Example**: `/check-memory AudioBridgeService`

### Development Commands

#### `/implement-safe [feature description]`
**Purpose**: Implement features with all safety checks  
**When to use**:
- Starting any new feature
- Creating new services
- Adding new components
**Example**: `/implement-safe LiveKit room creation service`

#### `/test-isolated [component/service]`
**Purpose**: Create and run isolated unit tests  
**When to use**:
- After implementing new code
- When debugging issues
- Before integration
**Example**: `/test-isolated RoomService.createRoom`

### Debugging Commands

#### `/debug-issue [error description]`
**Purpose**: Debug issues with 3-attempt limit  
**When to use**:
- When encountering errors
- Test failures
- Build issues
**Example**: `/debug-issue TypeError: Cannot read property 'id' of undefined`

### Review Commands

#### `/review-pr [branch/commit]`
**Purpose**: Review code for dangerous patterns  
**When to use**:
- Before merging PRs
- After AI generates significant code
- End of development session
**Example**: `/review-pr feature/audio-bridge`

## 🚨 Critical Rules When Using Commands

1. **Always run `/check-phase` at session start** - Know where you are
2. **Run `/detect-duplicates` before implementing** - Don't create what exists
3. **Use `/debug-issue` for ALL debugging** - Enforces 3-attempt limit
4. **Run `/review-pr` before committing** - Catch issues early

## 🔄 Recommended Workflow

### Starting a Session
```
1. /check-phase
2. Review the status
3. Pick one specific task
```

### Implementing Features
```
1. /detect-duplicates [feature]
2. /implement-safe [feature]
3. /test-isolated [feature]
4. /validate-layer [files]
5. /check-memory [implementation]
```

### Debugging Issues
```
1. /debug-issue [error]
2. Follow 3-attempt limit
3. Stop if not resolved
```

### Before Committing
```
1. /review-pr
2. Fix any critical issues
3. /validate-layer
4. Commit with descriptive message
```

## ⚠️ Warning Signs to Stop

If you see any of these, STOP and use commands:

- Multiple files with similar names → `/detect-duplicates`
- Debugging taking too long → `/debug-issue`
- Imports feel wrong → `/validate-layer`
- Memory concerns → `/check-memory`
- Unsure about progress → `/check-phase`

## 💡 Tips

- Commands accept arguments after the command name
- Be specific with arguments for better results
- Chain commands for comprehensive checks
- Commands enforce rules - trust their guidance

## 📚 Related Documentation

- `.claude/rules/FORBIDDEN_ACTIONS.md` - What not to do
- `CLAUDE.md` - Main project context
- `docs/research/ai-coding-failures-prevention.md` - Why these commands exist

Remember: These commands exist because of 5 previous failures. Use them to ensure success on attempt #6.


### Session Management Commands

#### `/init-session [focus area]`
**Purpose**: Start a development session with all checks  
**When to use**: 
- Beginning of each work session
- After pulling latest changes
- When returning to the project
**Example**: `/init-session LiveKit audio setup`

#### `/wrap-session [what you worked on]`
**Purpose**: Properly end a session with final checks  
**When to use**:
- End of work session
- Before taking a break
- After completing a feature
**Example**: `/wrap-session implemented room creation`

## 🎯 Complete Session Flow

### Starting Work
```
1. /init-session [area]
2. Follow the provided action items
3. Use other commands as needed
```

### Ending Work  
```
1. /wrap-session [what you did]
2. Fix any issues found
3. Commit if ready
4. Update CLAUDE.local.md
```
