"use client";
import React, { useEffect, useState } from "react";

// Import modular components
import DashboardSummary from "@/app/components/dashboard/DashboardSummary";
import ContactsByCompanyChart from "@/app/components/charts/ContactsByCompanyChart";
import ActivitiesTimelineChart from "@/app/components/charts/ActivitiesTimelineChart";
import TagDistributionChart from "@/app/components/charts/TagDistributionChart";

// Import updated services with proper ObjectId support
import {
  fetchDashboardData,
  type DashboardData,
  type Contact,
  type Activity,
  type Tag,
} from "@/app/components/services/dashboardService";

const DashboardPage = () => {
  // State for dashboard data
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load dashboard data
  const loadDashboardData = React.useCallback(async () => {
    console.log("🎯 DASHBOARD PAGE: Starting data load...");
    setLoading(true);
    setError(null);

    try {
      console.log(
        "📡 DASHBOARD PAGE: Calling fetchDashboardData() - should make ONLY 1 API call"
      );
      const data = await fetchDashboardData();
      if (data) {
        console.log("✅ DASHBOARD PAGE: Data received successfully:", data);
        setDashboardData(data);
      } else {
        console.error("❌ DASHBOARD PAGE: No data received");
        setError("Failed to load dashboard data");
      }
    } catch (error) {
      console.error("❌ DASHBOARD PAGE: Error loading dashboard data:", error);
      setError("An error occurred while loading dashboard data");
    } finally {
      setLoading(false);
      console.log("🎯 DASHBOARD PAGE: Data load complete");
    }
  }, []);

  // Initial data load
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Reload data when filters change (already handled by loadDashboardData dependencies)

  // Convert dashboard data to legacy format for existing components
  const getLegacyData = () => {
    if (!dashboardData) return { contacts: [], activities: [], tags: [] };

    // Create minimal contact data for summary component
    const contacts: Contact[] = Array.from(
      { length: dashboardData.stats.totalContacts },
      (_, i) => ({
        _id: `contact-${i}`,
        name: `Contact ${i + 1}`,
        email: `contact${i + 1}@example.com`,
        company: "Various",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastInteraction: new Date().toISOString(),
      })
    );

    // Create minimal activity data for summary component
    const activities: Activity[] = Array.from(
      { length: dashboardData.stats.totalActivities },
      (_, i) => ({
        _id: `activity-${i}`,
        action: "contact_created",
        entityType: "contact",
        entityId: `entity-${i}`,
        entityName: `Entity ${i + 1}`,
        timestamp: new Date().toISOString(),
      })
    );

    // Convert tag distribution to legacy tag format
    const tags: Tag[] = dashboardData.tagDistribution.map((tagDist, i) => ({
      _id: `tag-${i}`,
      tagName: tagDist.name,
      color: tagDist.color,
      usageCount: tagDist.value,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    return { contacts, activities, tags };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️ Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadDashboardData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-600">No dashboard data available</p>
      </div>
    );
  }

  const legacyData = getLegacyData();

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

        {/* Summary Cards Row - using optimized data */}
        <DashboardSummary
          contacts={legacyData.contacts}
          activities={legacyData.activities}
          tags={legacyData.tags}
        />

        {/* Charts Section - using server-side processed data */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ContactsByCompanyChart data={dashboardData.contactsByCompany} />
          <ActivitiesTimelineChart data={dashboardData.activityTimeline} />
          <TagDistributionChart data={dashboardData.tagDistribution} />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
