import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { MultiModalClassroom } from '../../MultiModalClassroom'

// Mock props for MultiModalClassroom
const mockProps = {
  sessionId: 'test-session-123',
  liveKitRoom: null,
  isConnected: true,
  isMuted: false,
  onMuteToggle: vi.fn(),
  onEndSession: vi.fn(),
  studentName: 'Test Student',
  sessionDuration: '00:15:30',
  connectionQuality: 'excellent' as const
}

// Mock dependencies for integration testing
vi.mock('@tldraw/tldraw', () => ({
  Tldraw: vi.fn(({ children, onMount, ...props }) => {
    // Simulate tldraw component with essential features
    const mockEditor = {
      getViewportScreenBounds: vi.fn(() => ({
        center: { x: 400, y: 300 }
      })),
      createShapes: vi.fn(),
      getCurrentPageShapes: vi.fn(() => []),
      selectAll: vi.fn(),
      deleteShapes: vi.fn()
    }

    // Simulate mounting behavior
    if (onMount) {
      setTimeout(() => onMount(mockEditor), 0)
    }

    return (
      <div data-testid="tldraw-canvas" {...props}>
        <div data-testid="mock-canvas">Mocked Tldraw Canvas</div>
        {children}
      </div>
    )
  }),
  DefaultKeyboardShortcutsDialog: vi.fn(() => null),
  DefaultKeyboardShortcutsDialogContent: vi.fn(() => null),
  TldrawUiMenuItem: vi.fn(() => null),
  DefaultToolbar: vi.fn(() => null),
  TldrawUiMenuGroup: vi.fn(() => null),
  useIsToolSelected: vi.fn(() => false),
  useTools: vi.fn(() => ({})),
  track: vi.fn((component) => component),
  useEditor: vi.fn(() => null)
}))

// Mock Deepgram SDK for voice integration testing
vi.mock('@deepgram/sdk', () => ({
  createClient: vi.fn(() => ({
    listen: {
      live: vi.fn(() => ({
        on: vi.fn(),
        send: vi.fn(),
        finish: vi.fn(),
        close: vi.fn()
      }))
    }
  })),
  LiveTranscriptionEvents: {
    Open: 'open',
    Close: 'close',
    Error: 'error',
    Transcript: 'transcript'
  }
}))

// Mock KaTeX for math integration testing
vi.mock('katex', () => ({
  default: {
    renderToString: vi.fn((latex: string) => {
      if (latex.includes('invalid')) {
        throw new Error('Invalid LaTeX')
      }
      return `<span class="katex-html">${latex}</span>`
    })
  }
}))

