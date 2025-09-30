# Complete Enforcement Architecture

**Workflow**: Research → Plan → Implement → Verify → Test → Confirm (with Implement→Verify→Test iterative loop)

---

## 🎯 Multi-Layer Enforcement Strategy

### ✅ YES - Embed Workflow in Every Story Definition

**Why this is PERFECT**:
1. **Self-Documenting**: Story contains its own workflow requirements
2. **Agent-Readable**: Agents can parse YAML and enforce automatically
3. **Orchestrator-Driven**: orchestrator-coordinator reads story and enforces transitions
4. **No Ambiguity**: Exact phases, criteria, and checkpoints defined
5. **Progress Tracking**: Each story tracks its current phase and iterations

**Implementation**: `STORY-TEMPLATE.yaml` with embedded 6-phase workflow ✅

---

## 🛡️ Layer 1: Proactive Prevention (BEFORE Action)

### Hook: UserPromptSubmit
**Enforces**: Research + Plan phases before Implement
**File**: `~/.claude/hooks/research-plan-enforcer.py`
**Triggers**: Before Claude can use Write/Edit tools
**Blocks**: Implementation requests without manifests

### Hook: Pre-Task
**Enforces**: Phase prerequisites before task starts
**What it checks**:
- Current phase in story YAML
- Previous phase completion status
- Required manifests exist
- Signatures present

```python
# ~/.claude/hooks/pre-task-phase-validator.py
def validate_phase_transition(story_yaml, requested_phase):
    workflow = story_yaml['workflow']['phases']
    current = story_yaml['current_phase']

    # Check if previous phase complete
    if requested_phase == 'implement':
        if not workflow['research']['status'] == 'completed':
            BLOCK("Research phase not complete")
        if not workflow['plan']['status'] == 'completed':
            BLOCK("Plan phase not complete")

    # Check completion criteria met
    if not check_completion_criteria(workflow[current]):
        BLOCK(f"{current} phase criteria not met")
```

---

## 🔍 Layer 2: During-Action Validation

### Hook: Pre-Edit
**Enforces**: Plan adherence before each file modification
**File**: `~/.claude/hooks/pre-edit-plan-validator.py`
**Triggers**: Before each Write/Edit/MultiEdit
**Checks**:
- File is mentioned in plan
- Modification aligns with roadmap
- Current step allows this file

### Hook: Post-Edit
**Enforces**: Code quality after each file modification
**File**: `~/.claude/hooks/post-write-plan-validator.py`
**Triggers**: After each Write/Edit/MultiEdit
**Validates**:
- No protected-core duplication
- Matches plan patterns
- TypeScript compiles
**Action on Fail**: DELETES file + blocks

### Hook: Agent-Spawn
**Enforces**: Correct agent for each phase
**Triggers**: When spawning agent via Task tool
**Validates**:
- Right agent for current phase
- Agent has correct context
- Phase prerequisites met

```python
# ~/.claude/hooks/agent-spawn-coordinator.py
def validate_agent_for_phase(story_yaml, agent_type):
    current_phase = story_yaml['current_phase']
    required_agent = story_yaml['workflow']['phases'][current_phase]['agent']

    if agent_type != required_agent:
        WARN(f"Phase {current_phase} requires {required_agent}, got {agent_type}")
```

---

## ✅ Layer 3: Checkpoint Enforcement (AFTER Phase)

### Hook: Post-Task
**Enforces**: Phase completion criteria before transition
**File**: `~/.claude/hooks/post-task-checkpoint.py`
**Triggers**: After each phase completes
**Validates**:
- All checklist items complete
- Completion criteria met
- Evidence collected
- Ready for next phase

### Hook: Verify-Phase Checkpoint
**Enforces**: Verification must pass before Test
**File**: `~/.claude/hooks/verify-checkpoint.py`
**Triggers**: After Verify phase
**Requirements**:
```yaml
verify_requirements:
  - typescript_errors: 0
  - lint_errors: 0
  - protected_core_violations: 0
  - plan_adherence: 100%
```
**Action**: Blocks Test phase if any requirement fails

### Hook: Test-Phase Checkpoint
**Enforces**: Tests must pass before Confirm
**File**: `~/.claude/hooks/test-checkpoint.py`
**Triggers**: After Test phase
**Requirements**:
```yaml
test_requirements:
  - unit_tests_passing: 100%
  - integration_tests_passing: 100%
  - coverage: ">80%"
  - no_regressions: true
```
**Action**: Blocks Confirm phase if any test fails

