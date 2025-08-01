"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";

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

  const getActionIcon = (action: string) => {
    switch (action) {
      case "CREATE":
        return (
          <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
            <svg
              className="w-4 h-4 text-green-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        );
      case "UPDATE":
        return (
          <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
            <svg
              className="w-4 h-4 text-blue-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.379-8.379-2.828-2.828z" />
            </svg>
          </div>
        );
      case "DELETE":
        return (
          <div className="flex items-center justify-center w-8 h-8 bg-red-100 rounded-full">
            <svg
              className="w-4 h-4 text-red-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"
                clipRule="evenodd"
              />
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414L7.586 12l-1.293 1.293a1 1 0 101.414 1.414L9 13.414l2.293 2.293a1 1 0 001.414-1.414L11.414 12l1.293-1.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
            <svg
              className="w-4 h-4 text-gray-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        );
    }
  };

  const getUserAvatar = (activity: Activity) => {
    // Use actual user name for avatar generation
    const userName = activity.userName || activity.user;

    // Generate a consistent color based on userName
    const colors = [
      "bg-red-100 text-red-600",
      "bg-blue-100 text-blue-600",
      "bg-green-100 text-green-600",
      "bg-yellow-100 text-yellow-600",
      "bg-purple-100 text-purple-600",
      "bg-pink-100 text-pink-600",
      "bg-indigo-100 text-indigo-600",
    ];
    const colorIndex = userName.length % colors.length;
    const colorClass = colors[colorIndex];

    // Get initials from actual name
    const initials = userName
      .split(" ")
      .map((name) => name.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase();

    return (
      <div
        className={`flex items-center justify-center w-10 h-10 rounded-full ${colorClass} ring-2 ring-white shadow-sm`}
        title={`${userName}${
          activity.userEmail ? ` (${activity.userEmail})` : ""
        }`}
      >
        <span className="text-sm font-bold">{initials}</span>
      </div>
    );
  };

  const getActionDescription = (activity: Activity) => {
    const entityType = activity.entityType.toLowerCase();
    const actionPast =
      {
        CREATE: "created",
        UPDATE: "updated",
        DELETE: "deleted",
        VIEW: "viewed",
      }[activity.action] || "modified";

    return `${actionPast} ${entityType}`;
  };

  const getDetailedDescription = (activity: Activity) => {
    if (!activity.details) return null;

    switch (activity.action) {
      case "CREATE":
        return activity.details.after ? (
          <div className="mt-2 text-xs text-gray-500 bg-green-50 p-2 rounded">
            <span className="font-medium text-green-700">
              New {activity.entityType.toLowerCase()}:
            </span>
            {activity.details.after.email && (
              <div>📧 {activity.details.after.email}</div>
            )}
            {activity.details.after.company && (
              <div>🏢 {activity.details.after.company}</div>
            )}
          </div>
        ) : null;

      case "UPDATE":
        return activity.details?.before && activity.details?.after ? (
          <div className="mt-2 text-xs text-gray-500 bg-blue-50 p-2 rounded">
            <span className="font-medium text-blue-700">Changes made:</span>
            {Object.keys(activity.details.after).map((key) =>
              activity.details?.before?.[key] !==
              activity.details?.after?.[key] ? (
                <div key={key} className="mt-1">
                  <span className="font-medium">{key}:</span>
                  <span className="text-red-600 line-through ml-1">
                    {activity.details?.before?.[key]}
                  </span>
                  <span className="text-green-600 ml-1">
                    → {activity.details?.after?.[key]}
                  </span>
                </div>
              ) : null
            )}
          </div>
        ) : null;

      case "DELETE":
        return activity.details.before ? (
          <div className="mt-2 text-xs text-gray-500 bg-red-50 p-2 rounded">
            <span className="font-medium text-red-700">
              Deleted {activity.entityType.toLowerCase()}:
            </span>
            {activity.details.before.email && (
              <div>📧 {activity.details.before.email}</div>
            )}
            {activity.details.before.company && (
              <div>🏢 {activity.details.before.company}</div>
            )}
          </div>
        ) : null;

      default:
        return null;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const getEntityLink = (entityType: string, entityId: string) => {
    switch (entityType) {
      case "CONTACT":
        return `/dashboard/contacts?id=${entityId}`;
      case "TAG":
        return `/dashboard/tags?id=${entityId}`;
      default:
        return "#";
    }
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

      {/* Timeline */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>

        {/* Activity items */}
        <div className="space-y-6">
          {activities.map((activity) => (
            <div
              key={activity._id}
              className="relative flex items-start space-x-3"
            >
              {/* Timeline dot */}
              <div className="relative z-10">
                {getActionIcon(activity.action)}
              </div>

              {/* Activity content */}
              <div className="flex-1 min-w-0">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      {/* User avatar */}
                      {getUserAvatar(activity)}

                      {/* Activity details */}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm">
                          <Link
                            href={getEntityLink(
                              activity.entityType,
                              activity.entityId
                            )}
                            className="font-semibold text-gray-900 hover:text-blue-800 hover:underline block"
                          >
                            {activity.entityName}
                          </Link>
                          <div className="text-gray-600 text-xs mt-1">
                            {getActionDescription(activity)}
                          </div>
                        </div>

                        {/* Detailed activity information */}
                        {getDetailedDescription(activity)}

                        {/* Activity metadata */}
                        {activity.details?.metadata?.source && (
                          <div className="mt-2 flex items-center space-x-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                              📱 {activity.details.metadata.source}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Timestamp */}
                    <div className="text-xs text-gray-500 ml-3 flex-shrink-0">
                      {formatTimestamp(activity.timestamp)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Load more button */}
        {hasMore && (
          <div className="text-center mt-8">
            <button
              onClick={loadMore}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Load More Activities
            </button>
          </div>
        )}

        {/* Empty state */}
        {activities.length === 0 && (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No activities
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a contact or tag.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivitiesPage;
