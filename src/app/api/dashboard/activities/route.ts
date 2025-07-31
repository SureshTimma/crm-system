import { ActivityModel } from "@/DB/MongoSchema";
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
