import { MongoConnect } from "@/DB/MongoConnect";
import { UserModel } from "@/DB/MongoSchema";
import { NextResponse } from "next/server";

export const POST = async (req: Request) => {
  try {
    console.log("Connected to MongoDB");

    await MongoConnect();

    const { uid, name, email, password } = await req.json();
    console.log("Received data:", { uid, name, email, password });

    const MongoUser = await UserModel.create({
      _id: uid,
      name,
      email
    });
    console.log("User saved to MongoDB:", MongoUser);

    return NextResponse.json({
      message: "User created successfully",
      user: MongoUser,
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : error,
      },
      { status: 500 }
    );
  }
};
