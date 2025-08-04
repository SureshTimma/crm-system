import { NextRequest, NextResponse } from "next/server";
import { EnhancedAIService } from "@/lib/aiService";
import { MongoConnect } from "@/DB/MongoConnect";
import { ChatModel, ConversationModel } from "@/DB/MongoSchema";
import { requireAuth } from "@/lib/auth";
import mongoose from "mongoose";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await requireAuth();
    const userObjectId = new mongoose.Types.ObjectId(user._id);

    await MongoConnect();

    const body = await request.json();
    const { message, conversationId } = body;

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    let currentConversationId = conversationId;

    // If no conversationId provided, create a new conversation
    if (!currentConversationId) {
      const newConversation = await ConversationModel.create({
        user: userObjectId,
        title: message.substring(0, 50) + (message.length > 50 ? "..." : ""),
        createdAt: new Date(),
        lastUpdated: new Date(),
      });
      currentConversationId = newConversation._id.toString();
    } else {
      // Update the lastUpdated timestamp of existing conversation
      await ConversationModel.findByIdAndUpdate(
        new mongoose.Types.ObjectId(currentConversationId),
        { lastUpdated: new Date() }
      );
    }

    const conversationObjectId = new mongoose.Types.ObjectId(
      currentConversationId
    );

    // Save user message to database
    await ChatModel.create({
      user: userObjectId,
      message: message.trim(),
      sender: "user",
      timestamp: new Date(),
      conversationId: conversationObjectId,
    });

    // Generate AI response with CRM context
    let aiResponse: string;

    try {
      aiResponse = await EnhancedAIService.processWithCRMContext(
        message,
        user._id,
        currentConversationId
      );
    } catch (error) {
      console.error("Enhanced AI service error:", error);
      // Use fallback response if AI fails
      aiResponse = "I'm sorry, I'm having trouble processing your request right now. Please try again in a moment.";
    }

    // Save AI response to database
    await ChatModel.create({
      user: userObjectId,
      message: aiResponse,
      sender: "ai",
      timestamp: new Date(),
      conversationId: conversationObjectId,
    });

    return NextResponse.json({
      message: aiResponse,
      timestamp: new Date().toISOString(),
      conversationId: currentConversationId,
      sender: "ai",
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    message: "Chat API is running",
    endpoints: {
      POST: "/api/chat - Send a message and get AI response",
    },
  });
}
