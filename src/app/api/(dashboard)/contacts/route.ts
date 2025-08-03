import { MongoConnect } from "@/DB/MongoConnect";
import { ContactsModel, TagsModel, UserModel } from "@/DB/MongoSchema";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

// Type definitions
interface PopulatedTag {
  _id: string;
  tagName: string;
  color: string;
}

interface ContactFilter {
  $or?: Array<Record<string, { $regex: string; $options: string }>>;
  company?: string;
  tags?: { $in: string[] };
}

interface SortObject {
  [key: string]: 1 | -1;
}

await MongoConnect();

// Helper function to safely get tag ObjectIds from tag names
async function getTagObjectIds(tagNames: string[]) {
  if (!tagNames || tagNames.length === 0) return [];

  try {
    const tagDocs = await TagsModel.find({ tagName: { $in: tagNames } });
    return tagDocs.map((tag) => tag._id);
  } catch (error) {
    console.error("Error fetching tag ObjectIds:", error);
    return [];
  }
}

// Helper function to safely transform tag data for frontend
function transformTagsForFrontend(
  tags: (PopulatedTag | string)[]
): (PopulatedTag | string)[] {
  if (!tags || !Array.isArray(tags)) return [];

  return tags
    .map((tag) => {
      if (typeof tag === "string") {
        return tag;
      } else if (tag && typeof tag === "object" && "tagName" in tag) {
        // Return the full tag object with color information
        return {
          _id: tag._id,
          tagName: tag.tagName,
          color: tag.color,
        };
      } else {
        return tag?.toString() || "";
      }
    })
    .filter(Boolean);
}

