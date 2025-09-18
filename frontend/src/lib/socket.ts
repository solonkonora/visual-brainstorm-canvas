import io from "socket.io-client";
import type { Socket } from "socket.io-client";

const BASE_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3004";
console.log("[Socket.IO] BASE_URL:", BASE_URL);

export const getCanvasSocket = () => io(BASE_URL);
export const getChatSocket = () => io(BASE_URL);

export type { Socket };
