import { MongoConnect } from "@/DB/MongoConnect";
import { TagsModel } from "@/DB/MongoSchema";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import mongoose from "mongoose";

export const POST = async (req: Request) => {
  try {
    await MongoConnect();
    const user = await requireAuth();
    const userObjectId = new mongoose.Types.ObjectId(user._id);

    const body = await req.json();

    const response = await TagsModel.create({
      tagName: body.tagName,
      color: body.color,
      usageCount: body.usageCount || 0,
      createdBy: userObjectId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "Tag created successfully",
      tag: response,
    });
  } catch (error) {
    console.error("Error creating tag:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create tag",
        error: error,
      },
      { status: 500 }
    );
  }
};

export const GET = async () => {
  try {
    await MongoConnect();
    const user = await requireAuth();
    const userObjectId = new mongoose.Types.ObjectId(user._id);

    // First try with population, fallback to basic query if it fails
    let tags;
    try {
      tags = await TagsModel.find({ createdBy: userObjectId })
        .populate({
          path: "createdBy",
          select: "name email",
          options: { strictPopulate: false },
        })
        .sort({ createdAt: -1 });
    } catch (populateError) {
      console.warn(
        "Population failed, falling back to basic query:",
        populateError
      );
      tags = await TagsModel.find({ createdBy: userObjectId }).sort({
        createdAt: -1,
      });
    }

    return NextResponse.json({
      success: true,
      tags: tags,
    });
  } catch (error) {
    console.error("Error fetching tags:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch tags",
        error: error,
      },
      { status: 500 }
    );
  }
};

export const PUT = async (req: Request) => {
  try {
    await MongoConnect();
    const user = await requireAuth();
    const userObjectId = new mongoose.Types.ObjectId(user._id);

    const body = await req.json();
    const url = new URL(req.url);
    const tagId = url.searchParams.get("tagId");

    const updatedTag = await TagsModel.findOneAndUpdate(
      { _id: tagId, createdBy: userObjectId },
      {
        ...body,
        updatedAt: new Date(),
      },
      { new: true } // Return the updated document
    );

    if (!updatedTag) {
      return NextResponse.json(
        {
          success: false,
          message: "Tag not found or access denied",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Tag updated successfully",
      tag: updatedTag,
    });
  } catch (error) {
    console.error("Error updating tag:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update tag",
        error: error,
      },
      { status: 500 }
    );
  }
};

export const DELETE = async (req: Request) => {
  try {
    await MongoConnect();
    const user = await requireAuth();
    const userObjectId = new mongoose.Types.ObjectId(user._id);

    const url = new URL(req.url);
    const tagId = url.searchParams.get("id");

    const deletedTag = await TagsModel.findOneAndDelete({
      _id: tagId,
      createdBy: userObjectId,
    });

    if (!deletedTag) {
      return NextResponse.json(
        {
          success: false,
          message: "Tag not found or access denied",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Tag deleted successfully",
      tag: deletedTag,
    });
  } catch (error) {
    console.error("Error deleting tag:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete tag",
        error: error,
      },
      { status: 500 }
    );
  }
};
