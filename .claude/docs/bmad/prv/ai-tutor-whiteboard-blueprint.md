# AI Tutor Whiteboard Blueprint

## Executive Summary

This blueprint defines the architecture and implementation strategy for an AI-powered teaching whiteboard that enables AI tutors to draw mathematical and scientific explanations in real-time, simulating a human teacher's classroom board experience.

**Key Finding**: No native whiteboard/canvas components exist in any shadcn/ui registry (official or third-party), requiring a hybrid integration approach combining external canvas libraries with shadcn/ui components for the interface.

---

## 🎯 Core Requirements

### Functional Requirements
- **Drawing Capabilities**: Freehand drawing, shapes, arrows, and annotations
- **Mathematical Support**: LaTeX equation rendering, geometric shapes, graphs
- **Scientific Diagrams**: Atomic structures, circuits, biological diagrams
- **AI Control**: Programmatic drawing with step-by-step animations
- **Real-time Interaction**: Students can see drawing in real-time
- **Voice Integration**: AI responds to voice commands and questions
- **Recording/Playback**: Capture and replay explanations
- **Multi-modal Input**: Support for text, voice, and pointing interactions

### Technical Requirements
- **Performance**: 60fps with 1000+ shapes on canvas
- **Latency**: <500ms AI response time for drawing commands
- **Scalability**: Support 50+ concurrent student viewers
- **Accessibility**: WCAG 2.1 AA compliance
- **Responsive**: Works on tablets, desktops, and large displays
- **Theme Integration**: Seamless shadcn/ui design system integration

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    AI Tutor Whiteboard System               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   UI Layer   │  │ Canvas Layer │  │   AI Layer   │     │
│  │  (Shadcn/UI) │  │   (TLDraw)   │  │  (OpenAI +)  │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │             │
│  ┌──────┴──────────────────┴──────────────────┴─────┐      │
│  │              Integration Layer                    │      │
│  │         (React + TypeScript + Next.js)           │      │
│  └───────────────────────────────────────────────────┘      │
│                                                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │                 Data Layer                         │     │
│  │    (Canvas State + AI Context + User Sessions)    │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Technology Stack

### Core Canvas Solution: TLDraw
- **Version**: Latest (^2.0.0)
- **Why TLDraw**:
  - 41.7k+ GitHub stars, actively maintained
  - Built-in AI integration capabilities
  - Extensible SDK for custom tools
  - Real-time collaboration support
  - Recording and playback features
  - Excellent performance with complex drawings

### UI Framework: Shadcn/UI Components
```bash
# Essential shadcn components for the interface
npx shadcn@latest add card dialog sheet tabs button
npx shadcn@latest add toggle-group slider select separator
npx shadcn@latest add tooltip popover badge progress
npx shadcn@latest add command scroll-area resizable
npx shadcn@latest add dropdown-menu context-menu
```

### Mathematical Rendering: KaTeX
- Fast math typesetting library
- LaTeX support for complex equations
- Client-side rendering for performance

### Supporting Libraries
```json
{
  "dependencies": {
    "tldraw": "^2.0.0",
    "@tldraw/tldraw": "^2.0.0",
    "katex": "^0.16.9",
    "react-katex": "^3.0.1",
    "@types/katex": "^0.16.7",
    "openai": "^4.24.0",
    "@tanstack/react-query": "^5.17.0",
    "socket.io-client": "^4.5.4",
    "framer-motion": "^10.17.0"
  }
}
```

---

## 📁 Project Structure

