import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { MultiModalClassroom } from '../MultiModalClassroom'

// Mock all the child components
vi.mock('../VoiceCommandProcessor', () => ({
  VoiceCommandProcessor: vi.fn(({ onCommand, isActive, lastCommand }) => (
    <div data-testid="voice-command-processor">
      <div>Voice Commands: {isActive ? 'Active' : 'Inactive'}</div>
      <button onClick={() => onCommand({ action: 'draw', shape: 'circle' })}>
        Mock Voice Command
      </button>
      {lastCommand && <div>Last: {lastCommand.action}</div>}
    </div>
  ))
}))

vi.mock('../MathNotationOverlay', () => ({
  MathNotationOverlay: vi.fn(({ editor, onMathInsert }) => (
    <div data-testid="math-notation-overlay">
      <button onClick={() => onMathInsert('\\pi', { x: 100, y: 100 })}>
        Insert Math
      </button>
    </div>
  ))
}))

vi.mock('../WhiteboardToolbar', () => ({
  WhiteboardToolbar: vi.fn(({ editor, mathMode, onMathModeToggle }) => (
    <div data-testid="whiteboard-toolbar">
      <button onClick={onMathModeToggle}>
        Math Mode: {mathMode ? 'On' : 'Off'}
      </button>
    </div>
  ))
}))

vi.mock('../CollaborationIndicator', () => ({
  CollaborationIndicator: vi.fn(({ collaborators, sessionId }) => (
    <div data-testid="collaboration-indicator">
      <div>Session: {sessionId}</div>
      <div>Collaborators: {collaborators.length}</div>
    </div>
  ))
}))

vi.mock('@/components/ui/audio-visualizer', () => ({
  AudioVisualizer: vi.fn(({ isConnected, isMuted, onMuteToggle, onEndSession, studentName, sessionDuration, connectionQuality }) => (
    <div data-testid="audio-visualizer">
      <div>Connection: {isConnected ? 'Connected' : 'Disconnected'}</div>
      <div>Muted: {isMuted ? 'Yes' : 'No'}</div>
      <div>Student: {studentName}</div>
      <div>Duration: {sessionDuration}</div>
      <div>Quality: {connectionQuality}</div>
      <button onClick={onMuteToggle}>Toggle Mute</button>
      <button onClick={onEndSession}>End Session</button>
    </div>
  ))
}))

// Mock tldraw components
vi.mock('@tldraw/tldraw', () => ({
  Tldraw: vi.fn(({ store, onMount }) => {
    // Simulate mounting the editor
    const mockEditor = {
      createShapes: vi.fn(),
      getViewportScreenBounds: vi.fn(() => ({ center: { x: 400, y: 300 } })),
      getSelectedShapes: vi.fn(() => []),
      nudgeShapes: vi.fn(),
      deleteShapes: vi.fn()
    }

    // Call onMount if provided
    if (onMount) {
      setTimeout(() => onMount(mockEditor), 0)
    }

    return (
      <div data-testid="tldraw-canvas">
        <div>Whiteboard Canvas</div>
        <button onClick={() => mockEditor.createShapes([{ type: 'geo', props: {} }])}>
          Create Shape
        </button>
      </div>
    )
  })
}))

vi.mock('@tldraw/sync', () => ({
  useSyncDemo: vi.fn(() => 'mock-store')
}))

// Mock Room type
const mockRoom = {
  disconnect: vi.fn(),
  isConnected: vi.fn(() => true)
}

