import io from "socket.io-client";
import type { Socket } from "socket.io-client";

const CANVAS_SOCKET_URL = process.env.NEXT_PUBLIC_CANVAS_SOCKET_URL || "http://localhost:3005";
const CHAT_SOCKET_URL = process.env.NEXT_PUBLIC_CHAT_SOCKET_URL || "http://localhost:3003";
console.log("[Socket.IO] CANVAS_SOCKET_URL:", CANVAS_SOCKET_URL);
console.log("[Socket.IO] CHAT_SOCKET_URL:", CHAT_SOCKET_URL);

export const getCanvasSocket = () => io(CANVAS_SOCKET_URL);
export const getChatSocket = () => io(CHAT_SOCKET_URL);

export type { Socket };