```
vt-new-2/
├── src/
│   ├── components/
│   │   ├── whiteboard/
│   │   │   ├── AITeacherWhiteboard.tsx      # Main component
│   │   │   ├── WhiteboardCanvas.tsx         # TLDraw wrapper
│   │   │   ├── TeacherToolbar.tsx          # Tool selection UI
│   │   │   ├── MathToolPanel.tsx           # Math-specific tools
│   │   │   ├── ScienceToolPanel.tsx        # Science diagrams
│   │   │   ├── AIControlPanel.tsx          # AI teacher controls
│   │   │   ├── StudentInteraction.tsx      # Q&A interface
│   │   │   └── RecordingControls.tsx       # Record/playback
│   │   │
│   │   └── ui/                             # Shadcn components
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       └── ... (other shadcn components)
│   │
│   ├── lib/
│   │   ├── ai/
│   │   │   ├── drawing-commands.ts         # AI to canvas commands
│   │   │   ├── explanation-engine.ts       # Content generation
│   │   │   ├── voice-interpreter.ts        # Voice to actions
│   │   │   └── adaptive-teaching.ts        # Student adaptation
│   │   │
│   │   ├── canvas/
│   │   │   ├── tldraw-config.ts           # TLDraw configuration
│   │   │   ├── custom-tools.ts            # Educational tools
│   │   │   ├── math-shapes.ts             # Geometric shapes
│   │   │   └── science-diagrams.ts        # Science visuals
│   │   │
│   │   └── utils/
│   │       ├── latex-renderer.ts          # KaTeX integration
│   │       ├── canvas-recorder.ts         # Recording logic
│   │       └── real-time-sync.ts          # WebSocket sync
│   │
│   └── styles/
│       ├── whiteboard.css                  # Canvas styles
│       └── globals.css                     # Theme integration
```

---

## 💻 Implementation Code

### Main Whiteboard Component

