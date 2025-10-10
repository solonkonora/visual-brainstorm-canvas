'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/app/context/user-context';
import { ROOM_SERVICE_URL } from '@/lib/env';
import {
  FaPalette,
  FaUsers,
  FaUnlock,
  FaSignInAlt,
  FaSpinner,
  FaExclamationTriangle
} from 'react-icons/fa';

interface Drawing {
  id: string;
  type: 'line' | 'circle' | 'rectangle';
  coordinates: Record<string, unknown>;
  style?: Record<string, unknown>;
  createdBy: string;
  createdAt: Date;
}

interface Room {
  _id: string;
  name: string;
  ownerId: string;
  shareableLinkKey: string;
  drawings: Drawing[];
  participants: string[];
  createdAt: Date;
  lastModifiedAt: Date;
  asOf?: number;
}

interface RoomPageProps {
  params: Promise<{ roomId: string }>;
}

const RoomPage = ({ params }: RoomPageProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [roomId, setRoomId] = useState<string | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [joinForm, setJoinForm] = useState({ name: '', password: '' });
  const [shareableKey, setShareableKey] = useState<string | null>(null);
  const [keyValidation, setKeyValidation] = useState<{ valid: boolean; checked: boolean }>({ valid: false, checked: false });
  const [validatingKey, setValidatingKey] = useState(false);

  const userContext = useUser();
  const user = userContext ? userContext.user : null;

  // Unwrap params (Next.js 15+ async behavior)
  useEffect(() => {
    const unwrapParams = async () => {
      const unwrapped = await params;
      setRoomId(unwrapped.roomId);
    };
    unwrapParams();
  }, [params]);

  // Extract shareable key from URL
  useEffect(() => {
    const key = searchParams.get('key');
    if (key) {
      setShareableKey(key);
    }
  }, [searchParams]);

  // Validate shareable key when both roomId and key are available
  useEffect(() => {
    if (!roomId || !shareableKey || keyValidation.checked) return;

    const validateShareableKey = async () => {
      setValidatingKey(true);
      try {
        const response = await fetch(`${ROOM_SERVICE_URL}/rooms/${roomId}/validate-key/${shareableKey}`);
        
        if (response.ok) {
          const result = await response.json();
          setKeyValidation({ valid: result.valid, checked: true });
          
          if (result.valid) {
            // If key is valid, show join form immediately
            setShowJoinForm(true);
          } else {
            setError('Invalid or expired shareable link');
          }
        } else {
          setKeyValidation({ valid: false, checked: true });
          setError('Unable to validate shareable link');
        }
      } catch (err) {
        console.error('Error validating shareable key:', err);
        setKeyValidation({ valid: false, checked: true });
        setError('Failed to validate shareable link');
      } finally {
        setValidatingKey(false);
      }
    };

    validateShareableKey();
  }, [roomId, shareableKey, keyValidation.checked]);

  // Fetch room details
  useEffect(() => {
    if (!roomId) return;

    const fetchRoomDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`http://localhost:3006/rooms/${roomId}`, { headers });

        if (!response.ok) {
          setError(response.status === 404 ? 'Room not found' : 'Failed to load room details');
          return;
        }

        const data = await response.json();
        setRoom(data);
      } catch {
        setError('Failed to connect to server');
      } finally {
        setLoading(false);
      }
    };

    fetchRoomDetails();
  }, [roomId]);

  // Handle Join Room
  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoining(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // Extract user ID from JWT token
      let userId = 'guest-user';
      try {
        if (token) {
          // Decode JWT token to get user ID
          const tokenPayload = JSON.parse(atob(token.split('.')[1]));
          userId = tokenPayload.sub || tokenPayload.userId || tokenPayload.id || 'guest-user';
        }
      } catch (error) {
        console.warn('Failed to decode token, using guest user:', error);
      }

      const response = await fetch(
        `http://localhost:3006/rooms/${roomId}/add-participant`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            userId: userId,
          }),
        }
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to join room');
      }

      const data = await response.json();
      sessionStorage.setItem('currentRoom', JSON.stringify(data));
      router.push(`/canvas?room=${roomId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setJoining(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setJoinForm(prev => ({ ...prev, [name]: value }));
  };

  // UI states
  if (!roomId || loading || validatingKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">
            {validatingKey ? 'Validating shareable link...' : 'Loading room details...'}
          </p>
        </div>
      </div>
    );
  }

  if (error && !room) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="text-center max-w-md">
          <FaExclamationTriangle className="text-6xl text-red-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
            Room Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8">{error}</p>
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

  // Main content
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center shadow-lg mx-auto mb-6">
            <FaPalette className="text-white text-2xl" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            {room.name}
          </h1>
          {user ? (
            <p className="text-sm text-gray-700 dark:text-gray-300">Hello, {user.name}</p>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              You are not signed in.{' '}
              <a href="/auth" className="text-blue-600 hover:underline">
                Sign in
              </a>
            </p>
          )}
          <p className="text-sm text-gray-600 dark:text-gray-400">Room ID: {room._id}</p>
        </div>

        {/* Room Info Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-8 border-b border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <FaUsers className="text-blue-600" />
                  <span className="text-2xl font-bold text-gray-800 dark:text-white">
                    {room.participants.length}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Participants</p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <FaUnlock className="text-green-500" />
                  <span className="text-green-600 dark:text-green-400 font-medium">Open</span>
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
          </div>

          {/* Join Form */}
          {!showJoinForm ? (
            <div className="p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
                Ready to Join?
              </h2>
              {shareableKey && keyValidation.valid ? (
                <p className="text-green-600 dark:text-green-400 mb-6">
                  ✓ Valid shareable link! You can join this room directly.
                </p>
              ) : (
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Click below to enter this collaborative room and start working together.
                </p>
              )}
              <button
                onClick={() => setShowJoinForm(true)}
                className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 font-medium flex items-center space-x-2 mx-auto"
              >
                <FaSignInAlt />
                <span>Join Room</span>
              </button>
            </div>
          ) : (
            <div className="p-8">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">
                {shareableKey && keyValidation.valid ? 'Join via Shareable Link' : 'Join Room'}
              </h2>

              {error && (
                <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                  {error}
                </div>
              )}

              <form onSubmit={handleJoinRoom} className="space-y-6">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
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

        {/* Back Button */}
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