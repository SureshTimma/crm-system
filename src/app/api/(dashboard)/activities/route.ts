import { MongoConnect } from "@/DB/MongoConnect";
import { ActivityModel } from "@/DB/MongoSchema";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import mongoose from "mongoose";

// Type definitions
interface ActivityFilter {
  user: mongoose.Types.ObjectId;
  timestamp?: { $gte: Date };
}

await MongoConnect();

export const GET = async (req: Request) => {
  try {
    const user = await requireAuth();
    const userObjectId = new mongoose.Types.ObjectId(user._id);

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "0");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const dateRange = url.searchParams.get("dateRange") || "30d";

    console.log("Activities GET params:", { page, limit, dateRange });

    // Build filter for user-specific activities
    const filter: ActivityFilter = {
      user: userObjectId,
    };

    // Add date range filter
    if (dateRange !== "all") {
      const daysBack = parseInt(dateRange.replace("d", ""));
      const dateLimit = new Date();
      dateLimit.setDate(dateLimit.getDate() - daysBack);
      filter.timestamp = { $gte: dateLimit };
    }

    const skip = page * limit;

    // Get activities with user filtering
    const activities = await ActivityModel.find(filter)
      .populate({
        path: "user",
        select: "name email",
        options: { strictPopulate: false },
      })
      .populate({
        path: "contact",
        select: "name email company",
        options: { strictPopulate: false },
      })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const totalCount = await ActivityModel.countDocuments(filter);

    return NextResponse.json({
      success: true,
      activities,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasMore: skip + activities.length < totalCount,
      },
    });
  } catch (error) {
    console.error("Error fetching activities:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch activities",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};

export const POST = async (req: Request) => {
  try {
    const user = await requireAuth();
    const userObjectId = new mongoose.Types.ObjectId(user._id);

    const body = await req.json();
    console.log("Creating activity with body:", body);

    // Create activity with authenticated user
    const newActivity = await ActivityModel.create({
      ...body,
      user: userObjectId,
      timestamp: new Date(),
    });

    // Populate the activity before returning
    const populatedActivity = await ActivityModel.findById(newActivity._id)
      .populate({
        path: "user",
        select: "name email",
        options: { strictPopulate: false },
      })
      .populate({
        path: "contact",
        select: "name email company",
        options: { strictPopulate: false },
      })
      .lean();

    return NextResponse.json({
      success: true,
      message: "Activity created successfully",
      activity: populatedActivity,
    });
  } catch (error) {
    console.error("Error creating activity:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create activity",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};
