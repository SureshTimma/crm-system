import { MongoConnect } from "@/DB/MongoConnect";
import { ContactModel } from "@/DB/MongoSchema";
import { NextResponse } from "next/server";

export const POST = async (req: Request) => {
    await MongoConnect();
    const body = await req.json();
    const newContact = await ContactModel.create({
        ...body,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastInteraction: new Date(),
    });

    return NextResponse.json({
        message: "Contact created successfully",
        contact: newContact
    });
}