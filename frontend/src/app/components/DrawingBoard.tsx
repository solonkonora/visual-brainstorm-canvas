/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation'; 
import {
  Stage, Layer, Line, Rect, Circle, Text, Transformer
} from 'react-konva';
import {
  FaPen, FaEraser, FaSquare, FaCircle, FaTextHeight,
  FaUndo, FaRedo, FaTrash, FaSun, FaMoon,
  FaCommentDots, FaShapes, FaArrowLeft, FaLink, FaImage,
  FaDownload, FaDatabase, FaSpinner, FaCheck, FaTimes,
  FaAlignLeft, FaAlignCenter, FaAlignRight
} from 'react-icons/fa';
import Konva from 'konva';
import { useTheme } from '../context/theme-context';

import { useCanvasStore, type ShapeType } from '@/stores/canvasStore';
import ChatWindow from './ChatWindow';

const DrawingBoard: React.FC = () => {
  const params = useParams();
  const canvasId = params.canvasId as string; // Access the dynamic parameter directly
  
  const {
    // State
    shapes,
    tool: currentTool,
    color: brushColor,
    brushSize,
    selectedIds,
    isDrawing,
    history,
    connectedUsers,
    isLoading,
    error,
    
    // Actions
    setTool,
    setColor: setBrushColor,
    setBrushSize,
    setIsDrawing,
    addShape,
    updateShapes,
    deleteShapes,
    selectShapes: setSelectedIds,
    undo,
    redo,
    
    // Socket actions
    initializeSocket,
    disconnectSocket,
    saveCanvas,
    loadCanvas
  } = useCanvasStore();
  
  const [selectionRect, setSelectionRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  const [connectTemp, setConnectTemp] = useState<string | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 800 });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState<string>('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const stageRef = useRef<Konva.Stage | null>(null);
  const trRef = useRef<Konva.Transformer | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { theme, toggleTheme } = useTheme();

  // Initialize Socket.IO connections and load canvas
  useEffect(() => {
    if (canvasId) {
      const userId = 'user-' + Date.now();
      initializeSocket(canvasId, userId);
      loadCanvas(canvasId);
    }

    return () => {
      disconnectSocket();
    };
  }, [canvasId, initializeSocket, disconnectSocket, loadCanvas]);

  // Handle window resize
  useEffect(() => {
    const updateCanvasSize = () => {
      if (typeof window !== 'undefined') {
        setCanvasSize({
          width: window.innerWidth - 64,
          height: window.innerHeight - 64
        });
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  // Handler functions (defined before useEffect that uses them)
  const handleClear = () => {
    updateShapes([]);
    setSelectedIds([]);
  };
  
  const handleDownload = useCallback(() => {
    if (!stageRef.current) return;
    
    // Export as image
    const uri = stageRef.current.toDataURL({ pixelRatio: 2 });
    const link = document.createElement('a');
    link.download = `canvas-${canvasId}-${new Date().toISOString().split('T')[0]}.png`;
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Show success message
    setSaveStatus('success');
    setSaveMessage('Canvas downloaded successfully!');
    setTimeout(() => {
      setSaveStatus('idle');
      setSaveMessage('');
    }, 3000);
  }, [canvasId]);
  
  const handleSaveToDatabase = useCallback(async () => {
    setSaveStatus('saving');
    setSaveMessage('Saving to database...');
    
    try {
      await saveCanvas();
      const now = new Date();
      setLastSaved(now);
      setSaveStatus('success');
      setSaveMessage(`Canvas saved successfully! (${shapes.length} shapes)`);
      setTimeout(() => {
        setSaveStatus('idle');
        setSaveMessage('');
      }, 3000);
    } catch (err) {
      setSaveStatus('error');
      setSaveMessage(`Failed to save: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setTimeout(() => {
        setSaveStatus('idle');
        setSaveMessage('');
      }, 5000);
    }
  }, [saveCanvas, shapes.length]);
  
  const handleDelete = useCallback(() => {
    if (selectedIds.length === 0) return;
    deleteShapes(selectedIds);
    setSelectedIds([]);
  }, [selectedIds, deleteShapes, setSelectedIds]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent browser shortcuts when focusing on canvas
      if (e.target === document.body || (e.target as Element)?.tagName === 'CANVAS') {
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          undo();
        }
        if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
          e.preventDefault();
          redo();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
          e.preventDefault();
          handleSaveToDatabase();
        }
        if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault();
          handleDelete();
        }
        
        // Tool shortcuts
        switch(e.key.toLowerCase()) {
          case 'b': setTool('brush'); break;
          case 'e': setTool('eraser'); break;
          case 'r': setTool('rect'); break;
          case 'c': setTool('circle'); break;
          case 't': setTool('text'); break;
          case 'v': setTool('select'); break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, handleSaveToDatabase, handleDelete, setTool]);

  // Auto-save functionality - save every 2 minutes if there are unsaved changes
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (shapes.length > 0 && saveStatus === 'idle') {
        handleSaveToDatabase();
      }
    }, 120000); // 2 minutes

    return () => clearInterval(autoSaveInterval);
  }, [shapes.length, saveStatus, handleSaveToDatabase]);

  // Keep transformer in sync with selected nodes
  useEffect(() => {
    if (!trRef.current || !stageRef.current) return;
    const stage = stageRef.current;
    const layer = stage.findOne('#main-layer') as Konva.Layer | null;
    const selectedNodes = selectedIds
      .map(id => layer?.findOne(`#${id}`))
      .filter(Boolean) as Konva.Node[];
    trRef.current.nodes(selectedNodes);
    trRef.current.getLayer()?.batchDraw();
  }, [selectedIds, shapes]);

  // Helper functions
  const findShapeById = (id: string | undefined) => shapes.find(s => s.id === id);
  
  const getShapeCenter = (s: ShapeType) => {
    if (!s) return { x: 0, y: 0 };
    if (s.type === 'rect' || s.type === 'image' || s.type === 'text') {
      return { x: (s.x ?? 0) + ((s.width ?? 0) / 2), y: (s.y ?? 0) + ((s.height ?? 0) / 2) };
    }
    if (s.type === 'circle') {
      return { x: s.x ?? 0, y: s.y ?? 0 };
    }
    if (s.type === 'line' && s.points && s.points.length >= 2) {
      const pts = s.points;
      return { x: pts[pts.length - 2], y: pts[pts.length - 1] };
    }
    return { x: s.x ?? 0, y: s.y ?? 0 };
  };

  const normalizeRect = (r: { x: number; y: number; w: number; h: number }) => {
    const nx = Math.min(r.x, r.x + r.w);
    const ny = Math.min(r.y, r.y + r.h);
    const nw = Math.abs(r.w);
    const nh = Math.abs(r.h);
    return { x: nx, y: ny, w: nw, h: nh };
  };

  const handleMouseDown = (e: any) => {
    const stage = e.target.getStage();
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;

    // clicking stage background
    if (e.target === stage) {
      if (currentTool === 'select') {
        setSelectionRect({ x: pos.x, y: pos.y, w: 0, h: 0 });
        setSelectedIds([]);
      } else if (currentTool === 'brush' || currentTool === 'eraser') {
        setIsDrawing(true);
        const newShape: ShapeType = {
          id: Date.now().toString(),
          type: 'line',
          points: [pos.x, pos.y],
          color: currentTool === 'eraser' ? '#ffffff' : brushColor,
          size: currentTool === 'eraser' ? Math.max(10, brushSize * 4) : brushSize,
          tool: currentTool,
        };
        addShape(newShape);
      } else if (currentTool === 'rect') {
        const newShape: ShapeType = {
          id: Date.now().toString(),
          type: 'rect',
          x: pos.x,
          y: pos.y,
          width: 120,
          height: 80,
          color: brushColor,
          draggable: true,
        };
        addShape(newShape);
      } else if (currentTool === 'circle') {
        const newShape: ShapeType = {
          id: Date.now().toString(),
          type: 'circle',
          x: pos.x,
          y: pos.y,
          radius: 50,
          color: brushColor,
          draggable: true,
        };
        addShape(newShape);
      } else if (currentTool === 'text') {
        const newShape: ShapeType = {
          id: Date.now().toString(),
          type: 'text',
          x: pos.x,
          y: pos.y,
          text: 'Double-click to edit',
          color: brushColor,
          draggable: true,
        };
        addShape(newShape);
      } else if (currentTool === 'image') {
        fileInputRef.current?.click();
      }
    } else {
      // clicked on a shape
      const clickedId = (e.target.attrs && e.target.attrs.id) || e.target.id();
      
      if (window.event && (window.event as MouseEvent).shiftKey) {
        setSelectedIds(selectedIds.includes(clickedId) 
          ? selectedIds.filter(id => id !== clickedId) 
          : [...selectedIds, clickedId]
        );
      } else {
        setSelectedIds([clickedId]);
      }

      if (currentTool === 'connect') {
        if (!connectTemp) {
          setConnectTemp(clickedId);
        } else if (connectTemp !== clickedId) {
          const fromShape = findShapeById(connectTemp);
          const toShape = findShapeById(clickedId);
          if (fromShape && toShape) {
            const fromCenter = getShapeCenter(fromShape);
            const toCenter = getShapeCenter(toShape);
            const connector: ShapeType = {
              id: Date.now().toString(),
              type: 'connector',
              points: [fromCenter.x, fromCenter.y, toCenter.x, toCenter.y],
              color: '#333',
              size: 2,
              fromId: connectTemp,
              toId: clickedId,
              draggable: false,
            };
            addShape(connector);
          }
          setConnectTemp(null);
          setTool('select');
        }
      }
    }
  };

  const handleMouseMove = (e: any) => {
    const stage = e.target.getStage();
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;

    if (isDrawing && (currentTool === 'brush' || currentTool === 'eraser')) {
      const lastShape = shapes[shapes.length - 1];
      if (lastShape && lastShape.type === 'line' && lastShape.points) {
        const updatedShapes = [...shapes.slice(0, -1), {
          ...lastShape,
          points: [...lastShape.points, pos.x, pos.y],
        }];
        updateShapes(updatedShapes);
      }
    } else if (selectionRect) {
      const sx = selectionRect.x;
      const sy = selectionRect.y;
      setSelectionRect({
        x: sx,
        y: sy,
        w: pos.x - sx,
        h: pos.y - sy,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    
    if (selectionRect) {
      const rect = normalizeRect(selectionRect);
      const ids = shapes
        .filter(s => s.type !== 'line')
        .filter(s => {
          const center = getShapeCenter(s);
          return center.x >= rect.x && center.x <= rect.x + rect.w && 
                 center.y >= rect.y && center.y <= rect.y + rect.h;
        })
        .map(s => s.id);
      setSelectedIds(ids);
      setSelectionRect(null);
    }
  };

  const onDragEnd = (id: string, e: any) => {
    const node = e.target;

    const shape = shapes.find(s => s.id === id);
    if (shape) {
      const updatedShapes = shapes.map(s => 
        s.id === id 
          ? { ...s, x: node.x(), y: node.y() }
          : s
      );
      updateShapes(updatedShapes);

    }
  }; 

  return (
    <div className="h-screen flex bg-white dark:bg-gray-900">
      {/* Left Toolbar */}
      <div className="w-16 bg-slate-100 dark:bg-slate-800 flex flex-col items-center py-4 space-y-2">
        <Link href="/general-dashboard" className="p-2 bg-slate-200 dark:bg-slate-700 rounded-lg mb-4">
          <FaArrowLeft />
        </Link>
        
        <button onClick={() => setTool('brush')} className={`p-3 rounded-lg ${currentTool === 'brush' ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-700'}`} title="Brush (b)">
          <FaPen />
        </button>
        <button onClick={() => setTool('eraser')} className={`p-3 rounded-lg ${currentTool === 'eraser' ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-700'}`} title="Eraser (e)">
          <FaEraser />
        </button>
        <button onClick={() => setTool('rect')} className={`p-3 rounded-lg ${currentTool === 'rect' ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-700'}`} title="Rectangle (r)">
          <FaSquare />
        </button>
        <button onClick={() => setTool('circle')} className={`p-3 rounded-lg ${currentTool === 'circle' ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-700'}`} title="Circle (c)">
          <FaCircle />
        </button>
        <button onClick={() => setTool('text')} className={`p-3 rounded-lg ${currentTool === 'text' ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-700'}`} title="Text (t)">
          <FaTextHeight />
        </button>
        <button onClick={() => setTool('connect')} className={`p-3 rounded-lg ${currentTool === 'connect' ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-700'}`} title="Connector">
          <FaLink />
        </button>
        <button onClick={() => { fileInputRef.current?.click(); setTool('image'); }} className="p-3 rounded-lg bg-slate-200 dark:bg-slate-700" title="Image">
          <FaImage />
        </button>

        <div className="mt-2 border-t pt-2">
          <div className="text-xs text-center">Brush</div>
          <input 
            type="range" 
            min={1} 
            max={40} 
            value={brushSize} 
            onChange={(e) => setBrushSize(Number(e.target.value))} 
            className="w-12 transform rotate-90 origin-center mt-2"
          />
          <div className="text-xs text-center mt-2">Color</div>
          <input 
            type="color" 
            value={brushColor} 
            onChange={(e) => setBrushColor(e.target.value)} 
            className="w-10 h-10 rounded-lg mt-1 cursor-pointer" 
          />

        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 relative">
        {/* Top Toolbar */}
        <div className="absolute top-0 left-0 right-0 h-16 bg-white dark:bg-gray-900 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 z-10">
          <div className="flex items-center space-x-2">
            <button onClick={undo} disabled={history.length === 0} className="p-2 bg-slate-200 dark:bg-slate-700 rounded-lg disabled:opacity-50">
              <FaUndo />
            </button>
            <button onClick={redo} disabled={true} className="p-2 bg-slate-200 dark:bg-slate-700 rounded-lg disabled:opacity-50">
              <FaRedo />
            </button>
            <button onClick={handleDelete} disabled={selectedIds.length === 0} className="p-2 bg-slate-200 dark:bg-slate-700 rounded-lg disabled:opacity-50">
              <FaTrash />
            </button>
            <button onClick={handleClear} className="p-2 bg-slate-200 dark:bg-slate-700 rounded-lg" title="Clear Canvas">
              <FaShapes />
            </button>
            
            {/* Download Button */}
            <button 
              onClick={handleDownload} 
              className="p-2 bg-slate-200 dark:bg-slate-700 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600" 
              title="Download as Image"
            >
              <FaDownload />
            </button>

            {/* Copy Sharable Link Button */}
           <button
  onClick={() => {
    // Check if the Clipboard API is available
    if (navigator.clipboard) {
      const shareLink = window.location.href;
      navigator.clipboard.writeText(shareLink);
      setSaveStatus('success');
      setSaveMessage('Link copied to clipboard!');
    } else {
      // Fallback for non-secure contexts or older browsers
      setSaveStatus('error');
      setSaveMessage('Clipboard access is not available.');
    }
    setTimeout(() => {
      setSaveStatus('idle');
      setSaveMessage('');
    }, 3000);
  }}
  className="p-2 bg-slate-200 dark:bg-slate-700 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600"
  title="Copy Sharable Link"
>
  <FaLink />
</button>
            
            {/* Save to Database Button */}
            <button 
              onClick={handleSaveToDatabase}
              disabled={saveStatus === 'saving'}
              className={`p-2 rounded-lg transition-all ${
                saveStatus === 'saving' 
                  ? 'bg-blue-500 text-white cursor-not-allowed' 
                  : saveStatus === 'success'
                  ? 'bg-green-500 text-white'
                  : saveStatus === 'error'
                  ? 'bg-red-500 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 hover:bg-blue-100 dark:hover:bg-slate-600'
              }`}
              title={
                saveStatus === 'saving' ? 'Saving...' :
                saveStatus === 'success' ? 'Saved successfully!' :
                saveStatus === 'error' ? 'Save failed' :
                'Save to Database (Ctrl+S)'
              }
            >
              {saveStatus === 'saving' ? (
                <FaSpinner className="animate-spin" />
              ) : saveStatus === 'success' ? (
                <FaCheck />
              ) : saveStatus === 'error' ? (
                <FaTimes />
              ) : (
                <FaDatabase />
              )}
            </button>
          </div>

          {/* Notification Area */}
          <div className="flex items-center space-x-4">
            {saveMessage && (
              <div className={`px-3 py-1 rounded text-sm transition-all ${
                saveStatus === 'success' ? 'bg-green-100 text-green-800' :
                saveStatus === 'error' ? 'bg-red-100 text-red-800' :
                saveStatus === 'saving' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {saveMessage}
              </div>
            )}
            <span className={`px-2 py-1 rounded text-sm bg-green-100 text-green-800`}>
              Connected ({connectedUsers.length} users)
            </span>
            <span className={`px-2 py-1 rounded text-sm bg-blue-100 text-blue-800`}>
              {shapes.length} shapes
            </span>
            {lastSaved && (
              <span className={`px-2 py-1 rounded text-sm bg-gray-100 text-gray-700`}>
                Last saved: {lastSaved.toLocaleTimeString()}
              </span>

            )}
            <button onClick={toggleTheme} className="p-2 bg-slate-200 dark:bg-slate-700 rounded-lg">
              {theme === 'dark' ? <FaSun /> : <FaMoon />}
            </button>
            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className={`p-3 rounded-lg ${isChatOpen ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}
              title="Toggle Chat"
            >
              <FaCommentDots />
            </button>
            <button
              onClick={() => setTool('text-align-left')}
              className={`p-3 rounded-lg ${currentTool === 'text-align-left' ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}
              title="Align Text Left"
            >
              <FaAlignLeft />
            </button>
            <button
              onClick={() => setTool('text-align-center')}
              className={`p-3 rounded-lg ${currentTool === 'text-align-center' ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}
              title="Align Text Center"
            >
              <FaAlignCenter />
            </button>
            <button
              onClick={() => setTool('text-align-right')}
              className={`p-3 rounded-lg ${currentTool === 'text-align-right' ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}
              title="Align Text Right"
            >
              <FaAlignRight />
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div className="mt-16 h-[calc(100vh-4rem)]">
          <Stage
            ref={stageRef}
            width={canvasSize.width}
            height={canvasSize.height}
            onMouseDown={handleMouseDown}
            onMousemove={handleMouseMove}
            onMouseup={handleMouseUp}
            className="bg-white dark:bg-gray-800"
          >
            <Layer id="main-layer">
              {shapes.map((shape) => {
                if (shape.type === 'line') {
                  return (
                    <Line
                      key={shape.id}
                      id={shape.id}
                      points={shape.points || []}
                      stroke={shape.color || '#000000'}
                      strokeWidth={shape.size || 2}
                      tension={0.5}
                      lineCap="round"
                      globalCompositeOperation={shape.tool === 'eraser' ? 'destination-out' : 'source-over'}
                    />
                  );
                }
                
                if (shape.type === 'rect') {
                  return (
                    <Rect
                      key={shape.id}
                      id={shape.id}
                      x={shape.x}
                      y={shape.y}
                      width={shape.width}
                      height={shape.height}
                      fill={shape.color}
                      stroke={shape.color}
                      strokeWidth={2}
                      draggable={shape.draggable}
                      onDragEnd={(e) => onDragEnd(shape.id, e)}
                    />
                  );
                }
                
                if (shape.type === 'circle') {
                  return (
                    <Circle
                      key={shape.id}
                      id={shape.id}
                      x={shape.x}
                      y={shape.y}
                      radius={shape.radius}
                      fill={shape.color}
                      stroke={shape.color}
                      strokeWidth={2}
                      draggable={shape.draggable}
                      onDragEnd={(e) => onDragEnd(shape.id, e)}
                    />
                  );
                }
                
                if (shape.type === 'text') {
                  return (
                    <Text
                      key={shape.id}
                      id={shape.id}
                      x={shape.x}
                      y={shape.y}
                      text={shape.text}
                      fontSize={16}
                      fontFamily="Arial"
                      fill={shape.color}
                      draggable={shape.draggable}
                      onDragEnd={(e) => onDragEnd(shape.id, e)}
                    />
                  );
                }
                
                return null;
              })}

              {/* Selection rectangle */}
              {selectionRect && (
                <Rect
                  x={selectionRect.x}
                  y={selectionRect.y}
                  width={selectionRect.w}
                  height={selectionRect.h}
                  fill="rgba(0, 162, 255, 0.1)"
                  stroke="rgba(0, 162, 255, 0.8)"
                  strokeWidth={1}
                  dash={[4, 4]}
                />
              )}

              {/* Transformer for selected nodes */}
              <Transformer 
                ref={trRef} 
                rotateEnabled 
                enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']} 
              />

              {/* Temporary connector */}
              {currentTool === 'connect' && connectTemp && (() => {
                const fromShape = findShapeById(connectTemp);
                if (!fromShape || !stageRef.current) return null;
                const fc = getShapeCenter(fromShape);
                const pointer = stageRef.current.getPointerPosition();
                if (!pointer) return null;
                return (
                  <Line 
                    points={[fc.x, fc.y, pointer.x, pointer.y]} 
                    stroke="#888" 
                    dash={[4, 4]} 
                    strokeWidth={2} 
                  />
                );
              })()}
            </Layer>
          </Stage>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = () => {
              const imageUrl = reader.result as string;
              const newShape: ShapeType = {
                id: Date.now().toString(),
                type: 'image',
                x: 100,
                y: 100,
                width: 200,
                height: 150,
                imageSrc: imageUrl,
                draggable: true,
              };
              addShape(newShape);
            };
            reader.readAsDataURL(file);
          }
        }}
      />

      {/* Chat Window */}
      <ChatWindow
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />
    </div>
  );
};

export default DrawingBoard;