import axios from "axios";

// API service functions for dashboard data
interface Contact {
  _id: string;
  name: string;
  email: string;
  company?: string;
  createdAt: string;
}

interface Activity {
  _id: string;
  timestamp: string;
  action: string;
  entityType: string;
}

interface Tag {
  _id: string;
  tagName: string;
  color: string;
  usageCount: number;
}

export const fetchContacts = async (): Promise<Contact[]> => {
  try {
    const response = await axios.get("/api/contacts");
    console.log("Contacts response:", response.data);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return [];
  }
};

export const fetchActivities = async (): Promise<Activity[]> => {
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
