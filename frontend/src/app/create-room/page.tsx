'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  FaPalette, 
  FaLock, 
  FaUnlock, 
  FaCopy, 
  FaCheck,
  FaArrowLeft
} from 'react-icons/fa';

interface CreatedRoom {
  roomId: string;
  name: string;
  description?: string;
  isPublic: boolean;
  maxParticipants: number;
  currentParticipants: number;
  shareableLink: string;
  createdAt: string;
}

const CreateRoomPage = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPublic: true,
    password: '',
    maxParticipants: 10,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdRoom, setCreatedRoom] = useState<CreatedRoom | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found. Please log in again.');
        router.push('/auth');
        return;
      }

      // For testing with mock user, simulate room creation
      if (token === 'mock-jwt-token-for-testing') {
        console.log('Mock room creation for:', formData);
        
        // Simulate successful room creation
        const mockRoomId = `room-${Date.now()}`;
        console.log(`Room "${formData.name}" created successfully! Room ID: ${mockRoomId}`);
        
        // Reset form
        setFormData({
          name: '',
          description: '',
          isPublic: false,
          password: '',
          maxParticipants: 10
        });
        setLoading(false);
        return;
      }

      console.log('Creating room with data:', formData);
      console.log('Canvas Service URL:', 'http://localhost:3005');
      console.log('Token exists:', !!token);

      const response = await fetch(`http://localhost:3005/api/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        console.log('Response content type:', contentType);
        
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          console.log('Error data:', errorData);
          throw new Error(errorData.message || `Server error: ${response.status} ${response.statusText}`);
        } else {
          const textResponse = await response.text();
          console.log('Non-JSON response:', textResponse);
          throw new Error(`Server error: ${response.status} ${response.statusText}. Response: ${textResponse}`);
        }
      }

      const data = await response.json();
      console.log('Success data:', data);
      setCreatedRoom(data.room);
    } catch (err) {
      console.error('Full error:', err);
      if (err instanceof Error) {
        setError(`Error: ${err.message}`);
      } else {
        setError('An unknown error occurred while creating the room');
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  if (createdRoom) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-green-800 rounded-full flex items-center justify-center shadow-lg mx-auto mb-4">
              <FaCheck className="text-white text-2xl" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
              Room Created Successfully!
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Your collaborative room is ready to go
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Room Details
                </label>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Room ID:</span>
                    <span className="font-mono text-lg font-bold text-blue-600 dark:text-blue-400">
                      {createdRoom.roomId}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Name:</span>
                    <span className="font-medium text-gray-800 dark:text-white">
                      {createdRoom.name}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Max Participants:</span>
                    <span className="font-medium text-gray-800 dark:text-white">
                      {createdRoom.maxParticipants}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Access:</span>
                    <div className="flex items-center space-x-2">
                      {createdRoom.isPublic ? (
                        <>
                          <FaUnlock className="text-green-500" />
                          <span className="text-green-600 dark:text-green-400">Public</span>
                        </>
                      ) : (
                        <>
                          <FaLock className="text-red-500" />
                          <span className="text-red-600 dark:text-red-400">Private</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Shareable Link
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={createdRoom.shareableLink}
                    readOnly
                    className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white font-mono text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(createdRoom.shareableLink)}
                    className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                      linkCopied
                        ? 'bg-green-600 text-white'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {linkCopied ? <FaCheck /> : <FaCopy />}
                  </button>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Share this link with anyone you want to collaborate with
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => router.push(`/room/${createdRoom.roomId}`)}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 font-medium"
                >
                  Enter Room
                </button>
                <button
                  onClick={() => router.push('/general-dashboard')}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 font-medium"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <Link href="/dashboard" className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-500 mb-4">
            <FaArrowLeft className="mr-2" />
            Back to Dashboard
          </Link>
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg mx-auto mb-4">
            <FaPalette className="text-white text-xl" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            Create New Room
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Set up a collaborative space for your team
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Room Name *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="My Awesome Room"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="What will you be working on together?"
              />
            </div>

            <div>
              <label htmlFor="maxParticipants" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Max Participants
              </label>
              <select
                id="maxParticipants"
                name="maxParticipants"
                value={formData.maxParticipants}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value={5}>5 people</option>
                <option value={10}>10 people</option>
                <option value={25}>25 people</option>
                <option value={50}>50 people</option>
              </select>
            </div>

            <div>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="isPublic"
                  checked={formData.isPublic}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="flex items-center space-x-2">
                  {formData.isPublic ? (
                    <FaUnlock className="text-green-500" />
                  ) : (
                    <FaLock className="text-red-500" />
                  )}
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {formData.isPublic ? 'Public Room' : 'Private Room'}
                  </span>
                </div>
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-7">
                {formData.isPublic 
                  ? 'Anyone with the link can join' 
                  : 'Requires a password to join'
                }
              </p>
            </div>

            {!formData.isPublic && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Room Password *
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required={!formData.isPublic}
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter room password"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Room...' : 'Create Room'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateRoomPage;

