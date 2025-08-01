"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "@/firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import axios from "axios";

interface User {
  uid: string;
  email: string;
  name: string;
  displayName?: string;
}

export type { User };

interface UserContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

interface UserProviderProps {
  children: React.ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch user details from MongoDB
  const fetchUserFromDB = async (uid: string): Promise<User | null> => {
    try {
      const response = await axios.get(`/api/auth/user/${uid}`);
      const data = response.data as { user: User };
      return data.user;
    } catch (error) {
      console.error("Error fetching user from DB:", error);
      return null;
    }
  };

  const refreshUser = async () => {
    if (auth.currentUser) {
      const dbUser = await fetchUserFromDB(auth.currentUser.uid);
      if (dbUser) {
        setUser(dbUser);
      } else {
        // Fallback to Firebase user data
        setUser({
          uid: auth.currentUser.uid,
          email: auth.currentUser.email || "",
          name: auth.currentUser.displayName || "User",
          displayName: auth.currentUser.displayName || undefined,
        });
      }
    }
  };

  const logout = async () => {
    try {
      await auth.signOut();
      // Clear session cookie
      await axios.post("/api/auth/logout");
      setUser(null);
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      setLoading(true);
      setError(null);

      if (firebaseUser) {
        try {
          // Get user details from MongoDB first
          const dbUser = await fetchUserFromDB(firebaseUser.uid);
          
          if (dbUser) {
            setUser(dbUser);
          } else {
            // Fallback to Firebase user data
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              name: firebaseUser.displayName || "User",
              displayName: firebaseUser.displayName || undefined,
            });
          }
        } catch (err) {
          console.error("Error setting up user:", err);
          setError("Failed to load user data");
        }
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value: UserContextType = {
    user,
    loading,
    error,
    refreshUser,
    logout,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
