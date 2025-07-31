import { ActivityModel } from "@/DB/MongoSchema";
import { cookies } from "next/headers";
import Cookies from "js-cookie";
import { NextResponse } from "next/server";
import { MongoConnect } from "@/DB/MongoConnect";

export const POST = async (req: Request) => {
  await MongoConnect();
  const {action, entityType} = await req.json();
  const response = await ActivityModel.create({
    user: Cookies.get("userId"),
    action,
    entityType,
    // entityId: response.data.contact._id,
  });

  return NextResponse.json({
    success: true,
    response
  })
};