export const POST = async (req: Request) => {
  try {
    const body = await req.json();

    // Get Firebase UID from headers and find MongoDB ObjectId
    const headersList = headers();
    const firebaseUid = headersList.get("user-id") || "placeholder-user-id"; // Temporary placeholder

    let userObjectId = null;
    if (firebaseUid !== "placeholder-user-id") {
      try {
        const userDoc = await UserModel.findOne({ firebaseUid }).lean();
        if (userDoc) {
          userObjectId = userDoc._id;
        }
      } catch (error) {
        console.warn(
          `Error finding user for Firebase UID ${firebaseUid}:`,
          error
        );
      }
    }

    // Handle tag creation/updating
    if (body.tags && body.tags.length > 0) {
      for (const tagName of body.tags) {
        await TagsModel.findOneAndUpdate(
          { tagName },
          {
            $inc: { usageCount: 1 },
            $setOnInsert: {
              color: "#3B82F6",
              createdBy: userObjectId,
              createdAt: new Date(),
            },
            updatedAt: new Date(),
          },
          { upsert: true, new: true }
        );
      }
    }

    // Get tag ObjectIds for the contact
    const tagIds = await getTagObjectIds(body.tags || []);

    const newContact = await ContactsModel.create({
      ...body,
      tags: tagIds,
      createdBy: userObjectId,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastInteraction: new Date(),
    });

    // Populate the contact with tag details before returning
    const populatedContact = await ContactsModel.findById(newContact._id)
      .populate("tags", "tagName color")
      .populate("createdBy", "name email")
      .lean();

    return NextResponse.json({
      success: true,
      message: "Contact created successfully",
      contact: populatedContact,
    });
  } catch (error) {
    console.error("Error creating contact:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create contact",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};

export const GET = async (req: Request) => {
  try {
    const url = new URL(req.url);

    // Extract query parameters
    const searchTerm = url.searchParams.get("search") || "";
    const tagFilter = url.searchParams.get("tag") || "";
    const companyFilter = url.searchParams.get("company") || "";
    const sortBy = url.searchParams.get("sortBy") || "createdAt";
    const sortOrder = url.searchParams.get("sortOrder") || "desc";
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "50");

    console.log("Query params:", {
      searchTerm,
      tagFilter,
      companyFilter,
      sortBy,
      sortOrder,
      page,
      limit,
    });

    // Build the filter object
    const filter: ContactFilter = {};

    // Search functionality
    if (searchTerm) {
      filter.$or = [
        { name: { $regex: searchTerm, $options: "i" } },
        { email: { $regex: searchTerm, $options: "i" } },
        { company: { $regex: searchTerm, $options: "i" } },
        { phone: { $regex: searchTerm, $options: "i" } },
        { notes: { $regex: searchTerm, $options: "i" } },
      ];
    }

    // Company filter
    if (companyFilter) {
      filter.company = companyFilter;
    }

    // Tag filter - need to get tag ObjectId first
    if (tagFilter) {
      try {
        const tagDoc = await TagsModel.findOne({ tagName: tagFilter });
        if (tagDoc) {
          filter.tags = { $in: [tagDoc._id] };
        }
      } catch (tagError) {
        console.warn("Tag filter error:", tagError);
      }
    }

    console.log("MongoDB filter:", JSON.stringify(filter, null, 2));

    // Build sort object
    const sortObj: SortObject = {};
    sortObj[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const totalCount = await ContactsModel.countDocuments(filter);

    // First try with population
    let contactsData;
    try {
      contactsData = await ContactsModel.find(filter)
        .populate({
          path: "tags",
          select: "tagName color",
          options: { strictPopulate: false },
        })
        .populate({
          path: "createdBy",
          select: "name email",
          options: { strictPopulate: false },
        })
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean();
    } catch (populateError) {
      console.warn(
        "Population failed, falling back to basic query:",
        populateError
      );
      // Fallback to basic query without population
      contactsData = await ContactsModel.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean();
    }

    // Transform the populated data to match the frontend expectations
    const transformedContacts = contactsData.map((contact) => ({
      ...contact,
      tags: transformTagsForFrontend(contact.tags || []),
    }));

    // Get unique companies for filter dropdown
    const companiesAggregation = await ContactsModel.aggregate([
      { $match: { company: { $exists: true, $ne: null, $ne: "" } } },
      { $group: { _id: "$company" } },
      { $sort: { _id: 1 } },
    ]);
    const uniqueCompanies = companiesAggregation.map((item) => item._id);

    // Get all available tags for the frontend (replaces separate tags API call)
    const availableTags = await TagsModel.find({}).sort({ tagName: 1 }).lean();

    return NextResponse.json({
      success: true,
      contacts: transformedContacts,
      availableTags, // Include all tags in response
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasMore: skip + contactsData.length < totalCount,
      },
      filters: {
        uniqueCompanies,
      },
    });
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch contacts",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};

export const DELETE = async (req: Request) => {
  try {
    const url = new URL(req.url);
    const _id = url.searchParams.get("id");

    if (!_id) {
      return NextResponse.json(
        {
          success: false,
          message: "Contact ID is required",
        },
        { status: 400 }
      );
    }

    // Get the contact first to update tag usage counts
    const contact = await ContactsModel.findById(_id).populate("tags");

    if (contact && contact.tags) {
      // Decrease usage count for each tag
      for (const tag of contact.tags) {
        await TagsModel.findByIdAndUpdate(tag._id, {
          $inc: { usageCount: -1 },
        });
      }
    }

    const response = await ContactsModel.deleteOne({ _id });
    return NextResponse.json({
      success: true,
      message: "Contact deleted successfully",
      contact: response,
    });
  } catch (error) {
    console.error("Error deleting contact:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete contact",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};

export const PUT = async (req: Request) => {
  try {
    const body = await req.json();
    const url = new URL(req.url);
    const _id = url.searchParams.get("contactId");

    if (!_id) {
      return NextResponse.json(
        {
          success: false,
          message: "Contact ID is required",
        },
        { status: 400 }
      );
    }

    // Get Firebase UID from headers and find MongoDB ObjectId
    const headersList = headers();
    const firebaseUid = headersList.get("user-id") || "placeholder-user-id";

    let userObjectId = null;
    if (firebaseUid !== "placeholder-user-id") {
      try {
        const userDoc = await UserModel.findOne({ firebaseUid }).lean();
        if (userDoc) {
          userObjectId = userDoc._id;
        }
      } catch (error) {
        console.warn(
          `Error finding user for Firebase UID ${firebaseUid}:`,
          error
        );
      }
    }

    console.log("Updating contact with ID:", _id);
    console.log("Update data received:", body);

    // Get the existing contact to compare tags
    const existingContact = await ContactsModel.findById(_id).populate("tags");

    // Handle tag updates
    if (body.tags && body.tags.length > 0) {
      // Decrease usage count for removed tags
      if (existingContact && existingContact.tags) {
        const oldTagNames = existingContact.tags.map(
          (tag: PopulatedTag) => tag.tagName
        );
        const removedTags = oldTagNames.filter(
          (tagName: string) => !body.tags.includes(tagName)
        );

        for (const tagName of removedTags) {
          await TagsModel.findOneAndUpdate(
            { tagName },
            { $inc: { usageCount: -1 } }
          );
        }
      }

      // Create/update tags and increase usage count
      for (const tagName of body.tags) {
        await TagsModel.findOneAndUpdate(
          { tagName },
          {
            $inc: { usageCount: 1 },
            $setOnInsert: {
              color: "#3B82F6",
              createdBy: existingContact?.createdBy || userObjectId,
              createdAt: new Date(),
            },
            updatedAt: new Date(),
          },
          { upsert: true, new: true }
        );
      }

      // Get tag ObjectIds for the contact
      const tagIds = await getTagObjectIds(body.tags);
      body.tags = tagIds;
    }

    const updatedContact = await ContactsModel.findByIdAndUpdate(
      _id,
      {
        ...body,
        updatedAt: new Date(),
      },
      { new: true } // Return the updated document
    )
      .populate("tags", "tagName color")
      .populate("createdBy", "name email");

    console.log("Updated contact:", updatedContact);

    // Transform the populated data to match the frontend expectations
    const transformedContact = {
      ...updatedContact?.toObject(),
      tags: transformTagsForFrontend(updatedContact?.tags || []),
    };

    return NextResponse.json({
      success: true,
      message: "Contact updated successfully",
      contact: transformedContact,
    });
  } catch (error) {
    console.error("Error updating contact:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update contact",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};