```typescript
// src/components/whiteboard/AITeacherWhiteboard.tsx
import React, { useState, useCallback, useRef } from 'react';
import { Tldraw, TldrawEditor, useEditor, track } from 'tldraw';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TeacherToolbar } from './TeacherToolbar';
import { AIControlPanel } from './AIControlPanel';
import { MathToolPanel } from './MathToolPanel';
import { useAITeacher } from '@/hooks/useAITeacher';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface AITeacherWhiteboardProps {
  studentId?: string;
  lessonTopic?: string;
  difficultyLevel?: 'beginner' | 'intermediate' | 'advanced';
}

export function AITeacherWhiteboard({ 
  studentId, 
  lessonTopic,
  difficultyLevel = 'intermediate' 
}: AITeacherWhiteboardProps) {
  const [isTeaching, setIsTeaching] = useState(false);
  const [currentTool, setCurrentTool] = useState<string>('pen');
  const [isRecording, setIsRecording] = useState(false);
  const editorRef = useRef<TldrawEditor | null>(null);
  
  const { 
    startExplanation, 
    drawMathStep,
    clearBoard,
    generateDiagram 
  } = useAITeacher(editorRef.current);

  // AI draws mathematical explanation
  const handleMathExplanation = useCallback(async (equation: string) => {
    if (!editorRef.current) return;
    
    setIsTeaching(true);
    const editor = editorRef.current;
    
    // Clear previous content
    editor.selectAll().deleteShapes(editor.getSelectedShapeIds());
    
    // Render equation with KaTeX
    const mathHtml = katex.renderToString(equation, {
      displayMode: true,
      throwOnError: false
    });
    
    // AI draws step-by-step
    const steps = await generateMathSteps(equation);
    
    for (const [index, step] of steps.entries()) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create text shape for equation
      editor.createShape({
        type: 'text',
        x: 100,
        y: 100 + (index * 150),
        props: {
          text: step.expression,
          size: 'xl',
          color: 'blue'
        }
      });
      
      // Draw connecting arrows
      if (index > 0) {
        editor.createShape({
          type: 'arrow',
          x: 150,
          y: 100 + ((index - 1) * 150) + 50,
          props: {
            start: { x: 0, y: 0 },
            end: { x: 0, y: 100 },
            color: 'black'
          }
        });
      }
      
      // Add explanation annotation
      editor.createShape({
        type: 'note',
        x: 400,
        y: 100 + (index * 150),
        props: {
          text: step.explanation,
          size: 'm',
          color: 'grey'
        }
      });
    }
    
    setIsTeaching(false);
  }, []);

  // Handle voice command
  const handleVoiceCommand = useCallback(async (audioBlob: Blob) => {
    const transcript = await speechToText(audioBlob);
    const command = await interpretCommand(transcript);
    
    switch(command.type) {
      case 'draw':
        await handleDraw(command.shape, command.params);
        break;
      case 'explain':
        await handleMathExplanation(command.equation);
        break;
      case 'clear':
        clearBoard();
        break;
      default:
        console.log('Unknown command:', command);
    }
  }, [handleMathExplanation, clearBoard]);

  return (
    <div className="flex h-screen bg-background">
      {/* Left Sidebar - Teaching Tools */}
      <Sheet>
        <SheetTrigger asChild>
          <Button 
            variant="outline" 
            size="icon"
            className="fixed left-4 top-4 z-50"
          >
            <PanelLeftIcon className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 overflow-y-auto">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Teaching Tools</h3>
              <TeacherToolbar 
                currentTool={currentTool}
                onToolChange={setCurrentTool}
              />
            </div>
            
            <Separator />
            
            <Tabs defaultValue="math" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="math">Math</TabsTrigger>
                <TabsTrigger value="science">Science</TabsTrigger>
                <TabsTrigger value="general">General</TabsTrigger>
              </TabsList>
              
              <TabsContent value="math" className="space-y-4">
                <MathToolPanel onInsertEquation={handleMathExplanation} />
              </TabsContent>
              
              <TabsContent value="science">
                <ScienceToolPanel onInsertDiagram={generateDiagram} />
              </TabsContent>
              
              <TabsContent value="general">
                <GeneralToolPanel />
              </TabsContent>
            </Tabs>
            
            <Separator />
            
            <AIControlPanel 
              isTeaching={isTeaching}
              onStartLesson={startExplanation}
              difficultyLevel={difficultyLevel}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Canvas Area */}
      <Card className="flex-1 m-4 overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle>AI Math & Science Tutor</CardTitle>
              {isTeaching && (
                <Badge variant="default" className="animate-pulse">
                  AI is teaching...
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {/* Quick Actions */}
              <Button
                variant="outline"
                size="sm"
                onClick={clearBoard}
                disabled={isTeaching}
              >
                Clear Board
              </Button>
              
              <Button
                variant={isRecording ? "destructive" : "outline"}
                size="sm"
                onClick={() => setIsRecording(!isRecording)}
              >
                {isRecording ? 'Stop Recording' : 'Record'}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => saveCanvas()}
              >
                Save
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0 h-[calc(100%-4rem)]">
          <div className="w-full h-full whiteboard-container">
            <Tldraw
              onMount={(editor) => {
                editorRef.current = editor;
                // Configure AI-ready editor
                configureAIEditor(editor);
              }}
              components={{
                // Custom UI components can be added here
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Right Sidebar - Student Interaction */}
      <Card className="w-80 m-4 mr-4">
        <CardHeader>
          <CardTitle className="text-base">Student Interaction</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <StudentQuestionPanel onQuestion={handleStudentQuestion} />
          <LearningProgressIndicator studentId={studentId} />
          <AdaptiveDifficultyControl 
            currentLevel={difficultyLevel}
            onLevelChange={setDifficultyLevel}
          />
        </CardContent>
      </Card>
    </div>
  );
}
```

### AI Drawing Engine

