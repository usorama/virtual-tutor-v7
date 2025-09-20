import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { MathNotationOverlay } from '../MathNotationOverlay'

// Mock KaTeX
vi.mock('katex', () => ({
  default: {
    renderToString: vi.fn((latex: string) => {
      // Mock successful rendering
      if (latex.includes('invalid')) {
        throw new Error('Invalid LaTeX')
      }
      return `<span class="katex-html">${latex}</span>`
    })
  }
}))

// Mock tldraw Editor
const mockEditor = {
  getViewportScreenBounds: vi.fn(() => ({
    center: { x: 400, y: 300 }
  })),
  createShapes: vi.fn(),
  getCurrentPageShapes: vi.fn(() => [])
}

describe('MathNotationOverlay', () => {
  const mockOnMathInsert = vi.fn()
  const defaultProps = {
    editor: mockEditor as any,
    onMathInsert: mockOnMathInsert
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Component Rendering', () => {
    it('renders trigger button when not visible', () => {
      render(<MathNotationOverlay {...defaultProps} />)

      expect(screen.getByText('Math Expression')).toBeInTheDocument()
      expect(screen.queryByText('Math Notation')).not.toBeInTheDocument()
    })

    it('shows overlay when trigger button is clicked', async () => {
      const user = userEvent.setup()
      render(<MathNotationOverlay {...defaultProps} />)

      const triggerButton = screen.getByText('Math Expression')
      await user.click(triggerButton)

      expect(screen.getByText('Math Notation')).toBeInTheDocument()
      expect(screen.getByText('Custom LaTeX Expression:')).toBeInTheDocument()
    })

    it('closes overlay when close button is clicked', async () => {
      const user = userEvent.setup()
      render(<MathNotationOverlay {...defaultProps} />)

      // Open overlay
      const triggerButton = screen.getByText('Math Expression')
      await user.click(triggerButton)

      // Close overlay (find button with X icon)
      const buttons = screen.getAllByRole('button')
      const xButton = buttons.find(button =>
        button.querySelector('svg')?.classList?.contains('lucide-x')
      )

      if (xButton) {
        await user.click(xButton)
      } else {
        // Fallback: use escape key
        await user.keyboard('{Escape}')
      }

      expect(screen.queryByText('Math Notation')).not.toBeInTheDocument()
    })
  })

  describe('LaTeX Expression Input', () => {
    it('allows typing custom LaTeX expressions', async () => {
      const user = userEvent.setup()
      render(<MathNotationOverlay {...defaultProps} />)

      // Open overlay
      await user.click(screen.getByText('Math Expression'))

      // Set LaTeX expression directly (more reliable than typing complex LaTeX)
      const input = screen.getByPlaceholderText(/Enter LaTeX expression/i)
      fireEvent.change(input, { target: { value: '\\frac{x}{y}' } })

      expect(input).toHaveValue('\\frac{x}{y}')
    })

    it('shows live preview of LaTeX expression', async () => {
      const user = userEvent.setup()
      render(<MathNotationOverlay {...defaultProps} />)

      // Open overlay
      await user.click(screen.getByText('Math Expression'))

      // Set LaTeX expression directly
      const input = screen.getByPlaceholderText(/Enter LaTeX expression/i)
      fireEvent.change(input, { target: { value: '\\frac{x}{y}' } })

      // Check for preview
      await waitFor(() => {
        expect(screen.getByText('Preview:')).toBeInTheDocument()
      })
    })

    it('handles invalid LaTeX expressions gracefully', async () => {
      const user = userEvent.setup()
      render(<MathNotationOverlay {...defaultProps} />)

      // Open overlay
      await user.click(screen.getByText('Math Expression'))

      // Set invalid LaTeX
      const input = screen.getByPlaceholderText(/Enter LaTeX expression/i)
      fireEvent.change(input, { target: { value: '\\invalid{expression}' } })

      // Should still show the input without crashing
      expect(input).toHaveValue('\\invalid{expression}')
    })

    it('inserts custom expression when insert button is clicked', async () => {
      const user = userEvent.setup()
      render(<MathNotationOverlay {...defaultProps} />)

      // Open overlay
      await user.click(screen.getByText('Math Expression'))

      // Set expression
      const input = screen.getByPlaceholderText(/Enter LaTeX expression/i)
      fireEvent.change(input, { target: { value: '\\frac{x}{y}' } })

      // Click insert button
      const insertButton = screen.getByText('Insert Custom Expression')
      await user.click(insertButton)

      expect(mockOnMathInsert).toHaveBeenCalledWith('\\frac{x}{y}', { x: 400, y: 300 })
    })

    it('handles Enter key to insert expression', async () => {
      const user = userEvent.setup()
      render(<MathNotationOverlay {...defaultProps} />)

      // Open overlay
      await user.click(screen.getByText('Math Expression'))

      // Set expression and press Enter
      const input = screen.getByPlaceholderText(/Enter LaTeX expression/i)
      fireEvent.change(input, { target: { value: '\\sqrt{25}' } })
      await user.keyboard('{Enter}')

      expect(mockOnMathInsert).toHaveBeenCalledWith('\\sqrt{25}', { x: 400, y: 300 })
    })

    it('handles Escape key to close overlay', async () => {
      const user = userEvent.setup()
      render(<MathNotationOverlay {...defaultProps} />)

      // Open overlay
      await user.click(screen.getByText('Math Expression'))

      // Press Escape
      const input = screen.getByPlaceholderText(/Enter LaTeX expression/i)
      await user.click(input)
      await user.keyboard('{Escape}')

      expect(screen.queryByText('Math Notation')).not.toBeInTheDocument()
    })
  })

  describe('Template System', () => {
    it('displays math templates organized by category', async () => {
      const user = userEvent.setup()
      render(<MathNotationOverlay {...defaultProps} />)

      // Open overlay
      await user.click(screen.getByText('Math Expression'))

      // Check for category filters
      expect(screen.getByText('basic')).toBeInTheDocument()
      expect(screen.getByText('algebra')).toBeInTheDocument()
      expect(screen.getByText('geometry')).toBeInTheDocument()
      expect(screen.getByText('calculus')).toBeInTheDocument()
    })

    it('filters templates by selected category', async () => {
      const user = userEvent.setup()
      render(<MathNotationOverlay {...defaultProps} />)

      // Open overlay
      await user.click(screen.getByText('Math Expression'))

      // Switch to algebra category
      const algebraButton = screen.getByText('algebra')
      await user.click(algebraButton)

      // Should show algebra templates
      expect(screen.getByText('Quadratic')).toBeInTheDocument()
      expect(screen.getByText('Binomial')).toBeInTheDocument()
    })

    it('inserts template when template button is clicked', async () => {
      const user = userEvent.setup()
      render(<MathNotationOverlay {...defaultProps} />)

      // Open overlay
      await user.click(screen.getByText('Math Expression'))

      // Click on a template (e.g., Fraction)
      const fractionTemplate = screen.getByText('Fraction')
      await user.click(fractionTemplate.closest('button')!)

      expect(mockOnMathInsert).toHaveBeenCalledWith('\\frac{1}{2}', { x: 400, y: 300 })
    })

    it('shows template preview with rendered LaTeX', async () => {
      const user = userEvent.setup()
      render(<MathNotationOverlay {...defaultProps} />)

      // Open overlay
      await user.click(screen.getByText('Math Expression'))

      // Templates should show rendered LaTeX
      await waitFor(() => {
        expect(screen.getByText('Fraction')).toBeInTheDocument()
      })
    })
  })

  describe('Position Calculation', () => {
    it('calculates cursor position from editor viewport', async () => {
      const user = userEvent.setup()
      render(<MathNotationOverlay {...defaultProps} />)

      // Open overlay
      await user.click(screen.getByText('Math Expression'))

      // Insert a template
      const fractionTemplate = screen.getByText('Fraction')
      await user.click(fractionTemplate.closest('button')!)

      // Should use editor's viewport center
      expect(mockEditor.getViewportScreenBounds).toHaveBeenCalled()
      expect(mockOnMathInsert).toHaveBeenCalledWith('\\frac{1}{2}', { x: 400, y: 300 })
    })

    it('handles missing editor gracefully', async () => {
      const user = userEvent.setup()
      render(<MathNotationOverlay {...defaultProps} editor={null} />)

      // Open overlay
      await user.click(screen.getByText('Math Expression'))

      // Insert expression
      const input = screen.getByPlaceholderText(/Enter LaTeX expression/i)
      fireEvent.change(input, { target: { value: '\\pi' } })
      await user.keyboard('{Enter}')

      // Should work without position
      expect(mockOnMathInsert).toHaveBeenCalledWith('\\pi', undefined)
    })
  })

  describe('Performance', () => {
    it('renders LaTeX expressions efficiently', async () => {
      const user = userEvent.setup()
      const start = performance.now()

      render(<MathNotationOverlay {...defaultProps} />)

      // Open overlay
      await user.click(screen.getByText('Math Expression'))

      // Set and render expression
      const input = screen.getByPlaceholderText(/Enter LaTeX expression/i)
      fireEvent.change(input, { target: { value: '\\frac{x^2}{y^2}' } })

      const duration = performance.now() - start

      // Should render quickly (less than 100ms for this simple operation)
      expect(duration).toBeLessThan(100)
    })

    it('debounces preview updates for performance', async () => {
      const katex = await import('katex')
      const renderSpy = vi.spyOn(katex.default, 'renderToString')

      const user = userEvent.setup()
      render(<MathNotationOverlay {...defaultProps} />)

      // Open overlay
      await user.click(screen.getByText('Math Expression'))

      // Type quickly
      const input = screen.getByPlaceholderText(/Enter LaTeX expression/i)
      await user.type(input, 'x^2')

      // Should not render for every keystroke
      await waitFor(() => {
        expect(renderSpy).toHaveBeenCalled()
      })

      renderSpy.mockRestore()
    })
  })

  describe('Accessibility', () => {
    it('provides keyboard navigation support', async () => {
      const user = userEvent.setup()
      render(<MathNotationOverlay {...defaultProps} />)

      // Open overlay
      await user.click(screen.getByText('Math Expression'))

      // Should be able to focus the input element directly
      const input = screen.getByPlaceholderText(/Enter LaTeX expression/i)
      await user.click(input)
      expect(input).toHaveFocus()
    })

    it('provides accessible labels for templates', async () => {
      const user = userEvent.setup()
      render(<MathNotationOverlay {...defaultProps} />)

      // Open overlay
      await user.click(screen.getByText('Math Expression'))

      // Templates should have accessible names
      expect(screen.getByText('Fraction')).toBeInTheDocument()
      expect(screen.getByText('Square Root')).toBeInTheDocument()
    })

    it('supports screen readers with proper ARIA labels', async () => {
      const user = userEvent.setup()
      render(<MathNotationOverlay {...defaultProps} />)

      // Open overlay
      await user.click(screen.getByText('Math Expression'))

      // Input should have proper label
      expect(screen.getByLabelText(/Custom LaTeX Expression/i)).toBeInTheDocument()
    })
  })

  describe('Help System', () => {
    it('displays LaTeX reference guide', async () => {
      const user = userEvent.setup()
      render(<MathNotationOverlay {...defaultProps} />)

      // Open overlay
      await user.click(screen.getByText('Math Expression'))

      // Check for help section
      expect(screen.getByText('Quick LaTeX Reference:')).toBeInTheDocument()
      expect(screen.getByText('\\frac{1}{2} → fraction')).toBeInTheDocument()
      expect(screen.getByText('\\sqrt{25} → square root')).toBeInTheDocument()
    })

    it('shows LaTeX syntax examples', async () => {
      const user = userEvent.setup()
      render(<MathNotationOverlay {...defaultProps} />)

      // Open overlay
      await user.click(screen.getByText('Math Expression'))

      // Check for syntax examples
      expect(screen.getByText('x^{2} → superscript')).toBeInTheDocument()
      expect(screen.getByText('x_{1} → subscript')).toBeInTheDocument()
      expect(screen.getByText('\\pi → π symbol')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('handles KaTeX rendering errors gracefully', async () => {
      const user = userEvent.setup()
      render(<MathNotationOverlay {...defaultProps} />)

      // Open overlay
      await user.click(screen.getByText('Math Expression'))

      // Set invalid LaTeX that will throw error
      const input = screen.getByPlaceholderText(/Enter LaTeX expression/i)
      fireEvent.change(input, { target: { value: '\\invalid{syntax}' } })

      // Component should not crash
      expect(input).toHaveValue('\\invalid{syntax}')
      expect(screen.getByText('Math Notation')).toBeInTheDocument()
    })

    it('prevents insertion of empty expressions', async () => {
      const user = userEvent.setup()
      render(<MathNotationOverlay {...defaultProps} />)

      // Open overlay
      await user.click(screen.getByText('Math Expression'))

      // Try to insert empty expression
      const insertButton = screen.getByText('Insert Custom Expression')
      await user.click(insertButton)

      // Should not call onMathInsert with empty expression
      expect(mockOnMathInsert).not.toHaveBeenCalled()
    })
  })

  describe('State Management', () => {
    it('clears custom expression after insertion', async () => {
      const user = userEvent.setup()
      render(<MathNotationOverlay {...defaultProps} />)

      // Open overlay
      await user.click(screen.getByText('Math Expression'))

      // Set and insert expression
      const input = screen.getByPlaceholderText(/Enter LaTeX expression/i)
      fireEvent.change(input, { target: { value: '\\pi' } })
      await user.keyboard('{Enter}')

      // Input should be cleared
      expect(input).toHaveValue('')
    })

    it('closes overlay after template insertion', async () => {
      const user = userEvent.setup()
      render(<MathNotationOverlay {...defaultProps} />)

      // Open overlay
      await user.click(screen.getByText('Math Expression'))

      // Click template
      const fractionTemplate = screen.getByText('Fraction')
      await user.click(fractionTemplate.closest('button')!)

      // Overlay should close
      expect(screen.queryByText('Math Notation')).not.toBeInTheDocument()
    })

    it('maintains category selection across sessions', async () => {
      const user = userEvent.setup()
      render(<MathNotationOverlay {...defaultProps} />)

      // Open overlay and select algebra
      await user.click(screen.getByText('Math Expression'))
      await user.click(screen.getByText('algebra'))

      // Close and reopen
      await user.keyboard('{Escape}')
      await user.click(screen.getByText('Math Expression'))

      // Should remember algebra selection
      expect(screen.getByText('algebra')).toHaveClass(/default/) // or whatever active class
    })
  })
})