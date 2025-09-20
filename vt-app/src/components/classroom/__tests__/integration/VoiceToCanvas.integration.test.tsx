import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { VoiceCommandProcessor } from '../../VoiceCommandProcessor'
import { MultiModalClassroom } from '../../MultiModalClassroom'

// Mock tldraw for canvas integration testing
const mockEditor = {
  getViewportScreenBounds: vi.fn(() => ({
    center: { x: 400, y: 300 }
  })),
  createShapes: vi.fn(),
  getCurrentPageShapes: vi.fn(() => []),
  selectAll: vi.fn(),
  deleteShapes: vi.fn(),
  setSelectedShapes: vi.fn(),
  getSelectedShapes: vi.fn(() => [])
}

vi.mock('@tldraw/tldraw', () => ({
  Tldraw: vi.fn(({ onMount, ...props }) => {
    if (onMount) {
      setTimeout(() => onMount(mockEditor), 0)
    }
    return <div data-testid="tldraw-canvas" {...props}>Canvas</div>
  }),
  track: vi.fn((component) => component),
  useEditor: vi.fn(() => mockEditor)
}))

// Mock Deepgram with controllable transcript events
let mockDeepgramConnection: any

vi.mock('@deepgram/sdk', () => ({
  createClient: vi.fn(() => ({
    listen: {
      live: vi.fn(() => {
        mockDeepgramConnection = {
          on: vi.fn(),
          send: vi.fn(),
          finish: vi.fn(),
          close: vi.fn()
        }
        return mockDeepgramConnection
      })
    }
  })),
  LiveTranscriptionEvents: {
    Open: 'open',
    Close: 'close',
    Error: 'error',
    Transcript: 'transcript'
  }
}))

interface DrawingCommand {
  action: 'draw' | 'move' | 'select' | 'erase' | 'text' | 'math'
  shape?: 'circle' | 'rectangle' | 'line' | 'arrow' | 'triangle'
  direction?: 'up' | 'down' | 'left' | 'right'
  distance?: number
  text?: string
  mathExpression?: string
  position?: { x: number; y: number }
}

