import { NextRequest, NextResponse } from "next/server";
import { Server } from "socket.io";
import { createServer } from "http";
import {
  OpenAIService,
  getFallbackResponse,
} from "../../components/chat/openaiService";

// Store the IO instance globally
let io: Server;

// Initialize Socket.IO server
function initSocket() {
  if (!io) {
    const httpServer = createServer();
    io = new Server(httpServer, {
      cors: {
        origin:
          process.env.NODE_ENV === "production"
            ? process.env.NEXT_PUBLIC_FRONTEND_URL
            : "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
      },
      path: "/api/socket/io",
    });

    // Socket connection handling
    io.on("connection", (socket) => {
      console.log("User connected:", socket.id);

      // Join user to a room (for private conversations)
      socket.on("join-room", (userId: string) => {
        socket.join(userId);
        console.log(`User ${socket.id} joined room ${userId}`);
      });

      // Handle chat messages
      socket.on("send-message", async (data) => {
        const { message, userId, conversationId, timestamp } = data;

        // Broadcast message to room
        socket.to(userId).emit("receive-message", {
          message,
          userId,
          conversationId,
          timestamp,
          sender: "user",
        });

        // Process with AI/LLM
        try {
          // Use OpenAI service for actual AI responses
          const aiResponse = await OpenAIService.generateResponse(
            message,
            conversationId || `conversation-${userId}-${Date.now()}`,
            userId
          );

          // Send AI response back
          setTimeout(() => {
            io.to(userId).emit("receive-message", {
              message: aiResponse,
              userId,
              conversationId,
              timestamp: new Date().toISOString(),
              sender: "ai",
            });
          }, 1000); // Simulate processing time
        } catch (error) {
          console.error("AI processing error:", error);

          // Use fallback response if OpenAI fails
          const fallbackMessage = getFallbackResponse();

          io.to(userId).emit("receive-message", {
            message: fallbackMessage,
            userId,
            conversationId,
            timestamp: new Date().toISOString(),
            sender: "ai",
            error: false, // Don't show as error since we have a fallback
          });
        }
      });

      // Handle typing indicators
      socket.on("typing", (data) => {
        socket.to(data.userId).emit("user-typing", data);
      });

      socket.on("stop-typing", (data) => {
        socket.to(data.userId).emit("user-stopped-typing", data);
      });

      socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
      });
    });

    // Start the server on a different port for Socket.IO
    const port = process.env.SOCKET_PORT || 3001;
    httpServer.listen(port, () => {
      console.log(`Socket.IO server running on port ${port}`);
    });
  }
  return io;
}

export async function GET() {
  try {
    initSocket();
    return NextResponse.json({ message: "Socket.IO server initialized" });
  } catch (error) {
    console.error("Socket initialization error:", error);
    return NextResponse.json(
      { error: "Failed to initialize socket" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    initSocket();

    // Handle any POST requests to socket endpoint
    return NextResponse.json({ message: "Socket endpoint ready", data: body });
  } catch (error) {
    console.error("Socket POST error:", error);
    return NextResponse.json({ error: "Socket POST failed" }, { status: 500 });
  }
}
