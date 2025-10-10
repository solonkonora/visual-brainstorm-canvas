"use client";

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { Home, Compass, Star, Gift, UserPlus, Menu, LogOut } from "lucide-react";
import Link from 'next/link';
import { useUser } from '../context/user-context';

export default function Dashboard() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, loading, logout } = useUser();

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]);
  
  const templates = [
    { name: "Blank board", color: "from-blue-500 to-blue-700" },
    { name: "Flowchart", color: "from-purple-500 to-purple-700" },
    { name: "Mind Map", color: "from-green-500 to-green-700" },
    { name: "Kanban Framework", color: "from-pink-500 to-pink-700" },
    { name: "Quick Retrospective", color: "from-yellow-400 to-yellow-600" },
    { name: "Brainwriting", color: "from-red-500 to-red-700" },
    { name: "Roadmap Planning", color: "from-indigo-500 to-indigo-700" },
    { name: "Customer Journey M...", color: "from-teal-500 to-teal-700" },
    { name: "Customer Touchpoint...", color: "from-cyan-500 to-cyan-700" },
  ];

  const boards = [
    { name: "My First Board", modified: "Today", owner: "Davy Kennang" },
    { name: "Untitled", modified: "Today", owner: "Davy Kennang" },
  ];

  const handleInviteMembers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('You must be logged in to invite members');
        return;
      }

      const response = await fetch('http://localhost:3000/api/canvases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        await navigator.clipboard.writeText(data.shareableLink);
        alert(`Invite link copied to clipboard: ${data.shareableLink}`);
      } else {
        alert('Failed to generate invite link');
      }
    } catch (error) {
      console.error('Error generating invite link:', error);
      alert('Error generating invite link');
    }
  };

  const handleLogout = () => {
    console.log('🚪 DEBUG: Dashboard logout button clicked');
    logout(); // Use the logout function from UserContext
  };

  return (
    <div className="flex h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Mobile menu button */}
      <button
        className="md:hidden fixed top-4 left-4 z-30 p-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open sidebar"
      >
        <Menu size={24} />
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed md:static z-40 top-0 left-0 h-full w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col shadow-lg transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <div className="p-4 font-semibold text-gray-800 dark:text-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center text-white font-bold shadow-md">
              VB
            </div>
            <span>Visual board</span>
          </div>
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>

        <nav className="flex-1 space-y-2 px-2">
          <a href="#" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <Compass size={18} /> Explore
          </a>
          <a href="#" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold shadow">
            <Home size={18} /> Home
          </a>
          <Link href="/rooms" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300">
            <UserPlus size={18} /> My Rooms
          </Link>
          <Link href="/create-room" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300">
            <Gift size={18} /> Create Room
          </Link>
          <a href="#" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <Star size={18} /> Starred
          </a>
        </nav>

        <div className="p-4 space-y-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-gray-500 hover:bg-red-600 text-white rounded-xl px-3 py-2 text-sm font-medium shadow transition"
          >
            <LogOut size={16} /> Logout
          </button>

        </div>
      </aside>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex items-center justify-between px-6 shadow-sm">
          <div className="text-2xl font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2 p-8">
            Dashboard
          </div>
          <div className="flex items-center gap-3">
            
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-700 animate-pulse"></div>
            ) : user ? (
              <div className="flex items-center gap-2">
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{user.name}</div>
                  {/* <div className="text-xs text-gray-600 dark:text-gray-400">{user.email}</div> */}
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-700 flex items-center justify-center text-white text-sm font-medium">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-700"></div>
            )}
          </div>
        </header>

        {/* Templates */}
        <div className="flex flex-wrap gap-4 overflow-x-auto py-4 px-4 sm:px-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          {templates.map((t, i) => (
            <div
              key={i}
              className={`min-w-[8rem] w-36 h-24 bg-gradient-to-br ${t.color} rounded-xl flex flex-col items-center justify-center text-sm font-medium text-white shadow-lg mb-2`}
            >
              {t.name}
            </div>
          ))}
        </div>

        {/* Boards */}
        <div className="px-2 sm:px-6 py-6">
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Quick Access</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link
                href="/create-room"
                className="bg-gradient-to-br from-blue-500 to-blue-700 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex flex-col items-center text-center"
              >
                <UserPlus size={32} className="mb-3" />
                <h3 className="font-semibold text-lg mb-2">Create Room</h3>
                <p className="text-blue-100 text-sm">Start a new collaborative session</p>
              </Link>
              
              <Link
                href="/rooms"
                className="bg-gradient-to-br from-green-500 to-green-700 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex flex-col items-center text-center"
              >
                <Home size={32} className="mb-3" />
                <h3 className="font-semibold text-lg mb-2">My Rooms</h3>
                <p className="text-green-100 text-sm">View and manage your rooms</p>
              </Link>
              
              <Link
                href="/dashboard"
                className="bg-gradient-to-br from-purple-500 to-purple-700 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex flex-col items-center text-center"
              >
                <Star size={32} className="mb-3" />
                <h3 className="font-semibold text-lg mb-2">Canvas Board</h3>
                <p className="text-purple-100 text-sm">Access the drawing canvas</p>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}