```typescript
// src/lib/ai/drawing-commands.ts
import { TldrawEditor } from 'tldraw';
import { OpenAI } from 'openai';

export class AIDrawingEngine {
  private editor: TldrawEditor;
  private openai: OpenAI;
  
  constructor(editor: TldrawEditor) {
    this.editor = editor;
    this.openai = new OpenAI({
      apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY
    });
  }
  
  // Generate drawing commands from natural language
  async interpretDrawingIntent(prompt: string): Promise<DrawingCommand[]> {
    const response = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [{
        role: "system",
        content: "Convert teaching explanations into drawing commands for a whiteboard."
      }, {
        role: "user",
        content: prompt
      }],
      functions: [{
        name: "generate_drawing_commands",
        parameters: {
          type: "object",
          properties: {
            commands: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { 
                    type: "string", 
                    enum: ["text", "arrow", "shape", "equation", "diagram"] 
                  },
                  params: { type: "object" }
                }
              }
            }
          }
        }
      }]
    });
    
    return JSON.parse(response.choices[0].function_call.arguments).commands;
  }
  
  // Execute drawing commands with animation
  async executeDrawingSequence(commands: DrawingCommand[]): Promise<void> {
    for (const command of commands) {
      await this.executeCommand(command);
      await this.animateDrawing(command);
    }
  }
  
  private async executeCommand(command: DrawingCommand): Promise<void> {
    switch(command.type) {
      case 'text':
        this.drawText(command.params);
        break;
      case 'arrow':
        this.drawArrow(command.params);
        break;
      case 'shape':
        this.drawShape(command.params);
        break;
      case 'equation':
        await this.drawEquation(command.params);
        break;
      case 'diagram':
        await this.drawDiagram(command.params);
        break;
    }
  }
  
  // Math-specific drawing
  async drawMathematicalProof(theorem: string, steps: ProofStep[]): Promise<void> {
    const startY = 100;
    const stepHeight = 120;
    
    // Draw theorem statement
    this.editor.createShape({
      type: 'text',
      x: 100,
      y: startY,
      props: {
        text: `Theorem: ${theorem}`,
        size: 'xl',
        font: 'serif',
        color: 'blue'
      }
    });
    
    // Draw proof steps with annotations
    for (let i = 0; i < steps.length; i++) {
      const y = startY + (i + 1) * stepHeight;
      
      // Step number
      this.editor.createShape({
        type: 'geo',
        x: 50,
        y: y,
        props: {
          geo: 'circle',
          w: 30,
          h: 30,
          text: `${i + 1}`,
          fill: 'semi'
        }
      });
      
      // Step expression
      this.editor.createShape({
        type: 'text',
        x: 100,
        y: y,
        props: {
          text: steps[i].expression,
          size: 'l',
          font: 'mono'
        }
      });
      
      // Reasoning
      this.editor.createShape({
        type: 'note',
        x: 450,
        y: y,
        props: {
          text: steps[i].reasoning,
          size: 's',
          color: 'grey'
        }
      });
      
      // Connect steps with arrows
      if (i > 0) {
        this.drawArrow({
          from: { x: 200, y: y - stepHeight + 30 },
          to: { x: 200, y: y - 20 },
          style: 'dashed',
          label: steps[i].rule
        });
      }
    }
    
    // QED box
    this.editor.createShape({
      type: 'geo',
      x: 400,
      y: startY + steps.length * stepHeight + 50,
      props: {
        geo: 'rectangle',
        w: 60,
        h: 30,
        text: 'Q.E.D.',
        fill: 'solid',
        color: 'green'
      }
    });
  }
  
  // Science diagram generation
  async drawScientificDiagram(type: DiagramType, params: any): Promise<void> {
    switch(type) {
      case 'atom':
        await this.drawAtomicStructure(params.element);
        break;
      case 'circuit':
        await this.drawElectricCircuit(params.components);
        break;
      case 'cell':
        await this.drawBiologicalCell(params.cellType);
        break;
      case 'molecule':
        await this.drawMolecularStructure(params.compound);
        break;
      case 'force':
        await this.drawForcesDiagram(params.forces);
        break;
    }
  }
  
  private async drawAtomicStructure(element: string): Promise<void> {
    const atomData = await getAtomicData(element);
    const centerX = 400, centerY = 300;
    
    // Draw nucleus
    this.editor.createShape({
      type: 'geo',
      x: centerX - 30,
      y: centerY - 30,
      props: {
        geo: 'circle',
        w: 60,
        h: 60,
        fill: 'solid',
        color: 'red',
        text: `${atomData.protons}p⁺\n${atomData.neutrons}n⁰`
      }
    });
    
    // Draw electron shells
    for (let shell = 0; shell < atomData.shells.length; shell++) {
      const radius = 80 + shell * 60;
      
      // Draw orbit
      this.editor.createShape({
        type: 'geo',
        x: centerX - radius,
        y: centerY - radius,
        props: {
          geo: 'ellipse',
          w: radius * 2,
          h: radius * 2,
          fill: 'none',
          dash: 'dashed',
          color: 'grey'
        }
      });
      
      // Draw electrons
      const electrons = atomData.shells[shell];
      const angleStep = (2 * Math.PI) / electrons;
      
      for (let e = 0; e < electrons; e++) {
        const angle = e * angleStep;
        const ex = centerX + radius * Math.cos(angle);
        const ey = centerY + radius * Math.sin(angle);
        
        this.editor.createShape({
          type: 'geo',
          x: ex - 8,
          y: ey - 8,
          props: {
            geo: 'circle',
            w: 16,
            h: 16,
            fill: 'solid',
            color: 'blue',
            text: 'e⁻'
          }
        });
      }
    }
    
    // Add element label
    this.editor.createShape({
      type: 'text',
      x: centerX - 50,
      y: centerY + 200,
      props: {
        text: `${element} (${atomData.symbol})`,
        size: 'xl',
        font: 'serif',
        align: 'center'
      }
    });
  }
}
```

