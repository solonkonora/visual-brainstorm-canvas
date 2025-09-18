'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  FaPalette, 
  FaPlus, 
  FaUsers, 
  FaLock, 
  FaUnlock,
  FaCopy,
  FaCheck,
  FaTrash,
  FaEdit,
  FaSpinner,
  FaCalendarAlt
} from 'react-icons/fa';
import { BACKEND_URL } from '@/lib/env';

interface Room {
  roomId: string;
  name: string;
  description?: string;
  isPublic: boolean;
  currentParticipants: number;
  maxParticipants: number;
  lastActivity: string;
  createdAt: string;
  shareableLink: string;
}

const RoomsPage = () => {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/auth');
          return;
        }

        // For testing with mock user, return mock rooms data
        if (token === 'mock-jwt-token-for-testing') {
          console.log('Using mock rooms data');
          
          // Mock rooms data for testing
          const mockRooms = [
            {
              roomId: 'room-demo-1',
              name: 'Design Brainstorm',
              description: 'Collaborative design session for the new product',
              isPublic: true,
              currentParticipants: 3,
              maxParticipants: 10,
              lastActivity: new Date().toISOString(),
              createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
              shareableLink: 'http://localhost:3000/room/room-demo-1'
            },
            {
              roomId: 'room-demo-2',
              name: 'Team Planning Session',
              description: 'Weekly team planning and roadmap discussion',
              isPublic: false,
              currentParticipants: 1,
              maxParticipants: 5,
              lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
              createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
              shareableLink: 'http://localhost:3000/room/room-demo-2'
            }
          ];
          
          setRooms(mockRooms);
          setLoading(false);
          return;
        }

        const response = await fetch(`${BACKEND_URL}/api/rooms`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            router.push('/auth');
            return;
          }
          throw new Error('Failed to fetch rooms');
        }

        const data = await response.json();
        setRooms(data.rooms);
      } catch {
        setError('Failed to load rooms');
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, [router]);

  const copyToClipboard = async (text: string, roomId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLink(roomId);
      setTimeout(() => setCopiedLink(null), 2000);
    } catch {
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours === 1) return '1 hour ago';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 day ago';
    return `${diffInDays} days ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Loading your rooms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center shadow-lg mx-auto mb-6">
            <FaPalette className="text-white text-2xl" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">
            Your Collaborative Rooms
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Create, manage, and join rooms where teams collaborate in real-time
          </p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg max-w-2xl mx-auto">
            {error}
          </div>
        )}

        {/* Create New Room Button */}
        <div className="text-center mb-12">
          <Link
            href="/create-room"
            className="inline-flex items-center space-x-3 px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
          >
            <FaPlus />
            <span>Create New Room</span>
          </Link>
        </div>

        {/* Rooms List */}
        {rooms.length === 0 ? (
          <div className="text-center py-16">
            <FaPalette className="text-6xl text-gray-400 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
              No rooms yet
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              Create your first collaborative room to get started
            </p>
            <Link
              href="/create-room"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200"
            >
              <FaPlus />
              <span>Create Room</span>
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => (
              <div
                key={room.roomId}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-all duration-200"
              >
                {/* Room Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2 line-clamp-1">
                      {room.name}
                    </h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-mono">{room.roomId}</span>
                      {room.isPublic ? (
                        <FaUnlock className="text-green-500" />
                      ) : (
                        <FaLock className="text-red-500" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Room Description */}
                {room.description && (
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                    {room.description}
                  </p>
                )}

                {/* Room Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <FaUsers className="text-blue-600 text-sm" />
                      <span className="font-bold text-gray-800 dark:text-white">
                        {room.currentParticipants}
                      </span>
                      <span className="text-gray-500">/ {room.maxParticipants}</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Participants</p>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <FaCalendarAlt className="text-green-600 text-sm" />
                      <span className="font-bold text-gray-800 dark:text-white text-xs">
                        {formatRelativeTime(room.lastActivity)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Last Active</p>
                  </div>
                </div>

                {/* Room Actions */}
                <div className="space-y-3">
                  <button
                    onClick={() => router.push(`/room/${room.roomId}`)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium"
                  >
                    Enter Room
                  </button>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => copyToClipboard(room.shareableLink, room.roomId)}
                      className={`flex-1 px-3 py-2 rounded-lg font-medium transition-all duration-200 text-sm flex items-center justify-center space-x-1 ${
                        copiedLink === room.roomId
                          ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {copiedLink === room.roomId ? (
                        <>
                          <FaCheck className="text-xs" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <FaCopy className="text-xs" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>

                    <button
                      className="px-3 py-2 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
                      title="Edit Room"
                    >
                      <FaEdit className="text-sm" />
                    </button>

                    <button
                      className="px-3 py-2 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-all duration-200"
                      title="Delete Room"
                    >
                      <FaTrash className="text-sm" />
                    </button>
                  </div>
                </div>

                {/* Room Metadata */}
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Created {formatDate(room.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Stats */}
        {rooms.length > 0 && (
          <div className="mt-16 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 text-center">
              Quick Stats
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {rooms.length}
                </div>
                <p className="text-gray-600 dark:text-gray-300">Total Rooms</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {rooms.reduce((acc, room) => acc + room.currentParticipants, 0)}
                </div>
                <p className="text-gray-600 dark:text-gray-300">Active Participants</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {rooms.filter(room => room.isPublic).length}
                </div>
                <p className="text-gray-600 dark:text-gray-300">Public Rooms</p>
              </div>
            </div>
          </div>
        )}

        <div className="text-center mt-12">
          <Link
            href="/general-dashboard"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-500 font-medium"
          >
            ← Back to Main Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RoomsPage;
