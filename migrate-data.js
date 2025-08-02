// Migration script to fix existing data after schema changes
// Run this script manually if you have existing data that needs to be migrated

import { MongoConnect } from "./src/DB/MongoConnect.js";
import { ContactsModel, TagsModel, UserModel } from "./src/DB/MongoSchema.js";

async function migrateData() {
  try {
    await MongoConnect();
    console.log("Connected to MongoDB for migration...");

    // 1. Fix contacts with invalid or missing createdBy fields
    console.log("Fixing contacts with invalid createdBy references...");
    const contactsWithoutCreatedBy = await ContactsModel.find({
      $or: [
        { createdBy: { $exists: false } },
        { createdBy: null },
        { createdBy: "" }
      ]
    });

    for (const contact of contactsWithoutCreatedBy) {
      await ContactsModel.findByIdAndUpdate(contact._id, {
        $unset: { createdBy: 1 } // Remove the invalid createdBy field
      });
    }
    console.log(`Fixed ${contactsWithoutCreatedBy.length} contacts`);

    // 2. Fix tags with invalid or missing createdBy fields
    console.log("Fixing tags with invalid createdBy references...");
    const tagsWithoutCreatedBy = await TagsModel.find({
      $or: [
        { createdBy: { $exists: false } },
        { createdBy: null },
        { createdBy: "" }
      ]
    });

    for (const tag of tagsWithoutCreatedBy) {
      await TagsModel.findByIdAndUpdate(tag._id, {
        $unset: { createdBy: 1 } // Remove the invalid createdBy field
      });
    }
    console.log(`Fixed ${tagsWithoutCreatedBy.length} tags`);

    // 3. Fix contacts with string tag references instead of ObjectIds
    console.log("Fixing contacts with string tag references...");
    const contactsWithStringTags = await ContactsModel.find({
      tags: { $type: "string" }
    });

    for (const contact of contactsWithStringTags) {
      // Try to find matching tags and convert to ObjectIds
      const stringTags = Array.isArray(contact.tags) ? contact.tags : [contact.tags];
      const tagDocs = await TagsModel.find({ tagName: { $in: stringTags } });
      const tagIds = tagDocs.map(tag => tag._id);
      
      await ContactsModel.findByIdAndUpdate(contact._id, {
        tags: tagIds
      });
    }
    console.log(`Fixed ${contactsWithStringTags.length} contacts with string tags`);

    // 4. Update any missing default fields
    console.log("Adding missing default fields...");
    
    // Add missing dates to contacts
    await ContactsModel.updateMany(
      { createdAt: { $exists: false } },
      { $set: { createdAt: new Date() } }
    );
    
    await ContactsModel.updateMany(
      { updatedAt: { $exists: false } },
      { $set: { updatedAt: new Date() } }
    );
    
    await ContactsModel.updateMany(
      { lastInteraction: { $exists: false } },
      { $set: { lastInteraction: new Date() } }
    );

    // Add missing dates to tags
    await TagsModel.updateMany(
      { createdAt: { $exists: false } },
      { $set: { createdAt: new Date() } }
    );
    
    await TagsModel.updateMany(
      { updatedAt: { $exists: false } },
      { $set: { updatedAt: new Date() } }
    );

    console.log("Migration completed successfully!");
    
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    process.exit(0);
  }
}

// Run the migration
migrateData();
