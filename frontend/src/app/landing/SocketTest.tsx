
"use client";
// Types for event payloads
type UserJoinedPayload = { userId: string };
type UpdatePayload = { text: string };
type MessagePayload = { text: string };

import React, { useEffect, useState } from "react";

import { getCanvasSocket, getChatSocket } from "@/lib/socket";



let canvasSocket: ReturnType<typeof getCanvasSocket> | null = null;
let chatSocket: ReturnType<typeof getChatSocket> | null = null;

const SocketTest: React.FC = () => {
  const [canvasConnected, setCanvasConnected] = useState(false);
  const [chatConnected, setChatConnected] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {

  // Connect to /canvas and /chat namespaces using utility
  canvasSocket = getCanvasSocket();
  chatSocket = getChatSocket();

    // Canvas namespace events
    canvasSocket.on("connect", () => {
      setCanvasConnected(true);
      setMessages((msgs) => [...msgs, "Connected to /canvas namespace!"]);
      canvasSocket?.emit("join", { sessionId: "test-session", userId: "frontend-test" });
    });
    canvasSocket.on("disconnect", () => {
      setCanvasConnected(false);
      setMessages((msgs) => [...msgs, "Disconnected from /canvas namespace."]);
    });
    canvasSocket.on("userJoined", (data: UserJoinedPayload) => {
      setMessages((msgs) => [...msgs, `[Canvas] User joined: ${JSON.stringify(data)}`]);
    });
    canvasSocket.on("update", (data: UpdatePayload) => {
      setMessages((msgs) => [...msgs, `[Canvas] Update: ${JSON.stringify(data)}`]);
    });

    // Chat namespace events
    chatSocket.on("connect", () => {
      setChatConnected(true);
      setMessages((msgs) => [...msgs, "Connected to /chat namespace!"]);
      chatSocket?.emit("join", { sessionId: "test-session", userId: "frontend-test" });
    });
    chatSocket.on("disconnect", () => {
      setChatConnected(false);
      setMessages((msgs) => [...msgs, "Disconnected from /chat namespace."]);
    });
    chatSocket.on("userJoined", (data: UserJoinedPayload) => {
      setMessages((msgs) => [...msgs, `[Chat] User joined: ${JSON.stringify(data)}`]);
    });
    chatSocket.on("message", (data: MessagePayload) => {
      setMessages((msgs) => [...msgs, `[Chat] Message: ${JSON.stringify(data)}`]);
    });

    // Clean up on unmount
    return () => {
      canvasSocket?.disconnect();
      chatSocket?.disconnect();
    };
  }, []);


  const sendCanvasUpdate = () => {
    canvasSocket?.emit("update", { text: "Canvas update from frontend!" });
    setMessages((msgs) => [...msgs, "Sent canvas update."]);
  };

  const sendChatMessage = () => {
    chatSocket?.emit("message", { text: "Hello from frontend chat!" });
    setMessages((msgs) => [...msgs, "Sent chat message."]);
  };

  return (
    <div className="p-4 border rounded bg-gray-50 mt-4">
      <h2 className="font-bold mb-2">Socket.IO Namespace Test</h2>
      <div>
        Canvas Status: {canvasConnected ? <span className="text-green-600">Connected</span> : <span className="text-red-600">Disconnected</span>}
      </div>
      <div>
        Chat Status: {chatConnected ? <span className="text-green-600">Connected</span> : <span className="text-red-600">Disconnected</span>}
      </div>
      <div className="flex gap-2 mt-2">
        <button
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={sendCanvasUpdate}
          disabled={!canvasConnected}
        >
          Send Canvas Update
        </button>
        <button
          className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
          onClick={sendChatMessage}
          disabled={!chatConnected}
        >
          Send Chat Message
        </button>
      </div>
      <div className="mt-3 text-sm">
        <div className="font-semibold">Events:</div>
        <ul className="list-disc ml-5">
          {messages.map((msg, idx) => (
            <li key={idx}>{msg}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default SocketTest;