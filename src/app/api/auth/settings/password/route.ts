import { NextRequest, NextResponse } from "next/server";
import { MongoConnect } from "@/DB/MongoConnect";
import { UserModel } from "@/DB/MongoSchema";
import { requireAuth } from "@/lib/auth";
import mongoose from "mongoose";

// PUT - Update user password
export async function PUT(req: NextRequest): Promise<NextResponse> {
  try {
    const user = await requireAuth();
    const userObjectId = new mongoose.Types.ObjectId(user._id);

    await MongoConnect();

    const body = await req.json();
    const { currentPassword, newPassword } = body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, message: "Current password and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, message: "New password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { success: false, message: "New password must be different from current password" },
        { status: 400 }
      );
    }

    // Get current user data with password
    const currentUser = await UserModel.findById(userObjectId).lean<{
      _id: string;
      password: string;
    }>();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Verify current password (simple comparison for now)
    if (currentUser.password !== currentPassword) {
      return NextResponse.json(
        { success: false, message: "Current password is incorrect" },
        { status: 400 }
      );
    }

    // Update user password (store as plain text for now)
    const updatedUser = await UserModel.findByIdAndUpdate(
      userObjectId,
      {
        password: newPassword,
        updatedAt: new Date(),
      },
      { new: true, runValidators: true }
    ).lean<{
      _id: string;
      name: string;
      email: string;
    }>();

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, message: "Failed to update password" },
        { status: 500 }
      );
    }

    // Return success response (without password data)
    return NextResponse.json({
      success: true,
      message: "Password updated successfully",
      user: {
        _id: updatedUser._id.toString(),
        name: updatedUser.name,
        email: updatedUser.email,
      },
    });
  } catch (error) {
    console.error("Password update error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update password",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
