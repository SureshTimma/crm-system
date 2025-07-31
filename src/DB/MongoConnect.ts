import mongoose from "mongoose";
const MONGODB_URI = process.env.MONGODB_URI;

export const MongoConnect = async () => {
  try {
    await mongoose.connect(MONGODB_URI ?? "default-mongodb-uri");
    console.log("connected 🔥");
  } catch (error) {
    console.log("error", error);
  }
};