### Hook: Agent-Complete
**Enforces**: Agent must report success before phase transition
**Triggers**: When agent reports task complete
**Validates**:
- Agent completed assigned phase
- All deliverables present
- Quality gates passed
**Action**: Updates story YAML with phase status

---

## 🔄 Layer 4: Iterative Loop Enforcement

### The Implement→Verify→Test Loop

**Configuration in Story YAML**:
```yaml
iterative_loop:
  phases: ["implement", "verify", "test"]
  exit_conditions:
    - typescript_errors: 0
    - tests_passing: 100%
    - coverage: ">80%"
  max_iterations: 5
```

**Enforcement Hook**: `~/.claude/hooks/iterative-loop-controller.py`
**Logic**:
1. After Implement: Automatically trigger Verify
2. After Verify: If PASS → trigger Test, if FAIL → return to Implement
3. After Test: If PASS → allow Confirm, if FAIL → return to Implement
4. Track iteration count, escalate after max

```python
# ~/.claude/hooks/iterative-loop-controller.py
def control_loop(story_yaml, completed_phase):
    loop_phases = story_yaml['iterative_loop']['phases']
    iteration = story_yaml['iterations_count']
    max_iter = story_yaml['iterative_loop']['max_iterations']

    if completed_phase == 'implement':
        next_phase = 'verify'

    elif completed_phase == 'verify':
        if verify_passed(story_yaml):
            next_phase = 'test'
        else:
            next_phase = 'implement'  # Loop back
            iteration += 1

    elif completed_phase == 'test':
        if test_passed(story_yaml):
            next_phase = 'confirm'  # Exit loop
        else:
            next_phase = 'implement'  # Loop back
            iteration += 1

    if iteration >= max_iter:
        ESCALATE("Max iterations reached, human review needed")

    update_story_yaml(story_yaml, next_phase, iteration)
    trigger_phase(next_phase)
```

---

## 📊 Layer 5: Evidence Enforcement

### Hook: Evidence-Collection-Enforcer
**Enforces**: Evidence exists before story completion
**File**: `~/.claude/hooks/evidence-enforcer.py`
**Triggers**: Before marking story complete
**Requirements**:
```yaml
evidence_requirements:
  - research_manifest: exists + complete
  - plan_manifest: exists + complete
  - implementation_commits: tracked
  - verification_results: documented
  - test_results: report exists
  - evidence_report: "[STORY-ID]-EVIDENCE.md" exists
```

**Evidence Report Structure**:
```markdown
# [STORY-ID] Evidence Report

## Research Completed ✅
- Manifest: [link]
- Protected-core searched: [results]
- Context7 queries: [log]
- Web research: [sources]

## Plan Completed ✅
- Manifest: [link]
- Roadmap: [summary]
- Tests planned: [list]

## Implementation Completed ✅
- Files created: [list with line counts]
- Git commits: [hashes]
- Integration points: [verified]

## Verification Passed ✅
- TypeScript: 0 errors
- Lint: 0 errors
- Protected-core: No violations
- Plan adherence: 100%

## Tests Passed ✅
- Unit tests: X/X passing (coverage: Y%)
- Integration tests: X/X passing
- E2E tests: X/X passing (if applicable)

## Confirmation ✅
- All phases complete
- All criteria met
- Story ready for next
```

---

## 🎭 Layer 6: Orchestrator Control

### Agent: orchestrator-coordinator
**Role**: Master workflow enforcer
**Responsibilities**:
1. Read story YAML and enforce workflow
2. Coordinate agent spawning for each phase
3. Manage phase transitions
4. Enforce checkpoints
5. Handle iterative loop
6. Collect evidence
7. Block story completion until all criteria met

**Orchestration Logic**:
```python
# Orchestrator enforces workflow
def orchestrate_story(story_id):
    story = load_story_yaml(story_id)

    # Phase 1: Research
    if story['workflow']['phases']['research']['status'] != 'completed':
        spawn_agent('web-research', 'research', story)
        wait_for_completion()
        validate_research_manifest()
        update_story_phase('research', 'completed')

    # Phase 2: Plan
    if story['workflow']['phases']['plan']['status'] != 'completed':
        spawn_agent('bmad-architect', 'plan', story)
        wait_for_completion()
        validate_plan_manifest()
        update_story_phase('plan', 'completed')

    # Phase 3-5: Iterative Loop
    while not exit_conditions_met(story):
        # Implement
        spawn_agent('story-implementer', 'implement', story)
        wait_for_completion()

        # Verify
        spawn_agent('code-verifier', 'verify', story)
        if not verify_passed():
            continue  # Loop back to implement

        # Test
        spawn_agent('test-runner', 'test', story)
        if not test_passed():
            continue  # Loop back to implement

        break  # Exit loop if both passed

    # Phase 6: Confirm
    spawn_agent('completion-enforcer', 'confirm', story)
    collect_evidence()
    validate_all_criteria()
    mark_story_complete()
```

