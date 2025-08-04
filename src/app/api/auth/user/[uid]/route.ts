import { NextRequest, NextResponse } from "next/server";
import { MongoConnect } from "@/DB/MongoConnect";
import { UserModel } from "@/DB/MongoSchema";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
): Promise<NextResponse> {
  try {
    await MongoConnect();

    const { uid } = await params;

    if (!uid) {
      return NextResponse.json(
        { error: "Firebase UID is required" },
        { status: 400 }
      );
    }

    // Find user by Firebase UID
    const user = await UserModel.findOne({ firebaseUid: uid }).lean<{
      _id: string;
      firebaseUid: string;
      name: string;
      email: string;
      profileImage?: string;
      profileImagePublicId?: string;
    }>();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Return user data without sensitive information
    const userData = {
      _id: user._id.toString(),
      firebaseUid: user.firebaseUid,
      name: user.name,
      email: user.email,
      profileImage: user.profileImage || null,
    };

    return NextResponse.json({
      success: true,
      user: userData,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : error,
      },
      { status: 500 }
    );
  }
}
