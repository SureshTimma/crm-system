"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { CSVUploader } from "@/app/components/contacts/CSVUploader";
import ContactModal from "@/app/components/contacts/ContactModal";
import ContactCard from "@/app/components/contacts/ContactCard";

// STEP 1: TYPE DEFINITIONS (as per Project_Interns.txt requirements)
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

interface Tag {
  _id: string;
  tagName: string;
  color: string;
  usageCount: number;
}

interface ContactResponse {
  success: boolean;
  contact: Contact;
}

const ContactsPage = () => {
  // STEP 2: STATE MANAGEMENT (simplified according to requirements)

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // CSV uploader state
  const [showCSVUploader, setShowCSVUploader] = useState(false);

  // Main data states
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);

  // Search and Filter states (as per PDF requirements)
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTagFilter, setSelectedTagFilter] = useState("");

  // Pagination states (backend pagination)
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Bulk actions state (as per PDF requirements)
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);

  // Refresh trigger for re-fetching data
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // STEP 3: BACKEND DATA FETCHING (All operations handled by backend)
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        setLoading(true);

        // Build query parameters for backend API
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: "20", // Show 20 contacts per page
          sortBy: "name", // Default sort by name
          sortOrder: "asc", // Ascending order
        });

        // Add search term if provided
        if (searchTerm) {
          params.append("search", searchTerm);
        }

        // Add tag filter if selected
        if (selectedTagFilter) {
          params.append("tag", selectedTagFilter);
        }

        // Call backend API
        const response = await axios.get(`/api/contacts?${params.toString()}`);

        // Type the response data for TypeScript
        const data = response.data as {
          success: boolean;
          contacts: Contact[];
          pagination: {
            currentPage: number;
            totalPages: number;
            totalCount: number;
          };
        };

        if (data.success) {
          setContacts(data.contacts);
          setCurrentPage(data.pagination.currentPage);
          setTotalPages(data.pagination.totalPages);
          setTotalCount(data.pagination.totalCount);
        }
      } catch (error) {
        console.error("Error fetching contacts:", error);
      } finally {
        setLoading(false);
      }
    };

    // Debounced search - wait 300ms after user stops typing
    const timeoutId = setTimeout(fetchContacts, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, selectedTagFilter, currentPage, refreshTrigger]);

  // STEP 4: CLEAR SELECTIONS WHEN FILTERS CHANGE
  useEffect(() => {
    setSelectedContacts([]); // Clear bulk selections when page/filters change
  }, [currentPage, searchTerm, selectedTagFilter]);

  // STEP 5: CRUD OPERATIONS (Create, Read, Update, Delete)

  // Create new contact
  const handleCreateContact = async (contactData: Omit<Contact, "_id">) => {
    try {
      const response = await axios.post("/api/contacts", contactData);
      const data = response.data as ContactResponse;

      if (data.success) {
        // Refresh the contacts list
        setRefreshTrigger((prev) => prev + 1);
        closeModal();

        // Log activity for audit trail
        await axios.post("/api/activities", {
          action: "contact_created",
          entityType: "contact",
          entityId: data.contact._id,
          entityName: data.contact.name,
        });
      }
    } catch (error) {
      console.error("Error creating contact:", error);
      alert("Failed to create contact. Please try again.");
    }
  };

  // Update existing contact
  const handleUpdateContact = async (contactData: Omit<Contact, "_id">) => {
    try {
      if (!editingContact) return;

      const response = await axios.put(
        `/api/contacts?contactId=${editingContact._id}`,
        contactData
      );
      const data = response.data as ContactResponse;

      if (data.success) {
        // Update contact in local state (optimistic update)
        setContacts((prevContacts) =>
          prevContacts.map((contact) =>
            contact._id === editingContact._id
              ? { ...contact, ...contactData, updatedAt: new Date() }
              : contact
          )
        );

        closeModal();

        // Log activity
        await axios.post("/api/activities", {
          action: "contact_updated",
          entityType: "contact",
          entityId: editingContact._id,
          entityName: contactData.name,
        });
      }
    } catch (error) {
      console.error("Error updating contact:", error);
      alert("Failed to update contact. Please try again.");
    }
  };

  // Delete single contact
  const handleDeleteContact = async (contactId: string) => {
    try {
      const response = await axios.delete(`/api/contacts?id=${contactId}`);
      const data = response.data as ContactResponse;

      if (data.success) {
        setRefreshTrigger((prev) => prev + 1);

        // Log activity
        await axios.post("/api/activities", {
          action: "contact_deleted",
          entityType: "contact",
          entityId: contactId,
          entityName: "Deleted Contact",
        });
      }
    } catch (error) {
      console.error("Error deleting contact:", error);
    }
  };

  // Handle modal form submission
  const handleModalSubmit = (
    contactData: Omit<Contact, "_id">,
    isEdit?: boolean
  ) => {
    if (isEdit) {
      handleUpdateContact(contactData);
    } else {
      handleCreateContact(contactData);
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

  // STEP 6: BULK ACTIONS (Select multiple contacts and perform actions)

  // Select or unselect all contacts on current page
  const handleSelectAll = () => {
    if (selectedContacts.length === contacts.length) {
      // If all are selected, unselect all
      setSelectedContacts([]);
    } else {
      // If not all are selected, select all
      setSelectedContacts(contacts.map((contact) => contact._id));
    }
  };

  // Delete multiple selected contacts
  const handleBulkDelete = async () => {
    if (selectedContacts.length === 0) return;

    // Ask for confirmation before deleting
    if (
      window.confirm(
        `Are you sure you want to delete ${selectedContacts.length} contact(s)?`
      )
    ) {
      try {
        // Delete each selected contact
        await Promise.all(
          selectedContacts.map((contactId) =>
            axios.delete(`/api/contacts?id=${contactId}`)
          )
        );

        // Log bulk delete activity for audit trail
        await axios.post("/api/activities", {
          action: "bulk_contacts_deleted",
          entityType: "contact",
          entityId: "bulk",
          entityName: `${selectedContacts.length} contacts`,
        });

        // Clear selection and refresh list
        setSelectedContacts([]);
        setRefreshTrigger((prev) => prev + 1);
      } catch (error) {
        console.error("Error deleting contacts:", error);
        alert("Error deleting some contacts. Please try again.");
      }
    }
  };

  // Add a tag to multiple selected contacts
  const handleBulkAddTag = async (tagName: string) => {
    if (selectedContacts.length === 0) return;

    try {
      // Add tag to each selected contact (if they don't already have it)
      await Promise.all(
        selectedContacts.map(async (contactId) => {
          const contact = contacts.find((c) => c._id === contactId);
          if (contact && !contact.tags.includes(tagName)) {
            const updatedTags = [...contact.tags, tagName];
            return axios.put(`/api/contacts?contactId=${contactId}`, {
              ...contact,
              tags: updatedTags,
              updatedAt: new Date(),
            });
          }
        })
      );

      // Log bulk tag addition activity
      await axios.post("/api/activities", {
        action: "bulk_tag_added",
        entityType: "contact",
        entityId: "bulk",
        entityName: `Tag "${tagName}" added to ${selectedContacts.length} contacts`,
      });

      // Clear selection and refresh list
      setSelectedContacts([]);
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error("Error adding tags:", error);
      alert("Error adding tag to some contacts. Please try again.");
    }
  };

  // STEP 7: LOAD AVAILABLE TAGS (For displaying tag colors)
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
    fetchTags();
  }, []);

  // STEP 8: RENDER THE CONTACTS PAGE
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Contacts</h1>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowCSVUploader(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium transition-colors duration-200 flex items-center space-x-2"
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
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <span>Import CSV</span>
          </button>

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
      </div>

      {/* SEARCH AND FILTER CONTROLS */}
      <div className="bg-white shadow rounded-lg mb-6 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search Input - searches name, email, company, phone */}
          <div>
            <label
              htmlFor="search"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Search Contacts
            </label>
            <div className="relative">
              <input
                type="text"
                id="search"
                placeholder="Search by name, email, company, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Tag Filter Dropdown - filters by specific tag */}
          <div>
            <label
              htmlFor="tagFilter"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Filter by Tag
            </label>
            <select
              id="tagFilter"
              value={selectedTagFilter}
              onChange={(e) => setSelectedTagFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Tags</option>
              {availableTags.map((tag) => (
                <option key={tag._id} value={tag.tagName}>
                  {tag.tagName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Clear Filters Button - shows only when filters are active */}
        {(searchTerm || selectedTagFilter) && (
          <div className="mt-4">
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedTagFilter("");
              }}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Bulk Actions Bar */}
      {selectedContacts.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-800 font-medium">
              {selectedContacts.length} contact(s) selected
            </span>
            <div className="flex items-center space-x-3">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleBulkAddTag(e.target.value);
                    e.target.value = "";
                  }
                }}
                className="text-sm px-3 py-1 border border-blue-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                defaultValue=""
                title="Add tag to selected contacts"
              >
                <option value="" disabled>
                  Add Tag
                </option>
                {availableTags.map((tag) => (
                  <option key={tag._id} value={tag.tagName}>
                    {tag.tagName}
                  </option>
                ))}
              </select>

              <button
                onClick={handleBulkDelete}
                className="text-sm px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-1 focus:ring-red-500"
              >
                Delete Selected
              </button>

              <button
                onClick={() => setSelectedContacts([])}
                className="text-sm px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {contacts.length} of {totalCount} contacts
            {searchTerm && ` matching "${searchTerm}"`}
            {selectedTagFilter && ` with tag "${selectedTagFilter}"`}
            {loading && " (loading...)"}
          </p>

          {/* Select All Checkbox */}
          {contacts.length > 0 && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="selectAll"
                checked={
                  selectedContacts.length === contacts.length &&
                  contacts.length > 0
                }
                onChange={handleSelectAll}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="selectAll" className="text-sm text-gray-600">
                Select All ({contacts.length})
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Contacts List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">
              Recent Contacts
            </h3>
            <div className="text-sm text-gray-500">
              {contacts.length} contact{contacts.length !== 1 ? "s" : ""}
              (Page {currentPage} of {totalPages}, {totalCount} total)
            </div>
          </div>
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
                {contacts.length === 0 ? "No contacts" : "No matching contacts"}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {contacts.length === 0
                  ? "Get started by creating a new contact."
                  : "Try adjusting your search or filter criteria."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {contacts.map((contact, index) => (
                <ContactCard
                  key={contact._id || index}
                  contact={contact}
                  index={index}
                  selectedContacts={selectedContacts}
                  availableTags={availableTags}
                  onSelectContact={(contactId, isSelected) => {
                    if (isSelected) {
                      setSelectedContacts([...selectedContacts, contactId]);
                    } else {
                      setSelectedContacts(
                        selectedContacts.filter((id) => id !== contactId)
                      );
                    }
                  }}
                  onEditContact={openEditModal}
                  onDeleteContact={handleDeleteContact}
                />
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center items-center gap-4">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-600"
          >
            Previous
          </button>

          <span className="text-gray-600">
            Page {currentPage} of {totalPages} (Total: {totalCount} contacts)
          </span>

          <button
            onClick={() =>
              setCurrentPage(Math.min(totalPages, currentPage + 1))
            }
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-600"
          >
            Next
          </button>
        </div>
      )}

      {/* CSV Uploader */}
      {showCSVUploader && (
        <CSVUploader
          onClose={() => setShowCSVUploader(false)}
          onImportComplete={() => {
            setRefreshTrigger((prev) => prev + 1);
            setShowCSVUploader(false);
          }}
        />
      )}
    </div>
  );
};

export default ContactsPage;