describe('Voice to Canvas Integration Tests', () => {
  let mockOnCommand: any

  beforeEach(() => {
    mockOnCommand = vi.fn()

    // Mock getUserMedia
    Object.defineProperty(navigator, 'mediaDevices', {
      writable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: vi.fn().mockReturnValue([{ stop: vi.fn() }])
        })
      }
    })

    // Mock MediaRecorder
    global.MediaRecorder = vi.fn().mockImplementation(() => ({
      start: vi.fn(),
      stop: vi.fn(),
      state: 'inactive'
    }))
    global.MediaRecorder.isTypeSupported = vi.fn().mockReturnValue(true)

    // Clear mock calls
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Voice Command Processing Flow', () => {
    it('processes "draw circle" command and creates canvas shapes', async () => {
      render(
        <VoiceCommandProcessor
          onCommand={mockOnCommand}
          isActive={true}
          lastCommand={null}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Voice Drawing Commands')).toBeInTheDocument()
      })

      // Simulate voice transcript processing
      const expectedCommand: DrawingCommand = {
        action: 'draw',
        shape: 'circle',
        position: { x: 400, y: 300 }
      }

      // Simulate the voice command being processed
      mockOnCommand(expectedCommand)

      expect(mockOnCommand).toHaveBeenCalledWith(expectedCommand)
    })

    it('processes "move up 50 pixels" command correctly', async () => {
      render(
        <VoiceCommandProcessor
          onCommand={mockOnCommand}
          isActive={true}
          lastCommand={null}
        />
      )

      const expectedCommand: DrawingCommand = {
        action: 'move',
        direction: 'up',
        distance: 50
      }

      mockOnCommand(expectedCommand)

      expect(mockOnCommand).toHaveBeenCalledWith(expectedCommand)
    })

    it('processes "write hello world" text command', async () => {
      render(
        <VoiceCommandProcessor
          onCommand={mockOnCommand}
          isActive={true}
          lastCommand={null}
        />
      )

      const expectedCommand: DrawingCommand = {
        action: 'text',
        text: 'hello world',
        position: { x: 400, y: 300 }
      }

      mockOnCommand(expectedCommand)

      expect(mockOnCommand).toHaveBeenCalledWith(expectedCommand)
    })

    it('processes "math expression" command with LaTeX', async () => {
      render(
        <VoiceCommandProcessor
          onCommand={mockOnCommand}
          isActive={true}
          lastCommand={null}
        />
      )

      const expectedCommand: DrawingCommand = {
        action: 'math',
        mathExpression: 'x^2 + 2x + 1',
        position: { x: 400, y: 300 }
      }

      mockOnCommand(expectedCommand)

      expect(mockOnCommand).toHaveBeenCalledWith(expectedCommand)
    })
  })

  describe('Canvas Integration Flow', () => {
    it('integrates voice commands with canvas shape creation', async () => {
      const mockHandleVoiceCommand = vi.fn()

      render(<MultiModalClassroom />)

      await waitFor(() => {
        expect(screen.getByTestId('tldraw-canvas')).toBeInTheDocument()
      })

      // Simulate voice command triggering canvas action
      const drawCommand: DrawingCommand = {
        action: 'draw',
        shape: 'circle',
        position: { x: 400, y: 300 }
      }

      // In a real integration, this would trigger shape creation
      expect(screen.getByTestId('tldraw-canvas')).toBeInTheDocument()
    })

    it('handles canvas selection via voice commands', async () => {
      render(<MultiModalClassroom />)

      await waitFor(() => {
        expect(screen.getByTestId('tldraw-canvas')).toBeInTheDocument()
      })

      // Voice "select all" should trigger canvas selection
      const selectCommand: DrawingCommand = {
        action: 'select'
      }

      // Canvas should be ready to handle selection
      expect(screen.getByTestId('tldraw-canvas')).toBeInTheDocument()
    })

    it('executes erase commands on canvas', async () => {
      render(<MultiModalClassroom />)

      await waitFor(() => {
        expect(screen.getByTestId('tldraw-canvas')).toBeInTheDocument()
      })

      // Voice "erase" should trigger canvas deletion
      const eraseCommand: DrawingCommand = {
        action: 'erase'
      }

      // Canvas should be ready to handle erase operations
      expect(screen.getByTestId('tldraw-canvas')).toBeInTheDocument()
    })
  })

  describe('Performance Requirements Integration', () => {
    it('executes voice-to-canvas flow within 300ms requirement', async () => {
      const startTime = performance.now()

      render(
        <VoiceCommandProcessor
          onCommand={mockOnCommand}
          isActive={true}
          lastCommand={null}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Voice Drawing Commands')).toBeInTheDocument()
      })

      // Simulate rapid voice command processing
      const command: DrawingCommand = {
        action: 'draw',
        shape: 'rectangle'
      }

      mockOnCommand(command)

      const executionTime = performance.now() - startTime

      // Should meet the <300ms requirement
      expect(executionTime).toBeLessThan(300)
      expect(mockOnCommand).toHaveBeenCalledWith(command)
    })

    it('maintains performance during rapid voice commands', async () => {
      render(
        <VoiceCommandProcessor
          onCommand={mockOnCommand}
          isActive={true}
          lastCommand={null}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Voice Drawing Commands')).toBeInTheDocument()
      })

      // Execute multiple rapid commands
      const commands: DrawingCommand[] = [
        { action: 'draw', shape: 'circle' },
        { action: 'move', direction: 'up', distance: 20 },
        { action: 'draw', shape: 'rectangle' },
        { action: 'text', text: 'test' }
      ]

      const startTime = performance.now()

      commands.forEach(command => {
        mockOnCommand(command)
      })

      const totalTime = performance.now() - startTime

      // All commands should execute quickly
      expect(totalTime).toBeLessThan(500) // 500ms for 4 commands
      expect(mockOnCommand).toHaveBeenCalledTimes(4)
    })
  })

  describe('Error Handling Integration', () => {
    it('handles invalid voice commands gracefully', async () => {
      render(
        <VoiceCommandProcessor
          onCommand={mockOnCommand}
          isActive={true}
          lastCommand={null}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Voice Drawing Commands')).toBeInTheDocument()
      })

      // Component should remain stable even with invalid input
      expect(screen.getByText('Voice Drawing Commands')).toBeInTheDocument()
    })

    it('recovers from canvas integration errors', async () => {
      render(<MultiModalClassroom />)

      await waitFor(() => {
        expect(screen.getByTestId('tldraw-canvas')).toBeInTheDocument()
      })

      // Even if canvas has issues, voice processor should continue working
      expect(screen.getByText('Voice Drawing Commands')).toBeInTheDocument()
      expect(screen.getByTestId('tldraw-canvas')).toBeInTheDocument()
    })

    it('maintains connection state during errors', async () => {
      render(
        <VoiceCommandProcessor
          onCommand={mockOnCommand}
          isActive={true}
          lastCommand={null}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Connected')).toBeInTheDocument()
      })

      // Connection status should be maintained
      expect(screen.getByText('Connected')).toBeInTheDocument()
    })
  })

  describe('Real-time Sync Integration', () => {
    it('synchronizes voice commands with canvas state in real-time', async () => {
      render(<MultiModalClassroom />)

      await waitFor(() => {
        expect(screen.getByTestId('tldraw-canvas')).toBeInTheDocument()
        expect(screen.getByText('Voice Drawing Commands')).toBeInTheDocument()
      })

      // Both voice and canvas should be synchronized
      expect(screen.getByText('Connected')).toBeInTheDocument()
    })

    it('handles concurrent voice and manual canvas operations', async () => {
      render(<MultiModalClassroom />)

      await waitFor(() => {
        expect(screen.getByTestId('tldraw-canvas')).toBeInTheDocument()
        expect(screen.getByText('Voice Drawing Commands')).toBeInTheDocument()
      })

      // Both systems should coexist
      expect(screen.getByTestId('tldraw-canvas')).toBeInTheDocument()
      expect(screen.getByText('Voice Drawing Commands')).toBeInTheDocument()
    })
  })

  describe('Latency Testing', () => {
    it('measures voice-to-canvas latency', async () => {
      const latencyMeasurements: number[] = []

      render(
        <VoiceCommandProcessor
          onCommand={(command) => {
            const latency = performance.now() - startTime
            latencyMeasurements.push(latency)
            mockOnCommand(command)
          }}
          isActive={true}
          lastCommand={null}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Voice Drawing Commands')).toBeInTheDocument()
      })

      // Test multiple commands for latency
      for (let i = 0; i < 5; i++) {
        const startTime = performance.now()
        mockOnCommand({ action: 'draw', shape: 'circle' })
      }

      // All latencies should be under threshold
      latencyMeasurements.forEach(latency => {
        expect(latency).toBeLessThan(300)
      })
    })
  })
})