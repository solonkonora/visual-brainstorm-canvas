"use client";

import { Home, Compass, Star, Bell, Gift, UserPlus } from "lucide-react";
import Link from 'next/link';

export default function Dashboard() {
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

  return (
    <div className="flex h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 h-full flex flex-col shadow-lg">
        <div className="p-4 font-semibold text-gray-800 dark:text-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center text-white font-bold shadow-md">
              VB
            </div>
            <span>Visual board</span>
          </div>
        </div>

        <nav className="flex-1 space-y-2 px-2">
          <a href="#" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <Compass size={18} /> Explore
          </a>
          <a href="#" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold shadow">
            <Home size={18} /> Home
          </a>
          <a href="#" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <Star size={18} /> Starred
          </a>
        </nav>

        <div className="p-4">
                  <Link href="/dashboard" className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl px-3 py-2 text-sm font-medium shadow hover:from-blue-700 hover:to-blue-800 transition block text-center">
                    + New Space
                  </Link>
                </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex items-center justify-between px-6 shadow-sm">
          <div className="text-2xl font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
            Dashboard
            <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-lg">Free</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-1 text-sm font-medium px-3 py-1 border rounded-lg hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800 dark:text-gray-200">
              <UserPlus size={16} /> Invite members
            </button>
            <button className="bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm px-3 py-1 rounded-lg hover:from-blue-700 hover:to-blue-800 shadow">
              Upgrade
            </button>
            <Gift size={20} className="text-gray-600 dark:text-gray-300" />
            <Bell size={20} className="text-gray-600 dark:text-gray-300" />
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-700"></div>
          </div>
        </header>

        {/* Templates */}
        <div className="flex gap-4 overflow-x-auto py-4 px-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          {templates.map((t, i) => (
            <div
              key={i}
              className={`w-36 h-24 bg-gradient-to-br ${t.color} rounded-xl flex flex-col items-center justify-center text-sm font-medium text-white shadow-lg`}
            >
              {t.name}
            </div>
          ))}
          <Link href="/dashboard" className="ml-auto border px-3 py-2 rounded-lg hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-gray-200 shadow-sm">
                      + Create new
                    </Link>
        </div>

        {/* Boards */}
        <div className="px-6 py-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Boards in this team</h2>

          <div className="flex items-center gap-4 mb-6 text-sm">
            <select className="border rounded-lg px-2 py-1 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200">
              <option>All boards</option>
            </select>
            <select className="border rounded-lg px-2 py-1 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200">
              <option>Owned by anyone</option>
            </select>
            <select className="border rounded-lg px-2 py-1 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200">
              <option>Last opened</option>
            </select>
          </div>

          <table className="w-full border-t border-gray-200 dark:border-gray-700 text-sm">
            <thead className="text-left text-gray-600 dark:text-gray-400">
              <tr>
                <th className="py-2">Name</th>
                <th className="py-2">Last opened</th>
                <th className="py-2">Owner</th>
              </tr>
            </thead>
            <tbody>
              {boards.map((b, i) => (
                <tr
                  key={i}
                  className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  <td className="py-3 font-medium text-gray-800 dark:text-gray-200">{b.name}</td>
                  <td className="py-3 text-gray-600 dark:text-gray-400">{b.modified}</td>
                  <td className="py-3 text-gray-600 dark:text-gray-400">{b.owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
