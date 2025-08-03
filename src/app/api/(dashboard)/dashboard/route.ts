import { NextResponse } from "next/server";
import { MongoConnect } from "@/DB/MongoConnect";
import { ContactsModel, ActivityModel, TagsModel } from "@/DB/MongoSchema";
import { requireAuth } from "@/lib/auth";
import mongoose from "mongoose";

// TypeScript interfaces for proper typing
interface DashboardStats {
  totalContacts: number;
  newContactsThisWeek: number;
  totalActivities: number;
  activeTags: number;
}

interface ContactsByCompany {
  company: string;
  contacts: number;
}

interface ActivityTimeline {
  date: string;
  day: number;
  activities: number;
}

interface TagDistribution {
  name: string;
  value: number;
  color: string;
}

interface DashboardResponse {
  success: boolean;
  data: {
    stats: DashboardStats;
    contactsByCompany: ContactsByCompany[];
    activityTimeline: ActivityTimeline[];
    tagDistribution: TagDistribution[];
  };
}

export const GET = async () => {
  try {
    console.log("🚀 DASHBOARD API: Starting user-specific request");
    
    // Get authenticated user
    const user = await requireAuth();
    const userObjectId = new mongoose.Types.ObjectId(user._id);
    
    await MongoConnect();

    // Calculate fixed date ranges (no dynamic filtering)
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    console.log("📊 DASHBOARD API: Running user-specific aggregation queries for user:", user._id);

    // 1. Get Summary Statistics (user-specific)
    const [totalContacts, newContactsThisWeek, totalActivities, activeTags] =
      await Promise.all([
        ContactsModel.countDocuments({ createdBy: userObjectId }),
        ContactsModel.countDocuments({
          createdBy: userObjectId,
          createdAt: { $gte: oneWeekAgo },
        }),
        ActivityModel.countDocuments({ user: userObjectId }),
        TagsModel.countDocuments({
          createdBy: userObjectId,
          usageCount: { $gt: 0 },
        }),
      ]);

    console.log("📈 DASHBOARD API: User-specific stats calculated:", {
      totalContacts,
      newContactsThisWeek,
      totalActivities,
      activeTags,
    });

    // 2. Get Contacts by Company (Top 5) - User-specific
    const contactsByCompanyAgg = await ContactsModel.aggregate([
      { $match: { createdBy: userObjectId } },
      {
        $group: {
          _id: { $ifNull: ["$company", "No Company"] },
          contacts: { $sum: 1 },
        },
      },
      { $sort: { contacts: -1 } },
      { $limit: 5 },
      {
        $project: {
          _id: 0,
          company: {
            $cond: {
              if: { $gt: [{ $strLenCP: "$_id" }, 15] },
              then: { $concat: [{ $substr: ["$_id", 0, 15] }, "..."] },
              else: "$_id",
            },
          },
          contacts: 1,
        },
      },
    ]);

    // 3. Get Activities Timeline (Last 30 days fixed) - User-specific
    const activityTimelineAgg = await ActivityModel.aggregate([
      {
        $match: {
          user: userObjectId,
          timestamp: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$timestamp",
            },
          },
          activities: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Create complete timeline with zero values for missing days (30 days fixed)
    const timelineMap = new Map(
      activityTimelineAgg.map((item) => [item._id, item.activities])
    );

    const activityTimeline: ActivityTimeline[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split("T")[0];
      activityTimeline.push({
        date: dateStr,
        day: date.getDate(),
        activities: timelineMap.get(dateStr) || 0,
      });
    }

    // 4. Get Tag Distribution with populate optimization - User-specific
    console.log("🏷️ DASHBOARD API: Getting user-specific tag distribution...");
    const tagDistributionAgg = await TagsModel.aggregate([
      {
        $match: {
          createdBy: userObjectId,
          usageCount: { $gt: 0 },
        },
      },
      {
        $project: {
          name: "$tagName",
          value: "$usageCount",
          color: 1,
        },
      },
      { $sort: { value: -1 } },
      { $limit: 10 }, // Limit to top 10 tags for better visualization
    ]);

    console.log(
      "✅ DASHBOARD API: All data processed, sending single response"
    );

    // Prepare response data
    const dashboardData: DashboardResponse = {
      success: true,
      data: {
        stats: {
          totalContacts,
          newContactsThisWeek,
          totalActivities,
          activeTags,
        },
        contactsByCompany: contactsByCompanyAgg,
        activityTimeline,
        tagDistribution: tagDistributionAgg,
      },
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch dashboard data",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};

// Optional: POST endpoint for dashboard preferences (removed - not required)
export const POST = async () => {
  return NextResponse.json(
    {
      success: false,
      message: "POST method not implemented for dashboard",
    },
    { status: 405 }
  );
};
