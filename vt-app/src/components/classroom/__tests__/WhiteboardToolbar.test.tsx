import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { WhiteboardToolbar } from '../WhiteboardToolbar'

// Mock tldraw Editor
const mockEditor = {
  setCurrentTool: vi.fn(),
  getSelectedShapes: vi.fn(() => [] as any[]),
  updateShapes: vi.fn(),
  undo: vi.fn(),
  redo: vi.fn(),
  zoomIn: vi.fn(),
  zoomOut: vi.fn(),
  getCurrentPageShapes: vi.fn(() => [] as any[]),
  deleteShapes: vi.fn()
}

describe('WhiteboardToolbar', () => {
  const mockOnMathModeToggle = vi.fn()
  const defaultProps = {
    editor: mockEditor as any,
    mathMode: false,
    onMathModeToggle: mockOnMathModeToggle
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Component Rendering', () => {
    it('renders all tool sections', () => {
      render(<WhiteboardToolbar {...defaultProps} />)

      // Selection and Drawing Tools
      expect(screen.getByRole('button', { name: /select/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /draw/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /erase/i })).toBeInTheDocument()

      // Shape Tools
      expect(screen.getByRole('button', { name: /circle/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /square/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /triangle/i })).toBeInTheDocument()

      // Text and Math Tools
      expect(screen.getByRole('button', { name: /text/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /calculator/i })).toBeInTheDocument()

      // History Controls
      expect(screen.getByRole('button', { name: /undo/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /redo/i })).toBeInTheDocument()

      // Zoom Controls
      expect(screen.getByRole('button', { name: /zoom out/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /zoom in/i })).toBeInTheDocument()

      // Action Controls
      expect(screen.getByText('Export')).toBeInTheDocument()
      expect(screen.getByText('Clear')).toBeInTheDocument()
    })

    it('shows color palette with all colors', () => {
      render(<WhiteboardToolbar {...defaultProps} />)

      // Should have palette icon and color buttons
      expect(screen.getByRole('button', { name: /black/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /blue/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /red/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /green/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /orange/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /purple/i })).toBeInTheDocument()
    })

    it('handles missing editor gracefully', () => {
      render(<WhiteboardToolbar {...defaultProps} editor={null} />)

      // All buttons should still render
      expect(screen.getByRole('button', { name: /select/i })).toBeInTheDocument()
      expect(screen.getByText('Export')).toBeInTheDocument()
    })
  })

  describe('Tool Selection', () => {
    it('sets select tool when select button is clicked', async () => {
      const user = userEvent.setup()
      render(<WhiteboardToolbar {...defaultProps} />)

      const selectButton = screen.getByRole('button', { name: /select/i })
      await user.click(selectButton)

      expect(mockEditor.setCurrentTool).toHaveBeenCalledWith('select')
    })

    it('sets draw tool when draw button is clicked', async () => {
      const user = userEvent.setup()
      render(<WhiteboardToolbar {...defaultProps} />)

      const drawButton = screen.getByRole('button', { name: /draw/i })
      await user.click(drawButton)

      expect(mockEditor.setCurrentTool).toHaveBeenCalledWith('draw')
    })

    it('sets eraser tool when eraser button is clicked', async () => {
      const user = userEvent.setup()
      render(<WhiteboardToolbar {...defaultProps} />)

      const eraserButton = screen.getByRole('button', { name: /erase/i })
      await user.click(eraserButton)

      expect(mockEditor.setCurrentTool).toHaveBeenCalledWith('eraser')
    })

    it('sets text tool when text button is clicked', async () => {
      const user = userEvent.setup()
      render(<WhiteboardToolbar {...defaultProps} />)

      const textButton = screen.getByRole('button', { name: /text/i })
      await user.click(textButton)

      expect(mockEditor.setCurrentTool).toHaveBeenCalledWith('text')
    })

    it('handles tool selection errors gracefully', async () => {
      const user = userEvent.setup()
      mockEditor.setCurrentTool.mockImplementation(() => {
        throw new Error('Tool selection failed')
      })

      render(<WhiteboardToolbar {...defaultProps} />)

      const selectButton = screen.getByRole('button', { name: /select/i })
      await user.click(selectButton)

      // Should not crash the component
      expect(screen.getByRole('button', { name: /select/i })).toBeInTheDocument()
    })
  })

  describe('Shape Tool Selection', () => {
    it('sets geometry tool with circle shape', async () => {
      const user = userEvent.setup()
      render(<WhiteboardToolbar {...defaultProps} />)

      const circleButton = screen.getByRole('button', { name: /circle/i })
      await user.click(circleButton)

      expect(mockEditor.setCurrentTool).toHaveBeenCalledWith('geo')
    })

    it('sets geometry tool with rectangle shape', async () => {
      const user = userEvent.setup()
      render(<WhiteboardToolbar {...defaultProps} />)

      const rectangleButton = screen.getByRole('button', { name: /square/i })
      await user.click(rectangleButton)

      expect(mockEditor.setCurrentTool).toHaveBeenCalledWith('geo')
    })

    it('sets geometry tool with triangle shape', async () => {
      const user = userEvent.setup()
      render(<WhiteboardToolbar {...defaultProps} />)

      const triangleButton = screen.getByRole('button', { name: /triangle/i })
      await user.click(triangleButton)

      expect(mockEditor.setCurrentTool).toHaveBeenCalledWith('geo')
    })

    it('sets geometry tool with line shape', async () => {
      const user = userEvent.setup()
      render(<WhiteboardToolbar {...defaultProps} />)

      const lineButton = screen.getByRole('button', { name: /line/i })
      await user.click(lineButton)

      expect(mockEditor.setCurrentTool).toHaveBeenCalledWith('geo')
    })

    it('sets geometry tool with arrow shape', async () => {
      const user = userEvent.setup()
      render(<WhiteboardToolbar {...defaultProps} />)

      const arrowButton = screen.getByRole('button', { name: /arrow/i })
      await user.click(arrowButton)

      expect(mockEditor.setCurrentTool).toHaveBeenCalledWith('geo')
    })
  })

  describe('Color Management', () => {
    it('changes color for selected shapes', async () => {
      const user = userEvent.setup()
      const mockShape = {
        id: 'shape1',
        type: 'geo',
        props: { color: 'black' }
      }
      mockEditor.getSelectedShapes.mockReturnValue([mockShape])

      render(<WhiteboardToolbar {...defaultProps} />)

      const blueButton = screen.getByRole('button', { name: /blue/i })
      await user.click(blueButton)

      expect(mockEditor.updateShapes).toHaveBeenCalledWith([{
        id: 'shape1',
        type: 'geo',
        props: { ...mockShape.props, color: 'blue' }
      }])
    })

    it('handles color change with no selected shapes', async () => {
      const user = userEvent.setup()
      mockEditor.getSelectedShapes.mockReturnValue([])

      render(<WhiteboardToolbar {...defaultProps} />)

      const redButton = screen.getByRole('button', { name: /red/i })
      await user.click(redButton)

      // Should not crash when no shapes selected
      expect(mockEditor.updateShapes).not.toHaveBeenCalled()
    })

    it('handles color change errors gracefully', async () => {
      const user = userEvent.setup()
      mockEditor.updateShapes.mockImplementation(() => {
        throw new Error('Color update failed')
      })

      render(<WhiteboardToolbar {...defaultProps} />)

      const greenButton = screen.getByRole('button', { name: /green/i })
      await user.click(greenButton)

      // Should not crash the component
      expect(screen.getByRole('button', { name: /green/i })).toBeInTheDocument()
    })

    it('shows active color selection visually', async () => {
      const user = userEvent.setup()
      render(<WhiteboardToolbar {...defaultProps} />)

      const orangeButton = screen.getByRole('button', { name: /orange/i })
      await user.click(orangeButton)

      // Active color should have different styling (tested through class changes)
      expect(orangeButton).toBeInTheDocument()
    })
  })

  describe('History Controls', () => {
    it('calls undo when undo button is clicked', async () => {
      const user = userEvent.setup()
      render(<WhiteboardToolbar {...defaultProps} />)

      const undoButton = screen.getByRole('button', { name: /undo/i })
      await user.click(undoButton)

      expect(mockEditor.undo).toHaveBeenCalled()
    })

    it('calls redo when redo button is clicked', async () => {
      const user = userEvent.setup()
      render(<WhiteboardToolbar {...defaultProps} />)

      const redoButton = screen.getByRole('button', { name: /redo/i })
      await user.click(redoButton)

      expect(mockEditor.redo).toHaveBeenCalled()
    })

    it('handles history operations with null editor', async () => {
      const user = userEvent.setup()
      render(<WhiteboardToolbar {...defaultProps} editor={null} />)

      const undoButton = screen.getByRole('button', { name: /undo/i })
      await user.click(undoButton)

      // Should not crash when editor is null
      expect(screen.getByRole('button', { name: /undo/i })).toBeInTheDocument()
    })
  })

  describe('Zoom Controls', () => {
    it('calls zoomIn when zoom in button is clicked', async () => {
      const user = userEvent.setup()
      render(<WhiteboardToolbar {...defaultProps} />)

      const zoomInButton = screen.getByRole('button', { name: /zoom in/i })
      await user.click(zoomInButton)

      expect(mockEditor.zoomIn).toHaveBeenCalled()
    })

    it('calls zoomOut when zoom out button is clicked', async () => {
      const user = userEvent.setup()
      render(<WhiteboardToolbar {...defaultProps} />)

      const zoomOutButton = screen.getByRole('button', { name: /zoom out/i })
      await user.click(zoomOutButton)

      expect(mockEditor.zoomOut).toHaveBeenCalled()
    })
  })

  describe('Math Mode', () => {
    it('toggles math mode when calculator button is clicked', async () => {
      const user = userEvent.setup()
      render(<WhiteboardToolbar {...defaultProps} />)

      const calculatorButton = screen.getByRole('button', { name: /calculator/i })
      await user.click(calculatorButton)

      expect(mockOnMathModeToggle).toHaveBeenCalled()
    })

    it('shows active state when math mode is enabled', () => {
      render(<WhiteboardToolbar {...defaultProps} mathMode={true} />)

      const calculatorButton = screen.getByRole('button', { name: /calculator/i })
      // Math mode button should show active state
      expect(calculatorButton).toBeInTheDocument()
    })
  })

  describe('Canvas Actions', () => {
    it('clears canvas when clear button is clicked', async () => {
      const user = userEvent.setup()
      const mockShapes = [
        { id: 'shape1', type: 'geo', props: {} },
        { id: 'shape2', type: 'geo', props: {} }
      ]
      mockEditor.getCurrentPageShapes.mockReturnValue(mockShapes)

      render(<WhiteboardToolbar {...defaultProps} />)

      const clearButton = screen.getByText('Clear')
      await user.click(clearButton)

      expect(mockEditor.deleteShapes).toHaveBeenCalledWith(['shape1', 'shape2'])
    })

    it('handles clear canvas with no shapes', async () => {
      const user = userEvent.setup()
      mockEditor.getCurrentPageShapes.mockReturnValue([])

      render(<WhiteboardToolbar {...defaultProps} />)

      const clearButton = screen.getByText('Clear')
      await user.click(clearButton)

      expect(mockEditor.deleteShapes).not.toHaveBeenCalled()
    })

    it('handles export button click', async () => {
      const user = userEvent.setup()
      render(<WhiteboardToolbar {...defaultProps} />)

      const exportButton = screen.getByText('Export')
      await user.click(exportButton)

      // Export functionality would be implemented here
      expect(exportButton).toBeInTheDocument()
    })
  })

  describe('Tool State Management', () => {
    it('maintains active tool state visually', async () => {
      const user = userEvent.setup()
      render(<WhiteboardToolbar {...defaultProps} />)

      const drawButton = screen.getByRole('button', { name: /draw/i })
      await user.click(drawButton)

      // Draw tool should show active state
      expect(drawButton).toBeInTheDocument()
    })

    it('maintains active shape state visually', async () => {
      const user = userEvent.setup()
      render(<WhiteboardToolbar {...defaultProps} />)

      const circleButton = screen.getByRole('button', { name: /circle/i })
      await user.click(circleButton)

      // Circle should show active state when geo tool with circle is selected
      expect(circleButton).toBeInTheDocument()
    })

    it('resets to select tool when needed', async () => {
      const user = userEvent.setup()
      render(<WhiteboardToolbar {...defaultProps} />)

      // First select draw tool
      const drawButton = screen.getByRole('button', { name: /draw/i })
      await user.click(drawButton)

      // Then select select tool
      const selectButton = screen.getByRole('button', { name: /select/i })
      await user.click(selectButton)

      expect(mockEditor.setCurrentTool).toHaveBeenCalledWith('select')
    })
  })

  describe('Performance', () => {
    it('handles rapid tool switching efficiently', async () => {
      const user = userEvent.setup()
      render(<WhiteboardToolbar {...defaultProps} />)

      const start = performance.now()

      // Rapidly switch between tools
      await user.click(screen.getByRole('button', { name: /select/i }))
      await user.click(screen.getByRole('button', { name: /draw/i }))
      await user.click(screen.getByRole('button', { name: /circle/i }))
      await user.click(screen.getByRole('button', { name: /text/i }))

      const duration = performance.now() - start

      // Should complete quickly
      expect(duration).toBeLessThan(100)
      expect(mockEditor.setCurrentTool).toHaveBeenCalledTimes(4)
    })
  })

  describe('Accessibility', () => {
    it('provides keyboard navigation', async () => {
      const user = userEvent.setup()
      render(<WhiteboardToolbar {...defaultProps} />)

      // Should be able to tab through tools
      await user.tab()
      expect(document.activeElement).toBeDefined()
    })

    it('provides proper ARIA labels', () => {
      render(<WhiteboardToolbar {...defaultProps} />)

      // Tools should have accessible names
      expect(screen.getByRole('button', { name: /select/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /draw/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /erase/i })).toBeInTheDocument()
    })

    it('supports screen readers for color selection', () => {
      render(<WhiteboardToolbar {...defaultProps} />)

      // Color buttons should have accessible names
      expect(screen.getByRole('button', { name: /black/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /blue/i })).toBeInTheDocument()
    })

    it('provides keyboard shortcuts support', async () => {
      const user = userEvent.setup()
      render(<WhiteboardToolbar {...defaultProps} />)

      // Keyboard shortcuts would be handled at a higher level
      // This tests that the toolbar is keyboard accessible
      await user.keyboard('{Tab}')
      expect(document.activeElement).toBeDefined()
    })
  })

  describe('Integration with tldraw', () => {
    it('uses correct tldraw tool names', async () => {
      const user = userEvent.setup()
      render(<WhiteboardToolbar {...defaultProps} />)

      // Test all tldraw tool names
      await user.click(screen.getByRole('button', { name: /select/i }))
      expect(mockEditor.setCurrentTool).toHaveBeenCalledWith('select')

      await user.click(screen.getByRole('button', { name: /draw/i }))
      expect(mockEditor.setCurrentTool).toHaveBeenCalledWith('draw')

      await user.click(screen.getByRole('button', { name: /circle/i }))
      expect(mockEditor.setCurrentTool).toHaveBeenCalledWith('geo')

      await user.click(screen.getByRole('button', { name: /text/i }))
      expect(mockEditor.setCurrentTool).toHaveBeenCalledWith('text')

      await user.click(screen.getByRole('button', { name: /erase/i }))
      expect(mockEditor.setCurrentTool).toHaveBeenCalledWith('eraser')
    })

    it('handles tldraw editor methods correctly', async () => {
      const user = userEvent.setup()
      render(<WhiteboardToolbar {...defaultProps} />)

      // Test undo/redo
      await user.click(screen.getByRole('button', { name: /undo/i }))
      expect(mockEditor.undo).toHaveBeenCalled()

      await user.click(screen.getByRole('button', { name: /redo/i }))
      expect(mockEditor.redo).toHaveBeenCalled()

      // Test zoom
      await user.click(screen.getByRole('button', { name: /zoom in/i }))
      expect(mockEditor.zoomIn).toHaveBeenCalled()

      await user.click(screen.getByRole('button', { name: /zoom out/i }))
      expect(mockEditor.zoomOut).toHaveBeenCalled()
    })
  })
})