### Math Tools Panel

```typescript
// src/components/whiteboard/MathToolPanel.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MathToolPanelProps {
  onInsertEquation: (equation: string) => void;
  onInsertGraph: (func: string, range: [number, number]) => void;
  onInsertShape: (shape: GeometricShape) => void;
}

export function MathToolPanel({ 
  onInsertEquation, 
  onInsertGraph, 
  onInsertShape 
}: MathToolPanelProps) {
  const [equation, setEquation] = useState('');
  const [functionExpr, setFunctionExpr] = useState('');
  const [graphRange, setGraphRange] = useState<[number, number]>([-10, 10]);
  
  // Common equations for quick insert
  const commonEquations = [
    { label: 'Quadratic Formula', latex: 'x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}' },
    { label: 'Pythagorean Theorem', latex: 'a^2 + b^2 = c^2' },
    { label: 'Derivative', latex: '\\frac{d}{dx}f(x) = \\lim_{h \\to 0}\\frac{f(x+h)-f(x)}{h}' },
    { label: 'Integral', latex: '\\int_a^b f(x)dx = F(b) - F(a)' },
    { label: 'Euler\'s Identity', latex: 'e^{i\\pi} + 1 = 0' },
    { label: 'Binomial Theorem', latex: '(x+y)^n = \\sum_{k=0}^{n}\\binom{n}{k}x^{n-k}y^k' }
  ];
  
  // Geometric shapes
  const shapes = [
    { label: 'Triangle', type: 'triangle' },
    { label: 'Square', type: 'square' },
    { label: 'Circle', type: 'circle' },
    { label: 'Pentagon', type: 'pentagon' },
    { label: 'Hexagon', type: 'hexagon' },
    { label: 'Coordinate Axes', type: 'axes' }
  ];
  
  return (
    <div className="space-y-4">
      <Tabs defaultValue="equations">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="equations">Equations</TabsTrigger>
          <TabsTrigger value="graphs">Graphs</TabsTrigger>
          <TabsTrigger value="geometry">Geometry</TabsTrigger>
        </TabsList>
        
        <TabsContent value="equations" className="space-y-3">
          <div>
            <Label htmlFor="custom-equation">Custom LaTeX Equation</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="custom-equation"
                placeholder="e.g., E = mc^2"
                value={equation}
                onChange={(e) => setEquation(e.target.value)}
              />
              <Button 
                size="sm"
                onClick={() => onInsertEquation(equation)}
                disabled={!equation}
              >
                Insert
              </Button>
            </div>
          </div>
          
          <div>
            <Label>Common Equations</Label>
            <ScrollArea className="h-[200px] mt-1">
              <div className="space-y-2">
                {commonEquations.map((eq) => (
                  <Button
                    key={eq.label}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => onInsertEquation(eq.latex)}
                  >
                    {eq.label}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </TabsContent>
        
        <TabsContent value="graphs" className="space-y-3">
          <div>
            <Label htmlFor="function">Function</Label>
            <Input
              id="function"
              placeholder="e.g., x^2 + 2*x + 1"
              value={functionExpr}
              onChange={(e) => setFunctionExpr(e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="x-min">X Min</Label>
              <Input
                id="x-min"
                type="number"
                value={graphRange[0]}
                onChange={(e) => setGraphRange([Number(e.target.value), graphRange[1]])}
              />
            </div>
            <div>
              <Label htmlFor="x-max">X Max</Label>
              <Input
                id="x-max"
                type="number"
                value={graphRange[1]}
                onChange={(e) => setGraphRange([graphRange[0], Number(e.target.value)])}
              />
            </div>
          </div>
          
          <Button 
            className="w-full"
            onClick={() => onInsertGraph(functionExpr, graphRange)}
            disabled={!functionExpr}
          >
            Plot Graph
          </Button>
        </TabsContent>
        
        <TabsContent value="geometry" className="space-y-3">
          <Label>Geometric Shapes</Label>
          <div className="grid grid-cols-2 gap-2">
            {shapes.map((shape) => (
              <Button
                key={shape.type}
                variant="outline"
                size="sm"
                onClick={() => onInsertShape({ type: shape.type })}
              >
                {shape.label}
              </Button>
            ))}
          </div>
          
          <div>
            <Label>Shape Properties</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="outline">Outline</SelectItem>
                <SelectItem value="filled">Filled</SelectItem>
                <SelectItem value="dashed">Dashed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### AI Control System

```typescript
// src/lib/ai/adaptive-teaching.ts
export class AdaptiveTeachingSystem {
  private studentProfile: StudentProfile;
  private lessonContext: LessonContext;
  
