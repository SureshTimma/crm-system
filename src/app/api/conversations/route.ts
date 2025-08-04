import { NextRequest, NextResponse } from "next/server";
import { MongoConnect } from "@/DB/MongoConnect";
import { ConversationModel, ChatModel } from "@/DB/MongoSchema";
import { requireAuth } from "@/lib/auth";
import mongoose from "mongoose";

// GET - Fetch all conversations for the user
export async function GET(): Promise<NextResponse> {
  try {
    const user = await requireAuth();
    const userObjectId = new mongoose.Types.ObjectId(user._id);

    await MongoConnect();

    const conversations = await ConversationModel.find({
      user: userObjectId,
    })
      .sort({ lastUpdated: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      conversations: conversations,
    });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch conversations",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// POST - Create a new conversation
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const user = await requireAuth();
    const userObjectId = new mongoose.Types.ObjectId(user._id);

    await MongoConnect();

    const body = await req.json();
    const { title } = body;

    const newConversation = await ConversationModel.create({
      user: userObjectId,
      title: title || "New Conversation",
      createdAt: new Date(),
      lastUpdated: new Date(),
    });

    return NextResponse.json({
      success: true,
      conversation: newConversation,
    });
  } catch (error) {
    console.error("Error creating conversation:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create conversation",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete a conversation and all its messages
export async function DELETE(req: NextRequest): Promise<NextResponse> {
  try {
    const user = await requireAuth();
    const userObjectId = new mongoose.Types.ObjectId(user._id);

    await MongoConnect();

    const url = new URL(req.url);
    const conversationId = url.searchParams.get("conversationId");

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

    // Delete all messages in this conversation
    await ChatModel.deleteMany({
      conversationId: conversationObjectId,
      user: userObjectId,
    });

    // Delete the conversation
    await ConversationModel.deleteOne({
      _id: conversationObjectId,
      user: userObjectId,
    });

    return NextResponse.json({
      success: true,
      message: "Conversation deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting conversation:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete conversation",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
