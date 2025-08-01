"use client";

import React from "react";
import HttpChatComponent from "../../components/chat/HttpChatComponent";

const ChatPage = () => {
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
          userId="user-123" // In a real app, get this from authentication
          conversationId="main-conversation"
        />
      </div>
    </div>
  );
};

export default ChatPage;
