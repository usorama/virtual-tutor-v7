# Phase 4: Multi-Modal Learning & Interactive Whiteboard - Implementation Prompt

## 🎯 Mission Statement
Transform the audio-only AI classroom into a multi-modal learning environment with voice-controlled interactive whiteboard, mathematical notation rendering, and real-time collaborative features. Build upon Phase 3's audio-to-audio foundation to create the world's first voice-controlled mathematical whiteboard integrated with AI tutoring.

---

## 📋 MANDATORY: Research-First Protocol

### 🚨 CRITICAL RULE: NO IMPLEMENTATION WITHOUT RESEARCH VALIDATION

**Before writing ANY code, you MUST:**

1. **Read Research Document FIRST** (**MANDATORY**)
   - [Phase 4 Multi-Modal Whiteboard Research](../research/phase-4-multi-modal-whiteboard-research.md)
   - This contains technology choices, package recommendations, and implementation strategies
   - **Failure to read this document will result in wrong technology choices**

2. **Use Context7 for Package Documentation** (**MANDATORY**)
   - Research tldraw SDK current documentation and API
   - Research KaTeX React integration patterns
   - Research Deepgram Node.js SDK latest features
   - **Never assume package APIs - always verify current documentation**

3. **Web Search for Current Best Practices** (**MANDATORY**)
   - Search for "tldraw React TypeScript integration September 2025"
   - Search for "KaTeX performance optimization 2025"
   - Search for "voice-controlled drawing applications 2025"
   - **Technology changes rapidly - verify current approaches**

4. **Analyze Existing Codebase FIRST** (**MANDATORY**)
   - Review existing LiveKit integration in `/src/app/classroom/`
   - Check current package.json for version compatibility
   - Examine existing UI components for consistency patterns
   - **Never duplicate existing code or create conflicting implementations**

### 🔍 Planning Requirements

**Create Implementation Plan** before coding:
1. **Component Architecture:** How whiteboard integrates with existing classroom
2. **State Management:** Voice commands → drawing actions → collaborative sync
3. **Package Integration:** Specific installation and configuration steps
4. **Testing Strategy:** Voice command accuracy and collaboration testing

---

## 📊 Current Status (Post Phase 3)

### ✅ What's Working
- **Audio-to-Audio AI Classroom:** LiveKit + Gemini Live fully functional
- **Real-time Voice Conversations:** Students can talk to AI tutor naturally
- **NCERT Content Integration:** 147 content chunks available for context
- **Session Management:** Database tracking and progress updates
- **TypeScript Foundation:** React 19.1.0 + Next.js 15.5.3 + TypeScript 5

### ✅ Available Infrastructure
```typescript
// Existing classroom architecture
/src/app/classroom/page.tsx          // Main classroom interface
/src/components/ui/audio-visualizer.tsx  // Audio visualization
/src/lib/livekit/audio-manager.ts    // Audio state management

// Existing dependencies (package.json)
"@livekit/components-react": "^2.9.14"
"livekit-client": "^2.15.7"
"react": "19.1.0"
"next": "15.5.3"
```

### 🎯 Phase 4 Goals
Transform existing classroom to include:
- **Interactive Whiteboard:** tldraw-based collaborative drawing
- **Voice-Controlled Drawing:** Speak to draw mathematical concepts
- **Mathematical Notation:** KaTeX rendering for formulas
- **Real-time Collaboration:** Multiple users drawing simultaneously
- **AI Integration:** Voice commands synchronized with AI explanations

---

## 🚀 Implementation Plan

### Day 1: Whiteboard Foundation & Voice Command Infrastructure

#### Morning: Technology Integration Setup

**⚠️ MANDATORY: Technology Research Validation**
```bash
# 1. FIRST: Read research document
# /vt-app/docs/research/phase-4-multi-modal-whiteboard-research.md

# 2. MANDATORY: Use Context7 for current documentation
# Research tldraw, KaTeX, and Deepgram current APIs

# 3. MANDATORY: Web search for latest best practices
# "tldraw React integration September 2025"
# "KaTeX TypeScript setup 2025"
```

**Technology Stack Installation:**
```bash
# Install whiteboard and math rendering
pnpm add @tldraw/tldraw @tldraw/store
pnpm add katex @types/katex
pnpm add @deepgram/sdk

# CSS for styling
# Import tldraw CSS in globals.css
```

