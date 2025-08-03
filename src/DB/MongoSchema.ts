import mongoose from "mongoose";
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const UserSchema = new Schema({
  _id: { type: ObjectId, auto: true }, // MongoDB generated ObjectId
  firebaseUid: { type: String, required: true, unique: true }, // Firebase UID as separate field
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const contactSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: String,
  company: String,
  tags: [{ type: ObjectId, ref: "Tag" }],
  notes: String,
  createdBy: { type: ObjectId, ref: "User" }, // MongoDB ObjectId reference
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  lastInteraction: { type: Date, default: Date.now },
});

const tagsSchema = new Schema({
  tagName: { type: String, required: true, unique: true },
  color: { type: String, required: true, default: "#3B82F6" },
  usageCount: { type: Number, default: 0 },
  createdBy: { type: ObjectId, ref: "User" }, // MongoDB ObjectId reference
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const ActivitySchema = new Schema({
  user: { type: ObjectId, ref: "User" }, // MongoDB ObjectId reference
  action: { type: String, required: true },
  entityType: { type: String, required: true },
  entityId: { type: ObjectId, required: true },
  entityName: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const UserModel = mongoose.models.User || mongoose.model("User", UserSchema);
const ContactsModel =
  mongoose.models.Contact || mongoose.model("Contact", contactSchema);
const TagsModel = mongoose.models.Tag || mongoose.model("Tag", tagsSchema);
const ActivityModel =
  mongoose.models.Activity || mongoose.model("Activity", ActivitySchema);
export { UserModel, ContactsModel, TagsModel, ActivityModel };
