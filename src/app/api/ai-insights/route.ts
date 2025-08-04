import { NextRequest, NextResponse } from "next/server";
import { EnhancedAIService } from "@/lib/aiService";
import { requireAuth } from "@/lib/auth";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { type, contactName } = body;

    let response: string;

    switch (type) {
      case 'insights':
        response = await EnhancedAIService.generateCRMInsights(user._id);
        break;
        
      case 'actions':
        response = await EnhancedAIService.suggestNextActions(user._id);
        break;
        
      case 'engagement':
        response = await EnhancedAIService.analyzeContactEngagement(user._id, contactName);
        break;
        
      default:
        return NextResponse.json(
          { error: "Invalid insight type. Use 'insights', 'actions', or 'engagement'" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      insight: response,
      type,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("AI Insights API error:", error);
    return NextResponse.json(
      { error: "Failed to generate insights" },
      { status: 500 }
    );
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    message: "AI Insights API is running",
    endpoints: {
      POST: "/api/ai-insights - Generate CRM insights",
    },
    supportedTypes: [
      "insights - General CRM data insights",
      "actions - Suggested next actions", 
      "engagement - Contact engagement analysis"
    ]
  });
}
