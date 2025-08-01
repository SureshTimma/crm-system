"use client";

import React from "react";
import HttpChatComponent from "../../components/chat/HttpChatComponent";
import { useUser } from "@/contexts/UserContext";

const ChatPage = () => {
  const { user, loading } = useUser();

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            AI Chat Assistant
          </h1>
          <p className="text-gray-600 mt-2">
            Chat with your AI assistant for CRM guidance, customer management
            tips, and business insights
          </p>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            AI Chat Assistant
          </h1>
          <p className="text-red-600 mt-2">
            Unable to load user information. Please try refreshing the page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">AI Chat Assistant</h1>
        <p className="text-gray-600 mt-2">
          Chat with your AI assistant for CRM guidance, customer management
          tips, and business insights
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        <HttpChatComponent
          userId={user.uid}
          conversationId={`conversation-${user.uid}`}
        />
      </div>
    </div>
  );
};

export default ChatPage;
