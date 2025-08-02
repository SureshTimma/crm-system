import { ActivityModel } from "@/DB/MongoSchema";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { MongoConnect } from "@/DB/MongoConnect";
import mongoose from "mongoose";

interface PopulatedUser {
  _id: string;
  name: string;
  email: string;
}

interface PopulatedActivity {
  _id: string;
  user?: PopulatedUser;
  action: string;
  entityType: string;
  entityId: string;
  entityName: string;
  timestamp: Date;
}

export const POST = async (req: Request) => {
  try {
    const cookie = await cookies();
    const userId =
      cookie.get("userId")?.value.toString() || "placeholder-user-id"; // Default placeholder
    console.log("userid", userId);

    await MongoConnect();
    const { action, entityType, entityId, entityName } = await req.json();

    // Convert userId to ObjectId if it's a valid ObjectId string
    let userObjectId;
    if (mongoose.Types.ObjectId.isValid(userId)) {
      userObjectId = new mongoose.Types.ObjectId(userId);
    } else {
      userObjectId = new mongoose.Types.ObjectId(); // Create a new ObjectId for placeholder
    }

    const response = await ActivityModel.create({
      user: userObjectId,
      action,
      entityType,
      entityId: new mongoose.Types.ObjectId(entityId),
      entityName,
    });

    return NextResponse.json({
      success: true,
      response,
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

export const GET = async () => {
  try {
    await MongoConnect();

    const activities = await ActivityModel.find({})
      .populate("user", "name email")
      .sort({ timestamp: -1 })
      .limit(50)
      .lean();

    // Transform the populated data
    const activitiesWithUserDetails = activities.map(
      (activity: PopulatedActivity) => ({
        ...activity,
        userName: activity.user?.name || "Unknown User",
        userEmail: activity.user?.email || "",
      })
    );

    return NextResponse.json({
      success: true,
      activities: activitiesWithUserDetails,
    });
  } catch (error) {
    console.error("Error fetching activities:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch activities",
      },
      { status: 500 }
    );
  }
};
