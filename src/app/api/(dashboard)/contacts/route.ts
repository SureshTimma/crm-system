import { MongoConnect } from "@/DB/MongoConnect";
import { ContactsModel, TagsModel } from "@/DB/MongoSchema";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import mongoose from "mongoose";

// Type definitions
interface PopulatedTag {
  _id: string;
  tagName: string;
  color: string;
}

interface ContactFilter {
  createdBy?: mongoose.Types.ObjectId;
  $or?: Array<Record<string, { $regex: string; $options: string }>>;
  company?: string;
  tags?: { $in: string[] };
}

interface SortObject {
  [key: string]: 1 | -1;
}

await MongoConnect();

// Helper function to safely get tag ObjectIds from tag names
async function getTagObjectIds(
  tagNames: string[],
  userObjectId: mongoose.Types.ObjectId
) {
  if (!tagNames || tagNames.length === 0) return [];

  try {
    const tagIds = [];
    for (const tagName of tagNames) {
      // Look for existing tag first (user-specific)
      let tag = await TagsModel.findOne({
        tagName,
        createdBy: userObjectId,
      });

      // If tag doesn't exist, create it
      if (!tag) {
        tag = await TagsModel.create({
          tagName,
          color: "#" + Math.floor(Math.random() * 16777215).toString(16), // Random color
          usageCount: 1,
          createdBy: userObjectId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } else {
        // Increment usage count
        await TagsModel.findByIdAndUpdate(tag._id, {
          $inc: { usageCount: 1 },
        });
      }

      tagIds.push(tag._id);
    }
    return tagIds;
  } catch (error) {
    console.error("Error fetching/creating tag ObjectIds:", error);
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
        return String(tag || "");
      }
    })
    .filter(Boolean);
}

export const POST = async (req: Request): Promise<NextResponse> => {
  try {
    const body = await req.json();

    // Get authenticated user
    const user = await requireAuth();
    const userObjectId = new mongoose.Types.ObjectId(user._id);

    await MongoConnect();

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
    const tagIds = await getTagObjectIds(body.tags || [], userObjectId);

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

export const GET = async (req: Request): Promise<NextResponse> => {
  try {
    const user = await requireAuth();
    const userObjectId = new mongoose.Types.ObjectId(user._id);

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

    // Build the filter object with user-specific filtering
    const filter: ContactFilter = {
      createdBy: userObjectId,
    };

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

    // Tag filter - need to get tag ObjectId first (user-specific)
    if (tagFilter) {
      try {
        const tagDoc = await TagsModel.findOne({
          tagName: tagFilter,
          createdBy: userObjectId,
        });
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

    // Get unique companies for filter dropdown (user-specific)
    const companiesAggregation = await ContactsModel.aggregate([
      {
        $match: {
          createdBy: userObjectId,
          company: { $exists: true, $nin: [null, ""] },
        },
      },
      { $group: { _id: "$company" } },
      { $sort: { _id: 1 } },
    ]);
    const uniqueCompanies = companiesAggregation.map((item) => item._id);

    // Get all available tags for the frontend (user-specific)
    const availableTags = await TagsModel.find({ createdBy: userObjectId })
      .sort({ tagName: 1 })
      .lean();

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

export const DELETE = async (req: Request): Promise<NextResponse> => {
  try {
    const user = await requireAuth();
    const userObjectId = new mongoose.Types.ObjectId(user._id);

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

    // Get the contact first to update tag usage counts and verify ownership
    const contact = await ContactsModel.findOne({
      _id,
      createdBy: userObjectId,
    }).populate("tags");

    if (!contact) {
      return NextResponse.json(
        {
          success: false,
          message: "Contact not found or access denied",
        },
        { status: 404 }
      );
    }

    if (contact.tags) {
      // Decrease usage count for each tag (user-specific)
      for (const tag of contact.tags) {
        await TagsModel.findOneAndUpdate(
          { _id: tag._id, createdBy: userObjectId },
          { $inc: { usageCount: -1 } }
        );
      }
    }

    const response = await ContactsModel.deleteOne({
      _id,
      createdBy: userObjectId,
    });

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

export const PUT = async (req: Request): Promise<NextResponse> => {
  try {
    const user = await requireAuth();
    const userObjectId = new mongoose.Types.ObjectId(user._id);

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

    console.log("Updating contact with ID:", _id);
    console.log("Update data received:", body);

    // Get the existing contact to compare tags and verify ownership
    const existingContact = await ContactsModel.findOne({
      _id,
      createdBy: userObjectId,
    }).populate("tags");

    if (!existingContact) {
      return NextResponse.json(
        {
          success: false,
          message: "Contact not found or access denied",
        },
        { status: 404 }
      );
    }

    // Handle tag updates
    if (body.tags && body.tags.length > 0) {
      // Decrease usage count for removed tags (user-specific)
      if (existingContact && existingContact.tags) {
        const oldTagNames = existingContact.tags.map(
          (tag: PopulatedTag) => tag.tagName
        );
        const removedTags = oldTagNames.filter(
          (tagName: string) => !body.tags.includes(tagName)
        );

        for (const tagName of removedTags) {
          await TagsModel.findOneAndUpdate(
            { tagName, createdBy: userObjectId },
            { $inc: { usageCount: -1 } }
          );
        }
      }

      // Get tag ObjectIds for the contact (this will create/update tags as needed)
      const tagIds = await getTagObjectIds(body.tags, userObjectId);
      body.tags = tagIds;
    }

    const updatedContact = await ContactsModel.findOneAndUpdate(
      { _id, createdBy: userObjectId },
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
