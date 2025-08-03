"use client";

import React from "react";

// Type definitions for the contact card component
interface Contact {
  _id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  tags: (string | Tag)[]; // Can be strings or full tag objects
  notes: string;
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

interface ContactCardProps {
  contact: Contact;
  index: number;
  selectedContacts: string[];
  availableTags: Tag[];
  onSelectContact: (contactId: string, isSelected: boolean) => void;
  onEditContact: (contact: Contact) => void;
  onDeleteContact: (contactId: string) => void;
}

const ContactCard: React.FC<ContactCardProps> = ({
  contact,
  index,
  selectedContacts,
  availableTags,
  onSelectContact,
  onEditContact,
  onDeleteContact,
}) => {
  // Check if this contact is selected
  const isSelected = selectedContacts.includes(contact._id);

  // Handle checkbox change
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSelectContact(contact._id, e.target.checked);
  };

  // Get tag color class based on color value
  const getTagColorClass = (color: string) => {
    const colorMap: { [key: string]: string } = {
      "#3B82F6": "bg-blue-500",
      "#10B981": "bg-green-500",
      "#F59E0B": "bg-yellow-500",
      "#8B5CF6": "bg-purple-500",
      "#EF4444": "bg-red-500",
      "#DC2626": "bg-red-600",
      "#059669": "bg-green-600",
    };
    return colorMap[color] || "bg-gray-500";
  };

  return (
    <div
      key={contact._id || index}
      className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
    >
      {/* CHECKBOX FOR BULK SELECTION */}
      <div className="flex-shrink-0">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={handleCheckboxChange}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          aria-label={`Select ${contact.name}`}
        />
      </div>

      {/* CONTACT AVATAR */}
      <div className="flex-shrink-0">
        <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center">
          <span className="text-lg font-medium text-white">
            {contact.name.charAt(0).toUpperCase()}
          </span>
        </div>
      </div>

      {/* CONTACT INFORMATION */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Contact Name */}
            <p className="text-lg font-medium text-gray-900 truncate">
              {contact.name}
            </p>

            {/* Contact Email */}
            <p className="text-sm text-gray-600 truncate">{contact.email}</p>

            {/* Company (if available) */}
            {contact.company && (
              <p className="text-sm font-medium text-gray-700 mt-1">
                🏢 {contact.company}
              </p>
            )}

            {/* Last Interaction Date */}
            <p className="text-xs text-gray-500 mt-1">
              Last interaction:{" "}
              {new Date(contact.lastInteraction).toLocaleDateString()}
            </p>

            {/* Tags Display */}
            {contact.tags && contact.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {contact.tags.map((tag, tagIndex) => {
                  // Handle both string tags and Tag objects
                  let tagName: string;
                  let tagColor: string;

                  if (typeof tag === "string") {
                    // If it's a string, try to find the tag object in availableTags
                    tagName = tag;
                    const foundTag = availableTags.find(
                      (t) => t.tagName === tag
                    );
                    tagColor = foundTag?.color || "#6B7280";
                  } else {
                    // If it's already a Tag object, use its properties
                    tagName = tag.tagName;
                    tagColor = tag.color || "#6B7280";
                  }

                  const colorClass = getTagColorClass(tagColor);

                  return (
                    <span
                      key={tagIndex}
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white ${colorClass}`}
                    >
                      {tagName}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex items-center space-x-2 ml-4">
            {/* Edit Button */}
            <button
              className="text-gray-400 hover:text-blue-600 transition-colors duration-200 p-1"
              title="Edit contact"
              onClick={() => onEditContact(contact)}
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
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>

            {/* Delete Button */}
            <button
              className="text-gray-400 hover:text-red-600 transition-colors duration-200 p-1"
              title="Delete contact"
              onClick={() => onDeleteContact(contact._id)}
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
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactCard;
