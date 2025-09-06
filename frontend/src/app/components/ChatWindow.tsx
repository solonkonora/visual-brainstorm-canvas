'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FaTimes, FaPaperPlane, FaUsers, FaSmile } from 'react-icons/fa';
import { useChatStore } from '@/stores/chatStore';
import { useParams } from 'next/navigation';

interface ChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ isOpen, onClose }) => {
  const params = useParams();
  const canvasId = params.canvasId as string;

  const {
    messages,
    users,
    isConnected,
    sendMessage,
    initializeChat,
    disconnectChat,
    loadChatHistory,
    markMessagesAsRead
  } = useChatStore();

  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize chat when component mounts
  useEffect(() => {
    if (isOpen && canvasId) {
      const userId = 'user-' + Date.now(); // In real app, get from auth
      const username = 'User'; // In real app, get from auth
      initializeChat(canvasId, userId, username);
      loadChatHistory(canvasId);
    }

    return () => {
      if (!isOpen) {
        disconnectChat();
      }
    };
  }, [isOpen, canvasId, initializeChat, disconnectChat, loadChatHistory]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read when chat opens
  useEffect(() => {
    if (isOpen) {
      markMessagesAsRead();
    }
  }, [isOpen, markMessagesAsRead]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageInput.trim()) {
      sendMessage(messageInput.trim());
      setMessageInput('');
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-lg z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <FaUsers className="text-gray-600 dark:text-gray-400" />
          <span className="font-semibold text-gray-900 dark:text-white">Chat</span>
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
        >
          <FaTimes className="text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Users List */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
          <span>{users.length} online</span>
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full text-xs"
            >
              <span className={`w-2 h-2 rounded-full ${user.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></span>
              <span className="text-gray-700 dark:text-gray-300">{user.username}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((message) => (
          <div key={message.id} className="flex flex-col">
            {message.type === 'system' ? (
              <div className="text-center text-xs text-gray-500 dark:text-gray-400 py-1">
                {message.message}
              </div>
            ) : (
              <div className="flex space-x-2">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {message.username.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-sm text-gray-900 dark:text-white">
                      {message.username}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                    {message.message}
                  </div>
                  {message.replyTo && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 pl-2 border-l-2 border-gray-300 dark:border-gray-600">
                      Replying to: {messages.find(m => m.id === message.replyTo)?.message}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            disabled={!isConnected}
          />
          <button
            type="submit"
            disabled={!messageInput.trim() || !isConnected}
            className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaPaperPlane />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