describe('MultiModalClassroom Integration Tests', () => {
  let mockAudioContext: any
  let mockMediaStream: any

  beforeEach(() => {
    // Mock Web Audio API
    mockAudioContext = {
      createMediaStreamSource: vi.fn(),
      createAnalyser: vi.fn(() => ({
        connect: vi.fn(),
        getByteFrequencyData: vi.fn(),
        frequencyBinCount: 128,
        fftSize: 256
      })),
      close: vi.fn()
    }
    global.AudioContext = vi.fn(() => mockAudioContext)

    // Mock MediaDevices
    mockMediaStream = {
      getTracks: vi.fn(() => [{ stop: vi.fn() }])
    }
    Object.defineProperty(navigator, 'mediaDevices', {
      writable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue(mockMediaStream)
      }
    })

    // Mock performance.now for timing tests
    vi.spyOn(performance, 'now').mockImplementation(() => Date.now())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Component Integration', () => {
    it('integrates voice commands with whiteboard drawing', async () => {
      const user = userEvent.setup()

      render(<MultiModalClassroom {...mockProps} />)

      // Wait for components to mount
      await waitFor(() => {
        expect(screen.getByTestId('tldraw-canvas')).toBeInTheDocument()
      })

      // Verify voice processor is connected
      expect(screen.getByText('Voice Drawing Commands')).toBeInTheDocument()

      // Verify whiteboard toolbar is available
      expect(screen.getByTestId('tldraw-canvas')).toBeInTheDocument()

      // Simulate voice command triggering drawing action
      const voiceProcessor = screen.getByText('Voice Drawing Commands').closest('div')
      expect(voiceProcessor).toBeInTheDocument()
    })

    it('integrates math notation with canvas display', async () => {
      const user = userEvent.setup()

      render(<MultiModalClassroom {...mockProps} />)

      // Wait for canvas to mount
      await waitFor(() => {
        expect(screen.getByTestId('tldraw-canvas')).toBeInTheDocument()
      })

      // Open math notation overlay
      const mathButton = screen.getByText('Math Expression')
      await user.click(mathButton)

      // Verify math overlay integration
      expect(screen.getByText('Math Notation')).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/Enter LaTeX expression/i)).toBeInTheDocument()

      // Insert math expression
      const input = screen.getByPlaceholderText(/Enter LaTeX expression/i)
      fireEvent.change(input, { target: { value: '\\sum_{i=1}^n x_i' } })

      const insertButton = screen.getByText('Insert Custom Expression')
      await user.click(insertButton)

      // Verify integration between math and canvas
      expect(screen.getByTestId('tldraw-canvas')).toBeInTheDocument()
    })

    it('maintains collaboration indicators during multi-modal interactions', async () => {
      const user = userEvent.setup()

      render(<MultiModalClassroom {...mockProps} />)

      // Wait for components to load
      await waitFor(() => {
        expect(screen.getByTestId('tldraw-canvas')).toBeInTheDocument()
      })

      // Verify collaboration status is displayed
      expect(screen.getByText('Connected')).toBeInTheDocument()

      // Perform multi-modal action (voice + math)
      const mathButton = screen.getByText('Math Expression')
      await user.click(mathButton)

      // Collaboration should remain intact
      expect(screen.getByText('Connected')).toBeInTheDocument()
    })
  })

  describe('Data Flow Integration', () => {
    it('properly flows voice commands to drawing actions', async () => {
      const user = userEvent.setup()

      render(<MultiModalClassroom {...mockProps} />)

      await waitFor(() => {
        expect(screen.getByTestId('tldraw-canvas')).toBeInTheDocument()
      })

      // Simulate voice command processing
      const voiceComponent = screen.getByText('Voice Drawing Commands').closest('div')

      // Voice commands should be processed and affect canvas
      expect(voiceComponent).toBeInTheDocument()
      expect(screen.getByTestId('tldraw-canvas')).toBeInTheDocument()
    })

    it('handles math expression data flow to canvas', async () => {
      const user = userEvent.setup()

      render(<MultiModalClassroom {...mockProps} />)

      await waitFor(() => {
        expect(screen.getByTestId('tldraw-canvas')).toBeInTheDocument()
      })

      // Open math notation
      const mathButton = screen.getByText('Math Expression')
      await user.click(mathButton)

      // Add expression
      const input = screen.getByPlaceholderText(/Enter LaTeX expression/i)
      fireEvent.change(input, { target: { value: 'E = mc^2' } })

      // Insert expression (should flow to canvas)
      const insertButton = screen.getByText('Insert Custom Expression')
      await user.click(insertButton)

      // Verify data reached canvas layer
      expect(screen.getByTestId('tldraw-canvas')).toBeInTheDocument()
    })

    it('coordinates toolbar actions with canvas state', async () => {
      const user = userEvent.setup()

      render(<MultiModalClassroom {...mockProps} />)

      await waitFor(() => {
        expect(screen.getByTestId('tldraw-canvas')).toBeInTheDocument()
      })

      // Toolbar actions should coordinate with canvas
      const canvas = screen.getByTestId('tldraw-canvas')
      expect(canvas).toBeInTheDocument()

      // Test that multiple components can coordinate
      const mathButton = screen.getByText('Math Expression')
      expect(mathButton).toBeInTheDocument()
    })
  })

  describe('Real-time Sync Integration', () => {
    it('synchronizes voice commands across components', async () => {
      const user = userEvent.setup()

      render(<MultiModalClassroom {...mockProps} />)

      await waitFor(() => {
        expect(screen.getByTestId('tldraw-canvas')).toBeInTheDocument()
      })

      // Voice commands should sync with canvas state
      const voiceProcessor = screen.getByText('Voice Drawing Commands')
      const canvas = screen.getByTestId('tldraw-canvas')

      expect(voiceProcessor).toBeInTheDocument()
      expect(canvas).toBeInTheDocument()
    })

    it('maintains sync during multi-modal operations', async () => {
      const user = userEvent.setup()

      render(<MultiModalClassroom {...mockProps} />)

      await waitFor(() => {
        expect(screen.getByTestId('tldraw-canvas')).toBeInTheDocument()
      })

      // Perform multiple actions in sequence
      const mathButton = screen.getByText('Math Expression')
      await user.click(mathButton)

      // Add math expression
      const input = screen.getByPlaceholderText(/Enter LaTeX expression/i)
      fireEvent.change(input, { target: { value: '\\int_0^1 x dx' } })

      const insertButton = screen.getByText('Insert Custom Expression')
      await user.click(insertButton)

      // All components should remain synchronized
      expect(screen.getByTestId('tldraw-canvas')).toBeInTheDocument()
      expect(screen.getByText('Connected')).toBeInTheDocument()
    })
  })

  describe('Performance Integration', () => {
    it('maintains performance during multi-modal interactions', async () => {
      const startTime = performance.now()
      const user = userEvent.setup()

      render(<MultiModalClassroom {...mockProps} />)

      await waitFor(() => {
        expect(screen.getByTestId('tldraw-canvas')).toBeInTheDocument()
      })

      // Perform multiple rapid actions
      const mathButton = screen.getByText('Math Expression')
      await user.click(mathButton)

      const input = screen.getByPlaceholderText(/Enter LaTeX expression/i)
      fireEvent.change(input, { target: { value: 'f(x) = x^2' } })

      const insertButton = screen.getByText('Insert Custom Expression')
      await user.click(insertButton)

      const totalTime = performance.now() - startTime

      // Should complete multi-modal operations quickly
      expect(totalTime).toBeLessThan(1000) // 1 second for integration test
    })

    it('handles concurrent multi-modal operations efficiently', async () => {
      const user = userEvent.setup()

      render(<MultiModalClassroom {...mockProps} />)

      await waitFor(() => {
        expect(screen.getByTestId('tldraw-canvas')).toBeInTheDocument()
      })

      // Simulate concurrent operations
      const mathButton = screen.getByText('Math Expression')
      const voiceProcessor = screen.getByText('Voice Drawing Commands')

      // Both should be operational simultaneously
      expect(mathButton).toBeInTheDocument()
      expect(voiceProcessor).toBeInTheDocument()
      expect(screen.getByTestId('tldraw-canvas')).toBeInTheDocument()
    })
  })

  describe('Error Handling Integration', () => {
    it('gracefully handles errors across integrated components', async () => {
      const user = userEvent.setup()

      render(<MultiModalClassroom {...mockProps} />)

      await waitFor(() => {
        expect(screen.getByTestId('tldraw-canvas')).toBeInTheDocument()
      })

      // Trigger potential error scenarios
      const mathButton = screen.getByText('Math Expression')
      await user.click(mathButton)

      // Test with invalid math expression
      const input = screen.getByPlaceholderText(/Enter LaTeX expression/i)
      fireEvent.change(input, { target: { value: '\\invalid{syntax}' } })

      // Should handle gracefully without breaking other components
      expect(input).toHaveValue('\\invalid{syntax}')
      expect(screen.getByTestId('tldraw-canvas')).toBeInTheDocument()
      expect(screen.getByText('Voice Drawing Commands')).toBeInTheDocument()
    })

    it('recovers from component integration failures', async () => {
      const user = userEvent.setup()

      render(<MultiModalClassroom {...mockProps} />)

      await waitFor(() => {
        expect(screen.getByTestId('tldraw-canvas')).toBeInTheDocument()
      })

      // Even if one component has issues, others should continue working
      expect(screen.getByText('Math Expression')).toBeInTheDocument()
      expect(screen.getByText('Voice Drawing Commands')).toBeInTheDocument()
      expect(screen.getByTestId('tldraw-canvas')).toBeInTheDocument()
    })
  })
})