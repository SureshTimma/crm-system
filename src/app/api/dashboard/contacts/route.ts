import { MongoConnect } from "@/DB/MongoConnect";
import { ContactsModel } from "@/DB/MongoSchema";
import { NextResponse } from "next/server";

await MongoConnect();

export const POST = async (req: Request) => {
    const body = await req.json();
    const newContact = await ContactsModel.create({
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

export const GET = async ()=>{
    const contactsData = await ContactsModel.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json(contactsData);
}