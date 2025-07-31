import { NextRequest, NextResponse } from "next/server";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

// Initialize Firebase Admin (same as middleware)
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: "prodgain-crm-system",
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

// console.log(process.env.FIREBASE_CLIENT_EMAIL, process.env.FIREBASE_PRIVATE_KEY);

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json(
        { error: "ID token is required" },
        { status: 400 }
      );
    }

    console.log("Verifying ID token...");

    // Verify the token with Firebase Admin
    const decodedToken = await getAuth().verifyIdToken(idToken);
    console.log("Token verified for user:", decodedToken.uid);

    // Create a session cookie (5 days expiry)
    const sessionCookie = await getAuth().createSessionCookie(idToken, {
      expiresIn: 60 * 60 * 24 * 5 * 1000, // 5 days
    });

    console.log("Session cookie created successfully");

    // Set secure HTTP-only cookie
    const response = NextResponse.json({
      success: true,
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
      },
    });

    response.cookies.set("session", sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Only HTTPS in production
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 5, // 5 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json(
      {
        error: "Authentication failed",
        details: error instanceof Error ? error.message : error,
      },
      { status: 401 }
    );
  }
}