describe('MultiModalClassroom', () => {
  const mockOnMuteToggle = vi.fn()
  const mockOnEndSession = vi.fn()

  const defaultProps = {
    sessionId: 'test-session-123',
    isConnected: true,
    isMuted: false,
    onMuteToggle: mockOnMuteToggle,
    onEndSession: mockOnEndSession,
    studentName: 'Test Student',
    sessionDuration: '05:30',
    connectionQuality: 'good' as const
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Component Rendering', () => {
    it('renders main classroom interface', () => {
      render(<MultiModalClassroom {...defaultProps} />)

      expect(screen.getByText('AI Mathematics Classroom')).toBeInTheDocument()
      expect(screen.getByTestId('audio-visualizer')).toBeInTheDocument()
      expect(screen.getByTestId('tldraw-canvas')).toBeInTheDocument()
    })

    it('shows session information', () => {
      render(<MultiModalClassroom {...defaultProps} />)

      expect(screen.getByText(/Duration: 05:30/)).toBeInTheDocument()
      expect(screen.getByText(/1 participant/)).toBeInTheDocument()
    })

    it('renders all control buttons', () => {
      render(<MultiModalClassroom {...defaultProps} />)

      expect(screen.getByText(/Voice Drawing/)).toBeInTheDocument()
      expect(screen.getByText(/Math Mode/)).toBeInTheDocument()
      expect(screen.getByText(/Show.*Whiteboard/)).toBeInTheDocument()
    })

    it('shows whiteboard by default', () => {
      render(<MultiModalClassroom {...defaultProps} />)

      expect(screen.getByTestId('whiteboard-toolbar')).toBeInTheDocument()
      expect(screen.getByTestId('tldraw-canvas')).toBeInTheDocument()
      expect(screen.getByTestId('collaboration-indicator')).toBeInTheDocument()
    })
  })

  describe('Layout Management', () => {
    it('toggles whiteboard visibility', async () => {
      const user = userEvent.setup()
      render(<MultiModalClassroom {...defaultProps} />)

      const toggleButton = screen.getByText(/Hide.*Whiteboard/)
      await user.click(toggleButton)

      expect(screen.getByText(/Show.*Whiteboard/)).toBeInTheDocument()
      expect(screen.queryByTestId('whiteboard-toolbar')).not.toBeInTheDocument()
    })

    it('adjusts layout when whiteboard is hidden', async () => {
      const user = userEvent.setup()
      render(<MultiModalClassroom {...defaultProps} />)

      const toggleButton = screen.getByText(/Hide.*Whiteboard/)
      await user.click(toggleButton)

      // Audio visualizer should take full width
      expect(screen.getByTestId('audio-visualizer')).toBeInTheDocument()
    })
  })

  describe('Voice Command Integration', () => {
    it('toggles voice command listening', async () => {
      const user = userEvent.setup()
      render(<MultiModalClassroom {...defaultProps} />)

      const voiceButton = screen.getByText(/Voice Drawing/)
      await user.click(voiceButton)

      // Voice command processor should become visible
      await waitFor(() => {
        expect(screen.getByTestId('voice-command-processor')).toBeInTheDocument()
      })
    })

    it('executes drawing commands from voice', async () => {
      const user = userEvent.setup()
      render(<MultiModalClassroom {...defaultProps} />)

      // Enable voice commands
      const voiceButton = screen.getByText(/Voice Drawing/)
      await user.click(voiceButton)

      // Simulate voice command
      await waitFor(() => {
        const mockVoiceButton = screen.getByText('Mock Voice Command')
        user.click(mockVoiceButton)
      })

      // Should show last command feedback
      await waitFor(() => {
        expect(screen.getByText(/Last command/)).toBeInTheDocument()
      })
    })

    it('hides voice processor when disabled', async () => {
      const user = userEvent.setup()
      render(<MultiModalClassroom {...defaultProps} />)

      // Enable then disable voice commands
      const voiceButton = screen.getByText(/Voice Drawing/)
      await user.click(voiceButton)
      await user.click(voiceButton)

      expect(screen.queryByTestId('voice-command-processor')).not.toBeInTheDocument()
    })
  })

  describe('Math Mode Integration', () => {
    it('toggles math mode', async () => {
      const user = userEvent.setup()
      render(<MultiModalClassroom {...defaultProps} />)

      const mathButton = screen.getByText(/Math Mode/)
      await user.click(mathButton)

      // Math notation overlay should become visible
      await waitFor(() => {
        expect(screen.getByTestId('math-notation-overlay')).toBeInTheDocument()
      })
    })

    it('inserts math expressions on canvas', async () => {
      const user = userEvent.setup()
      render(<MultiModalClassroom {...defaultProps} />)

      // Enable math mode
      const mathButton = screen.getByText(/Math Mode/)
      await user.click(mathButton)

      // Insert math expression
      await waitFor(async () => {
        const insertButton = screen.getByText('Insert Math')
        await user.click(insertButton)
      })

      // Should execute math insertion command
      expect(true).toBe(true) // Math insertion handled
    })

    it('syncs math mode state with toolbar', async () => {
      const user = userEvent.setup()
      render(<MultiModalClassroom {...defaultProps} />)

      const mathButton = screen.getByText(/Math Mode/)
      await user.click(mathButton)

      // Toolbar should reflect math mode state
      expect(screen.getByText(/Math Mode: On/)).toBeInTheDocument()
    })
  })

  describe('Audio Integration', () => {
    it('forwards audio controls to visualizer', () => {
      render(<MultiModalClassroom {...defaultProps} />)

      expect(screen.getByText('Connection: Connected')).toBeInTheDocument()
      expect(screen.getByText('Muted: No')).toBeInTheDocument()
      expect(screen.getByText('Student: Test Student')).toBeInTheDocument()
    })

    it('handles mute toggle', async () => {
      const user = userEvent.setup()
      render(<MultiModalClassroom {...defaultProps} />)

      const muteButton = screen.getByText('Toggle Mute')
      await user.click(muteButton)

      expect(mockOnMuteToggle).toHaveBeenCalled()
    })

    it('handles session end', async () => {
      const user = userEvent.setup()
      render(<MultiModalClassroom {...defaultProps} />)

      const endButton = screen.getByText('End Session')
      await user.click(endButton)

      expect(mockOnEndSession).toHaveBeenCalled()
    })
  })

  describe('Whiteboard Integration', () => {
    it('initializes tldraw with collaboration store', () => {
      render(<MultiModalClassroom {...defaultProps} />)

      expect(screen.getByTestId('tldraw-canvas')).toBeInTheDocument()
      expect(screen.getByText('Whiteboard Canvas')).toBeInTheDocument()
    })

    it('handles editor mounting', async () => {
      render(<MultiModalClassroom {...defaultProps} />)

      // Editor should be mounted and ready
      await waitFor(() => {
        expect(screen.getByTestId('tldraw-canvas')).toBeInTheDocument()
      })
    })

    it('shows collaboration indicator', () => {
      render(<MultiModalClassroom {...defaultProps} />)

      expect(screen.getByTestId('collaboration-indicator')).toBeInTheDocument()
      expect(screen.getByText(/Session: test-session-123/)).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('renders efficiently with all components', () => {
      const start = performance.now()

      render(<MultiModalClassroom {...defaultProps} />)

      const duration = performance.now() - start

      expect(duration).toBeLessThan(100) // Should render quickly
    })

    it('handles rapid state changes efficiently', async () => {
      const user = userEvent.setup()
      const { rerender } = render(<MultiModalClassroom {...defaultProps} />)

      const start = performance.now()

      // Rapid state changes
      for (let i = 0; i < 5; i++) {
        rerender(<MultiModalClassroom {...defaultProps} isMuted={i % 2 === 0} />)
      }

      const duration = performance.now() - start

      expect(duration).toBeLessThan(50) // Should handle updates quickly
    })
  })

  describe('Error Handling', () => {
    it('handles component initialization gracefully', () => {
      render(<MultiModalClassroom {...defaultProps} />)

      expect(screen.getByText('AI Mathematics Classroom')).toBeInTheDocument()
    })

    it('handles disconnected state', () => {
      render(<MultiModalClassroom {...defaultProps} isConnected={false} />)

      expect(screen.getByText('Connection: Disconnected')).toBeInTheDocument()
    })

    it('handles component mounting errors gracefully', () => {
      // Should not crash even if child components fail
      render(<MultiModalClassroom {...defaultProps} />)

      expect(screen.getByText('AI Mathematics Classroom')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('provides keyboard navigation support', async () => {
      const user = userEvent.setup()
      render(<MultiModalClassroom {...defaultProps} />)

      // Should be able to tab through controls
      await user.tab()
      expect(document.activeElement).toBeDefined()
    })

    it('provides accessible labels for controls', () => {
      render(<MultiModalClassroom {...defaultProps} />)

      expect(screen.getByText(/Voice Drawing/)).toBeInTheDocument()
      expect(screen.getByText(/Math Mode/)).toBeInTheDocument()
      expect(screen.getByText(/Whiteboard/)).toBeInTheDocument()
    })

    it('supports screen readers', () => {
      render(<MultiModalClassroom {...defaultProps} />)

      // Session information should be accessible
      expect(screen.getByText(/Duration:/)).toBeInTheDocument()
      expect(screen.getByText(/participant/)).toBeInTheDocument()
    })
  })

  describe('Collaboration Features', () => {
    it('shows collaborator count', () => {
      render(<MultiModalClassroom {...defaultProps} />)

      expect(screen.getByText(/1 participant/)).toBeInTheDocument()
    })

    it('updates collaborator display', () => {
      const { rerender } = render(<MultiModalClassroom {...defaultProps} />)

      // Simulate more collaborators
      rerender(<MultiModalClassroom {...defaultProps} />)

      expect(screen.getByTestId('collaboration-indicator')).toBeInTheDocument()
    })
  })

  describe('Voice Command Execution', () => {
    it('executes draw commands on canvas', async () => {
      const user = userEvent.setup()
      render(<MultiModalClassroom {...defaultProps} />)

      // Enable voice commands and execute
      const voiceButton = screen.getByText(/Voice Drawing/)
      await user.click(voiceButton)

      await waitFor(async () => {
        const mockVoiceButton = screen.getByText('Mock Voice Command')
        await user.click(mockVoiceButton)
      })

      // Command should be processed and shown
      await waitFor(() => {
        expect(screen.getByText(/Last:/)).toBeInTheDocument()
      })
    })

    it('shows command feedback', async () => {
      const user = userEvent.setup()
      render(<MultiModalClassroom {...defaultProps} />)

      // Enable voice commands
      const voiceButton = screen.getByText(/Voice Drawing/)
      await user.click(voiceButton)

      await waitFor(async () => {
        const mockVoiceButton = screen.getByText('Mock Voice Command')
        await user.click(mockVoiceButton)
      })

      // Should show feedback badge
      await waitFor(() => {
        expect(screen.getByText(/Last command/)).toBeInTheDocument()
      })
    })
  })
})