**Integration Architecture:**
```typescript
// src/components/classroom/MultiModalClassroom.tsx
import { Tldraw } from '@tldraw/tldraw'
import { VoiceCommandProcessor } from './VoiceCommandProcessor'
import { MathNotationRenderer } from './MathNotationRenderer'

interface MultiModalClassroomProps {
  sessionId: string
  liveKitRoom: Room  // Existing LiveKit room
}

const MultiModalClassroom = ({ sessionId, liveKitRoom }: MultiModalClassroomProps) => {
  return (
    <div className="grid grid-cols-2 h-screen">
      {/* Existing audio interface */}
      <div className="flex flex-col">
        <AudioInterface room={liveKitRoom} />
        <VoiceCommandProcessor onCommand={executeDrawingCommand} />
      </div>
      
      {/* New whiteboard interface */}
      <div className="relative">
        <Tldraw 
          persistenceKey={`classroom-${sessionId}`}
          shareZone={<CollaborationIndicator />}
        />
        <MathNotationOverlay />
      </div>
    </div>
  )
}
```

#### Afternoon: Voice Command Processing

**Voice-to-Drawing Command Parser:**
```typescript
// src/lib/voice/command-parser.ts
export interface DrawingCommand {
  action: 'draw' | 'move' | 'select' | 'erase' | 'text' | 'math'
  shape?: 'circle' | 'rectangle' | 'line' | 'arrow' | 'triangle'
  direction?: 'up' | 'down' | 'left' | 'right'
  distance?: number
  text?: string
  mathExpression?: string
}

export class VoiceCommandParser {
  private patterns = {
    draw: /draw\s+(circle|rectangle|line|arrow|triangle)/i,
    move: /move\s+(up|down|left|right)(\s+\d+)?/i,
    math: /write\s+(integral|fraction|summation|equation)/i,
    text: /write\s+["'](.+)["']/i
  }
  
  parse(transcript: string): DrawingCommand | null {
    // Parse natural language to structured commands
    // "Draw a circle" -> { action: 'draw', shape: 'circle' }
    // "Move right 5 units" -> { action: 'move', direction: 'right', distance: 5 }
    // "Write integral of x squared" -> { action: 'math', mathExpression: '\\int x^2 dx' }
  }
}
```

**Deepgram Integration:**
```typescript
// src/lib/voice/speech-processor.ts
import { LiveTranscription } from '@deepgram/sdk'

export class SpeechProcessor {
  private deepgram: LiveTranscription
  private commandParser = new VoiceCommandParser()
  
  async startListening(onCommand: (cmd: DrawingCommand) => void) {
    const connection = this.deepgram.listen({
      model: 'nova-2-conversationalai',
      language: 'en-US',
      smart_format: true,
      interim_results: true
    })
    
    connection.on('transcript', (data) => {
      if (data.is_final) {
        const command = this.commandParser.parse(data.alternatives[0].transcript)
        if (command) {
          onCommand(command)
        }
      }
    })
  }
}
```

### Day 2: Mathematical Notation & Whiteboard Integration

#### Morning: KaTeX Mathematical Rendering

**Math Expression Renderer:**
```typescript
// src/components/math/MathRenderer.tsx
import katex from 'katex'
import 'katex/dist/katex.min.css'

interface MathRendererProps {
  expression: string
  displayMode?: boolean
  position: { x: number; y: number }
}

export const MathRenderer = ({ expression, displayMode = false, position }: MathRendererProps) => {
  const html = katex.renderToString(expression, {
    throwOnError: false,
    displayMode,
    strict: 'warn'
  })
  
  return (
    <div 
      className="absolute pointer-events-none"
      style={{ left: position.x, top: position.y }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
```

**Mathematical Expression Parser:**
```typescript
// src/lib/math/expression-parser.ts
export class MathExpressionParser {
  private voiceToLatex = {
    'integral': '\\int',
    'fraction': '\\frac',
    'summation': '\\sum',
    'square root': '\\sqrt',
    'x squared': 'x^2',
    'x cubed': 'x^3',
    'pi': '\\pi',
    'theta': '\\theta'
  }
  
  parseVoiceToLatex(voiceInput: string): string {
    // "integral of x squared from 0 to infinity"
    // Returns: "\\int_0^\\infty x^2 dx"
    
    let latex = voiceInput.toLowerCase()
    
    // Replace voice patterns with LaTeX
    Object.entries(this.voiceToLatex).forEach(([voice, latexSymbol]) => {
      latex = latex.replace(new RegExp(voice, 'gi'), latexSymbol)
    })
    
    return latex
  }
}
```

