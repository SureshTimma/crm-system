import mongoose from "mongoose";
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const UserSchema = new Schema({
  _id: { type: String, required: true },
  name: String,
  email: String,
  password: String,
});

const contactSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: String,
  company: String,
  tags: [{ type: String, ref: "Tag" }],
  notes: String,
  createdBy: { type: ObjectId, ref: "User" },
  createdAt: Date,
  updatedAt: Date,
  lastInteraction: Date,
});

const tagsSchema = new Schema({
  tagName: { type: String, required: true },
  color: { type: String, required: true, default: "#3B82F6" },
  usageCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const UserModel = mongoose.models.User || mongoose.model("User", UserSchema);
const ContactsModel =
  mongoose.models.Contact || mongoose.model("Contact", contactSchema);
const TagsModel = mongoose.models.Tag || mongoose.model("Tag", tagsSchema);
export { UserModel, ContactsModel, TagsModel };