  constructor(studentId: string) {
    this.studentProfile = loadStudentProfile(studentId);
    this.lessonContext = new LessonContext();
  }
  
  // Adapt explanation complexity based on student understanding
  async generateAdaptiveExplanation(
    topic: string,
    currentUnderstanding: number
  ): Promise<TeachingSequence> {
    const complexity = this.calculateComplexity(currentUnderstanding);
    
    const prompt = `
      Generate a ${complexity} level explanation for ${topic}.
      Student's current understanding: ${currentUnderstanding}/10
      Previous struggles: ${this.studentProfile.commonMistakes.join(', ')}
      Learning style: ${this.studentProfile.learningStyle}
    `;
    
    const response = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [{
        role: "system",
        content: "You are an adaptive AI tutor. Adjust your teaching based on student needs."
      }, {
        role: "user",
        content: prompt
      }]
    });
    
    return this.parseTeachingSequence(response.choices[0].message.content);
  }
  
  // Monitor student interaction and adjust teaching
  async monitorAndAdapt(interaction: StudentInteraction): Promise<TeachingAdjustment> {
    const indicators = this.analyzeInteraction(interaction);
    
    if (indicators.confusion > 0.7) {
      return {
        action: 'simplify',
        suggestion: 'Break down into smaller steps',
        newComplexity: this.lessonContext.complexity - 1
      };
    }
    
    if (indicators.boredom > 0.7) {
      return {
        action: 'advance',
        suggestion: 'Move to more challenging content',
        newComplexity: this.lessonContext.complexity + 1
      };
    }
    
    if (indicators.engagement < 0.3) {
      return {
        action: 'change_approach',
        suggestion: 'Try visual or interactive explanation',
        newMethod: 'visual'
      };
    }
    
    return { action: 'continue', suggestion: 'Maintain current approach' };
  }
  
  // Generate practice problems based on performance
  async generatePracticeProblems(
    topic: string,
    difficulty: number,
    count: number
  ): Promise<PracticeProblem[]> {
    const problems: PracticeProblem[] = [];
    
    for (let i = 0; i < count; i++) {
      const problem = await this.generateSingleProblem(topic, difficulty + (i * 0.1));
      problems.push(problem);
    }
    
    return problems;
  }
}
```

---

## 🎨 Styling & Theme Integration

```css
/* src/styles/whiteboard.css */
.whiteboard-container {
  /* Integrate with shadcn theme */
  --tl-background: hsl(var(--background));
  --tl-foreground: hsl(var(--foreground));
  --tl-primary: hsl(var(--primary));
  --tl-primary-foreground: hsl(var(--primary-foreground));
  --tl-secondary: hsl(var(--secondary));
  --tl-secondary-foreground: hsl(var(--secondary-foreground));
  --tl-accent: hsl(var(--accent));
  --tl-accent-foreground: hsl(var(--accent-foreground));
  --tl-destructive: hsl(var(--destructive));
  --tl-border: hsl(var(--border));
  --tl-input: hsl(var(--input));
  --tl-ring: hsl(var(--ring));
  
  /* Custom whiteboard styles */
  --tl-grid-color: hsl(var(--muted) / 0.5);
  --tl-pen-color: hsl(var(--foreground));
  --tl-eraser-size: 20px;
  --tl-selection-color: hsl(var(--primary) / 0.3);
}

