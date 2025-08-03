import { NextRequest, NextResponse } from "next/server";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { MongoConnect } from "@/DB/MongoConnect";
import { UserModel } from "@/DB/MongoSchema";

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

export async function POST(request: NextRequest): Promise<NextResponse> {
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

    // Connect to MongoDB and check/create user
    await MongoConnect();

    // Check if user exists in MongoDB
    let user = await UserModel.findOne({
      firebaseUid: decodedToken.uid,
    }).lean<{
      _id: string;
      firebaseUid: string;
      name: string;
      email: string;
    }>();

    if (!user) {
      // User doesn't exist in MongoDB, create them
      console.log("User not found in MongoDB, creating new user...");
      try {
        const newUser = await UserModel.create({
          firebaseUid: decodedToken.uid,
          name:
            decodedToken.name || decodedToken.email?.split("@")[0] || "User",
          email: decodedToken.email,
          password: "firebase-auth", // Default since using Firebase auth
        });
        console.log("User created in MongoDB:", newUser._id.toString());
        user = {
          _id: newUser._id.toString(),
          firebaseUid: newUser.firebaseUid,
          name: newUser.name,
          email: newUser.email,
        };
      } catch (createError) {
        console.error("Error creating user in MongoDB:", createError);
        // Continue with login even if user creation fails
      }
    } else {
      console.log("User found in MongoDB:", user._id?.toString());
    }

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
        name: decodedToken.name || decodedToken.email?.split("@")[0] || "User",
      },
    });

    response.cookies.set("session", sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Only HTTPS in production
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 5, // 5 days
      path: "/",
    });

    // Set user ID cookie for API authentication
    response.cookies.set("userId", decodedToken.uid, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
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
