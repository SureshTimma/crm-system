"use client";

import React, { useState, useRef } from "react";
import { useUser } from "@/contexts/UserContext";
import { Camera, Save, X, User as UserIcon, Mail, Edit2 } from "lucide-react";
import Image from "next/image";
import axios from "axios";

const ProfilePage = () => {
  const { user, loading, refreshUser } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update form data when user data changes
  React.useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
      });
    }
  }, [user]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setUpdateMessage({
          type: "error",
          text: "Image size should be less than 5MB",
        });
        return;
      }

      // Check file type
      if (!file.type.startsWith("image/")) {
        setUpdateMessage({
          type: "error",
          text: "Please select a valid image file",
        });
        return;
      }

      setUpdateMessage({
        type: "success",
        text: "Processing image...",
      });

      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImage(e.target?.result as string);
        setUpdateMessage({
          type: "success",
          text: "Image ready for upload. Save to apply changes.",
        });
      };
      reader.onerror = () => {
        setUpdateMessage({
          type: "error",
          text: "Failed to process image",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setUpdateMessage({
      type: "success",
      text: profileImage ? "Uploading image and updating profile..." : "Updating profile...",
    });

    try {
      // Update user profile
      const response = await axios.put("/api/auth/profile", {
        name: formData.name,
        email: formData.email,
        profileImage: profileImage,
      });

      const data = response.data as { success: boolean; message?: string };

      if (data.success) {
        setUpdateMessage({
          type: "success",
          text: "Profile updated successfully!",
        });
        setIsEditing(false);
        setProfileImage(null); // Clear the pending image
        await refreshUser();
      } else {
        throw new Error(data.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Profile update error:", error);
      let errorMessage = "Failed to update profile";
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } }; message?: string };
        errorMessage = axiosError.response?.data?.message || axiosError.message || errorMessage;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setUpdateMessage({
        type: "error",
        text: errorMessage,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      name: user?.name || "",
      email: user?.email || "",
    });
    setProfileImage(null);
    setUpdateMessage(null);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Unable to load user information. Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow rounded-lg">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
              <p className="text-gray-600">Manage your account information and preferences</p>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Edit2 size={16} className="mr-2" />
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Profile Content */}
        <div className="px-6 py-6">
          {/* Update Message */}
          {updateMessage && (
            <div
              className={`mb-6 p-4 rounded-md ${
                updateMessage.type === "success"
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              <p
                className={`text-sm ${
                  updateMessage.type === "success" ? "text-green-800" : "text-red-800"
                }`}
              >
                {updateMessage.text}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Image Section */}
              <div className="lg:col-span-1">
                <div className="text-center">
                  <div className="relative inline-block">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                      {profileImage || user?.profileImage ? (
                        <Image
                          src={profileImage || user?.profileImage || ""}
                          alt="Profile picture"
                          width={128}
                          height={128}
                          className="w-32 h-32 rounded-full object-cover"
                        />
                      ) : (
                        <span>{getInitials(user?.name || "User")}</span>
                      )}
                    </div>
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg"
                        title="Change profile picture"
                        aria-label="Change profile picture"
                      >
                        <Camera size={16} />
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      aria-label="Profile picture upload"
                      title="Select profile picture"
                    />
                  </div>
                  <div className="mt-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {user.name || "User"}
                    </h3>
                    <p className="text-gray-500">{user.email}</p>
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="lg:col-span-2 space-y-6">
                {/* Name Field */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    <UserIcon size={16} className="inline mr-2" />
                    Full Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your full name"
                      required
                    />
                  ) : (
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                      {user.name || "Not provided"}
                    </div>
                  )}
                </div>

                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail size={16} className="inline mr-2" />
                    Email Address
                  </label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                    {user.email}
                    <span className="ml-2 text-xs text-gray-500">(Cannot be changed)</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Email is linked to your authentication and cannot be modified here.
                  </p>
                </div>

                {/* Account Information */}
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Account Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        User ID
                      </label>
                      <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm font-mono">
                        {user._id}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Firebase UID
                      </label>
                      <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm font-mono">
                        {user.uid}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                {isEditing && (
                  <div className="flex space-x-3 pt-6 border-t border-gray-200">
                    <button
                      type="submit"
                      disabled={isUpdating}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUpdating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Updating...
                        </>
                      ) : (
                        <>
                          <Save size={16} className="mr-2" />
                          Save Changes
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={isUpdating}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <X size={16} className="mr-2" />
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
