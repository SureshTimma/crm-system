"use client";
import React, { useEffect, useState } from "react";

// Import modular components
import DashboardSummary from "@/app/components/dashboard/DashboardSummary";
import ContactsByCompanyChart from "@/app/components/charts/ContactsByCompanyChart";
import ActivitiesTimelineChart from "@/app/components/charts/ActivitiesTimelineChart";
import TagDistributionChart from "@/app/components/charts/TagDistributionChart";

// Import services and utilities
import {
  fetchContacts,
  fetchActivities,
  fetchTags,
} from "@/app/components/services/dashboardService";
import {
  getContactsByCompany,
  getActivitiesTimeline,
  getTagDistribution,
} from "@/app/components/utils/dashboardUtils";

const DashboardPage = () => {
  // TypeScript interfaces
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

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const [contactsData, activitiesData, tagsData] = await Promise.all([
          fetchContacts(),
          fetchActivities(),
          fetchTags(),
        ]);

        setContacts(contactsData);
        setActivities(activitiesData);
        setTags(tagsData);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // Process data for charts
  const companyData = getContactsByCompany(contacts);
  const timelineData = getActivitiesTimeline(activities);
  const tagData = getTagDistribution(tags);

  // Debug: Log the processed data
  console.log("Dashboard Debug - Contacts:", contacts.length);
  console.log("Dashboard Debug - Company Data:", companyData);
  console.log("Dashboard Debug - Activities:", activities.length);
  console.log("Dashboard Debug - Tags:", tags.length);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

        {/* Summary Cards Row */}
        <DashboardSummary
          contacts={contacts}
          activities={activities}
          tags={tags}
        />

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ContactsByCompanyChart data={companyData} />
          <ActivitiesTimelineChart data={timelineData} />
          <TagDistributionChart data={tagData} />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
