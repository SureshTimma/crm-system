import { MongoConnect } from "@/DB/MongoConnect";
import { UserModel } from "@/DB/MongoSchema";
import { NextResponse } from "next/server";

export const POST = async (req: Request) => {
  try {
    console.log("Register API: Connecting to MongoDB");

    await MongoConnect();

    const { uid, name, email } = await req.json();
    console.log("Register API: Received data:", { uid, name, email });

    // Check if user already exists
    const existingUser = await UserModel.findById(uid);
    if (existingUser) {
      return NextResponse.json({
        message: "User already exists",
        user: existingUser,
      });
    }

    // Create new user
    const MongoUser = await UserModel.create({
      _id: uid,
      name,
      email,
    });
    console.log("Register API: User saved to MongoDB:", MongoUser);

    return NextResponse.json({
      message: "User created successfully",
      user: MongoUser,
    });
  } catch (error) {
    console.error("Register API error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : error,
      },
      { status: 500 }
    );
  }
};
