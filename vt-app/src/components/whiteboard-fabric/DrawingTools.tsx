'use client';

import { useState } from 'react';
import { Canvas, Rect, Circle as FabricCircle, Line, IText, PencilBrush } from 'fabric';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Pencil,
  Square,
  Circle,
  Type,
  Eraser,
  Trash2,
  Download,
  Minus,
  MousePointer
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type DrawingTool = 'select' | 'pen' | 'rectangle' | 'circle' | 'line' | 'text' | 'eraser';

interface DrawingToolsProps {
  canvas: Canvas | null;
  activeTool: DrawingTool;
  onToolChange: (tool: DrawingTool) => void;
}

export function DrawingTools({ canvas, activeTool, onToolChange }: DrawingToolsProps) {
  const [brushWidth, setBrushWidth] = useState(2);
  const [color, setColor] = useState('#000000');

  const handleToolSelect = (tool: DrawingTool) => {
    if (!canvas) return;

    // Reset canvas mode
    canvas.isDrawingMode = false;
    canvas.selection = tool === 'select';
    canvas.off('mouse:down');
    canvas.off('mouse:move');
    canvas.off('mouse:up');

    onToolChange(tool);

    switch (tool) {
      case 'select':
        canvas.selection = true;
        break;

      case 'pen':
        canvas.isDrawingMode = true;
        if (canvas.freeDrawingBrush) {
          canvas.freeDrawingBrush.width = brushWidth;
          canvas.freeDrawingBrush.color = color;
        }
        break;

      case 'rectangle':
        addRectangle();
        break;

      case 'circle':
        addCircle();
        break;

      case 'line':
        addLine();
        break;

      case 'text':
        addText();
        break;

      case 'eraser':
        canvas.isDrawingMode = true;
        // @ts-ignore - EraserBrush might not be available in v6
        // For now, use PencilBrush with white color as eraser
        canvas.freeDrawingBrush = new PencilBrush(canvas);
        if (canvas.freeDrawingBrush) {
          canvas.freeDrawingBrush.color = '#FFFFFF';
          canvas.freeDrawingBrush.width = brushWidth * 3;
        }
        break;
    }
  };

  const addRectangle = () => {
    if (!canvas) return;
    const rect = new Rect({
      left: 100,
      top: 100,
      width: 150,
      height: 100,
      fill: 'transparent',
      stroke: color,
      strokeWidth: 2,
    });
    canvas.add(rect);
    canvas.setActiveObject(rect);
    canvas.renderAll();
  };

  const addCircle = () => {
    if (!canvas) return;
    const circle = new FabricCircle({
      left: 100,
      top: 100,
      radius: 50,
      fill: 'transparent',
      stroke: color,
      strokeWidth: 2,
    });
    canvas.add(circle);
    canvas.setActiveObject(circle);
    canvas.renderAll();
  };

  const addLine = () => {
    if (!canvas) return;
    const line = new Line([100, 100, 300, 100], {
      stroke: color,
      strokeWidth: 2,
    });
    canvas.add(line);
    canvas.setActiveObject(line);
    canvas.renderAll();
  };

  const addText = () => {
    if (!canvas) return;
    const text = new IText('Type here...', {
      left: 100,
      top: 100,
      fontSize: 24,
      fill: color,
      fontFamily: 'Arial',
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
    // Automatically enter edit mode for the text
    text.enterEditing();
  };

  const clearCanvas = () => {
    if (!canvas) return;
    canvas.clear();
    canvas.backgroundColor = 'white';
    canvas.renderAll();
  };

  const downloadCanvas = () => {
    if (!canvas) return;
    const dataURL = canvas.toDataURL({
      format: 'png',
      quality: 1.0,
      multiplier: 1,
    });
    const link = document.createElement('a');
    link.download = 'whiteboard.png';
    link.href = dataURL;
    link.click();
  };

  const updateBrushWidth = (value: number[]) => {
    const width = value[0];
    setBrushWidth(width);
    if (canvas && canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.width = width;
    }
  };

  const updateColor = (newColor: string) => {
    setColor(newColor);
    if (canvas && canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = newColor;
    }
  };

  const tools = [
    { id: 'select' as DrawingTool, icon: MousePointer, label: 'Select' },
    { id: 'pen' as DrawingTool, icon: Pencil, label: 'Draw' },
    { id: 'rectangle' as DrawingTool, icon: Square, label: 'Rectangle' },
    { id: 'circle' as DrawingTool, icon: Circle, label: 'Circle' },
    { id: 'line' as DrawingTool, icon: Minus, label: 'Line' },
    { id: 'text' as DrawingTool, icon: Type, label: 'Text' },
    { id: 'eraser' as DrawingTool, icon: Eraser, label: 'Eraser' },
  ];

  const colors = [
    '#000000', // Black
    '#FF0000', // Red
    '#00FF00', // Green
    '#0000FF', // Blue
    '#FFFF00', // Yellow
    '#FF00FF', // Magenta
    '#00FFFF', // Cyan
    '#FFA500', // Orange
  ];

  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-md">
      {/* Tool Selection */}
      <div className="flex gap-1 border-r pr-4">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Button
              key={tool.id}
              variant={activeTool === tool.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleToolSelect(tool.id)}
              title={tool.label}
              className="p-2"
            >
              <Icon className="h-4 w-4" />
            </Button>
          );
        })}
      </div>

      {/* Color Selection */}
      <div className="flex gap-1 border-r pr-4">
        {colors.map((c) => (
          <button
            key={c}
            onClick={() => updateColor(c)}
            className={cn(
              "w-8 h-8 rounded-full border-2",
              color === c ? "border-gray-800" : "border-gray-300"
            )}
            style={{ backgroundColor: c }}
            title={c}
          />
        ))}
        <input
          type="color"
          value={color}
          onChange={(e) => updateColor(e.target.value)}
          className="w-8 h-8 rounded cursor-pointer"
          title="Custom color"
        />
      </div>

      {/* Brush Size */}
      {(activeTool === 'pen' || activeTool === 'eraser') && (
        <div className="flex items-center gap-2 border-r pr-4">
          <span className="text-sm text-gray-600">Size:</span>
          <Slider
            value={[brushWidth]}
            onValueChange={updateBrushWidth}
            min={1}
            max={20}
            step={1}
            className="w-24"
          />
          <span className="text-sm text-gray-600 w-8">{brushWidth}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={clearCanvas}
          title="Clear canvas"
          className="p-2"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={downloadCanvas}
          title="Download"
          className="p-2"
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}