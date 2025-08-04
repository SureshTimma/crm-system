"use client";

import React, { useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { Lock, Save, Eye, EyeOff, Shield } from "lucide-react";
import axios from "axios";

const SettingsPage = () => {
  const { user, loading } = useUser();
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [updateMessage, setUpdateMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear message when user starts typing
    if (updateMessage) {
      setUpdateMessage(null);
    }
  };

  const togglePasswordVisibility = (field: "current" | "new" | "confirm") => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const validateForm = () => {
    if (!formData.currentPassword) {
      setUpdateMessage({
        type: "error",
        text: "Current password is required",
      });
      return false;
    }

    if (!formData.newPassword) {
      setUpdateMessage({
        type: "error",
        text: "New password is required",
      });
      return false;
    }

    if (formData.newPassword.length < 6) {
      setUpdateMessage({
        type: "error",
        text: "New password must be at least 6 characters long",
      });
      return false;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setUpdateMessage({
        type: "error",
        text: "New passwords do not match",
      });
      return false;
    }

    if (formData.currentPassword === formData.newPassword) {
      setUpdateMessage({
        type: "error",
        text: "New password must be different from current password",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsUpdating(true);
    setUpdateMessage({
      type: "success",
      text: "Updating password...",
    });

    try {
      const response = await axios.put("/api/auth/settings/password", {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      const data = response.data as { success: boolean; message?: string };

      if (data.success) {
        setUpdateMessage({
          type: "success",
          text: "Password updated successfully!",
        });
        
        // Clear form
        setFormData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        throw new Error(data.message || "Failed to update password");
      }
    } catch (error) {
      console.error("Password update error:", error);
      let errorMessage = "Failed to update password";
      
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

  const handleReset = () => {
    setFormData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setUpdateMessage(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">Please log in to access settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Manage your account security settings</p>
        </div>

        {/* Password Update Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center">
              <Shield className="h-5 w-5 text-blue-600 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">Change Password</h2>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Update your password to keep your account secure
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Current Password */}
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords.current ? "text" : "password"}
                  id="currentPassword"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 pl-10 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter current password"
                  required
                />
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("current")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.current ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords.new ? "text" : "password"}
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 pl-10 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter new password (min 6 characters)"
                  required
                  minLength={6}
                />
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("new")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.new ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 pl-10 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Confirm new password"
                  required
                />
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("confirm")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.confirm ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Status Message */}
            {updateMessage && (
              <div
                className={`p-4 rounded-md ${
                  updateMessage.type === "success"
                    ? "bg-green-50 border border-green-200"
                    : "bg-red-50 border border-red-200"
                }`}
                role="alert"
                aria-live="polite"
              >
                <p
                  className={`text-sm font-medium ${
                    updateMessage.type === "success" ? "text-green-800" : "text-red-800"
                  }`}
                >
                  {updateMessage.text}
                </p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={isUpdating}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Update Password
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={handleReset}
                disabled={isUpdating}
                className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reset
              </button>
            </div>
          </form>
        </div>

        {/* Security Tips */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Password Security Tips</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Use at least 8 characters with a mix of letters, numbers, and symbols</li>
            <li>• Don&apos;t reuse passwords from other accounts</li>
            <li>• Consider using a password manager</li>
            <li>• Change your password regularly</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
