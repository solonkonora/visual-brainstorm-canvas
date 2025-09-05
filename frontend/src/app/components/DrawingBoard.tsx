'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Stage, Layer, Line, Rect, Circle, Text, Transformer, Image as KonvaImage, Group
} from 'react-konva';
import {
  FaPen, FaEraser, FaSquare, FaCircle, FaTextHeight,
  FaUndo, FaRedo, FaTrash, FaSave, FaSun, FaMoon,
  FaCommentDots, FaShapes, FaArrowLeft, FaLink, FaImage, FaObjectGroup, FaObjectUngroup,
  FaAlignLeft, FaAlignCenter, FaAlignRight, FaArrowsAltH
} from 'react-icons/fa';
import Konva from 'konva';
import { useTheme } from '../context/theme-context';
import { BACKEND_URL } from '@/lib/env';

interface ShapeType {
  id: string;
  type: 'line' | 'rect' | 'circle' | 'text' | 'image' | 'connector' | 'group';
  points?: number[]; // for line/connector
  x?: number;
  y?: number;
  width?: number; 
  height?: number;
  radius?: number;
  color?: string;
  size?: number; // stroke width
  tool?: string; // 'brush' | 'eraser'
  text?: string;
  imageSrc?: string; // object URL or data URL
  children?: string[]; // for group: child shape ids
  fromId?: string; // connector endpoints
  toId?: string;
  draggable?: boolean;
}

const STORAGE_KEY = 'miro_clone_shapes_v1';

