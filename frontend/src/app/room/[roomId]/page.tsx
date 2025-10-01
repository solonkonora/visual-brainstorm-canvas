'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@/app/context/user-context';
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

interface Room {
  roomId: string;
  name: string;
  description?: string;
  isPublic: boolean;
  maxParticipants: number;
  currentParticipants: number;
  participants?: string[]; // Array of user IDs
  createdBy: string;
  createdAt?: string;
}

interface RoomPageProps {
  params: Promise<{
    roomId: string;
  }>;
}

const RoomPage = ({ params }: RoomPageProps) => {
  const router = useRouter();
  const [roomId, setRoomId] = React.useState<string | null>(null);
  // Get current user from context (if UserProvider wraps the app)
  let user: { id: string; name: string; email: string } | null = null;
  try {
    // Prefer top-level hook usage; if not in a React tree wrapped by UserProvider,
    // this will throw and we fall back to null.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    user = useUser().user;
  } catch {
    user = null;
  }

  // Unwrap the params Promise as required by Next.js 15
  React.useEffect(() => {
    const unwrapParams = async () => {
      const unwrappedParams = await params;
      setRoomId(unwrappedParams.roomId);
    };
    unwrapParams();
  }, [params]);
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
    if (!roomId) return; // Wait for roomId to be available
    
    const fetchRoomDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // For testing with mock user, return mock room data
        if (token === 'mock-jwt-token-for-testing') {
          console.log('Using mock room data for roomId:', roomId);
          
          // Mock room data for testing
          const mockRoom: Room = {
            roomId,
            name: roomId === 'room-demo-1' ? 'Design Brainstorm' : 'Team Planning Session',
            description: roomId === 'room-demo-1' 
              ? 'Collaborative design session for the new product' 
              : 'Weekly team planning and roadmap discussion',
            isPublic: roomId === 'room-demo-1' ? true : false,
            maxParticipants: roomId === 'room-demo-1' ? 10 : 5,
            currentParticipants: roomId === 'room-demo-1' ? 3 : 1,
            participants: ['mock-user-1'],
            createdBy: 'mock-user-1',
            createdAt: new Date().toISOString(),
          };
          
          setRoom(mockRoom);
          setLoading(false);
          return;
        }

        const response = await fetch(`http://localhost:3005/api/rooms/${roomId}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        });
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Room not found');
          } else {
            setError('Failed to load room details');
          }
          return;
        }

        const data = await response.json();
        setRoom(data);  // The API returns room data directly, not nested under 'room'
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
      
      // For testing with mock user, skip API call and redirect directly
      if (token === 'mock-jwt-token-for-testing') {
        console.log('Mock user joining room:', roomId);
        // Store room data and redirect to canvas
        sessionStorage.setItem('currentRoom', JSON.stringify(room));
        router.push(`/canvas?room=${roomId}`);
        return;
      }
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`http://localhost:3005/api/rooms/${roomId}/join`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          password: joinForm.password || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to join room');
      }

      const data = await response.json();
      
      // Store room data and redirect to canvas
      sessionStorage.setItem('currentRoom', JSON.stringify(data));
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

  if (!roomId || loading) {
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
          {/* Show current logged in user's name when available */}
          {user ? (
            <p className="text-sm text-gray-700 dark:text-gray-300">Hello, {user.name}</p>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400">You are not signed in. <a href="/auth" className="text-blue-600">Sign in</a></p>
          )}
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
                  {!room.isPublic ? (
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
                  <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Active
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
                disabled={room.currentParticipants >= room.maxParticipants}
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

                {!room.isPublic && (
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
