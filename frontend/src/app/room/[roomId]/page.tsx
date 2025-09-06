'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FaPalette, 
  FaUsers, 
  FaLock, 
  FaUnlock,
  FaSignInAlt,
  FaSpinner,
  FaExclamationTriangle
} from 'react-icons/fa';
import { BACKEND_URL } from '@/lib/env';

interface Room {
  roomId: string;
  name: string;
  description?: string;
  isPublic: boolean;
  maxParticipants: number;
  currentParticipants: number;
  requiresPassword: boolean;
  shareableLink: string;
  status: string;
  participants?: Array<{
    name: string;
    joinedAt: string;
    isActive: boolean;
  }>;
  settings: {
    allowGuests: boolean;
    allowDrawing: boolean;
    allowChat: boolean;
  };
}

interface RoomPageProps {
  params: {
    roomId: string;
  };
}

const RoomPage = ({ params }: RoomPageProps) => {
  const router = useRouter();
  const { roomId } = params;
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joinForm, setJoinForm] = useState({
    name: '',
    password: '',
  });
  const [showJoinForm, setShowJoinForm] = useState(false);

  useEffect(() => {
    const fetchRoomDetails = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/rooms/${roomId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Room not found');
          } else {
            setError('Failed to load room details');
          }
          return;
        }

        const data = await response.json();
        setRoom(data.room);
      } catch {
        setError('Failed to connect to server');
      } finally {
        setLoading(false);
      }
    };

    fetchRoomDetails();
  }, [roomId]);

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoining(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${BACKEND_URL}/api/rooms/join`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          roomId,
          name: joinForm.name,
          password: joinForm.password || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to join room');
      }

      const data = await response.json();
      
      // Store room data and redirect to canvas
      sessionStorage.setItem('currentRoom', JSON.stringify(data.room));
      router.push(`/canvas?room=${roomId}`);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setJoining(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setJoinForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Loading room details...</p>
        </div>
      </div>
    );
  }

  if (error && !room) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <FaExclamationTriangle className="text-6xl text-red-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
            Room Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            {error}
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!room) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center shadow-lg mx-auto mb-6">
            <FaPalette className="text-white text-2xl" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            {room.name}
          </h1>
          {room.description && (
            <p className="text-lg text-gray-600 dark:text-gray-300">
              {room.description}
            </p>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Room Info */}
          <div className="p-8 border-b border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <FaUsers className="text-blue-600" />
                  <span className="text-2xl font-bold text-gray-800 dark:text-white">
                    {room.currentParticipants}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    / {room.maxParticipants}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Participants</p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  {room.requiresPassword ? (
                    <>
                      <FaLock className="text-red-500" />
                      <span className="text-red-600 dark:text-red-400 font-medium">Private</span>
                    </>
                  ) : (
                    <>
                      <FaUnlock className="text-green-500" />
                      <span className="text-green-600 dark:text-green-400 font-medium">Public</span>
                    </>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Access</p>
              </div>

              <div className="text-center">
                <div className="mb-2">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    room.status === 'active' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                  }`}>
                    {room.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
              </div>
            </div>

            {room.currentParticipants >= room.maxParticipants && (
              <div className="mt-6 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-lg text-center">
                <FaExclamationTriangle className="inline mr-2" />
                This room is currently full. Please try again later.
              </div>
            )}
          </div>

          {/* Join Form */}
          {!showJoinForm ? (
            <div className="p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
                Ready to Join?
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Click below to enter this collaborative room and start working together.
              </p>
              <button
                onClick={() => setShowJoinForm(true)}
                disabled={room.currentParticipants >= room.maxParticipants || room.status !== 'active'}
                className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto"
              >
                <FaSignInAlt />
                <span>Join Room</span>
              </button>
            </div>
          ) : (
            <div className="p-8">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">
                Join Room
              </h2>

              {error && (
                <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                  {error}
                </div>
              )}

              <form onSubmit={handleJoinRoom} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Your Name *
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={joinForm.name}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter your display name"
                  />
                </div>

                {room.requiresPassword && (
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Room Password *
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      value={joinForm.password}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Enter room password"
                    />
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    type="submit"
                    disabled={joining}
                    className="flex-1 py-3 px-6 bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {joining ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        <span>Joining...</span>
                      </>
                    ) : (
                      <>
                        <FaSignInAlt />
                        <span>Join Room</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowJoinForm(false);
                      setError(null);
                    }}
                    className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        <div className="text-center mt-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-500 font-medium"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoomPage;
