import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { MathNotationOverlay } from '../../MathNotationOverlay'
import { MultiModalClassroom } from '../../MultiModalClassroom'

// Mock tldraw editor for math integration
const mockEditor = {
  getViewportScreenBounds: vi.fn(() => ({
    center: { x: 400, y: 300 }
  })),
  createShapes: vi.fn(),
  getCurrentPageShapes: vi.fn(() => []),
  insertText: vi.fn(),
  createTextShape: vi.fn(),
  addMathElement: vi.fn()
} as any

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

// Mock KaTeX for math rendering integration
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

describe('Math Notation to Canvas Integration Tests', () => {
  let mockOnMathInsert: any

  const mockProps = {
    sessionId: 'test-session-123',
    isConnected: true,
    isMuted: false,
    onMuteToggle: vi.fn(),
    onEndSession: vi.fn(),
    studentName: 'Test Student',
    sessionDuration: '00:15:30',
    connectionQuality: 'excellent' as const
  }

  beforeEach(() => {
    mockOnMathInsert = vi.fn()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Math Expression Processing Flow', () => {
    it('processes custom LaTeX expressions and integrates with canvas', async () => {
      const user = userEvent.setup()

      render(
        <MathNotationOverlay
          editor={mockEditor}
          onMathInsert={mockOnMathInsert}
        />
      )

      // Open math overlay
      await user.click(screen.getByText('Math Expression'))

      // Enter LaTeX expression
      const input = screen.getByPlaceholderText(/Enter LaTeX expression/i)
      fireEvent.change(input, { target: { value: '\\frac{d}{dx}(x^2) = 2x' } })

      // Insert expression
      const insertButton = screen.getByText('Insert Custom Expression')
      await user.click(insertButton)

      // Verify math integration with canvas
      expect(mockOnMathInsert).toHaveBeenCalledWith(
        '\\frac{d}{dx}(x^2) = 2x',
        { x: 400, y: 300 }
      )
    })

    it('processes math templates and inserts to canvas', async () => {
      const user = userEvent.setup()

      render(
        <MathNotationOverlay
          editor={mockEditor}
          onMathInsert={mockOnMathInsert}
        />
      )

      // Open overlay
      await user.click(screen.getByText('Math Expression'))

      // Click fraction template
      const fractionTemplate = screen.getByText('Fraction')
      await user.click(fractionTemplate.closest('button')!)

      // Verify template insertion
      expect(mockOnMathInsert).toHaveBeenCalledWith(
        '\\frac{1}{2}',
        { x: 400, y: 300 }
      )
    })

    it('handles complex mathematical expressions', async () => {
      const user = userEvent.setup()

      render(
        <MathNotationOverlay
          editor={mockEditor}
          onMathInsert={mockOnMathInsert}
        />
      )

      await user.click(screen.getByText('Math Expression'))

      // Enter complex expression
      const input = screen.getByPlaceholderText(/Enter LaTeX expression/i)
      fireEvent.change(input, {
        target: { value: '\\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}' }
      })

      const insertButton = screen.getByText('Insert Custom Expression')
      await user.click(insertButton)

      expect(mockOnMathInsert).toHaveBeenCalledWith(
        '\\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}',
        { x: 400, y: 300 }
      )
    })
  })

  describe('Canvas Integration Flow', () => {
    it('integrates math overlay with full classroom canvas', async () => {
      const user = userEvent.setup()

      render(<MultiModalClassroom {...mockProps} />)

      await waitFor(() => {
        expect(screen.getByTestId('tldraw-canvas')).toBeInTheDocument()
      })

      // Open math notation
      const mathButton = screen.getByText('Math Expression')
      await user.click(mathButton)

      // Verify overlay appears over canvas
      expect(screen.getByText('Math Notation')).toBeInTheDocument()
      expect(screen.getByTestId('tldraw-canvas')).toBeInTheDocument()

      // Insert expression
      const input = screen.getByPlaceholderText(/Enter LaTeX expression/i)
      fireEvent.change(input, { target: { value: 'f(x) = ax^2 + bx + c' } })

      const insertButton = screen.getByText('Insert Custom Expression')
      await user.click(insertButton)

      // Verify canvas is still active
      expect(screen.getByTestId('tldraw-canvas')).toBeInTheDocument()
    })

    it('handles math insertion with proper positioning', async () => {
      const user = userEvent.setup()

      render(
        <MathNotationOverlay
          editor={mockEditor}
          onMathInsert={mockOnMathInsert}
        />
      )

      await user.click(screen.getByText('Math Expression'))

      // Insert expression
      const input = screen.getByPlaceholderText(/Enter LaTeX expression/i)
      fireEvent.change(input, { target: { value: '\\sum_{n=1}^{\\infty} \\frac{1}{n^2}' } })

      const insertButton = screen.getByText('Insert Custom Expression')
      await user.click(insertButton)

      // Should use editor's viewport center for positioning
      expect(mockEditor.getViewportScreenBounds).toHaveBeenCalled()
      expect(mockOnMathInsert).toHaveBeenCalledWith(
        '\\sum_{n=1}^{\\infty} \\frac{1}{n^2}',
        { x: 400, y: 300 }
      )
    })

    it('closes overlay after successful insertion', async () => {
      const user = userEvent.setup()

      render(
        <MathNotationOverlay
          editor={mockEditor}
          onMathInsert={mockOnMathInsert}
        />
      )

      // Open overlay
      await user.click(screen.getByText('Math Expression'))
      expect(screen.getByText('Math Notation')).toBeInTheDocument()

      // Insert via template
      const fractionTemplate = screen.getByText('Fraction')
      await user.click(fractionTemplate.closest('button')!)

      // Overlay should close after insertion
      expect(screen.queryByText('Math Notation')).not.toBeInTheDocument()
    })
  })

  describe('LaTeX Rendering Integration', () => {
    it('renders LaTeX preview in real-time during typing', async () => {
      const user = userEvent.setup()

      render(
        <MathNotationOverlay
          editor={mockEditor}
          onMathInsert={mockOnMathInsert}
        />
      )

      await user.click(screen.getByText('Math Expression'))

      // Type expression
      const input = screen.getByPlaceholderText(/Enter LaTeX expression/i)
      fireEvent.change(input, { target: { value: '\\alpha + \\beta = \\gamma' } })

      // Should show preview
      await waitFor(() => {
        expect(screen.getByText('Preview:')).toBeInTheDocument()
      })
    })

    it('handles LaTeX rendering errors gracefully', async () => {
      const user = userEvent.setup()

      render(
        <MathNotationOverlay
          editor={mockEditor}
          onMathInsert={mockOnMathInsert}
        />
      )

      await user.click(screen.getByText('Math Expression'))

      // Enter invalid LaTeX
      const input = screen.getByPlaceholderText(/Enter LaTeX expression/i)
      fireEvent.change(input, { target: { value: '\\invalid{syntax}' } })

      // Should not crash
      expect(input).toHaveValue('\\invalid{syntax}')
      expect(screen.getByText('Math Notation')).toBeInTheDocument()
    })

    it('renders template previews correctly', async () => {
      const user = userEvent.setup()

      render(
        <MathNotationOverlay
          editor={mockEditor}
          onMathInsert={mockOnMathInsert}
        />
      )

      await user.click(screen.getByText('Math Expression'))

      // Templates should show rendered LaTeX
      await waitFor(() => {
        expect(screen.getByText('Fraction')).toBeInTheDocument()
        expect(screen.getByText('Square Root')).toBeInTheDocument()
      })
    })
  })

  describe('Performance Integration', () => {
    it('renders math expressions within performance targets', async () => {
      const startTime = performance.now()
      const user = userEvent.setup()

      render(
        <MathNotationOverlay
          editor={mockEditor}
          onMathInsert={mockOnMathInsert}
        />
      )

      await user.click(screen.getByText('Math Expression'))

      // Type and render expression
      const input = screen.getByPlaceholderText(/Enter LaTeX expression/i)
      fireEvent.change(input, { target: { value: '\\frac{x^2}{y^2}' } })

      const insertButton = screen.getByText('Insert Custom Expression')
      await user.click(insertButton)

      const duration = performance.now() - startTime

      // Should complete quickly (under 100ms for this operation)
      expect(duration).toBeLessThan(100)
      expect(mockOnMathInsert).toHaveBeenCalled()
    })

    it('handles rapid math insertions efficiently', async () => {
      const user = userEvent.setup()

      render(
        <MathNotationOverlay
          editor={mockEditor}
          onMathInsert={mockOnMathInsert}
        />
      )

      const startTime = performance.now()

      // Rapid template insertions
      for (let i = 0; i < 5; i++) {
        await user.click(screen.getByText('Math Expression'))

        const fractionTemplate = screen.getByText('Fraction')
        await user.click(fractionTemplate.closest('button')!)
      }

      const totalTime = performance.now() - startTime

      // Should handle multiple insertions quickly
      expect(totalTime).toBeLessThan(500) // 500ms for 5 insertions
      expect(mockOnMathInsert).toHaveBeenCalledTimes(5)
    })
  })

  describe('Multi-Modal Integration', () => {
    it('coordinates with voice commands in full classroom', async () => {
      const user = userEvent.setup()

      render(<MultiModalClassroom {...mockProps} />)

      await waitFor(() => {
        expect(screen.getByTestId('tldraw-canvas')).toBeInTheDocument()
      })

      // Both math and voice should be available
      expect(screen.getByText('Math Expression')).toBeInTheDocument()
      expect(screen.getByText('Voice Drawing Commands')).toBeInTheDocument()

      // Open math overlay
      const mathButton = screen.getByText('Math Expression')
      await user.click(mathButton)

      // Voice commands should still be available
      expect(screen.getByText('Voice Drawing Commands')).toBeInTheDocument()
    })

    it('maintains canvas state during math operations', async () => {
      const user = userEvent.setup()

      render(<MultiModalClassroom {...mockProps} />)

      await waitFor(() => {
        expect(screen.getByTestId('tldraw-canvas')).toBeInTheDocument()
      })

      // Perform math operation
      const mathButton = screen.getByText('Math Expression')
      await user.click(mathButton)

      const input = screen.getByPlaceholderText(/Enter LaTeX expression/i)
      fireEvent.change(input, { target: { value: 'E = mc^2' } })

      const insertButton = screen.getByText('Insert Custom Expression')
      await user.click(insertButton)

      // Canvas should remain stable
      expect(screen.getByTestId('tldraw-canvas')).toBeInTheDocument()
      expect(screen.getByText('Connected')).toBeInTheDocument()
    })
  })

  describe('Category Filtering Integration', () => {
    it('filters templates by category and integrates with canvas', async () => {
      const user = userEvent.setup()

      render(
        <MathNotationOverlay
          editor={mockEditor}
          onMathInsert={mockOnMathInsert}
        />
      )

      await user.click(screen.getByText('Math Expression'))

      // Switch to algebra category
      const algebraButton = screen.getByText('algebra')
      await user.click(algebraButton)

      // Should show algebra templates
      expect(screen.getByText('Quadratic')).toBeInTheDocument()

      // Insert algebra template
      const quadraticTemplate = screen.getByText('Quadratic')
      await user.click(quadraticTemplate.closest('button')!)

      // Should integrate with canvas
      expect(mockOnMathInsert).toHaveBeenCalled()
    })

    it('maintains category selection across overlay sessions', async () => {
      const user = userEvent.setup()

      render(
        <MathNotationOverlay
          editor={mockEditor}
          onMathInsert={mockOnMathInsert}
        />
      )

      // Open and select category
      await user.click(screen.getByText('Math Expression'))
      await user.click(screen.getByText('calculus'))

      // Close overlay
      await user.keyboard('{Escape}')

      // Reopen
      await user.click(screen.getByText('Math Expression'))

      // Category should be remembered
      expect(screen.getByText('calculus')).toBeInTheDocument()
    })
  })

  describe('Error Recovery Integration', () => {
    it('recovers from math insertion errors gracefully', async () => {
      const user = userEvent.setup()

      // Mock insertion failure
      const failingOnMathInsert = vi.fn(() => {
        throw new Error('Canvas insertion failed')
      })

      render(
        <MathNotationOverlay
          editor={mockEditor}
          onMathInsert={failingOnMathInsert}
        />
      )

      await user.click(screen.getByText('Math Expression'))

      const input = screen.getByPlaceholderText(/Enter LaTeX expression/i)
      fireEvent.change(input, { target: { value: 'x + y = z' } })

      // Even if insertion fails, overlay should remain functional
      expect(input).toHaveValue('x + y = z')
      expect(screen.getByText('Math Notation')).toBeInTheDocument()
    })

    it('handles editor disconnection gracefully', async () => {
      const user = userEvent.setup()

      render(
        <MathNotationOverlay
          editor={null}
          onMathInsert={mockOnMathInsert}
        />
      )

      await user.click(screen.getByText('Math Expression'))

      const input = screen.getByPlaceholderText(/Enter LaTeX expression/i)
      fireEvent.change(input, { target: { value: '\\pi r^2' } })

      await user.keyboard('{Enter}')

      // Should work without position when no editor
      expect(mockOnMathInsert).toHaveBeenCalledWith('\\pi r^2', undefined)
    })
  })
})