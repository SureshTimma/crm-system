import { NextRequest, NextResponse } from "next/server";
import { MongoConnect } from "@/DB/MongoConnect";
import { UserModel } from "@/DB/MongoSchema";
import { requireAuth } from "@/lib/auth";
import { uploadImageToCloudinary, deleteImageFromCloudinary } from "@/lib/cloudinary";
import mongoose from "mongoose";

// PUT - Update user profile
export async function PUT(req: NextRequest): Promise<NextResponse> {
  try {
    const user = await requireAuth();
    const userObjectId = new mongoose.Types.ObjectId(user._id);

    await MongoConnect();

    const body = await req.json();
    const { name, email, profileImage } = body;

    // Validate input
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: "Name is required" },
        { status: 400 }
      );
    }

    if (email && !email.includes("@")) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid email address" },
        { status: 400 }
      );
    }

    // Get current user data to handle image deletion
    const currentUser = await UserModel.findById(userObjectId).lean<{
      profileImage?: string;
      profileImagePublicId?: string;
    }>();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const updateData: {
      name: string;
      email?: string;
      updatedAt: Date;
      profileImage?: string;
      profileImagePublicId?: string;
    } = {
      name: name.trim(),
      updatedAt: new Date(),
      ...(email && { email: email.trim() }),
    };

    // Handle image upload to Cloudinary if provided
    if (profileImage) {
      try {
        // Delete old image from Cloudinary if exists
        if (currentUser.profileImagePublicId) {
          await deleteImageFromCloudinary(currentUser.profileImagePublicId);
        }

        // Upload new image to Cloudinary
        const cloudinaryResult = await uploadImageToCloudinary(profileImage, 'crm-profiles');
        
        updateData.profileImage = cloudinaryResult.secure_url;
        updateData.profileImagePublicId = cloudinaryResult.public_id;
      } catch (uploadError) {
        console.error("Error uploading image to Cloudinary:", uploadError);
        return NextResponse.json(
          { success: false, message: "Failed to upload image" },
          { status: 500 }
        );
      }
    }

    // Update user profile
    const updatedUser = await UserModel.findByIdAndUpdate(
      userObjectId,
      updateData,
      { new: true, runValidators: true }
    ).lean<{
      _id: string;
      firebaseUid: string;
      name: string;
      email: string;
      profileImage?: string;
      profileImagePublicId?: string;
    }>();

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Return updated user data (excluding sensitive information)
    const userData = {
      _id: updatedUser._id.toString(),
      firebaseUid: updatedUser.firebaseUid,
      name: updatedUser.name,
      email: updatedUser.email,
      profileImage: updatedUser.profileImage || null,
    };

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: userData,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update profile",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET - Get user profile
export async function GET(): Promise<NextResponse> {
  try {
    const user = await requireAuth();
    const userObjectId = new mongoose.Types.ObjectId(user._id);

    await MongoConnect();

    const userData = await UserModel.findById(userObjectId)
      .select("-password")
      .lean<{
        _id: string;
        firebaseUid: string;
        name: string;
        email: string;
        profileImage?: string;
        profileImagePublicId?: string;
        createdAt: Date;
        updatedAt: Date;
      }>();

    if (!userData) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        _id: userData._id.toString(),
        firebaseUid: userData.firebaseUid,
        name: userData.name,
        email: userData.email,
        profileImage: userData.profileImage || null,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch profile",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