const DrawingBoard: React.FC = () => {
  const [tool, setTool] = useState<'brush' | 'eraser' | 'rect' | 'circle' | 'text' | 'connect' | 'image' | 'select'>('brush');
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  const [shapes, setShapes] = useState<ShapeType[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [history, setHistory] = useState<ShapeType[][]>([]);
  const [redoStack, setRedoStack] = useState<ShapeType[][]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectionRect, setSelectionRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [connectTemp, setConnectTemp] = useState<string | null>(null); // store first selected shape id when creating connector
  const [canvasId, setCanvasId] = useState<string | null>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const trRef = useRef<Konva.Transformer | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { theme, toggleTheme } = useTheme();

  // Create a new canvas when the component loads
  useEffect(() => {
    const createCanvas = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No authentication token found');
          return;
        }

        const response = await fetch(`${BACKEND_URL}/api/canvases`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setCanvasId(data.canvasId);
          console.log('Canvas created successfully:', data.canvasId);
        } else {
          console.error('Failed to create canvas');
        }
      } catch (error) {
        console.error('Error creating canvas:', error);
      }
    };

    createCanvas();
  }, []);

  // Load saved shapes from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: ShapeType[] = JSON.parse(raw);
        setShapes(parsed);
      }
    } catch (e) {
      console.warn('Failed to load shapes from storage', e);
    }
  }, []);

  // Save shapes to localStorage whenever changed
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(shapes));
    } catch (e) {
      console.warn('Failed to save shapes to storage', e);
    }
  }, [shapes]);

  // keep transformer in sync with selected nodes
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

  // Undo/redo keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMeta = e.ctrlKey || e.metaKey;
      if (e.key === 'Delete') {
        e.preventDefault();
        handleDelete();
      }
      if (isMeta && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
      }
      if (isMeta && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
      if (isMeta && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        if (e.shiftKey) handleUngroup();
        else handleGroup();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedIds, shapes, history, redoStack]);

  // Utility helpers
  const pushHistory = (nextShapes?: ShapeType[]) => {
    setHistory(h => [...h, nextShapes ? nextShapes : shapes]);
    setRedoStack([]);
  };

  // Stage mouse handlers
  const handleMouseDown = (e: any) => {
    const stage = e.target.getStage();
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;

    // clicking stage background
    if (e.target === stage) {
      // start selection rect if in select mode
      if (tool === 'select') {
        setSelectionRect({ x: pos.x, y: pos.y, w: 0, h: 0 });
        setSelectedIds([]);
      } else if (tool === 'brush' || tool === 'eraser') {
        setIsDrawing(true);
        const newLine: ShapeType = {
          id: Date.now().toString(),
          type: 'line',
          points: [pos.x, pos.y],
          color: tool === 'eraser' ? '#ffffff' : color,
          size: tool === 'eraser' ? Math.max(10, brushSize * 4) : brushSize,
          tool,
        };
        pushHistory();
        setShapes(prev => [...prev, newLine]);
      } else if (tool === 'rect') {
        const newRect: ShapeType = {
          id: Date.now().toString(),
          type: 'rect',
          x: pos.x,
          y: pos.y,
          width: 120,
          height: 80,
          color,
          draggable: true,
        };
        pushHistory();
        setShapes(prev => [...prev, newRect]);
      } else if (tool === 'circle') {
        const newCircle: ShapeType = {
          id: Date.now().toString(),
          type: 'circle',
          x: pos.x,
          y: pos.y,
          radius: 50,
          color,
          draggable: true,
        };
        pushHistory();
        setShapes(prev => [...prev, newCircle]);
      } else if (tool === 'text') {
        const newText: ShapeType = {
          id: Date.now().toString(),
          type: 'text',
          x: pos.x,
          y: pos.y,
          text: 'Double-click to edit',
          color,
          draggable: true,
        };
        pushHistory();
        setShapes(prev => [...prev, newText]);
      } else if (tool === 'image') {
        // trigger file input
        fileInputRef.current?.click();
      }
      // other tools like connect handled on shape click
    } else {
      // clicked on a shape/node
      const clickedId = (e.target.attrs && e.target.attrs.id) || e.target.id();
      const exists = shapes.find(s => s.id === clickedId);
      if (!exists) {
        // maybe clicked on a Konva group child; try parent
        let node = e.target;
        while (node && node.parent && !node.attrs?.id) {
          node = node.parent;
        }
      }

      // Shift toggles selection
      if (window.event && (window.event as MouseEvent).shiftKey) {
        setSelectedIds(prev =>
          prev.includes(clickedId) ? prev.filter(id => id !== clickedId) : [...prev, clickedId]
        );
      } else {
        setSelectedIds([clickedId]);
      }

      // If current tool is connect, handle connecting two shapes
      if (tool === 'connect') {
        if (!connectTemp) {
          setConnectTemp(clickedId);
        } else {
          // create connector between connectTemp and clickedId (unless same)
          if (connectTemp !== clickedId) {
            pushHistory();
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
              setShapes(prev => [...prev, connector]);
            }
          }
          setConnectTemp(null);
          setTool('select'); // auto back to select
        }
      }
    }
  };

  const handleMouseMove = (e: any) => {
    const stage = e.target.getStage();
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;

    if (isDrawing && (tool === 'brush' || tool === 'eraser')) {
      setShapes(prev => {
        const last = prev[prev.length - 1];
        if (!last || last.type !== 'line') return prev;
        const updated: ShapeType = {
          ...last,
          points: last.points ? [...last.points, pos.x, pos.y] : [pos.x, pos.y],
        };
        return [...prev.slice(0, -1), updated];
      });
    } else if (selectionRect) {
      // update selection rectangle
      const sx = selectionRect.x;
      const sy = selectionRect.y;
      setSelectionRect({
        x: sx,
        y: sy,
        w: pos.x - sx,
        h: pos.y - sy,
      });
    } else if (tool === 'connect' && connectTemp) {
      // show temporary connector as rubberband (update the last temp connector in shapes?) We'll just render on canvas as temp in Layer below connector rendering
      // handled in render
    }
  };

  const handleMouseUp = (e?: any) => {
    if (isDrawing) setIsDrawing(false);

    if (selectionRect) {
      // compute selected shapes within rect bounding box (intersects)
      const rect = normalizeRect(selectionRect);
      const ids = shapes
        .filter(s => s.type !== 'connector' && s.type !== 'line')
        .filter(s => {
          const center = getShapeCenter(s);
          return center.x >= rect.x && center.x <= rect.x + rect.w && center.y >= rect.y && center.y <= rect.y + rect.h;
        })
        .map(s => s.id);
      setSelectedIds(ids);
      setSelectionRect(null);
    }
  };

  // Helpers to find shape center (approx)
  const findShapeById = (id: string | undefined) => shapes.find(s => s.id === id);
  const getShapeCenter = (s: ShapeType) => {
    if (!s) return { x: 0, y: 0 };
    if (s.type === 'rect' || s.type === 'image' || s.type === 'text' || s.type === 'group') {
      return { x: (s.x ?? 0) + ((s.width ?? 0) / 2), y: (s.y ?? 0) + ((s.height ?? 0) / 2) };
    }
    if (s.type === 'circle') {
      return { x: s.x ?? 0, y: s.y ?? 0 };
    }
    if (s.type === 'connector' && s.points && s.points.length >= 4) {
      return { x: (s.points[0] + s.points[s.points.length - 2]) / 2, y: (s.points[1] + s.points[s.points.length - 1]) / 2 };
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

  // Shape drag end update (persist position)
  const onDragEnd = (id: string, e: any) => {
    const node = e.target;
    const newX = node.x();
    const newY = node.y();
    pushHistory();
    setShapes(prev => prev.map(s => (s.id === id ? { ...s, x: newX, y: newY } : s)));
    // update connectors that reference this id
    updateConnectorsForMovedShape(id);
  };

  const updateConnectorsForMovedShape = (movedId: string) => {
    setShapes(prev => {
      const moved = prev.find(s => s.id === movedId);
      if (!moved) return prev;
      const center = getShapeCenter(moved);
      return prev.map(s => {
        if (s.type === 'connector') {
          if (s.fromId === movedId && s.toId) {
            const to = prev.find(x => x.id === s.toId);
            if (!to) return s;
            const toCenter = getShapeCenter(to);
            return { ...s, points: [center.x, center.y, toCenter.x, toCenter.y] };
          }
          if (s.toId === movedId && s.fromId) {
            const from = prev.find(x => x.id === s.fromId);
            if (!from) return s;
            const fromCenter = getShapeCenter(from);
            return { ...s, points: [fromCenter.x, fromCenter.y, center.x, center.y] };
          }
        }
        return s;
      });
    });
  };

  // Undo/Redo/Clear/Save/Delete
  const handleUndo = () => {
    setHistory(prev => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setRedoStack(r => [shapes, ...r]);
      setShapes(last);
      return prev.slice(0, -1);
    });
  };
  const handleRedo = () => {
    setRedoStack(prev => {
      if (prev.length === 0) return prev;
      const [first, ...rest] = prev;
      setHistory(h => [...h, shapes]);
      setShapes(first);
      return rest;
    });
  };
  const handleClear = () => {
    pushHistory();
    setShapes([]);
    setSelectedIds([]);
  };
  const handleSave = async () => {
    // Save to backend
    if (canvasId) {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          alert('You must be logged in to save the canvas');
          return;
        }

        const response = await fetch(`${BACKEND_URL}/api/canvases/${canvasId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ strokes: shapes }),
        });

        if (response.ok) {
          alert('Canvas saved successfully!');
        } else {
          const errorData = await response.json();
          alert(`Failed to save canvas: ${errorData.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Error saving canvas:', error);
        alert('Error saving canvas');
      }
    }

    // Also save as image
    if (!stageRef.current) return;
    const uri = stageRef.current.toDataURL({ pixelRatio: 2 });
    const link = document.createElement('a');
    link.download = 'drawing.png';
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const handleDelete = () => {
    if (selectedIds.length === 0) return;
    pushHistory();
    setShapes(prev => prev.filter(s => !selectedIds.includes(s.id)));
    setSelectedIds([]);
  };

  // Text edit double click
  const handleTextDblClick = (shape: ShapeType) => {
    if (!stageRef.current) return;
    const stage = stageRef.current;
    const abs = stage.getAbsoluteTransform().point({ x: shape.x ?? 0, y: shape.y ?? 0 });
    const textarea = document.createElement('textarea');
    textarea.value = shape.text || '';
    textarea.style.position = 'absolute';
    textarea.style.top = `${abs.y}px`;
    textarea.style.left = `${abs.x}px`;
    textarea.style.fontSize = '18px';
    textarea.style.border = '1px solid #ccc';
    textarea.style.padding = '4px';
    textarea.style.background = 'white';
    document.body.appendChild(textarea);
    textarea.focus();

    const done = () => {
      pushHistory();
      setShapes(prev => prev.map(s => s.id === shape.id ? { ...s, text: textarea.value } : s));
      document.body.removeChild(textarea);
    };

    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') done();
      if (e.key === 'Escape') {
        document.body.removeChild(textarea);
      }
    });
    textarea.addEventListener('blur', done);
  };

  // Grouping & Align
  const handleGroup = () => {
    if (selectedIds.length < 2) return;
    pushHistory();
    // compute bounding box
    const selectedShapes = shapes.filter(s => selectedIds.includes(s.id));
    const minX = Math.min(...selectedShapes.map(s => (s.x ?? 0)));
    const minY = Math.min(...selectedShapes.map(s => (s.y ?? 0)));
    const maxX = Math.max(...selectedShapes.map(s => ((s.x ?? 0) + (s.width ?? (s.radius ? s.radius * 2 : 0)))));
    const maxY = Math.max(...selectedShapes.map(s => ((s.y ?? 0) + (s.height ?? (s.radius ? s.radius * 2 : 0)))));
    const groupShape: ShapeType = {
      id: `group-${Date.now()}`,
      type: 'group',
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      children: selectedIds,
      draggable: true,
    };
    // remove children from root and replace with group. To keep simple, keep child shapes but mark them as children (we will render them normally but maintain group id for move)
    // For simplicity we will store group separately and NOT remove children; but we will move children when group moves by listening to group's drag end
    setShapes(prev => [...prev, groupShape]);
    setSelectedIds([groupShape.id]);
  };

  const handleUngroup = () => {
    // find selected groups and remove them
    const groups = shapes.filter(s => selectedIds.includes(s.id) && s.type === 'group');
    if (groups.length === 0) return;
    pushHistory();
    const remaining = shapes.filter(s => !groups.some(g => g.id === s.id));
    setShapes(remaining);
    setSelectedIds([]);
  };

  const handleAlign = (mode: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom' | 'distribute') => {
    if (selectedIds.length < 2) return;
    pushHistory();
    const selected = shapes.filter(s => selectedIds.includes(s.id));
    if (mode === 'distribute') {
      // distribute horizontally by x
      const sorted = [...selected].sort((a, b) => (a.x ?? 0) - (b.x ?? 0));
      const minX = Math.min(...sorted.map(s => s.x ?? 0));
      const maxX = Math.max(...sorted.map(s => (s.x ?? 0)));
      const totalWidth = sorted.reduce((acc, s) => acc + (s.width ?? (s.radius ? s.radius * 2 : 0)), 0);
      const gap = (maxX - minX - totalWidth) / (sorted.length - 1 || 1);
      let cursor = minX;
      setShapes(prev => prev.map(s => {
        const ix = sorted.findIndex(x => x.id === s.id);
        if (ix === -1) return s;
        const w = s.width ?? (s.radius ? s.radius * 2 : 0);
        const updated = { ...s, x: cursor };
        cursor += w + gap;
        return updated;
      }));
      return;
    }

    if (mode === 'left' || mode === 'center' || mode === 'right') {
      const refX = mode === 'left' ? Math.min(...selected.map(s => s.x ?? 0))
        : mode === 'right' ? Math.max(...selected.map(s => (s.x ?? 0) + (s.width ?? (s.radius ? s.radius * 2 : 0)))) : 0;
      if (mode === 'center') {
        const centers = selected.map(s => ((s.x ?? 0) + ((s.width ?? (s.radius ? s.radius * 2 : 0)) / 2)));
        const avg = centers.reduce((a, b) => a + b, 0) / centers.length;
        setShapes(prev => prev.map(s => selectedIds.includes(s.id) ? { ...s, x: avg - ((s.width ?? (s.radius ? s.radius * 2 : 0)) / 2) } : s));
        return;
      }
      setShapes(prev => prev.map(s => {
        if (!selectedIds.includes(s.id)) return s;
        if (mode === 'left') return { ...s, x: refX };
        if (mode === 'right') return { ...s, x: refX - (s.width ?? (s.radius ? s.radius * 2 : 0)) };
        return s;
      }));
      return;
    }

    if (mode === 'top' || mode === 'middle' || mode === 'bottom') {
      if (mode === 'middle') {
        const centersY = selected.map(s => ((s.y ?? 0) + ((s.height ?? (s.radius ? s.radius * 2 : 0)) / 2)));
        const avgY = centersY.reduce((a, b) => a + b, 0) / centersY.length;
        setShapes(prev => prev.map(s => selectedIds.includes(s.id) ? { ...s, y: avgY - ((s.height ?? (s.radius ? s.radius * 2 : 0)) / 2) } : s));
        return;
      }
      const refY = mode === 'top' ? Math.min(...selected.map(s => s.y ?? 0))
        : Math.max(...selected.map(s => (s.y ?? 0) + (s.height ?? (s.radius ? s.radius * 2 : 0))));
      setShapes(prev => prev.map(s => {
        if (!selectedIds.includes(s.id)) return s;
        if (mode === 'top') return { ...s, y: refY };
        if (mode === 'bottom') return { ...s, y: refY - (s.height ?? (s.radius ? s.radius * 2 : 0)) };
        return s;
      }));
      return;
    }
  };

  // Image upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const stage = stageRef.current;
    const center = stage ? { x: stage.width() / 2, y: stage.height() / 2 } : { x: 200, y: 200 };
    const imageShape: ShapeType = {
      id: Date.now().toString(),
      type: 'image',
      x: center.x - 150 / 2,
      y: center.y - 100 / 2,
      width: 150,
      height: 100,
      imageSrc: url,
      draggable: true,
    };
    pushHistory();
    setShapes(prev => [...prev, imageShape]);
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Draw helper to render Konva Image from URL
  const KonvaImageNode: React.FC<{ src?: string; x?: number; y?: number; width?: number; height?: number; id?: string; onDblClick?: () => void; onClick?: () => void; draggable?: boolean; onDragEnd?: (e: any) => void; }> = (props) => {
    const { src, ...rest } = props;
    const [img, setImg] = useState<HTMLImageElement | null>(null);
    useEffect(() => {
      if (!src) {
        setImg(null);
        return;
      }
      const image = new window.Image();
      image.onload = () => setImg(image);
      image.src = src;
      return () => {
        // don't revoke URL here because we might keep showing it until reload; user may want it cached
      };
    }, [src]);
    // @ts-ignore
    return <KonvaImage image={img} {...rest} />;
  };

  // Connector rendering helper: arrowhead
  const drawArrow = (ctx: any, points: number[]) => {
    // not used directly; konva Line supports arrow by stroke and pointerLength/width props if using Arrow shape - but Arrow component isn't imported; we will draw simple line and small triangle via extra Line segments or use endCap style
    // We'll render lines and small circles at ends to indicate endpoints.
  };

  // Update connector endpoints when any referenced shape moves/resizes
  useEffect(() => {
    // recompute connector points for connectors referencing shapes (if shapes changed)
    setShapes(prev => prev.map(s => {
      if (s.type === 'connector' && s.fromId && s.toId) {
        const from = prev.find(x => x.id === s.fromId);
        const to = prev.find(x => x.id === s.toId);
        if (from && to) {
          const fc = getShapeCenter(from);
          const tc = getShapeCenter(to);
          return { ...s, points: [fc.x, fc.y, tc.x, tc.y] };
        }
      }
      return s;
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shapes.length]); // only when shapes count changes or when move handler calls updateConnectorsForMovedShape

  return (
    <div className={`w-full h-full ${theme === 'dark' ? 'dark' : ''}`}>
      {/* file input hidden */}
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />

      {/* Top Toolbar */}
      <div className="absolute top-0 left-0 w-full flex items-center justify-between px-4 py-2 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 z-50 flex-wrap">
        <div className="flex items-center space-x-3">
          <span className="font-bold text-lg">My First Board</span>
        </div>
        <div className="flex items-center space-x-2">
          <Link href="/general-dashboard" className="p-2 bg-slate-200 dark:bg-slate-700 rounded-xl"><FaArrowLeft /></Link>
          <button onClick={handleUndo} className="p-2 bg-slate-200 dark:bg-slate-700 rounded-xl"><FaUndo /></button>
          <button onClick={handleRedo} className="p-2 bg-slate-200 dark:bg-slate-700 rounded-xl"><FaRedo /></button>
          <button onClick={handleClear} className="p-2 bg-slate-200 dark:bg-slate-700 rounded-xl"><FaTrash /></button>
          <button onClick={toggleTheme} className="p-2 bg-blue-500 text-white rounded-xl">{theme === 'dark' ? <FaSun /> : <FaMoon />}</button>
          <button onClick={handleSave} className="p-2 bg-blue-600 text-white rounded-xl"><FaSave /> Save</button>
        </div>
      </div>

      {/* Left Toolbar */}
      <div className="absolute top-20 left-4 flex flex-col space-y-3 z-50 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg sm:left-2 sm:top-16">
        <button onClick={() => setTool('brush')} className={`p-3 rounded-lg ${tool === 'brush' ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-700'}`} title="Brush (b)"><FaPen /></button>
        <button onClick={() => setTool('eraser')} className={`p-3 rounded-lg ${tool === 'eraser' ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-700'}`} title="Eraser (e)"><FaEraser /></button>
        <button onClick={() => setTool('rect')} className={`p-3 rounded-lg ${tool === 'rect' ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-700'}`} title="Rectangle (r)"><FaSquare /></button>
        <button onClick={() => setTool('circle')} className={`p-3 rounded-lg ${tool === 'circle' ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-700'}`} title="Circle (c)"><FaCircle /></button>
        <button onClick={() => setTool('text')} className={`p-3 rounded-lg ${tool === 'text' ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-700'}`} title="Text (t)"><FaTextHeight /></button>
        <button onClick={() => setTool('connect')} className={`p-3 rounded-lg ${tool === 'connect' ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-700'}`} title="Connector"><FaLink /></button>
        <button onClick={() => { fileInputRef.current?.click(); setTool('image'); }} className="p-3 rounded-lg bg-slate-200 dark:bg-slate-700" title="Image"><FaImage /></button>

        <div className="mt-2 border-t pt-2">
          <div className="text-xs">Brush size</div>
          <input type="range" min={1} max={40} value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="rounded-full" />
          <div className="text-xs mt-2">Color</div>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-10 rounded-2xl mt-1 cursor-pointer" />
        </div>

      </div>

      {/* Right Inspector / Actions */}
      <div className="absolute top-20 right-4 z-50 sm:right-2 sm:top-16">
        <div className="flex flex-col gap-2 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg">
          <div className="font-semibold">Selection</div>
          <div className="text-sm">Selected: {selectedIds.length}</div>
          <div className="flex gap-2 mt-2">
            <button onClick={handleGroup} className="px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded-xl"><FaObjectGroup /></button>
            <button onClick={handleUngroup} className="px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded-xl"><FaObjectUngroup /></button>
            <button onClick={() => handleAlign('left')} className="px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded-xl" title="Align left"><FaAlignLeft /></button>
            <button onClick={() => handleAlign('center')} className="px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded-xl" title="Align center"><FaAlignCenter /></button>
            <button onClick={() => handleAlign('right')} className="px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded-xl" title="Align right"><FaAlignRight /></button>
            <button onClick={() => handleAlign('distribute')} className="px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded-xl" title="Distribute"><FaArrowsAltH /></button>
          </div>
        </div>
      </div>

      {/* Whiteboard */}
      <div className="w-full h-full bg-[radial-gradient(circle_at_center,_rgba(0,0,0,0.05)_1px,_transparent_1px)] [background-size:20px_20px] dark:bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.06)_1px,_transparent_1px)]">
        <Stage
          width={typeof window !== 'undefined' ? window.innerWidth : 1200}
          height={typeof window !== 'undefined' ? window.innerHeight : 800}
          onMouseDown={handleMouseDown}
          onMousemove={handleMouseMove}
          onMouseup={handleMouseUp}
          ref={(node) => { stageRef.current = node; }}
          className="cursor-crosshair"
        >
          <Layer id="main-layer">
            {/* optional selection rectangle rendering */}
            {selectionRect && (
              <Rect
                x={normalizeRect(selectionRect).x}
                y={normalizeRect(selectionRect).y}
                width={normalizeRect(selectionRect).w}
                height={normalizeRect(selectionRect).h}
                fill="rgba(0,120,255,0.12)"
                stroke="rgba(0,120,255,0.6)"
                dash={[4, 4]}
                listening={false}
              />
            )}

            {/* shapes */}
            {shapes.map(shape => {
              if (shape.type === 'line') {
                return (
                  <Line
                    key={shape.id}
                    id={shape.id}
                    points={shape.points || []}
                    stroke={shape.color}
                    strokeWidth={shape.size}
                    tension={0.5}
                    lineCap="round"
                    lineJoin="round"
                    globalCompositeOperation={shape.tool === 'eraser' ? 'destination-out' : 'source-over'}
                  />
                );
              }
              if (shape.type === 'rect') {
                return (
                  <Rect
                    key={shape.id}
                    id={shape.id}
                    x={shape.x ?? 0} y={shape.y ?? 0}
                    width={shape.width ?? 120}
                    height={shape.height ?? 80}
                    fill={shape.color}
                    cornerRadius={10}
                    draggable={!!shape.draggable}
                    onDragEnd={(e) => onDragEnd(shape.id, e)}
                    onClick={() => {
                      // Shift toggling handled in stage handler; but clicking a shape should select it
                      setSelectedIds(prev => (window.event && (window.event as MouseEvent).shiftKey ? (prev.includes(shape.id) ? prev.filter(id => id !== shape.id) : [...prev, shape.id]) : [shape.id]));
                    }}
                    onDblClick={() => { /* future: allow editing rect */ }}
                  />
                );
              }
              if (shape.type === 'circle') {
                return (
                  <Circle
                    key={shape.id}
                    id={shape.id}
                    x={shape.x ?? 0} y={shape.y ?? 0}
                    radius={shape.radius ?? 50}
                    fill={shape.color}
                    draggable={!!shape.draggable}
                    onDragEnd={(e) => onDragEnd(shape.id, e)}
                    onClick={() => setSelectedIds([shape.id])}
                  />
                );
              }
              if (shape.type === 'text') {
                return (
                  <Text
                    key={shape.id}
                    id={shape.id}
                    x={shape.x ?? 0} y={shape.y ?? 0}
                    text={shape.text || ''}
                    fontSize={18}
                    fill={shape.color}
                    draggable={!!shape.draggable}
                    onDblClick={() => handleTextDblClick(shape)}
                    onClick={() => setSelectedIds([shape.id])}
                    onDragEnd={(e) => onDragEnd(shape.id, e)}
                  />
                );
              }
              if (shape.type === 'image') {
                return (
                  <KonvaImageNode
                    key={shape.id}
                    id={shape.id}
                    src={shape.imageSrc}
                    x={shape.x}
                    y={shape.y}
                    width={shape.width}
                    height={shape.height}
                    onClick={() => setSelectedIds([shape.id])}
                    onDblClick={() => setSelectedIds([shape.id])}
                    draggable={!!shape.draggable}
                    onDragEnd={(e) => onDragEnd(shape.id, e)}
                  />
                );
              }
              if (shape.type === 'connector') {
                return (
                  <Group key={shape.id}>
                    <Line
                      key={shape.id + '-line'}
                      id={shape.id}
                      points={shape.points || []}
                      stroke={shape.color || '#333'}
                      strokeWidth={shape.size ?? 2}
                      lineCap="round"
                      lineJoin="round"
                    />
                    {/* small circles at ends */}
                    {shape.points && shape.points.length >= 4 && (
                      <>
                        <Circle x={shape.points[0]} y={shape.points[1]} radius={4} fill="#333" />
                        <Circle x={shape.points[shape.points.length - 2]} y={shape.points[shape.points.length - 1]} radius={4} fill="#333" />
                      </>
                    )}
                  </Group>
                );
              }
              if (shape.type === 'group') {
                // render group's children (visually identical) and draw a dashed rectangle around them
                const children = shapes.filter(s => shape.children?.includes(s.id));
                return (
                  <Group
                    key={shape.id}
                    id={shape.id}
                    x={shape.x ?? 0}
                    y={shape.y ?? 0}
                    draggable
                    onDragEnd={(e) => {
                      // compute drag delta and move children accordingly
                      const node = e.target;
                      const newX = node.x();
                      const newY = node.y();
                      const dx = newX - (shape.x ?? 0);
                      const dy = newY - (shape.y ?? 0);
                      pushHistory();
                      setShapes(prev => prev.map(s => shape.children?.includes(s.id) ? { ...s, x: (s.x ?? 0) + dx, y: (s.y ?? 0) + dy } : s));
                      // update group's own position removed (we'll remove group on ungroup)
                      setShapes(prev => prev.map(s => s.id === shape.id ? { ...s, x: newX, y: newY } : s));
                    }}
                    onClick={() => setSelectedIds([shape.id])}
                  >
                    {/* border */}
                    <Rect
                      x={0}
                      y={0}
                      width={shape.width ?? 100}
                      height={shape.height ?? 100}
                      stroke="rgba(0,0,0,0.12)"
                      dash={[6, 6]}
                    />
                    {/* render children (relative positions must be adjusted) */}
                    {children.map(child => {
                      const relX = (child.x ?? 0) - (shape.x ?? 0);
                      const relY = (child.y ?? 0) - (shape.y ?? 0);
                      if (child.type === 'rect') {
                        return <Rect key={child.id} id={child.id} x={relX} y={relY} width={child.width} height={child.height} fill={child.color} cornerRadius={10} />;
                      }
                      if (child.type === 'text') {
                        return <Text key={child.id} id={child.id} x={relX} y={relY} text={child.text || ''} fontSize={18} fill={child.color} />;
                      }
                      if (child.type === 'circle') {
                        return <Circle key={child.id} id={child.id} x={relX} y={relY} radius={child.radius} fill={child.color} />;
                      }
                      if (child.type === 'image') {
                        return <KonvaImageNode key={child.id} id={child.id} src={child.imageSrc} x={relX} y={relY} width={child.width} height={child.height} />;
                      }
                      return null;
                    })}
                  </Group>
                );
              }
              return null;
            })}

            {/* transformer for selected nodes */}
            <Transformer ref={(node) => { trRef.current = node; }} rotateEnabled enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']} />

            {/* temporary connector rubberband render if building a connector */}
            {tool === 'connect' && connectTemp && (() => {
              const fromShape = findShapeById(connectTemp);
              if (!fromShape || !stageRef.current) return null;
              const fc = getShapeCenter(fromShape);
              const pointer = stageRef.current.getPointerPosition();
              if (!pointer) return null;
              return <Line points={[fc.x, fc.y, pointer.x, pointer.y]} stroke="#888" dash={[4, 4]} strokeWidth={2} />;
            })()}

          </Layer>
        </Stage>
      </div>
    </div>
  );
};

export default DrawingBoard;