#### Afternoon: Tldraw Integration & Custom Tools

**Whiteboard Component Integration:**
```typescript
// src/components/classroom/WhiteboardInterface.tsx
import { Tldraw, useEditor } from '@tldraw/tldraw'
import { MathToolbar } from './MathToolbar'

export const WhiteboardInterface = ({ sessionId }: { sessionId: string }) => {
  const [mathMode, setMathMode] = useState(false)
  
  const handleMount = useCallback((editor: Editor) => {
    // Custom tools for mathematical drawing
    editor.registerTool('math-tool', MathTool)
    editor.registerTool('voice-guided-tool', VoiceGuidedTool)
  }, [])
  
  return (
    <div className="relative h-full">
      <Tldraw
        persistenceKey={`math-classroom-${sessionId}`}
        onMount={handleMount}
        components={{
          Toolbar: MathToolbar,
          ShareZone: CollaborationZone
        }}
      />
      
      {mathMode && (
        <MathInputOverlay 
          onMathSubmit={handleMathSubmission}
          position={cursorPosition}
        />
      )}
    </div>
  )
}
```

**Voice Command Executor:**
```typescript
// src/lib/whiteboard/command-executor.ts
import { Editor } from '@tldraw/tldraw'

export class WhiteboardCommandExecutor {
  constructor(private editor: Editor) {}
  
  executeCommand(command: DrawingCommand) {
    switch (command.action) {
      case 'draw':
        this.drawShape(command.shape!, command.position)
        break
      case 'math':
        this.insertMathExpression(command.mathExpression!)
        break
      case 'move':
        this.moveSelection(command.direction!, command.distance)
        break
      case 'erase':
        this.eraseSelection()
        break
    }
  }
  
  private drawShape(shape: string, position?: { x: number; y: number }) {
    const id = this.editor.createShapeId()
    const center = position || this.editor.getViewportScreenBounds().center
    
    this.editor.createShape({
      id,
      type: shape,
      x: center.x,
      y: center.y,
      props: {
        w: 100,
        h: 100
      }
    })
  }
  
  private insertMathExpression(expression: string) {
    // Create custom math shape with KaTeX rendering
    const mathShapeId = this.editor.createShapeId()
    this.editor.createShape({
      id: mathShapeId,
      type: 'math-expression',
      props: {
        latex: expression,
        fontSize: 16
      }
    })
  }
}
```

### Day 3: Real-time Collaboration & AI Integration

#### Morning: Collaborative State Management

**Supabase Real-time Whiteboard Sync:**
```sql
-- Database schema for whiteboard collaboration
CREATE TABLE whiteboard_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learning_session_id UUID REFERENCES learning_sessions(id),
  whiteboard_state JSONB,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  active_users TEXT[]
);

CREATE TABLE whiteboard_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES whiteboard_sessions(id),
  user_id TEXT NOT NULL,
  event_type TEXT, -- 'draw', 'move', 'delete', 'math_insert'
  event_data JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Real-time subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE whiteboard_events;
```

**Collaboration Manager:**
```typescript
// src/lib/collaboration/whiteboard-sync.ts
import { createClient } from '@/lib/supabase/client'

export class WhiteboardCollaboration {
  private supabase = createClient()
  private channel: RealtimeChannel
  
  async initializeSession(sessionId: string) {
    this.channel = this.supabase
      .channel(`whiteboard:${sessionId}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'whiteboard_events' },
        this.handleRemoteChange.bind(this)
      )
      .subscribe()
  }
  
  async broadcastDrawingEvent(event: DrawingEvent) {
    await this.supabase
      .from('whiteboard_events')
      .insert({
        session_id: this.sessionId,
        user_id: this.userId,
        event_type: event.type,
        event_data: event.data
      })
  }
  
  private handleRemoteChange(change: any) {
    // Apply remote changes to local whiteboard
    const event = change.new
    if (event.user_id !== this.userId) {
      this.applyRemoteDrawingEvent(event)
    }
  }
}
```

#### Afternoon: AI-Whiteboard Integration

**Voice + Visual Synchronization:**
```typescript
// src/lib/ai/multimodal-coordinator.ts
export class MultiModalCoordinator {
  constructor(
    private aiChat: LiveKitAI,
    private whiteboard: WhiteboardCommandExecutor,
    private mathRenderer: MathExpressionParser
  ) {}
  
