import { NextRequest, NextResponse } from "next/server";
import { MongoConnect } from "@/DB/MongoConnect";
import { ChatModel, ConversationModel } from "@/DB/MongoSchema";
import { requireAuth } from "@/lib/auth";
import mongoose from "mongoose";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
): Promise<NextResponse> {
  try {
    const user = await requireAuth();
    const userObjectId = new mongoose.Types.ObjectId(user._id);

    await MongoConnect();

    const { conversationId } = await params;

    if (!conversationId) {
      return NextResponse.json(
        { success: false, error: "Conversation ID is required" },
        { status: 400 }
      );
    }

    const conversationObjectId = new mongoose.Types.ObjectId(conversationId);

    // Verify the conversation belongs to the user
    const conversation = await ConversationModel.findOne({
      _id: conversationObjectId,
      user: userObjectId,
    });

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Fetch all messages for this conversation
    const messages = await ChatModel.find({
      conversationId: conversationObjectId,
      user: userObjectId,
    })
      .sort({ timestamp: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      conversation: conversation,
      messages: messages,
    });
  } catch (error) {
    console.error("Error fetching conversation messages:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch conversation messages",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
