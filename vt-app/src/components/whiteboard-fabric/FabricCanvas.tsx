'use client';

import { useEffect, useRef, useState } from 'react';
import { Canvas } from 'fabric';

interface FabricCanvasProps {
  width?: number;
  height?: number;
  onCanvasReady?: (canvas: Canvas) => void;
  isTeacher?: boolean;
}

export function FabricCanvas({
  width = 1200,
  height = 700,
  onCanvasReady,
  isTeacher = false
}: FabricCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize Fabric.js canvas
    const canvas = new Canvas(canvasRef.current, {
      width,
      height,
      backgroundColor: 'white',
      selection: isTeacher, // Only teachers can select objects
      interactive: isTeacher, // Only teachers can interact
    });

    // Set default properties
    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.width = 2;
      canvas.freeDrawingBrush.color = '#000000';
    }

    // Store reference
    fabricRef.current = canvas;
    setIsReady(true);

    // Notify parent component
    if (onCanvasReady) {
      onCanvasReady(canvas);
    }

    // Cleanup
    return () => {
      canvas.dispose();
      fabricRef.current = null;
      setIsReady(false);
    };
  }, [width, height, isTeacher, onCanvasReady]);

  return (
    <div className="relative bg-white rounded-lg shadow-lg overflow-hidden">
      <canvas
        ref={canvasRef}
        className="border border-gray-200"
        style={{ touchAction: 'none' }}
      />
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100/50">
          <div className="text-gray-500">Initializing whiteboard...</div>
        </div>
      )}
    </div>
  );
}