"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Send, Bot, User, Loader } from "lucide-react";
import axios from "axios";

interface ApiResponse {
  message: string;
  timestamp: string;
  conversationId: string;
  sender: string;
}

interface Message {
  id: string;
  message: string;
  sender: "user" | "ai";
  timestamp: string;
  conversationId?: string;
  error?: boolean;
}

interface HttpChatComponentProps {
  userId?: string;
  conversationId?: string;
}

const HttpChatComponent: React.FC<HttpChatComponentProps> = ({
  userId = "default-user",
  conversationId = "default-conversation",
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Load conversation messages when conversationId changes
  useEffect(() => {
    if (conversationId && conversationId !== "default-conversation") {
      loadConversationMessages();
    } else {
      // Load welcome message for new conversations
      const welcomeMessage: Message = {
        id: "welcome",
        message:
          "Hello! I'm your CRM AI assistant. I'm here to help you with customer management, sales processes, contact organization, and general CRM best practices. How can I assist you today?",
        sender: "ai",
        timestamp: new Date().toISOString(),
        conversationId,
      };
      setMessages([welcomeMessage]);
    }
  }, [conversationId]);

  const loadConversationMessages = useCallback(async () => {
    try {
      const response = await axios.get(`/api/conversations/${conversationId}`);
      const data = response.data as {
        success: boolean;
        messages: Array<{
          _id: string;
          message: string;
          sender: "user" | "ai";
          timestamp: string;
          conversationId: string;
        }>;
      };

      if (data.success && data.messages) {
        const formattedMessages: Message[] = data.messages.map((msg) => ({
          id: msg._id,
          message: msg.message,
          sender: msg.sender,
          timestamp: msg.timestamp,
          conversationId: msg.conversationId,
        }));
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error("Error loading conversation messages:", error);
      // If error loading, show welcome message
      const welcomeMessage: Message = {
        id: "welcome",
        message:
          "Hello! I'm your CRM AI assistant. I'm here to help you with customer management, sales processes, contact organization, and general CRM best practices. How can I assist you today?",
        sender: "ai",
        timestamp: new Date().toISOString(),
        conversationId,
      };
      setMessages([welcomeMessage]);
    }
  }, [conversationId]);

  // Handle sending messages
  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      message: newMessage,
      sender: "user",
      timestamp: new Date().toISOString(),
      conversationId,
    };

    // Add user message to local state
    setMessages((prev) => [...prev, userMessage]);
    const currentMessage = newMessage;
    setNewMessage("");
    setIsLoading(true);

    try {
      // Send message to API
      const response = await axios.post<ApiResponse>("/api/chat", {
        message: currentMessage,
        userId,
        conversationId,
      });

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        message: response.data.message,
        sender: "ai",
        timestamp: response.data.timestamp,
        conversationId: response.data.conversationId,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error sending message:", error);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        message:
          "Sorry, I encountered an error processing your message. Please try again.",
        sender: "ai",
        timestamp: new Date().toISOString(),
        conversationId,
        error: true,
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Clear conversation
  const clearConversation = () => {
    const welcomeMessage: Message = {
      id: "welcome-new",
      message: "Conversation cleared! How can I help you with your CRM needs?",
      sender: "ai",
      timestamp: new Date().toISOString(),
      conversationId,
    };
    setMessages([welcomeMessage]);
  };

  return (
    <div className="flex flex-col h-[600px] bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-2">
          <Bot className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            CRM AI Assistant
          </h3>
        </div>
        <button
          onClick={clearConversation}
          className="text-sm text-gray-600 hover:text-gray-800 px-3 py-1 rounded border border-gray-300 hover:bg-gray-100 transition-colors"
        >
          Clear Chat
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
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
                  {message.sender === "user" ? "You" : "AI Assistant"}
                </span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{message.message}</p>
              <div className="text-xs opacity-75 mt-1">
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <Bot className="h-4 w-4" />
                <span className="text-xs">AI is thinking</span>
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
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              isLoading
                ? "AI is responding..."
                : "Ask me about CRM, contacts, sales, or any business questions..."
            }
            disabled={isLoading}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400"
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || isLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Press Enter to send • Shift+Enter for new line
        </div>
      </div>
    </div>
  );
};

export default HttpChatComponent;
