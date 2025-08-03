import { cookies } from "next/headers";
import { UserModel } from "@/DB/MongoSchema";
import { MongoConnect } from "@/DB/MongoConnect";

export interface AuthenticatedUser {
  _id: string; // MongoDB ObjectId
  firebaseUid: string; // Firebase UID
  name: string;
  email: string;
}

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  try {
    await MongoConnect();

    const cookieStore = await cookies();
    const firebaseUid = cookieStore.get("userId")?.value;

    if (!firebaseUid) {
      return null;
    }

    // Find user by Firebase UID to get MongoDB ObjectId
    const user = await UserModel.findOne({ firebaseUid }).lean<{
      _id: string;
      firebaseUid: string;
      name: string;
      email: string;
    }>();

    if (!user) {
      return null;
    }

    return {
      _id: user._id.toString(),
      firebaseUid: user.firebaseUid,
      name: user.name,
      email: user.email,
    };
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

export async function requireAuth(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Authentication required");
  }

  return user;
}
