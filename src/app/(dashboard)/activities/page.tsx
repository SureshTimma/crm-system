"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import ActivityTimeline from "@/app/components/activities/ActivityTimeline";

// Updated interface to match proper ObjectId schema
interface User {
  _id: string;
  name: string;
  email: string;
}

interface Activity {
  _id: string;
  user: User;
  action: "CREATE" | "UPDATE" | "DELETE" | "VIEW";
  entityType: "CONTACT" | "TAG" | "USER";
  entityId: string;
  entityName: string;
  details?: {
    before?: Record<string, string>;
    after?: Record<string, string>;
    metadata?: Record<string, string>;
  };
  timestamp: string;
}

interface RawActivity {
  _id: string;
  user?: User;
  action: "CREATE" | "UPDATE" | "DELETE" | "VIEW";
  entityType: "CONTACT" | "TAG" | "USER";
  entityId: string;
  entityName: string;
  details?: {
    before?: Record<string, string>;
    after?: Record<string, string>;
    metadata?: Record<string, string>;
  };
  timestamp: string;
}

interface ActivitiesResponse {
  success: boolean;
  activities: RawActivity[];
  pagination: {
    currentPage: number;
    hasMore: boolean;
    nextCursor: number | null;
    totalCount: number;
    limit: number;
  };
}

const ActivitiesPage = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  // Filter states as per Project_Interns.txt requirements
  const [dateRange, setDateRange] = useState<string>("30d"); // Date range picker
  const [activityType, setActivityType] = useState<string>("all"); // Activity type filter
  const [selectedUser, setSelectedUser] = useState<string>("all"); // User filter

  const fetchActivities = React.useCallback(
    async (pageNum = 0, reset = false) => {
      try {
        setLoading(pageNum === 0); // Only show loading for first page

        // Build query parameters with backend filtering
        const params = new URLSearchParams();
        params.append("page", pageNum.toString());
        params.append("limit", "20");

        if (dateRange !== "all") {
          params.append("dateRange", dateRange);
        }
        if (activityType !== "all") {
          params.append("activityType", activityType);
        }
        if (selectedUser !== "all") {
          params.append("userId", selectedUser);
        }

        const response = await axios.get(
          `/api/activities?${params.toString()}`
        );
        const responseData = response.data as ActivitiesResponse;

        if (responseData.success) {
          // Filter out activities without user data to match interface requirements
          const validActivities = responseData.activities.filter(
            (activity) => activity.user != null
          ) as Activity[];

          if (reset || pageNum === 0) {
            setActivities(validActivities);
          } else {
            setActivities((prev) => [...prev, ...validActivities]);
          }
          setHasMore(responseData.pagination.hasMore);
          setPage(pageNum);
        }
      } catch (error) {
        console.error("Error fetching activities:", error);
      } finally {
        setLoading(false);
      }
    },
    [dateRange, activityType, selectedUser]
  );

  // Load initial data
  useEffect(() => {
    fetchActivities(0, true); // Reset pagination when filters change
  }, [fetchActivities]);

  // Load more for infinite scroll (as per project requirements)
  const loadMore = () => {
    if (hasMore && !loading) {
      const nextPage = page + 1;
      fetchActivities(nextPage, false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Page header with title - as per project requirements */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Activity Timeline</h1>
        <p className="text-gray-600">
          Track all changes and activities in your CRM
        </p>
      </div>

      {/* Filter bar - as per Project_Interns.txt requirements */}
      <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border">
        <div className="flex flex-wrap gap-4">
          {/* Date range picker */}
          <div>
            <label
              htmlFor="dateRange"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Date Range
            </label>
            <select
              id="dateRange"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Time</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>

          {/* Activity type filter dropdown */}
          <div>
            <label
              htmlFor="activityType"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Activity Type
            </label>
            <select
              id="activityType"
              value={activityType}
              onChange={(e) => setActivityType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Types</option>
              <option value="contact_created">Contact Created</option>
              <option value="contact_updated">Contact Updated</option>
              <option value="contact_deleted">Contact Deleted</option>
              <option value="bulk_import">Bulk Import</option>
              <option value="bulk_delete">Bulk Delete</option>
              <option value="user_login">User Login</option>
            </select>
          </div>

          {/* User filter (if multiple users) - as per project requirements */}
          <div>
            <label
              htmlFor="userFilter"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              User
            </label>
            <select
              id="userFilter"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Users</option>
              {/* TODO: Populate with actual users from API */}
            </select>
          </div>
        </div>
      </div>

      {/* Timeline view with infinite scroll - as per project requirements */}
      {loading && activities.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <ActivityTimeline
          activities={activities}
          hasMore={hasMore}
          onLoadMore={loadMore}
        />
      )}
    </div>
  );
};

export default ActivitiesPage;