  async processAIResponse(audioResponse: string, transcript: string) {
    // Parse AI response for visual cues
    const visualCommands = this.extractVisualCommands(transcript)
    
    // Execute drawing commands while AI speaks
    for (const command of visualCommands) {
      await this.whiteboard.executeCommand(command)
      
      // Add timing delay to sync with speech
      await this.waitForSpeechSync(audioResponse, command.timestamp)
    }
  }
  
  private extractVisualCommands(transcript: string): DrawingCommand[] {
    const patterns = [
      /let me draw (.*) to show/i,
      /imagine a (circle|triangle|rectangle)/i,
      /the formula is (.*)/i,
      /this looks like (.*)/i
    ]
    
    // Extract drawing intentions from AI speech
    // "Let me draw a circle to show you" -> draw circle
    // "The formula is integral of x squared" -> math expression
    
    return commands
  }
}
```

**Enhanced Classroom Interface:**
```typescript
// src/app/classroom/page.tsx (Enhanced)
export default function EnhancedClassroomPage() {
  const [multiModalMode, setMultiModalMode] = useState(true)
  const [whiteboardVisible, setWhiteboardVisible] = useState(true)
  
  return (
    <div className="h-screen flex flex-col">
      {/* Header with controls */}
      <ClassroomHeader 
        onToggleWhiteboard={() => setWhiteboardVisible(!whiteboardVisible)}
        onToggleMode={() => setMultiModalMode(!multiModalMode)}
      />
      
      {/* Main learning area */}
      <div className="flex-1 flex">
        {/* Audio conversation (existing) */}
        <div className={`${whiteboardVisible ? 'w-1/2' : 'w-full'} transition-all`}>
          <AudioClassroom 
            sessionId={sessionId}
            onAIResponse={handleAIResponse}
          />
        </div>
        
        {/* Interactive whiteboard (new) */}
        {whiteboardVisible && (
          <div className="w-1/2 border-l">
            <WhiteboardInterface 
              sessionId={sessionId}
              aiCoordinator={multiModalCoordinator}
            />
          </div>
        )}
      </div>
      
      {/* Voice command feedback */}
      <VoiceCommandFeedback 
        lastCommand={lastVoiceCommand}
        isListening={isListeningForCommands}
      />
    </div>
  )
}
```

---

## 🔧 Technical Implementation Details

### Package Dependencies
```json
{
  "dependencies": {
    "@tldraw/tldraw": "^2.0.0",
    "@tldraw/store": "^2.0.0",
    "katex": "^0.16.8",
    "@types/katex": "^0.16.7",
    "@deepgram/sdk": "^3.4.0"
  }
}
```

### Environment Variables
```env
# Add to .env.local
DEEPGRAM_API_KEY=your_deepgram_api_key
NEXT_PUBLIC_ENABLE_VOICE_DRAWING=true
NEXT_PUBLIC_MATH_NOTATION_ENABLED=true
```

### CSS Integration
```css
/* Add to globals.css */
@import '@tldraw/tldraw/tldraw.css';
@import 'katex/dist/katex.min.css';

.tldraw-container {
  height: 100%;
  width: 100%;
  position: relative;
}

