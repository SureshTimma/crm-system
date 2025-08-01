"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSocket } from "./SocketContext";
import { Send, Bot, User, Loader } from "lucide-react";

interface Message {
  id: string;
  message: string;
  sender: "user" | "ai";
  timestamp: string;
  conversationId?: string;
  error?: boolean;
}

interface ChatComponentProps {
  userId?: string;
  conversationId?: string;
}

const ChatComponent: React.FC<ChatComponentProps> = ({
  userId = "default-user",
  conversationId = "default-conversation",
}) => {
  const { socket, isConnected, error } = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Join the user's room
    socket.emit("join-room", userId);

    // Listen for incoming messages
    socket.on("receive-message", (data: Message) => {
      setMessages((prev) => [
        ...prev,
        {
          ...data,
          id: Date.now().toString() + Math.random(),
        },
      ]);
      setIsAiTyping(false);
      setIsLoading(false);
    });

    // Listen for typing indicators
    socket.on("user-typing", () => {
      setIsAiTyping(true);
    });

    socket.on("user-stopped-typing", () => {
      setIsAiTyping(false);
    });

    return () => {
      socket.off("receive-message");
      socket.off("user-typing");
      socket.off("user-stopped-typing");
    };
  }, [socket, userId]);

  // Handle sending messages
  const sendMessage = async () => {
    if (!newMessage.trim() || !socket || !isConnected) return;

    const messageData: Message = {
      id: Date.now().toString(),
      message: newMessage,
      sender: "user",
      timestamp: new Date().toISOString(),
      conversationId,
    };

    // Add user message to local state
    setMessages((prev) => [...prev, messageData]);

    // Emit message to server
    socket.emit("send-message", {
      message: newMessage,
      userId,
      conversationId,
      timestamp: messageData.timestamp,
    });

    // Clear input and show loading
    setNewMessage("");
    setIsLoading(true);
    setIsAiTyping(true);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Handle typing indicators
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);

    if (socket && isConnected) {
      if (!isTyping) {
        setIsTyping(true);
        socket.emit("typing", { userId, conversationId });
      }

      // Stop typing after 1 second of no input
      setTimeout(() => {
        setIsTyping(false);
        socket.emit("stop-typing", { userId, conversationId });
      }, 1000);
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 bg-red-50 border border-red-200 rounded-lg">
        <div className="text-center">
          <div className="text-red-600 text-lg font-semibold mb-2">
            Connection Error
          </div>
          <div className="text-red-500">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[600px] bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-2">
          <Bot className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">AI Assistant</h3>
        </div>
        <div className="flex items-center space-x-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected ? "bg-green-500" : "bg-red-500"
            }`}
          />
          <span className="text-sm text-gray-600">
            {isConnected ? "Connected" : "Disconnected"}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <Bot className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>Start a conversation with your AI assistant</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.sender === "user"
                    ? "bg-blue-600 text-white"
                    : message.error
                    ? "bg-red-100 text-red-800 border border-red-200"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                <div className="flex items-center space-x-1 mb-1">
                  {message.sender === "user" ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                  <span className="text-xs opacity-75">
                    {message.sender === "user" ? "You" : "AI"}
                  </span>
                </div>
                <p className="text-sm">{message.message}</p>
                <div className="text-xs opacity-75 mt-1">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))
        )}

        {/* AI Typing Indicator */}
        {isAiTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-1">
                <Bot className="h-4 w-4" />
                <span className="text-xs">AI is typing</span>
                <Loader className="h-3 w-3 animate-spin" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={isConnected ? "Type a message..." : "Connecting..."}
            disabled={!isConnected || isLoading}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400"
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || !isConnected || isLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatComponent;
