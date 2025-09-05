import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { getChatSocket } from '@/lib/socket';
import io from 'socket.io-client';

type SocketType = ReturnType<typeof io>;

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  message: string;
  timestamp: string;
  roomId: string;
  type: 'text' | 'system' | 'file' | 'emoji';
  replyTo?: string;
  reactions?: Record<string, string[]>; 
}

export interface ChatUser {
  id: string;
  username: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen?: string;
  role: 'owner' | 'collaborator' | 'viewer';
}

interface ChatState {
  // Chat data
  messages: ChatMessage[];
  users: ChatUser[];
  currentRoomId: string | null;
  
  // Socket
  socket: SocketType | null;
  
  // UI state
  isTyping: Record<string, boolean>;
  unreadCount: number;
  isConnected: boolean;
  error: string | null;
  
  // Actions
  sendMessage: (message: string, type?: ChatMessage['type']) => void;
  replyToMessage: (messageId: string, reply: string) => void;
  addReaction: (messageId: string, emoji: string) => void;
  removeReaction: (messageId: string, emoji: string) => void;
  
  // Socket actions
  initializeChat: (roomId: string, userId: string, username: string) => void;
  disconnectChat: () => void;
  setTyping: (isTyping: boolean) => void;
  
  // API actions
  loadChatHistory: (roomId: string) => Promise<void>;
  markMessagesAsRead: () => void;
  
  // System messages
  addSystemMessage: (message: string) => void;
}

export const useChatStore = create<ChatState>()(
  devtools((set, get) => ({
    // Initial state
    messages: [],
    users: [],
    currentRoomId: null,
    
    socket: null,
    isTyping: {},
    unreadCount: 0,
    isConnected: false,
    error: null,
    
    // Send message
    sendMessage: (message: string, type = 'text') => {
      const { socket, currentRoomId } = get();
      if (!socket || !currentRoomId) return;
      
      const messageData = {
        id: Date.now().toString(),
        message: message.trim(),
        type,
        roomId: currentRoomId,
        timestamp: new Date().toISOString()
      };
      
      socket.emit('chat_message', messageData);
      
      // Optimistically add to local state
      set((state) => ({
        messages: [...state.messages, {
          ...messageData,
          userId: socket.id || 'local',
          username: 'You', // This should be replaced with actual username
        }]
      }));
    },
    
    replyToMessage: (messageId: string, reply: string) => {
      const { socket, currentRoomId } = get();
      if (!socket || !currentRoomId) return;
      
      const messageData = {
        id: Date.now().toString(),
        message: reply.trim(),
        type: 'text' as const,
        roomId: currentRoomId,
        timestamp: new Date().toISOString(),
        replyTo: messageId
      };
      
      socket.emit('chat_message', messageData);
    },
    
    addReaction: (messageId: string, emoji: string) => {
      const { socket, currentRoomId } = get();
      if (!socket || !currentRoomId) return;
      
      socket.emit('message_reaction', {
        messageId,
        emoji,
        action: 'add',
        roomId: currentRoomId
      });
    },
    
    removeReaction: (messageId: string, emoji: string) => {
      const { socket, currentRoomId } = get();
      if (!socket || !currentRoomId) return;
      
      socket.emit('message_reaction', {
        messageId,
        emoji,
        action: 'remove',
        roomId: currentRoomId
      });
    },
    
    // Socket initialization
    initializeChat: (roomId: string, userId: string, username: string) => {
      const socket = getChatSocket();
      set({ socket, currentRoomId: roomId });
      
      // Join room
      socket.emit('join_chat', { roomId, userId, username });
      
      // Listen for events
      socket.on('message_received', (data: ChatMessage) => {
        set((state) => ({
          messages: [...state.messages, data],
          unreadCount: state.unreadCount + 1
        }));
      });
      
      socket.on('user_joined_chat', (data: { userId: string, username: string }) => {
        set((state) => ({
          users: [...state.users.filter(u => u.id !== data.userId), {
            id: data.userId,
            username: data.username,
            isOnline: true,
            role: 'collaborator' as const
          }]
        }));
        
        get().addSystemMessage(`${data.username} joined the chat`);
      });
      
      socket.on('user_left_chat', (data: { userId: string, username: string }) => {
        set((state) => ({
          users: state.users.map(u => 
            u.id === data.userId 
              ? { ...u, isOnline: false, lastSeen: new Date().toISOString() }
              : u
          )
        }));
        
        get().addSystemMessage(`${data.username} left the chat`);
      });
      
      socket.on('user_typing', (data: { userId: string, username: string, isTyping: boolean }) => {
        set((state) => ({
          isTyping: { ...state.isTyping, [data.userId]: data.isTyping }
        }));
      });
      
      socket.on('message_reaction_updated', (data: { messageId: string, reactions: Record<string, string[]> }) => {
        set((state) => ({
          messages: state.messages.map(msg => 
            msg.id === data.messageId 
              ? { ...msg, reactions: data.reactions }
              : msg
          )
        }));
      });
      
      socket.on('connect', () => {
        set({ isConnected: true, error: null });
      });
      
      socket.on('connect_error', (error: Error) => {
        set({ error: error.message, isConnected: false });
      });
      
      socket.on('disconnect', () => {
        set({ isConnected: false });
      });
    },
    
    disconnectChat: () => {
      const { socket } = get();
      if (socket) {
        socket.disconnect();
        set({ 
          socket: null, 
          isConnected: false, 
          currentRoomId: null,
          users: [],
          isTyping: {}
        });
      }
    },
    
    setTyping: (isTyping: boolean) => {
      const { socket, currentRoomId } = get();
      if (socket && currentRoomId) {
        socket.emit('typing', { roomId: currentRoomId, isTyping });
      }
    },
    
    // API actions
    loadChatHistory: async (roomId: string) => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/chat/${roomId}/messages`, {
          credentials: 'include'
        });
        
        if (!response.ok) throw new Error('Failed to load chat history');
        
        const messages = await response.json();
        set({ messages, error: null });
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Failed to load chat history' });
      }
    },
    
    markMessagesAsRead: () => {
      set({ unreadCount: 0 });
    },
    
    addSystemMessage: (message: string) => {
      const systemMessage: ChatMessage = {
        id: `system-${Date.now()}`,
        userId: 'system',
        username: 'System',
        message,
        timestamp: new Date().toISOString(),
        roomId: get().currentRoomId || '',
        type: 'system'
      };
      
      set((state) => ({
        messages: [...state.messages, systemMessage]
      }));
    }
  }))
);