---

## 🔧 Additional Enforcement Mechanisms

### 1. Session-End Hook
**Prevents**: Closing session with incomplete story
**Hook**: `session-end-incomplete-blocker.py`
**Logic**:
```python
def session_end():
    active_stories = get_active_stories()
    for story in active_stories:
        if story['status'] != 'completed':
            if story['current_phase'] in ['implement', 'verify', 'test']:
                WARN(f"Story {story['id']} incomplete at {story['current_phase']}")
                if not user_confirms_pause():
                    BLOCK("Cannot end session with story mid-implementation")
```

### 2. Git Commit Hook (Enhanced)
**Prevents**: Committing without phase completion
**Hook**: `.git/hooks/pre-commit` (enhanced version)
**Checks**:
```bash
# Check which story is active
STORY_ID=$(git log -1 --oneline | grep -oP '[A-Z]+-\d+')

# Check if story allows commit at current phase
CURRENT_PHASE=$(yq .current_phase ".research-plan-manifests/stories/$STORY_ID.yaml")

if [ "$CURRENT_PHASE" = "research" ] || [ "$CURRENT_PHASE" = "plan" ]; then
    echo "Cannot commit during research/plan phase - complete manifests first"
    exit 1
fi
```

### 3. Task Dependency Enforcement
**Prevents**: Starting dependent stories before prerequisites
**Hook**: `task-dependency-validator.py`
**Logic**:
```python
def validate_dependencies(story):
    depends_on = story.get('depends_on', [])
    for dep_story_id in depends_on:
        dep_story = load_story_yaml(dep_story_id)
        if dep_story['status'] != 'completed':
            BLOCK(f"Cannot start {story['id']} until {dep_story_id} complete")
```

---

## 📊 Summary of All Enforcement Layers

| Layer | Hook Type | When | What | Action |
|-------|-----------|------|------|--------|
| 1 | UserPromptSubmit | Before tools | Research+Plan exist | Block prompt |
| 2 | Pre-Task | Before phase | Prerequisites met | Block phase |
| 2 | Pre-Edit | Before file write | Plan adherence | Block write |
| 2 | Post-Edit | After file write | Code quality | Delete file |
| 2 | Agent-Spawn | Agent launch | Correct agent for phase | Warn/block |
| 3 | Post-Task | After phase | Completion criteria | Block transition |
| 3 | Verify-Checkpoint | After Verify | All checks pass | Block Test |
| 3 | Test-Checkpoint | After Test | All tests pass | Block Confirm |
| 3 | Agent-Complete | Agent done | Success reported | Update status |
| 4 | Loop-Controller | Phase transition | Loop logic | Control flow |
| 5 | Evidence-Enforcer | Before complete | Evidence exists | Block completion |
| 6 | Orchestrator | Throughout | Workflow enforcement | Coordinate all |
| Extra | Session-End | Session close | No incomplete work | Warn/block |
| Extra | Git-Commit | Commit time | Phase allows commit | Block commit |
| Extra | Dependency | Story start | Dependencies complete | Block story |

---

## 🎯 Result

**NO WAY TO BYPASS WORKFLOW**:
- Can't skip Research (UserPromptSubmit blocks)
- Can't skip Plan (UserPromptSubmit blocks)
- Can't implement without plan (Pre-Edit blocks)
- Can't write bad code (Post-Edit deletes)
- Can't skip Verify (Loop controller enforces)
- Can't skip Test (Loop controller enforces)
- Can't complete without evidence (Evidence enforcer blocks)
- Can't start dependent stories early (Dependency validator blocks)
- Can't close session mid-story (Session-end warns)

**ITERATIVE LOOP GUARANTEED**:
- Implement→Verify→Test continues until all pass
- Max 5 iterations before escalation
- Automatic looping controlled by hooks
- Progress tracked in story YAML

---

**Status**: Enforcement architecture designed
**Implementation**: Ready for hook creation
**Confidence**: 100% workflow enforcement