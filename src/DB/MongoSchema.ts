import mongoose, { Document, Types } from "mongoose";
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

// TypeScript interfaces
export interface IUser extends Document {
  _id: Types.ObjectId;
  firebaseUid: string;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IContact extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  tags: Types.ObjectId[];
  notes?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  lastInteraction: Date;
}

export interface ITag extends Document {
  _id: Types.ObjectId;
  tagName: string;
  color: string;
  usageCount: number;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IActivity extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  action: string;
  entityType: string;
  entityId: Types.ObjectId;
  entityName: string;
  timestamp: Date;
}

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

const UserModel = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
const ContactsModel =
  mongoose.models.Contact || mongoose.model<IContact>("Contact", contactSchema);
const TagsModel = mongoose.models.Tag || mongoose.model<ITag>("Tag", tagsSchema);
const ActivityModel =
  mongoose.models.Activity || mongoose.model<IActivity>("Activity", ActivitySchema);
export { UserModel, ContactsModel, TagsModel, ActivityModel };
