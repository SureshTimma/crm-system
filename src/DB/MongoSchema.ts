import mongoose from "mongoose";
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const UserSchema = new Schema({
  _id: { type: String, required: true },
  name: String,
  email: String,
  password: String,
});

const UserModel = mongoose.models.User || mongoose.model("User", UserSchema);
export { UserModel };
