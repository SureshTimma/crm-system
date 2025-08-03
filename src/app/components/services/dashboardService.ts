import axios from "axios";

// Updated TypeScript interfaces to match project requirements
interface Contact {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  tags?: string[]; // ObjectId references as strings
  notes?: string;
  createdBy?: string; // ObjectId reference as string
  createdAt: string;
  updatedAt: string;
  lastInteraction: string;
}

interface Activity {
  _id: string;
  user?: string; // ObjectId reference as string
  userName?: string; // Populated user name
  userEmail?: string; // Populated user email
  action: string;
  entityType: string;
  entityId: string; // ObjectId reference as string
  entityName: string;
  timestamp: string;
}

interface Tag {
  _id: string;
  tagName: string;
  color: string;
  usageCount: number;
  createdBy?: string; // ObjectId reference as string
  createdAt: string;
  updatedAt: string;
}

// New dashboard-specific interfaces
interface DashboardStats {
  totalContacts: number;
  newContactsThisWeek: number;
  totalActivities: number;
  activeTags: number;
}

interface ContactsByCompany {
  company: string;
  contacts: number;
}

interface ActivityTimeline {
  date: string;
  day: number;
  activities: number;
}

interface TagDistribution {
  name: string;
  value: number;
  color: string;
}

interface DashboardData {
  stats: DashboardStats;
  contactsByCompany: ContactsByCompany[];
  activityTimeline: ActivityTimeline[];
  tagDistribution: TagDistribution[];
}

// Main dashboard service function (simplified - no filters as per project requirements)
export const fetchDashboardData = async (): Promise<DashboardData | null> => {
  try {
    console.log("🚀 DASHBOARD: Making single API call to /api/dashboard");
    const response = await axios.get("/api/dashboard");
    console.log("✅ DASHBOARD: Single API response received:", response.data);

    const data = response.data as { success: boolean; data: DashboardData };
    if (data.success) {
      console.log(
        "✅ DASHBOARD: Data processed successfully - NO additional API calls needed"
      );
      return data.data;
    }
    return null;
  } catch (error) {
    console.error("❌ DASHBOARD: Error fetching dashboard data:", error);
    return null;
  }
};

// Backward compatibility functions (deprecated - use fetchDashboardData instead)
export const fetchContacts = async (): Promise<Contact[]> => {
  console.warn(
    "⚠️ DEPRECATED: fetchContacts() called - Use fetchDashboardData() instead for dashboard"
  );
  try {
    const response = await axios.get("/api/contacts");
    console.log("Contacts response:", response.data);

    const data = response.data as { contacts?: Contact[] } | Contact[];
    if (Array.isArray(data)) {
      return data;
    } else if (
      "contacts" in data &&
      data.contacts &&
      Array.isArray(data.contacts)
    ) {
      return data.contacts;
    }
    return [];
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return [];
  }
};

export const fetchActivities = async (): Promise<Activity[]> => {
  console.warn(
    "⚠️ DEPRECATED: fetchActivities() called - Use fetchDashboardData() instead for dashboard"
  );
  try {
    const response = await axios.get("/api/activities");
    console.log("Activities response:", response.data);
    const data = response.data as {
      success: boolean;
      activities: Activity[];
    };
    return data.success ? data.activities : [];
  } catch (error) {
    console.error("Error fetching activities:", error);
    return [];
  }
};

export const fetchTags = async (): Promise<Tag[]> => {
  console.warn(
    "⚠️ DEPRECATED: fetchTags() called - Use fetchDashboardData() instead for dashboard"
  );
  try {
    const response = await axios.get("/api/tags");
    console.log("Tags response:", response.data);
    const data = response.data as { success: boolean; tags: Tag[] };
    return data.success ? data.tags : [];
  } catch (error) {
    console.error("Error fetching tags:", error);
    return [];
  }
};

// Export types for use in components
export type {
  Contact,
  Activity,
  Tag,
  DashboardStats,
  ContactsByCompany,
  ActivityTimeline,
  TagDistribution,
  DashboardData,
};
