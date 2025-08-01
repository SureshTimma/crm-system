"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import ActivityTimeline from "@/app/components/activities/ActivityTimeline";

interface Activity {
  _id: string;
  user: string;
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
  activities: Activity[];
}

const ActivitiesPage = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async (pageNum = 0) => {
    try {
      const response = await axios.get(
        `/api/activities?page=${pageNum}&limit=20`
      );
      const responseData = response.data as ActivitiesResponse;
      if (responseData.success) {
        if (pageNum === 0) {
          setActivities(responseData.activities);
        } else {
          setActivities((prev) => [...prev, ...responseData.activities]);
        }
        setHasMore(responseData.activities.length === 20);
      }
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchActivities(nextPage);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Activity Timeline</h1>
        <p className="text-gray-600">
          Track all changes and activities in your CRM
        </p>
      </div>

      <ActivityTimeline
        activities={activities}
        hasMore={hasMore}
        onLoadMore={loadMore}
      />
    </div>
  );
};

export default ActivitiesPage;
