import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { getCanvasSocket } from '@/lib/socket';
import io from 'socket.io-client';

type SocketType = ReturnType<typeof io>;

// Debounce utility function
const debounce = <T extends (...args: never[]) => void>(func: T, wait: number): T => {
  let timeout: NodeJS.Timeout;
  return ((...args: Parameters<T>) => {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  }) as T;
};

export interface ShapeType {
  id: string;
  type: 'line' | 'rect' | 'circle' | 'text' | 'image' | 'connector' | 'group';
  points?: number[];
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  radius?: number;
  color?: string;
  size?: number;
  tool?: string;
  text?: string;
  imageSrc?: string;
  children?: string[];
  fromId?: string;
  toId?: string;
  draggable?: boolean;
  userId?: string; // Track who created the shape
  timestamp?: number;
}

export interface CanvasRoom {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  collaborators: string[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  thumbnail?: string;
}

export interface ConnectedUser {
  id: string;
  name: string;
  avatar?: string;
  cursor?: { x: number; y: number };
  color: string;
  isActive: boolean;
}

interface CanvasState {
  // Canvas data
  currentRoom: CanvasRoom | null;
  shapes: ShapeType[];
  selectedIds: string[];
  history: ShapeType[][];
  redoStack: ShapeType[][];
  
  // Drawing state
  tool: 'brush' | 'eraser' | 'rect' | 'circle' | 'text' | 'connect' | 'image' | 'select' | 'text-align-left' | 'text-align-center' | 'text-align-right';
  color: string;
  brushSize: number;
  isDrawing: boolean;
  
  // Collaboration state
  socket: SocketType | null;
  connectedUsers: ConnectedUser[];
  userCursors: Record<string, { x: number; y: number }>;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setCurrentRoom: (room: CanvasRoom | null) => void;
  addShape: (shape: ShapeType) => void;
  updateShapes: (shapes: ShapeType[]) => void;
  deleteShapes: (shapeIds: string[]) => void;
  selectShapes: (shapeIds: string[]) => void;
  setTool: (tool: CanvasState['tool']) => void;
  setColor: (color: string) => void;
  setBrushSize: (size: number) => void;
  setIsDrawing: (drawing: boolean) => void;
  
  // Socket actions
  initializeSocket: (roomId: string, userId: string) => void;
  disconnectSocket: () => void;
  broadcastShapeAdd: (shape: ShapeType) => void;
  broadcastShapeUpdate: (shapes: ShapeType[]) => void;
  broadcastShapeDelete: (shapeIds: string[]) => void;
  broadcastCursorMove: (x: number, y: number) => void;
  
  // History actions
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
  
