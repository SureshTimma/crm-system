"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";

// Types
interface Tag {
  _id: string;
  tagName: string;
  color: string;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface TagFormData {
  tagName: string;
  color: string;
}

// API Response interfaces
interface TagResponse {
  success: boolean;
  tag: Tag;
}

interface TagsResponse {
  success: boolean;
  tags: Tag[];
}

// Color options for tags
const TAG_COLORS = [
  { name: "Blue", value: "#3B82F6", bg: "bg-blue-500", text: "text-white" },
  { name: "Green", value: "#10B981", bg: "bg-green-500", text: "text-white" },
  { name: "Purple", value: "#8B5CF6", bg: "bg-purple-500", text: "text-white" },
  { name: "Pink", value: "#EC4899", bg: "bg-pink-500", text: "text-white" },
  { name: "Yellow", value: "#F59E0B", bg: "bg-yellow-500", text: "text-white" },
  { name: "Red", value: "#EF4444", bg: "bg-red-500", text: "text-white" },
  { name: "Indigo", value: "#6366F1", bg: "bg-indigo-500", text: "text-white" },
  { name: "Teal", value: "#14B8A6", bg: "bg-teal-500", text: "text-white" },
  { name: "Orange", value: "#F97316", bg: "bg-orange-500", text: "text-white" },
  { name: "Gray", value: "#6B7280", bg: "bg-gray-500", text: "text-white" },
];

// Utility function to get color classes
const getColorClasses = (colorValue: string) => {
  const colorConfig = TAG_COLORS.find((color) => color.value === colorValue);
  return colorConfig || { bg: "bg-blue-500", text: "text-white" };
};

// Color Picker Component
const ColorPicker = ({
  selectedColor,
  onColorSelect,
  isOpen,
  onClose,
}: {
  selectedColor: string;
  onColorSelect: (color: string) => void;
  isOpen: boolean;
  onClose: () => void;
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50 min-w-[200px]">
      <div className="grid grid-cols-5 gap-2">
        {TAG_COLORS.map((color) => (
          <button
            key={color.value}
            onClick={() => {
              onColorSelect(color.value);
              onClose();
            }}
            className={`w-8 h-8 rounded-full ${
              color.bg
            } hover:scale-110 transition-transform duration-200 ${
              selectedColor === color.value
                ? "ring-2 ring-gray-400 ring-offset-2"
                : ""
            }`}
            title={color.name}
          />
        ))}
      </div>
    </div>
  );
};

// Tag Modal Component
const TagModal = ({
  isOpen,
  onClose,
  onSubmit,
  editingTag,
  isEditing,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (tagData: TagFormData, isEdit?: boolean) => void;
  editingTag?: Tag | null;
  isEditing: boolean;
}) => {
  const [formData, setFormData] = useState<TagFormData>({
    tagName: "",
    color: "#3B82F6", // Default blue
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [colorPickerOpen, setColorPickerOpen] = useState(false);

  // Pre-fill form when editing
  useEffect(() => {
    if (isEditing && editingTag) {
      setFormData({
        tagName: editingTag.tagName,
        color: editingTag.color,
      });
    } else {
      setFormData({
        tagName: "",
        color: "#3B82F6",
      });
    }
    setErrors({});
  }, [isEditing, editingTag, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.tagName.trim()) {
      newErrors.tagName = "Tag name is required";
    } else if (formData.tagName.trim().length < 2) {
      newErrors.tagName = "Tag name must be at least 2 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      const tagData: TagFormData = {
        tagName: formData.tagName.trim(),
        color: formData.color,
      };

      console.log("Submitting tag data:", tagData);
      onSubmit(tagData, isEditing);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md transform transition-all">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {isEditing ? "Edit Tag" : "Create New Tag"}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              title="Close modal"
              aria-label="Close modal"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Tag Name */}
            <div>
              <label
                htmlFor="tagName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Tag Name *
              </label>
              <input
                type="text"
                id="tagName"
                name="tagName"
                value={formData.tagName}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.tagName ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="Enter tag name"
              />
              {errors.tagName && (
                <p className="mt-1 text-xs text-red-600">{errors.tagName}</p>
              )}
            </div>

            {/* Color Picker */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tag Color
              </label>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setColorPickerOpen(!colorPickerOpen)}
                    className={`w-12 h-10 rounded-md border border-gray-300 flex items-center justify-center hover:border-gray-400 transition-colors duration-200 ${
                      getColorClasses(formData.color).bg
                    }`}
                    title="Click to select color"
                    aria-label="Select tag color"
                  >
                    <span className="sr-only">Select color</span>
                  </button>
                </div>
                <span className="text-sm text-gray-600">
                  {TAG_COLORS.find((c) => c.value === formData.color)?.name ||
                    "Custom"}
                </span>
              </div>

              <ColorPicker
                selectedColor={formData.color}
                onColorSelect={(color) =>
                  setFormData((prev) => ({ ...prev, color }))
                }
                isOpen={colorPickerOpen}
                onClose={() => setColorPickerOpen(false)}
              />
            </div>

            {/* Preview */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preview
              </label>
              <div className="flex items-center space-x-2">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    getColorClasses(formData.color).bg
                  } ${getColorClasses(formData.color).text}`}
                >
                  {formData.tagName || "Tag Preview"}
                </span>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`flex-1 px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  isEditing
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {isEditing ? "Update Tag" : "Create Tag"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Main Tags Page Component
const TagsPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Create Tag Handler
  const handleCreateTag = async (tagData: TagFormData) => {
    try {
      const response = await axios.post("/api/tags", {
        ...tagData,
        usageCount: 0,
      });

      const responseData = response.data as TagResponse;
      if (responseData.success) {
        setRefreshTrigger((prev) => prev + 1);
        closeModal();
      } else {
        alert("Failed to create tag. Please try again.");
      }
    } catch (error) {
      console.error("Error creating tag:", error);
      alert("An error occurred while creating the tag.");
    }
  };

  // Update Tag Handler
  const handleUpdateTag = async (tagData: TagFormData) => {
    try {
      if (!editingTag) return;

      console.log("Updating tag with data:", tagData);

      const response = await axios.put(
        `/api/tags?tagId=${editingTag._id}`,
        tagData
      );

      console.log("Update response:", response.data);

      const responseData = response.data as TagResponse;
      if (responseData.success) {
        // Update tag directly in state
        setTags((prevTags) =>
          prevTags.map((tag) =>
            tag._id === editingTag._id
              ? { ...tag, ...tagData, updatedAt: new Date() }
              : tag
          )
        );

        closeModal();
        console.log("Tag updated successfully");
      } else {
        console.error("Update failed:", response.data);
        alert("Failed to update tag. Please try again.");
      }
    } catch (error) {
      console.error("Error updating tag:", error);
      alert("An error occurred while updating the tag.");
    }
  };

  // Delete Tag Handler
  const handleDeleteTag = async (tagId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this tag? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await axios.delete(`/api/tags?id=${tagId}`);
      console.log("Delete response:", response.data);

      const responseData = response.data as TagResponse;
      if (responseData.success) {
        setRefreshTrigger((prev) => prev + 1);
        console.log("Tag deleted successfully");
      } else {
        console.error("Delete failed:", response.data);
        alert("Failed to delete tag. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting tag:", error);
      alert("An error occurred while deleting the tag.");
    }
  };

  // Modal Handlers
  const handleModalSubmit = (tagData: TagFormData, isEdit?: boolean) => {
    console.log("Modal submit - tagData:", tagData);
    console.log("Modal submit - isEdit:", isEdit);

    if (isEdit) {
      handleUpdateTag(tagData);
    } else {
      handleCreateTag(tagData);
    }
  };

  const openEditModal = (tag: Tag) => {
    setEditingTag(tag);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingTag(null);
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTag(null);
    setIsEditing(false);
  };

  // Fetch Tags
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const tagsData = await axios.get("/api/tags");
        const responseData = tagsData.data as TagsResponse;
        if (responseData.success) {
          setTags(responseData.tags);
        } else {
          setTags(tagsData.data as Tag[]);
        }
      } catch (error) {
        console.error("Error fetching tags:", error);
      }
    };
    fetchTags();
  }, [refreshTrigger]);

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Tags</h1>
        <button
          onClick={openCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors duration-200 flex items-center space-x-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          <span>Add Tag</span>
        </button>
      </div>

      {/* Tags Grid */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">All Tags</h3>
        </div>
        <div className="p-6">
          {tags.length === 0 ? (
            <div className="text-center py-8">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No tags
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating your first tag.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {tags.map((tag) => (
                <div
                  key={tag._id}
                  className="relative bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
                >
                  {/* Tag Color Indicator */}
                  <div className="flex items-center space-x-3 mb-3">
                    <div
                      className={`w-4 h-4 rounded-full ${
                        getColorClasses(tag.color).bg
                      }`}
                    ></div>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        getColorClasses(tag.color).bg
                      } ${getColorClasses(tag.color).text}`}
                    >
                      {tag.tagName}
                    </span>
                  </div>

                  {/* Tag Info */}
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-gray-900 mb-1">
                      {tag.tagName}
                    </h4>
                    <p className="text-xs text-gray-500">
                      Used {tag.usageCount} time
                      {tag.usageCount !== 1 ? "s" : ""}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {/* Edit Button */}
                      <button
                        onClick={() => openEditModal(tag)}
                        className="text-gray-400 hover:text-blue-600 transition-colors duration-200"
                        title="Edit tag"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteTag(tag._id)}
                        className="text-gray-400 hover:text-red-600 transition-colors duration-200"
                        title="Delete tag"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>

                    {/* Usage Count Badge */}
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-800">
                      {tag.usageCount}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <TagModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={handleModalSubmit}
        editingTag={editingTag}
        isEditing={isEditing}
      />
    </div>
  );
};

export default TagsPage;
