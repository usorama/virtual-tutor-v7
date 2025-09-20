'use client';

import { useState, useCallback } from 'react';
import { Editor } from '@tldraw/tldraw';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Palette,
  Eraser,
  Type,
  Circle,
  Square,
  Minus,
  ArrowRight,
  Triangle,
  Pen,
  MousePointer,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Download,
  Upload,
  Trash2,
  Calculator
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface WhiteboardToolbarProps {
  editor: Editor | null;
  mathMode: boolean;
  onMathModeToggle: () => void;
  className?: string;
}

type ToolType = 'select' | 'draw' | 'geo' | 'text' | 'eraser';
type ShapeType = 'circle' | 'rectangle' | 'line' | 'arrow' | 'triangle';
type ColorType = 'black' | 'blue' | 'red' | 'green' | 'orange' | 'purple';

const colors: { value: ColorType; hex: string }[] = [
  { value: 'black', hex: '#000000' },
  { value: 'blue', hex: '#3b82f6' },
  { value: 'red', hex: '#ef4444' },
  { value: 'green', hex: '#22c55e' },
  { value: 'orange', hex: '#f97316' },
  { value: 'purple', hex: '#a855f7' },
];

export function WhiteboardToolbar({
  editor,
  mathMode,
  onMathModeToggle,
  className
}: WhiteboardToolbarProps) {
  // State
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [activeShape, setActiveShape] = useState<ShapeType>('circle');
  const [activeColor, setActiveColor] = useState<ColorType>('black');

  /**
   * Set the current tool in tldraw
   */
  const setTool = useCallback((tool: ToolType, shape?: ShapeType) => {
    if (!editor) return;

    try {
      if (tool === 'select') {
        editor.setCurrentTool('select');
      } else if (tool === 'draw') {
        editor.setCurrentTool('draw');
      } else if (tool === 'geo' && shape) {
        editor.setCurrentTool('geo');
        setActiveShape(shape);
      } else if (tool === 'text') {
        editor.setCurrentTool('text');
      } else if (tool === 'eraser') {
        editor.setCurrentTool('eraser');
      }

      setActiveTool(tool);
    } catch (error) {
      console.error('Error setting tool:', error);
    }
  }, [editor]);

  /**
   * Change the drawing color
   */
  const setColor = useCallback((color: ColorType) => {
    if (!editor) return;

    try {
      // Update style for new shapes - simplified approach
      // editor.setStyleForNextShapes({ color }); // This method needs proper parameters

      // Update style for selected shapes
      const selectedShapes = editor.getSelectedShapes();
      if (selectedShapes.length > 0) {
        editor.updateShapes(
          selectedShapes.map(shape => ({
            id: shape.id,
            type: shape.type,
            props: {
              ...shape.props,
              color
            }
          }))
        );
      }

      setActiveColor(color);
    } catch (error) {
      console.error('Error setting color:', error);
    }
  }, [editor]);

  /**
   * Undo last action
   */
  const undo = useCallback(() => {
    if (!editor) return;
    editor.undo();
  }, [editor]);

  /**
   * Redo last action
   */
  const redo = useCallback(() => {
    if (!editor) return;
    editor.redo();
  }, [editor]);

  /**
   * Zoom in
   */
  const zoomIn = useCallback(() => {
    if (!editor) return;
    editor.zoomIn();
  }, [editor]);

  /**
   * Zoom out
   */
  const zoomOut = useCallback(() => {
    if (!editor) return;
    editor.zoomOut();
  }, [editor]);

  /**
   * Clear the canvas
   */
  const clearCanvas = useCallback(() => {
    if (!editor) return;

    const allShapes = editor.getCurrentPageShapes();
    if (allShapes.length > 0) {
      editor.deleteShapes(allShapes.map(s => s.id));
    }
  }, [editor]);

  /**
   * Export canvas as image
   */
  const exportImage = useCallback(async () => {
    if (!editor) return;

    try {
      // Simple export approach - would need proper tldraw export method
      console.log('Export feature not implemented yet - would export current canvas');
    } catch (error) {
      console.error('Error exporting image:', error);
    }
  }, [editor]);

  return (
    <div className={cn("flex items-center gap-2 p-2 bg-background border-b", className)}>
      {/* Selection and Drawing Tools */}
      <div className="flex items-center gap-1">
        <Button
          variant={activeTool === 'select' ? "default" : "ghost"}
          size="sm"
          onClick={() => setTool('select')}
          className="gap-1"
        >
          <MousePointer className="h-4 w-4" />
        </Button>

        <Button
          variant={activeTool === 'draw' ? "default" : "ghost"}
          size="sm"
          onClick={() => setTool('draw')}
          className="gap-1"
        >
          <Pen className="h-4 w-4" />
        </Button>

        <Button
          variant={activeTool === 'eraser' ? "default" : "ghost"}
          size="sm"
          onClick={() => setTool('eraser')}
          className="gap-1"
        >
          <Eraser className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Shape Tools */}
      <div className="flex items-center gap-1">
        <Button
          variant={activeTool === 'geo' && activeShape === 'circle' ? "default" : "ghost"}
          size="sm"
          onClick={() => setTool('geo', 'circle')}
          className="gap-1"
        >
          <Circle className="h-4 w-4" />
        </Button>

        <Button
          variant={activeTool === 'geo' && activeShape === 'rectangle' ? "default" : "ghost"}
          size="sm"
          onClick={() => setTool('geo', 'rectangle')}
          className="gap-1"
        >
          <Square className="h-4 w-4" />
        </Button>

        <Button
          variant={activeTool === 'geo' && activeShape === 'triangle' ? "default" : "ghost"}
          size="sm"
          onClick={() => setTool('geo', 'triangle')}
          className="gap-1"
        >
          <Triangle className="h-4 w-4" />
        </Button>

        <Button
          variant={activeTool === 'geo' && activeShape === 'line' ? "default" : "ghost"}
          size="sm"
          onClick={() => setTool('geo', 'line')}
          className="gap-1"
        >
          <Minus className="h-4 w-4" />
        </Button>

        <Button
          variant={activeTool === 'geo' && activeShape === 'arrow' ? "default" : "ghost"}
          size="sm"
          onClick={() => setTool('geo', 'arrow')}
          className="gap-1"
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Text and Math Tools */}
      <div className="flex items-center gap-1">
        <Button
          variant={activeTool === 'text' ? "default" : "ghost"}
          size="sm"
          onClick={() => setTool('text')}
          className="gap-1"
        >
          <Type className="h-4 w-4" />
        </Button>

        <Button
          variant={mathMode ? "default" : "ghost"}
          size="sm"
          onClick={onMathModeToggle}
          className="gap-1"
        >
          <Calculator className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Color Palette */}
      <div className="flex items-center gap-1">
        <Palette className="h-4 w-4 text-muted-foreground" />
        {colors.map((color) => (
          <Button
            key={color.value}
            variant="ghost"
            size="sm"
            onClick={() => setColor(color.value)}
            className={cn(
              "w-8 h-8 p-0 rounded-full border-2 transition-all",
              activeColor === color.value
                ? "border-primary ring-2 ring-primary/20 scale-110"
                : "border-muted hover:border-border"
            )}
            style={{ backgroundColor: color.hex }}
          >
            <span className="sr-only">{color.value}</span>
          </Button>
        ))}
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* History Controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={undo}
          className="gap-1"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={redo}
          className="gap-1"
        >
          <RotateCw className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Zoom Controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={zoomOut}
          className="gap-1"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={zoomIn}
          className="gap-1"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Action Controls */}
      <div className="flex items-center gap-1 ml-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={exportImage}
          className="gap-1"
        >
          <Download className="h-4 w-4" />
          Export
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={clearCanvas}
          className="gap-1 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
          Clear
        </Button>
      </div>
    </div>
  );
}