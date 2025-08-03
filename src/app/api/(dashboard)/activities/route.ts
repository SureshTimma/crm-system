import { ActivityModel, UserModel } from "@/DB/MongoSchema";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { MongoConnect } from "@/DB/MongoConnect";
import mongoose from "mongoose";

interface PopulatedUser {
  _id: string;
  name: string;
  email: string;
}

interface ActivityDocument {
  _id: any;
  user?: PopulatedUser;
  action: string;
  entityType: string;
  entityId: any;
  entityName: string;
  timestamp: Date;
}

interface ActivityFilter {
  timestamp?: { $gte: Date };
  action?: string;
  user?: mongoose.Types.ObjectId; // MongoDB ObjectId for user reference
}

export const POST = async (req: Request) => {
  try {
    const cookie = await cookies();
    const userId =
      cookie.get("userId")?.value.toString() || "placeholder-user-id"; // Default placeholder
    console.log("userid", userId);

    await MongoConnect();
    const { action, entityType, entityId, entityName } = await req.json();

    // Map action names to standardized format
    const actionMapping: Record<string, string> = {
      contact_created: "CREATE",
      contact_updated: "UPDATE",
      contact_deleted: "DELETE",
      contact_viewed: "VIEW",
      tag_created: "CREATE",
      tag_updated: "UPDATE",
      tag_deleted: "DELETE",
      tag_viewed: "VIEW",
      user_created: "CREATE",
      user_updated: "UPDATE",
      user_deleted: "DELETE",
      user_viewed: "VIEW",
    };

    // Map entity types to standardized format
    const entityTypeMapping: Record<string, string> = {
      contact: "CONTACT",
      tag: "TAG",
      user: "USER",
    };

    const standardizedAction = actionMapping[action] || action.toUpperCase();
    const standardizedEntityType =
      entityTypeMapping[entityType] || entityType.toUpperCase();

    // Handle user ID - find MongoDB ObjectId from Firebase UID
    let userObjectId = null;
    if (userId !== "placeholder-user-id") {
      try {
        // Find user by Firebase UID to get MongoDB ObjectId
        const userDoc = await UserModel.findOne({ firebaseUid: userId }).lean();

        if (userDoc) {
          userObjectId = userDoc._id;
        } else {
          console.warn(`User not found for Firebase UID: ${userId}`);
        }
      } catch (error) {
        console.warn(`Error finding user ${userId}:`, error);
      }
    }

    const response = await ActivityModel.create({
      user: userObjectId,
      action: standardizedAction,
      entityType: standardizedEntityType,
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

export const GET = async (request: Request) => {
  try {
    await MongoConnect();

    // Get query parameters for filtering (as per project requirements)
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "0");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const dateRange = url.searchParams.get("dateRange"); // Date range filter
    const activityType = url.searchParams.get("activityType"); // Activity type filter
    const userId = url.searchParams.get("userId"); // User filter

    // Build filter object based on project requirements
    const filter: ActivityFilter = {};

    // Date range filtering
    if (dateRange) {
      const now = new Date();
      let startDate: Date;

      switch (dateRange) {
        case "7d":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "30d":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "90d":
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
      filter.timestamp = { $gte: startDate };
    }

    // Activity type filtering (as per project requirements)
    if (activityType && activityType !== "all") {
      filter.action = activityType;
    }

    // User filtering (if multiple users - as per project requirements)
    if (userId && userId !== "all") {
      // Find MongoDB ObjectId from Firebase UID for filtering
      try {
        const userDoc = await UserModel.findOne({ firebaseUid: userId }).lean();
        if (userDoc) {
          filter.user = userDoc._id;
        } else {
          // If user not found, set filter to non-existent ObjectId so no results are returned
          filter.user = new mongoose.Types.ObjectId();
        }
      } catch (error) {
        console.warn(`Error finding user for filtering: ${userId}`, error);
        filter.user = new mongoose.Types.ObjectId(); // No results
      }
    }

    console.log("Activities filter:", filter);

    // Get total count for infinite scroll
    const totalCount = await ActivityModel.countDocuments(filter);

    // Fetch activities WITHOUT populate first to avoid ObjectId casting errors
    const activities = await ActivityModel.find(filter)
      .sort({ timestamp: -1 }) // Most recent first
      .skip(page * limit)
      .limit(limit)
      .lean();

    // Transform activities and manually handle user data
    const transformedActivities = await Promise.all(
      activities.map(async (activity: ActivityDocument) => {
        let userData = null;

        // Try to populate user by Firebase UID (stored as _id)
        if (activity.user) {
          try {
            const userDoc = await UserModel.findById(activity.user).lean();
            if (userDoc) {
              userData = {
                _id: userDoc._id.toString(),
                name: userDoc.name,
                email: userDoc.email,
              };
            }
          } catch (err) {
            console.warn(`Could not populate user ${activity.user}:`, err);
          }
        }

        return {
          _id: activity._id.toString(),
          user: userData,
          action: activity.action,
          entityType: activity.entityType,
          entityId: activity.entityId ? activity.entityId.toString() : "",
          entityName: activity.entityName,
          timestamp: activity.timestamp,
          // Add user details for display
          userName: userData?.name || "Unknown User",
          userEmail: userData?.email || "",
        };
      })
    );

    // Calculate pagination info for infinite scroll
    const hasMore = (page + 1) * limit < totalCount;
    const nextCursor = hasMore ? page + 1 : null;

    return NextResponse.json({
      success: true,
      activities: transformedActivities,
      pagination: {
        currentPage: page,
        hasMore,
        nextCursor,
        totalCount,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching activities:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch activities",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};
