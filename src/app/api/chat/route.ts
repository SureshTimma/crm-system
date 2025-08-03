import { NextRequest, NextResponse } from "next/server";
import {
  OpenAIService,
  getFallbackResponse,
} from "../../components/chat/openaiService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, conversationId, userId } = body;

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Generate AI response
    let aiResponse: string;

    try {
      aiResponse = await OpenAIService.generateResponse(
        message,
        conversationId || `conversation-${userId || "anonymous"}-${Date.now()}`,
        userId || "anonymous"
      );
    } catch (error) {
      console.error("OpenAI service error:", error);
      // Use fallback response if OpenAI fails
      aiResponse = getFallbackResponse();
    }

    return NextResponse.json({
      message: aiResponse,
      timestamp: new Date().toISOString(),
      conversationId:
        conversationId || `conversation-${userId || "anonymous"}-${Date.now()}`,
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

export async function GET() {
  return NextResponse.json({
    message: "Chat API is running",
    endpoints: {
      POST: "/api/chat - Send a message and get AI response",
    },
  });
}
