"use client";

import React, { useState } from "react";
import axios from "axios";
import { useEffect } from "react";

// Types
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
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  lastInteraction: Date;
}

// API Response interfaces for type safety
interface ContactResponse {
  success: boolean;
  contact: Contact;
}

interface ContactsResponse {
  success: boolean;
  contacts: Contact[];
}

// Modal Component
const ContactModal = ({
  isOpen,
  onClose,
  onSubmit,
  editingContact,
  isEditing,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (contactData: Omit<Contact, "_id">, isEdit?: boolean) => void;
  editingContact?: Contact | null;
  isEditing: boolean;
}) => {
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    phone: "",
    company: "",
    tags: "",
    notes: "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // ✅ Pre-fill form when editing
  useEffect(() => {
    if (isEditing && editingContact) {
      setFormData({
        name: editingContact.name,
        email: editingContact.email,
        phone: editingContact.phone || "",
        company: editingContact.company || "",
        tags: editingContact.tags.join(", "),
        notes: editingContact.notes || "",
      });
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
    }
    setErrors({});
  }, [isEditing, editingContact, isOpen]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      const contactData: Omit<Contact, "_id"> = {
        ...formData,
        tags: formData.tags
          ? formData.tags.split(",").map((tag) => tag.trim())
          : [],
        // ✅ Fix: Keep original createdAt, but use current form data for everything else
        createdAt: editingContact?.createdAt || new Date(),
        updatedAt: new Date(),
        lastInteraction: new Date(),
      };

      console.log("Form data at submit:", formData); // ✅ Debug log
      console.log("Submitting contact data:", contactData); // ✅ Debug log

      onSubmit(contactData, isEditing);

      // ✅ Don't reset form or close modal here - let parent handle it
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
            {/* Name */}
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

            {/* Email */}
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

            {/* Phone */}
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

            {/* Company */}
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

            {/* Tags */}
            <div>
              <label
                htmlFor="tags"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Tags
              </label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter tags separated by commas"
              />
              <p className="mt-1 text-xs text-gray-500">
                Separate multiple tags with commas
              </p>
            </div>

            {/* Notes */}
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
                {isEditing ? "Update Contact" : "Create Contact"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const ContactsPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const handleUpdateContact = async (contactData: Omit<Contact, "_id">) => {
    try {
      if (!editingContact) return;

      console.log("Sending update data to backend:", contactData); // ✅ Debug log

      const response = await axios.put(
        `/api/contacts?contactId=${editingContact._id}`,
        contactData
      );

      const responseData = response.data as ContactResponse;
      if (responseData.success) {
        // ✅ Update contact directly in state
        setContacts((prevContacts) =>
          prevContacts.map((contact) =>
            contact._id === editingContact._id
              ? { ...contact, ...contactData, updatedAt: new Date() }
              : contact
          )
        );

        await axios.post("/api/activities", {
          action: "contact_updated",
          entityType: "contact",
          entityId: editingContact._id,
          entityName: contactData.name,
        });

        // ✅ Close modal after successful update
        closeModal();

        console.log("Contact updated successfully");
      } else {
        console.error("Update failed:", response.data);
        alert("Failed to update contact. Please try again.");
      }
    } catch (error) {
      console.error("Error updating contact:", error);
      alert("An error occurred while updating the contact.");
    }
  };

  const handleCreateContact = async (contactData: Omit<Contact, "_id">) => {
    try {
      const response = await axios.post("/api/contacts", contactData);

      const responseData = response.data as ContactResponse;
      if (responseData.success) {
        setRefreshTrigger((prev) => prev + 1);
        closeModal();
        // console.log("Contact created successfully", responseData);

        await axios.post("./api/activities", {
          action: "contact_created",
          entityType: "contact",
          entityId: responseData.contact._id,
          entityName: responseData.contact.name,
        });
        console.log("New activity logged:", newActivity.data);
      } else {
        console.error("Creation failed:", response.data);
        alert("Failed to create contact. Please try again.");
      }
    } catch (error) {
      console.error("Error creating contact:", error);
      alert("An error occurred while creating the contact.");
    }
  };

  const handleModalSubmit = (
    contactData: Omit<Contact, "_id">,
    isEdit?: boolean
  ) => {
    console.log("Modal submit - contactData:", contactData);
    console.log("Modal submit - isEdit:", isEdit);

    if (isEdit) {
      handleUpdateContact(contactData);
    } else {
      handleCreateContact(contactData);
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    try {
      const response = await axios.delete(`/api/contacts?id=${contactId}`);
      console.log(response.data);
      if ((response.data as ContactResponse).success) {
        setRefreshTrigger((prev) => prev + 1);
      }
      await axios.post("/api/activities", {
        action: "contact_deleted",
        entityType: "contact",
        entityId: contactId,
        entityName: response.data.contact.name,
      });
    } catch (error) {
      console.error("Error deleting contact:", error);
    }
  };

  const openEditModal = (contact: Contact) => {
    setEditingContact(contact);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingContact(null);
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingContact(null);
    setIsEditing(false);
  };

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const contactsData = await axios.get("/api/contacts");
        console.log(contactsData.data);

        // Handle both response formats
        const responseData = contactsData.data as ContactsResponse;
        if (responseData.success) {
          setContacts(responseData.contacts);
        } else {
          // Fallback for array response
          setContacts(contactsData.data as Contact[]);
        }
      } catch (error) {
        console.error("Error fetching contacts:", error);
      }
    };
    fetchContacts();
  }, [refreshTrigger]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Contacts</h1>
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
          <span>Create Contact</span>
        </button>
      </div>

      {/* Contacts List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Contacts</h3>
        </div>
        <div className="p-6">
          {contacts.length === 0 ? (
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
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No contacts
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new contact.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {contacts.map((contact, index) => (
                <div
                  key={contact._id || index}
                  className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {contact.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {contact.name}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {contact.email}
                    </p>
                    {contact.company && (
                      <p className="text-sm text-gray-500 truncate">
                        {contact.company}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0 flex items-center space-x-4">
                    {contact.phone && (
                      <p className="text-sm text-gray-500">{contact.phone}</p>
                    )}
                    <div className="flex items-center space-x-2">
                      {/* Edit Icon */}
                      <button
                        className="text-gray-400 hover:text-blue-600 transition-colors duration-200"
                        title="Edit contact"
                        onClick={() => openEditModal(contact)}
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

                      {/* Delete Icon */}
                      <button
                        className="text-gray-400 hover:text-red-600 transition-colors duration-200"
                        title="Delete contact"
                        onClick={() => handleDeleteContact(contact._id)}
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
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <ContactModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={handleModalSubmit}
        editingContact={editingContact}
        isEditing={isEditing}
      />
    </div>
  );
};

export default ContactsPage;
