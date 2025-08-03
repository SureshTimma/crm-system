import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ConversationHistory {
  conversationId: string;
  messages: ChatMessage[];
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

// System prompt for the CRM assistant
const SYSTEM_PROMPT = `You are a helpful AI assistant integrated into a CRM (Customer Relationship Management) system. 

Your role is to help users with:
- Customer management and insights
- Sales pipeline assistance
- Contact organization and tracking
- Activity logging and follow-ups
- Data analysis and reporting
- General CRM best practices

Please provide helpful, professional, and concise responses. When discussing CRM-specific topics, offer practical advice and actionable insights. If asked about features not related to CRM, politely redirect the conversation back to CRM-related topics while still being helpful.

Keep your responses conversational but professional, and always aim to help users be more productive with their customer relationships.`;

// Store conversations in memory (in production, use a database)
const conversationStore = new Map<string, ChatMessage[]>();

export class OpenAIService {
  static async generateResponse(
    userMessage: string,
    conversationId: string,
    userId: string
  ): Promise<string> {
    try {
      // Get or create conversation history
      let conversation = conversationStore.get(conversationId) || [];

      // Add system prompt if this is a new conversation
      if (conversation.length === 0) {
        conversation.push({
          role: "system",
          content: SYSTEM_PROMPT,
        });
        console.log(`Started new conversation for user ${userId}`);
      }

      // Add user message to conversation
      conversation.push({
        role: "user",
        content: userMessage,
      });

      // Generate response using OpenAI
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini", // GPT-4.1 Mini
        messages: conversation,
        max_tokens: 500,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      });

      const assistantMessage =
        completion.choices[0]?.message?.content ||
        "I apologize, but I encountered an issue generating a response. Please try again.";

      // Add assistant response to conversation
      conversation.push({
        role: "assistant",
        content: assistantMessage,
      });

      // Keep only the last 20 messages to manage token usage
      if (conversation.length > 21) {
        // 20 + system prompt
        conversation = [
          conversation[0], // Keep system prompt
          ...conversation.slice(-20), // Keep last 20 messages
        ];
      }

      // Store updated conversation
      conversationStore.set(conversationId, conversation);

      return assistantMessage;
    } catch (error) {
      console.error("OpenAI API Error:", error);

      if (error instanceof Error) {
        if (error.message.includes("API key")) {
          return "I need an OpenAI API key to be configured. Please ask your administrator to set up the OPENAI_API_KEY environment variable.";
        }
        if (error.message.includes("quota")) {
          return "The AI service has reached its usage limit. Please contact your administrator or try again later.";
        }
        if (error.message.includes("rate limit")) {
          return "I'm receiving too many requests right now. Please wait a moment and try again.";
        }
      }

      return "I encountered an unexpected error. Please try again in a moment, and if the problem persists, contact your administrator.";
    }
  }

  static getConversationHistory(conversationId: string): ChatMessage[] {
    return conversationStore.get(conversationId) || [];
  }

  static clearConversation(conversationId: string): void {
    conversationStore.delete(conversationId);
  }

  static getAllConversations(): string[] {
    return Array.from(conversationStore.keys());
  }
}

// Fallback responses when OpenAI is not available
export const fallbackResponses = [
  "I'm here to help you with your CRM needs! What would you like to know about managing customers, contacts, or sales activities?",
  "That's an interesting question about your CRM workflow. Let me help you think through that...",
  "For CRM best practices, I'd recommend focusing on consistent data entry and regular follow-ups with your contacts.",
  "Customer relationship management is all about staying organized and maintaining good communication. How can I assist you with that?",
  "I can help you with contact management, activity tracking, and sales pipeline optimization. What specific area would you like to explore?",
  "CRM success comes from understanding your customers' needs and maintaining regular engagement. What challenges are you facing?",
  "Data quality is crucial in CRM systems. Are you looking for help with data organization or analysis?",
  "Effective follow-up strategies can significantly improve your sales outcomes. Would you like some suggestions?",
];

export function getFallbackResponse(): string {
  return fallbackResponses[
    Math.floor(Math.random() * fallbackResponses.length)
  ];
}