/* Math equation rendering styles */
.katex-display {
  margin: 1em 0;
  font-size: 1.2em;
}

.katex-html {
  color: hsl(var(--foreground));
}

/* AI teaching animation */
@keyframes ai-drawing {
  from {
    stroke-dashoffset: 1000;
  }
  to {
    stroke-dashoffset: 0;
  }
}

.ai-drawing-path {
  stroke-dasharray: 1000;
  animation: ai-drawing 2s ease-in-out forwards;
}

/* Student interaction indicators */
.student-pointer {
  position: absolute;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: hsl(var(--primary));
  opacity: 0.7;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.7;
  }
  50% {
    transform: scale(1.5);
    opacity: 0.3;
  }
}
```

---

## 🚀 Installation & Setup

### Step 1: Install Dependencies

```bash
# Core dependencies
npm install tldraw @tldraw/tldraw
npm install katex react-katex @types/katex
npm install openai @tanstack/react-query
npm install socket.io-client
npm install framer-motion

# Install all required shadcn/ui components
npx shadcn@latest add card dialog sheet tabs button
npx shadcn@latest add toggle-group slider select separator
npx shadcn@latest add tooltip popover badge progress
npx shadcn@latest add command scroll-area resizable
npx shadcn@latest add dropdown-menu context-menu
npx shadcn@latest add input label switch
```

### Step 2: Environment Variables

```env
# .env.local
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:3001
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### Step 3: Configure Next.js

```javascript
// next.config.js
module.exports = {
  transpilePackages: ['tldraw', '@tldraw/tldraw'],
  images: {
    domains: ['localhost'],
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });
    return config;
  },
};
```

---

## 📊 Performance Optimization

### Canvas Performance
- **Virtualization**: Only render visible shapes
- **Debouncing**: Throttle AI drawing commands to 60fps
- **Caching**: Cache rendered equations and diagrams
- **WebGL**: Use hardware acceleration when available

### AI Response Optimization
- **Streaming**: Stream drawing commands as they're generated
- **Batching**: Group similar operations
- **Predictive Loading**: Pre-generate common explanations
- **Edge Functions**: Deploy AI logic to edge for lower latency

### Memory Management
```typescript
// Cleanup and memory management
useEffect(() => {
  return () => {
    // Cleanup canvas resources
    if (editorRef.current) {
      editorRef.current.dispose();
    }
    // Clear cached equations
    clearKaTeXCache();
    // Close WebSocket connections
    closeWebSocketConnection();
  };
}, []);
```

---

## 🧪 Testing Strategy

