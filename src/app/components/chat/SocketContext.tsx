"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  error: string | null;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  error: null,
});

export const useSocket = () => {
  return useContext(SocketContext);
};

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const socketUrl =
      process.env.NODE_ENV === "production"
        ? process.env.NEXT_PUBLIC_SOCKET_URL || "wss://your-domain.com"
        : "http://localhost:3001";

    try {
      const newSocket = io(socketUrl, {
        path: "/api/socket/io",
        transports: ["websocket", "polling"],
        timeout: 20000,
        forceNew: true,
      });

      newSocket.on("connect", () => {
        console.log("Connected to Socket.IO server");
        setIsConnected(true);
        setError(null);
      });

      newSocket.on("connect_error", (err) => {
        console.error("Socket connection error:", err);
        setError("Failed to connect to chat server");
        setIsConnected(false);
      });

      newSocket.on("disconnect", (reason) => {
        console.log("Disconnected from Socket.IO server:", reason);
        setIsConnected(false);
      });

      newSocket.on("reconnect", (attemptNumber) => {
        console.log("Reconnected to Socket.IO server:", attemptNumber);
        setIsConnected(true);
        setError(null);
      });

      setSocket(newSocket);

      return () => {
        if (newSocket) {
          newSocket.disconnect();
        }
      };
    } catch (err) {
      console.error("Socket initialization error:", err);
      setError("Failed to initialize chat connection");
    }
  }, []);

  const value = {
    socket,
    isConnected,
    error,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
