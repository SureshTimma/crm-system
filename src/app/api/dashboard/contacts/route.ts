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
    contact: newContact,
  });
};

export const GET = async () => {
  const contactsData = await ContactsModel.find()
    .sort({ createdAt: -1 })
    .lean();
  return NextResponse.json(contactsData);
};

export const DELETE = async (req: Request) => {
  const url = new URL(req.url);
  const _id = url.searchParams.get("id");
  const response = await ContactsModel.deleteOne({ _id });
  return NextResponse.json({
    message: "Contact deleted successfully",
    contact: response,
  });   
};

export const PUT = async (req: Request)=>{
    const body = await req.json();
    const url = new URL(req.url);
    const _id = url.searchParams.get("contactId");
    
    console.log("Updating contact with ID:", _id);
    console.log("Update data received:", body);
    
    const updatedContact = await ContactsModel.findByIdAndUpdate(
        _id, 
        {
          ...body,
          updatedAt: new Date(),
        },
        { new: true } // Return the updated document
    );
    
    console.log("Updated contact:", updatedContact);
    
    return NextResponse.json({
        success: true,
        message: "Contact updated successfully",
        contact: updatedContact,
    });

}