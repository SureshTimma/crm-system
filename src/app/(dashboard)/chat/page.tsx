"use client";

import React, { useState, useEffect } from "react";
import HttpChatComponent from "../../components/chat/HttpChatComponent";
import { useUser } from "@/contexts/UserContext";
import { Plus, MessageSquare, Trash2 } from "lucide-react";
import axios from "axios";

interface Conversation {
  _id: string;
  title: string;
  createdAt: string;
  lastUpdated: string;
}

interface ApiResponse {
  success: boolean;
  conversations?: Conversation[];
  conversation?: Conversation;
}

const ChatPage = () => {
  const { user, loading } = useUser();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);
  const [loadingConversations, setLoadingConversations] = useState(true);

  // Fetch conversations when component mounts
  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  const fetchConversations = async () => {
    try {
      setLoadingConversations(true);
      const response = await axios.get("/api/conversations");
      const data = response.data as ApiResponse;
      if (data.success && data.conversations) {
        setConversations(data.conversations);
        // Set the first conversation as current if none selected
        if (data.conversations.length > 0 && !currentConversationId) {
          setCurrentConversationId(data.conversations[0]._id);
        }
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoadingConversations(false);
    }
  };

  const createNewConversation = async () => {
    try {
      const response = await axios.post("/api/conversations", {
        title: "New Conversation",
      });
      const data = response.data as ApiResponse;
      if (data.success && data.conversation) {
        const newConversation = data.conversation;
        setConversations((prev) => [newConversation, ...prev]);
        setCurrentConversationId(newConversation._id);
      }
    } catch (error) {
      console.error("Error creating conversation:", error);
    }
  };

  const deleteConversation = async (conversationId: string) => {
    if (!confirm("Are you sure you want to delete this conversation?")) {
      return;
    }

    try {
      const response = await axios.delete(
        `/api/conversations?conversationId=${conversationId}`
      );
      const data = response.data as ApiResponse;
      if (data.success) {
        setConversations((prev) =>
          prev.filter((c) => c._id !== conversationId)
        );
        // If deleted conversation was current, select another one
        if (currentConversationId === conversationId) {
          const remaining = conversations.filter(
            (c) => c._id !== conversationId
          );
          setCurrentConversationId(
            remaining.length > 0 ? remaining[0]._id : null
          );
        }
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffInDays === 0) {
      return "Today";
    } else if (diffInDays === 1) {
      return "Yesterday";
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <div className="flex h-full">
        <div className="flex justify-center items-center w-full">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-full">
        <div className="flex justify-center items-center w-full">
          <p className="text-red-600">
            Unable to load user information. Please try refreshing the page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-gray-50">
      {/* Conversations Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Conversations
            </h2>
            <button
              onClick={createNewConversation}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="New Conversation"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {loadingConversations ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <MessageSquare size={48} className="mx-auto mb-2 text-gray-300" />
              <p>No conversations yet</p>
              <p className="text-sm">Start a new conversation to begin</p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {conversations.map((conversation) => (
                <div
                  key={conversation._id}
                  onClick={() => setCurrentConversationId(conversation._id)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors relative group ${
                    currentConversationId === conversation._id
                      ? "bg-blue-50 border-l-4 border-blue-500"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {conversation.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(conversation.lastUpdated)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(conversation._id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-50 rounded transition-all"
                      title="Delete Conversation"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {currentConversationId ? (
          <div className="flex-1">
            <HttpChatComponent
              userId={user.uid}
              conversationId={currentConversationId}
            />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageSquare size={64} className="mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                AI Chat Assistant
              </h3>
              <p className="text-gray-600 mb-4">
                Select a conversation or create a new one to start chatting
              </p>
              <button
                onClick={createNewConversation}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={20} className="mr-2" />
                Start New Conversation
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
