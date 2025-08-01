import { NextResponse } from "next/server";

export async function POST() {
  try {
    // Clear the session cookie
    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });

    response.cookies.set("session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      expires: new Date(0), // Expire immediately
      path: "/",
    });

    // Also clear the userId cookie
    response.cookies.set("userId", "", {
      expires: new Date(0),
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Logout API error:", error);
    return NextResponse.json(
      {
        error: "Logout failed",
        details: error instanceof Error ? error.message : error,
      },
      { status: 500 }
    );
  }
}