  // API actions
  saveCanvas: () => Promise<void>;
  loadCanvas: (roomId: string) => Promise<void>;
  createRoom: (roomData: Partial<CanvasRoom>) => Promise<CanvasRoom>;
  joinRoom: (roomId: string) => Promise<void>;
  leaveRoom: () => void;
}

export const useCanvasStore = create<CanvasState>()(
  devtools(
    persist(
      (set, get) => {
        // Create debounced save function
        const debouncedSave = debounce(() => get().saveCanvas(), 2000);
        
        return {
        // Initial state
        currentRoom: null,
        shapes: [],
        selectedIds: [],
        history: [],
        redoStack: [],
        
        tool: 'brush',
        color: '#000000',
        brushSize: 5,
        isDrawing: false,
        
        socket: null,
        connectedUsers: [],
        userCursors: {},
        
        isLoading: false,
        error: null,
        
        // Basic state setters
        setCurrentRoom: (room) => set({ currentRoom: room }),
        
        addShape: (shape) => {
          set((state) => {
            const newShapes = [...state.shapes, shape];
            return { 
              shapes: newShapes,
              history: [...state.history, state.shapes], // Save current state to history
              redoStack: [] // Clear redo stack when new action is performed
            };
          });
          get().broadcastShapeAdd(shape);
          // Auto-save to database with debounce
          debouncedSave();
        },
        
        updateShapes: (shapes) => {
          set((state) => ({
            shapes,
            history: [...state.history, state.shapes], // Save current state to history
            redoStack: [] // Clear redo stack when new action is performed
          }));
          get().broadcastShapeUpdate(shapes);
          // Auto-save to database with debounce
          debouncedSave();
        },
        
        deleteShapes: (shapeIds) => {
          set((state) => ({
            shapes: state.shapes.filter(s => !shapeIds.includes(s.id)),
            selectedIds: state.selectedIds.filter(id => !shapeIds.includes(id)),
            history: [...state.history, state.shapes], // Save current state to history
            redoStack: [] // Clear redo stack when new action is performed
          }));
          get().broadcastShapeDelete(shapeIds);
          // Auto-save to database with debounce
          debouncedSave();
        },
        
        selectShapes: (shapeIds) => set({ selectedIds: shapeIds }),
        setTool: (tool) => set({ tool }),
        setColor: (color) => set({ color }),
        setBrushSize: (size) => set({ brushSize: size }),
        setIsDrawing: (drawing) => set({ isDrawing: drawing }),
        
        // History management
        pushHistory: () => {
          set((state) => ({
            history: [...state.history, state.shapes],
            redoStack: []
          }));
        },
        
        undo: () => {
          const state = get();
          if (state.history.length === 0) return;
          
          const previousShapes = state.history[state.history.length - 1];
          set({
            shapes: previousShapes,
            history: state.history.slice(0, -1),
            redoStack: [state.shapes, ...state.redoStack.slice(0, 19)] // Limit redo stack size
          });
          
          // Broadcast the change and save to database
          get().broadcastShapeUpdate(previousShapes);
          debouncedSave();
        },
        
        redo: () => {
          const state = get();
          if (state.redoStack.length === 0) return;
          
          const [nextShapes, ...remainingRedo] = state.redoStack;
          set({
            shapes: nextShapes,
            history: [...state.history, state.shapes].slice(-20), // Limit history size
            redoStack: remainingRedo
          });
          
          // Broadcast the change and save to database
          get().broadcastShapeUpdate(nextShapes);
          debouncedSave();
        },
        
        // Socket initialization
        initializeSocket: (roomId: string, userId: string) => {
          const socket = getCanvasSocket();
          set({ socket, isLoading: true });
          
          // Join room
          socket.emit('join', { sessionId: roomId, userId });
          
          // Listen for events
          socket.on('shape_added', (data: { shape: ShapeType, userId: string }) => {
            if (data.userId !== socket.id) {
              set((state) => ({ shapes: [...state.shapes, data.shape] }));
            }
          });
          
          socket.on('shape_updated', (data: { shapes: ShapeType[], userId: string }) => {
            if (data.userId !== socket.id) {
              set({ shapes: data.shapes });
            }
          });
          
          socket.on('shape_deleted', (data: { shapeIds: string[], userId: string }) => {
            if (data.userId !== socket.id) {
              set((state) => ({
                shapes: state.shapes.filter(s => !data.shapeIds.includes(s.id))
              }));
            }
          });
          
          socket.on('userJoined', (data: { userId: string; userData?: { name: string; avatar?: string; color?: string } }) => {
            set((state) => ({
              connectedUsers: [...state.connectedUsers.filter(u => u.id !== data.userId), {
                id: data.userId,
                name: data.userData?.name || `User ${data.userId.slice(-4)}`,
                color: data.userData?.color || '#' + Math.floor(Math.random()*16777215).toString(16),
                isActive: true
              }]
            }));
          });
          
          socket.on('userLeft', (data: { userId: string }) => {
            set((state) => ({
              connectedUsers: state.connectedUsers.filter(u => u.id !== data.userId)
            }));
          });
          
          socket.on('cursorMove', (data: { userId: string, x: number, y: number }) => {
            set((state) => ({
              userCursors: { ...state.userCursors, [data.userId]: { x: data.x, y: data.y } }
            }));
          });
          
          socket.on('connect', () => {
            set({ isLoading: false, error: null });
          });
          
          socket.on('connect_error', (error: Error) => {
            set({ error: error.message, isLoading: false });
          });
        },
        
        disconnectSocket: () => {
          const { socket } = get();
          if (socket) {
            socket.disconnect();
            set({ socket: null, connectedUsers: [], userCursors: {} });
          }
        },
        
        // Broadcasting actions
        broadcastShapeAdd: (shape) => {
          const { socket, currentRoom } = get();
          if (socket && currentRoom) {
            socket.emit('shape_add', {
              sessionId: currentRoom.id,
              shape,
              userId: socket.id
            });
          }
        },
        
        broadcastShapeUpdate: (shapes) => {
          const { socket, currentRoom } = get();
          if (socket && currentRoom) {
            socket.emit('shape_update', {
              sessionId: currentRoom.id,
              shapes,
              userId: socket.id
            });
          }
        },
        
        broadcastShapeDelete: (shapeIds) => {
          const { socket, currentRoom } = get();
          if (socket && currentRoom) {
            socket.emit('shape_delete', {
              sessionId: currentRoom.id,
              shapeIds,
              userId: socket.id
            });
          }
        },
        
        broadcastCursorMove: (x, y) => {
          const { socket, currentRoom } = get();
          if (socket && currentRoom) {
            socket.emit('cursor_move', {
              sessionId: currentRoom.id,
              x,
              y,
              userId: socket.id
            });
          }
        },
        
        // API actions
        saveCanvas: async () => {
          const { currentRoom, shapes } = get();
          if (!currentRoom) return;
          
          set({ isLoading: true });
          try {
            // Transform shapes to match backend schema
            const transformedShapes = shapes.map(shape => ({
              id: shape.id,
              type: shape.type,
              x: shape.x,
              y: shape.y,
              width: shape.width,
              height: shape.height,
              radius: shape.radius,
              points: shape.points,
              fill: shape.color, // Map color to fill
              stroke: shape.color,
              strokeWidth: shape.size,
              text: shape.text,
              fontSize: 16,
              fontFamily: 'Arial',
              imageSrc: shape.imageSrc,
              draggable: shape.draggable,
              tool: shape.tool,
              fromId: shape.fromId,
              toId: shape.toId,
              createdBy: shape.userId || 'anonymous'
            }));

            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/canvas/${currentRoom.id}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                shapes: transformedShapes,
                title: currentRoom.name,
                description: currentRoom.description 
              }),
              credentials: 'include'
            });
            
            if (!response.ok) throw new Error('Failed to save canvas');
            
            set({ error: null });
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to save canvas' });
          } finally {
            set({ isLoading: false });
          }
        },
        
        loadCanvas: async (roomId: string) => {
          set({ isLoading: true });
          try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/canvas/${roomId}`, {
              credentials: 'include'
            });
            
            if (!response.ok) {
              // If session doesn't exist, create it
              if (response.status === 404) {
                const createResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/canvas`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    title: `Canvas ${roomId}`,
                    description: 'Collaborative canvas session' 
                  }),
                  credentials: 'include'
                });
                
                if (createResponse.ok) {
                  const createData = await createResponse.json();
                  set({ 
                    shapes: [], 
                    currentRoom: {
                      id: createData.sessionId,
                      name: createData.session.title,
                      description: createData.session.description,
                      ownerId: createData.session.ownerId,
                      collaborators: [],
                      isPublic: !createData.session.isPrivate,
                      createdAt: createData.session.createdAt,
                      updatedAt: createData.session.createdAt
                    },
                    error: null 
                  });
                  return;
                }
              }
              throw new Error('Failed to load canvas');
            }
            
            const data = await response.json();
            set({ 
              shapes: data.shapes || [], 
              currentRoom: {
                id: data.session.id,
                name: data.session.title,
                description: data.session.description,
                ownerId: data.session.ownerId,
                collaborators: data.session.participants || [],
                isPublic: !data.session.isPrivate,
                createdAt: data.session.createdAt,
                updatedAt: data.session.updatedAt
              },
              error: null 
            });
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to load canvas' });
          } finally {
            set({ isLoading: false });
          }
        },
        
        createRoom: async (roomData) => {
          set({ isLoading: true });
          try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/rooms`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(roomData),
              credentials: 'include'
            });
            
            if (!response.ok) throw new Error('Failed to create room');
            
            const room = await response.json();
            set({ currentRoom: room, error: null });
            return room;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to create room';
            set({ error: errorMessage });
            throw new Error(errorMessage);
          } finally {
            set({ isLoading: false });
          }
        },
        
        joinRoom: async (roomId: string) => {
          await get().loadCanvas(roomId);
          const { currentRoom } = get();
          if (currentRoom) {
            get().initializeSocket(roomId, 'current-user-id'); // TODO: Get actual user ID
          }
        },
        
        leaveRoom: () => {
          get().disconnectSocket();
          set({ currentRoom: null, shapes: [], selectedIds: [], connectedUsers: [] });
        }
        };
      },
      {
        name: 'canvas-storage',
        partialize: (state: CanvasState) => ({
          tool: state.tool,
          color: state.color,
          brushSize: state.brushSize
        })
      }
    )
  )
);