### Unit Tests
```typescript
// __tests__/ai-drawing-engine.test.ts
describe('AIDrawingEngine', () => {
  it('should convert math equation to drawing commands', async () => {
    const engine = new AIDrawingEngine(mockEditor);
    const commands = await engine.interpretDrawingIntent('Draw x^2 + 2x + 1');
    expect(commands).toHaveLength(3);
    expect(commands[0].type).toBe('equation');
  });
});
```

### Integration Tests
```typescript
// __tests__/whiteboard-integration.test.tsx
describe('AITeacherWhiteboard Integration', () => {
  it('should render equation when AI explains math', async () => {
    render(<AITeacherWhiteboard />);
    const explainButton = screen.getByText('Explain Quadratic');
    fireEvent.click(explainButton);
    
    await waitFor(() => {
      expect(screen.getByText(/x²/)).toBeInTheDocument();
    });
  });
});
```

### E2E Tests
```typescript
// e2e/whiteboard.spec.ts
test('AI teaches quadratic equation', async ({ page }) => {
  await page.goto('/whiteboard');
  await page.click('text=Start Lesson');
  await page.fill('#topic', 'Quadratic Equations');
  await page.click('text=Begin');
  
  // Wait for AI to start drawing
  await expect(page.locator('.ai-drawing-path')).toBeVisible();
  
  // Verify equation appears
  await expect(page.locator('.katex-display')).toContainText('x²');
});
```

---

## 🔒 Security Considerations

### API Security
- Rate limiting for AI requests
- Input sanitization for LaTeX expressions
- Token validation for WebSocket connections
- Content filtering for student inputs

### Data Privacy
- Student data encryption
- FERPA compliance for educational data
- Minimal data retention policy
- Anonymized analytics

---

## 📈 Monitoring & Analytics

### Key Metrics to Track
- **AI Performance**: Response time, accuracy, command success rate
- **Student Engagement**: Time on task, interaction frequency, completion rate
- **Learning Outcomes**: Problem success rate, concept mastery, progress velocity
- **System Health**: Canvas FPS, memory usage, API latency

### Dashboard Metrics
```typescript
interface WhiteboardMetrics {
  aiResponseTime: number;        // ms
  canvasFPS: number;             // frames per second
  activeStudents: number;        // concurrent users
  drawingComplexity: number;     // shapes on canvas
  teachingEffectiveness: number; // 0-1 score
}
```

---

## 🚦 Deployment Checklist

- [ ] Install all npm dependencies
- [ ] Configure environment variables
- [ ] Set up OpenAI API key
- [ ] Install shadcn/ui components
- [ ] Configure WebSocket server
- [ ] Set up database for session storage
- [ ] Configure CDN for static assets
- [ ] Set up monitoring and logging
- [ ] Test on target devices (tablets, desktop)
- [ ] Verify accessibility compliance
- [ ] Load test with 50+ concurrent users
- [ ] Deploy to staging environment
- [ ] Run E2E test suite
- [ ] Deploy to production

---

## 📚 Additional Resources

### Documentation
- [TLDraw Documentation](https://tldraw.dev)
- [Shadcn/UI Components](https://ui.shadcn.com)
- [KaTeX Documentation](https://katex.org)
- [OpenAI API Reference](https://platform.openai.com/docs)

### Example Implementations
- [TLDraw Examples](https://github.com/tldraw/tldraw/tree/main/examples)
- [Math Visualization with Mafs](https://mafs.dev)
- [Interactive Math with Mathigon](https://mathigon.org)

### Community Resources
- [TLDraw Discord](https://discord.gg/tldraw)
- [Shadcn/UI Discord](https://discord.gg/shadcn)
- [Educational Technology Forums](https://edtechcommunity.org)

---

## 📝 License & Attribution

This blueprint is designed for the VT-New-2 educational platform. 
- TLDraw is licensed under Apache 2.0
- Shadcn/UI components are open source
- KaTeX is licensed under MIT

---

*Blueprint Version: 1.0.0*  
*Last Updated: January 2025*  
*Author: AI Tutor Whiteboard Team*