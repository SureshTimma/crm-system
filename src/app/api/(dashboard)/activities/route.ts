import { ActivityModel, UserModel } from "@/DB/MongoSchema";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { MongoConnect } from "@/DB/MongoConnect";

export const POST = async (req: Request) => {
  const cookie = await cookies();
  const userId = cookie.get("userId")?.value.toString() || "anonymous"; // Default to 'anonymous' if no userId cookie is found
  console.log("userid", userId);
  await MongoConnect();
  const { action, entityType, entityId, entityName } = await req.json();
  const response = await ActivityModel.create({
    user: userId,
    action,
    entityType,
    entityId,
    entityName,
  });

  return NextResponse.json({
    success: true,
    response,
  });
};

export const GET = async () => {
  try {
    await MongoConnect();

    const activities = await ActivityModel.find({})
      .sort({ timestamp: -1 })
      .limit(50)
      .lean();

    // Get unique user IDs from activities
    const userIds = [...new Set(activities.map((activity) => activity.user))];

    // Fetch user details for all user IDs
    const users = await UserModel.find({ _id: { $in: userIds } }).lean();

    // Create a map of user ID to user details
    const userMap = users.reduce((acc, user) => {
      acc[user._id] = {
        name: user.name || "Unknown User",
        email: user.email || "",
      };
      return acc;
    }, {} as Record<string, { name: string; email: string }>);

    // Enhance activities with user details
    const activitiesWithUserDetails = activities.map((activity) => ({
      ...activity,
      userName: userMap[activity.user]?.name || "Unknown User",
      userEmail: userMap[activity.user]?.email || "",
    }));

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
