"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";

// Type definitions for the modal component
interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  tags: string;
  notes: string;
}

interface Contact extends Omit<ContactFormData, "tags"> {
  _id: string;
  tags: (string | Tag)[]; // Can be strings or full tag objects
  createdAt: Date;
  updatedAt: Date;
  lastInteraction: Date;
}

interface Tag {
  _id: string;
  tagName: string;
  color: string;
  usageCount: number;
}

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (contactData: Omit<Contact, "_id">, isEdit?: boolean) => void;
  editingContact?: Contact | null;
  isEditing: boolean;
}

const ContactModal: React.FC<ContactModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingContact,
  isEditing,
}) => {
  // STEP 1: FORM STATE MANAGEMENT
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    phone: "",
    company: "",
    tags: "",
    notes: "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showTagDropdown, setShowTagDropdown] = useState(false);

  // STEP 2: HANDLE CLICK OUTSIDE TO CLOSE TAG DROPDOWN
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showTagDropdown && !target.closest(".tag-dropdown-container")) {
        setShowTagDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showTagDropdown]);

  // STEP 3: PRE-FILL FORM WHEN EDITING EXISTING CONTACT
  useEffect(() => {
    if (isEditing && editingContact) {
      // Convert mixed tag format to string array for form
      const tagStrings = editingContact.tags.map((tag) =>
        typeof tag === "string" ? tag : tag.tagName
      );

      setFormData({
        name: editingContact.name,
        email: editingContact.email,
        phone: editingContact.phone || "",
        company: editingContact.company || "",
        tags: tagStrings.join(", "),
        notes: editingContact.notes || "",
      });
      setSelectedTags(tagStrings);
    } else {
      // Reset form for new contact
      setFormData({
        name: "",
        email: "",
        phone: "",
        company: "",
        tags: "",
        notes: "",
      });
      setSelectedTags([]);
    }
    setErrors({});
  }, [isEditing, editingContact, isOpen]);

  // STEP 4: FETCH AVAILABLE TAGS WHEN MODAL OPENS
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await axios.get("/api/tags");
        const tagsData = response.data as { success: boolean; tags: Tag[] };
        if (tagsData.success) {
          setAvailableTags(tagsData.tags);
        }
      } catch (error) {
        console.error("Error fetching tags:", error);
      }
    };

    if (isOpen) {
      fetchTags();
    }
  }, [isOpen]);

  // STEP 5: HANDLE INPUT CHANGES
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Update selectedTags when tags input changes manually
    if (name === "tags") {
      const tagArray = value
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag);
      setSelectedTags(tagArray);
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // STEP 6: HANDLE TAG SELECTION FROM DROPDOWN
  const handleTagSelect = (tagName: string) => {
    if (!selectedTags.includes(tagName)) {
      const newSelectedTags = [...selectedTags, tagName];
      setSelectedTags(newSelectedTags);
      setFormData((prev) => ({
        ...prev,
        tags: newSelectedTags.join(", "),
      }));
    }
    setShowTagDropdown(false);
  };

  // STEP 7: REMOVE SELECTED TAG
  const removeTag = (tagToRemove: string) => {
    const newSelectedTags = selectedTags.filter((tag) => tag !== tagToRemove);
    setSelectedTags(newSelectedTags);
    setFormData((prev) => ({
      ...prev,
      tags: newSelectedTags.join(", "),
    }));
  };

  // STEP 8: FORM VALIDATION
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // STEP 9: HANDLE FORM SUBMISSION
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      const contactData: Omit<Contact, "_id"> = {
        ...formData,
        tags: formData.tags
          ? formData.tags.split(",").map((tag) => tag.trim())
          : [],
        createdAt: editingContact?.createdAt || new Date(),
        updatedAt: new Date(),
        lastInteraction: new Date(),
      };

      onSubmit(contactData, isEditing);
    }
  };

  // Don't render anything if modal is closed
  if (!isOpen) return null;

  // STEP 10: RENDER THE MODAL
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal Container */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md transform transition-all">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {isEditing ? "Edit Contact" : "Create New Contact"}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="Close modal"
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
            {/* Name Field - Required */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.name ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="Enter full name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Email Field - Required */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.email ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="Enter email address"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Phone Field - Optional */}
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Phone
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter phone number"
              />
            </div>

            {/* Company Field - Optional */}
            <div>
              <label
                htmlFor="company"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Company
              </label>
              <input
                type="text"
                id="company"
                name="company"
                value={formData.company}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter company name"
              />
            </div>

            {/* Tags Field - Optional with Dropdown */}
            <div className="relative tag-dropdown-container">
              <label
                htmlFor="tags"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Tags
              </label>

              {/* Selected Tags Display */}
              <div className="mb-2">
                {selectedTags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedTags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Tag Selection Dropdown */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setShowTagDropdown(!showTagDropdown)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex justify-between items-center"
                >
                  <span className="text-gray-500">
                    {selectedTags.length > 0
                      ? `${selectedTags.length} tag(s) selected`
                      : "Select tags..."}
                  </span>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      showTagDropdown ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Dropdown Options */}
                {showTagDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {availableTags.length > 0 ? (
                      availableTags.map((tag) => (
                        <button
                          key={tag._id}
                          type="button"
                          onClick={() => handleTagSelect(tag.tagName)}
                          disabled={selectedTags.includes(tag.tagName)}
                          className={`w-full px-3 py-2 text-left hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed ${
                            selectedTags.includes(tag.tagName)
                              ? "bg-blue-50 text-blue-700"
                              : "text-gray-900"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>{tag.tagName}</span>
                            <div
                              className={`w-3 h-3 rounded-full border border-gray-200`}
                              title={`Color: ${tag.color}`}
                            />
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-gray-500 text-sm">
                        No tags available. Create some tags first.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Manual Tag Input */}
              <input
                type="text"
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Or enter tags manually (comma-separated)"
              />
              <p className="mt-1 text-xs text-gray-500">
                Select from dropdown above or enter tags manually separated by
                commas
              </p>
            </div>

            {/* Notes Field - Optional */}
            <div>
              <label
                htmlFor="notes"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                value={formData.notes}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter any additional notes"
              />
            </div>

            {/* Form Buttons */}
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
                {isEditing ? "Update Contact" : "Create Contact"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ContactModal;
