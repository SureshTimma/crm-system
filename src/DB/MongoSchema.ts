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

const UserModel = mongoose.models.User || mongoose.model("User", UserSchema);
const ContactsModel = mongoose.models.Contact || mongoose.model("Contact", contactSchema);
export { UserModel, ContactsModel };