.math-overlay {
  position: absolute;
  pointer-events: none;
  z-index: 100;
}
```

---

## 🧪 Testing Strategy

### Voice Command Testing
```typescript
// src/tests/voice-commands.test.ts
describe('Voice Command Processing', () => {
  test('should parse draw circle command', () => {
    const parser = new VoiceCommandParser()
    const result = parser.parse("draw a circle")
    expect(result).toEqual({
      action: 'draw',
      shape: 'circle'
    })
  })
  
  test('should parse math expression command', () => {
    const result = parser.parse("write integral of x squared")
    expect(result).toEqual({
      action: 'math',
      mathExpression: '\\int x^2 dx'
    })
  })
})
```

### Integration Testing
```typescript
// src/tests/multimodal-integration.test.ts
describe('Multimodal Integration', () => {
  test('should sync voice with drawing', async () => {
    const coordinator = new MultiModalCoordinator(ai, whiteboard, math)
    await coordinator.processAIResponse("Let me draw a triangle", transcript)
    
    // Verify triangle was drawn on whiteboard
    expect(whiteboard.getShapes()).toContainShape('triangle')
  })
})
```

---

## 📊 Success Criteria

### Technical Validation
- [ ] Voice commands execute drawings within 300ms
- [ ] Mathematical expressions render correctly with KaTeX
- [ ] Real-time collaboration works for multiple users
- [ ] tldraw integrates seamlessly with existing LiveKit audio
- [ ] TypeScript compilation with zero errors
- [ ] All existing tests continue to pass

### User Experience Validation
- [ ] Students can say "draw a triangle" and see immediate result
- [ ] AI can say "let me show you" and draw automatically
- [ ] Mathematical formulas render beautifully on whiteboard
- [ ] Collaboration feels natural and responsive
- [ ] Voice + visual learning enhances comprehension

### Educational Effectiveness
- [ ] Students show improved understanding with visual aids
- [ ] Complex mathematical concepts are easier to grasp
- [ ] AI explanations combined with drawings increase engagement
- [ ] Learning sessions result in measurable progress improvement

---

## 🚨 Critical Implementation Rules

### 1. Research-First Protocol (NON-NEGOTIABLE)
- **MUST read research document before any coding**
- **MUST use Context7 for current package documentation**
- **MUST web search for September 2025 best practices**
- **MUST analyze existing codebase for compatibility**

### 2. No Assumptions Protocol
- **NEVER assume package APIs without verification**
- **NEVER duplicate existing functionality**
- **NEVER use outdated examples or tutorials**
- **NEVER implement without testing strategy**

### 3. Quality Standards
- **ALL code must have TypeScript types**
- **ALL components must follow existing patterns**
- **ALL integrations must preserve existing functionality**
- **ALL changes must include comprehensive tests**

### 4. Documentation Requirements
- **UPDATE research document with implementation learnings**
- **DOCUMENT any deviations from planned approach**
- **RECORD performance benchmarks and optimization notes**
- **MAINTAIN clear API documentation for future phases**

---

## 📚 Related Documentation

**🔗 MANDATORY Cross-References:**
- [Phase 4 Research Foundation](../research/phase-4-multi-modal-whiteboard-research.md) ← **READ FIRST**
- [Phase 4 Advanced Features Plan](./phase-4-advanced-features.md) - High-level feature overview
- [Virtual Tutor Project Status](../../CLAUDE.md) - Overall project context
- [Phase 3 Implementation](./phase-3-implementation-prompt.md) - Existing audio classroom foundation

---

## 📈 Phase 4 Completion Criteria

### Must Have (End of Day 3)
- [ ] Interactive whiteboard integrated with existing classroom
- [ ] Voice commands control drawing (basic shapes)
- [ ] Mathematical notation renders via voice commands
- [ ] Real-time collaboration for 2+ users
- [ ] AI responses can trigger visual drawings
- [ ] All existing audio functionality preserved

### Should Have
- [ ] Advanced mathematical expression parsing
- [ ] Voice command accuracy >85%
- [ ] Smooth synchronization between voice and visuals
- [ ] Comprehensive error handling and recovery
- [ ] Performance optimization for concurrent users

### Nice to Have
- [ ] Advanced drawing tools (curves, annotations)
- [ ] Voice-controlled zoom and pan
- [ ] Session recording with voice + visual
- [ ] Advanced mathematical graphing capabilities

---

## 🎯 Innovation Achievement

**Target:** Create the world's first voice-controlled mathematical whiteboard integrated with AI tutoring, combining:
- Natural language processing for drawing commands
- Real-time collaborative mathematical visualization
- AI-synchronized explanations with visual demonstrations
- Educational-focused interaction patterns

**Market Impact:** Revolutionary learning experience that makes complex mathematical concepts accessible through natural voice interaction and visual reinforcement.

---

## 🔄 Post-Implementation Requirements

### Documentation Updates
1. **Update research document** with implementation learnings
2. **Create API documentation** for whiteboard components
3. **Document voice command grammar** for user training
4. **Record performance benchmarks** for future optimization

### Integration Verification
1. **Ensure Phase 3 audio functionality** remains intact
2. **Verify database migrations** work correctly
3. **Test cross-browser compatibility** for whiteboard features
4. **Validate mobile responsiveness** (voice may work, drawing may not)

---

**Ready to revolutionize mathematical education?** 🚀

Begin with **mandatory research validation** then proceed to Day 1: Whiteboard Foundation & Voice Command Infrastructure.