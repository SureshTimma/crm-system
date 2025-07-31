"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";

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

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const response = await axios.get("/api/contacts");
        console.log("Contacts response:", response.data);
        // The API returns contacts directly, not wrapped in success object
        setContacts(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Error fetching contacts:", error);
      }
    };

    const fetchActivities = async () => {
      try {
        const response = await axios.get("/api/activities");
        console.log("Activities response:", response.data);
        const data = response.data as {
          success: boolean;
          activities: Activity[];
        };
        if (data.success) {
          setActivities(data.activities);
        }
      } catch (error) {
        console.error("Error fetching activities:", error);
      }
    };

    const fetchTags = async () => {
      try {
        const response = await axios.get("/api/tags");
        console.log("Tags response:", response.data);
        const data = response.data as { success: boolean; tags: Tag[] };
        if (data.success) {
          setTags(data.tags);
        }
      } catch (error) {
        console.error("Error fetching tags:", error);
      }
    };

    fetchContacts();
    fetchActivities();
    fetchTags();
  }, []);

  const getContactsCreatedThisWeek = () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    return contacts.filter((contact) => {
      const createdAt = new Date(contact.createdAt);
      return createdAt >= oneWeekAgo;
    }).length;
  };

  // ✅ Chart 1: Contacts by Company (Top 5)
  const getContactsByCompany = () => {
    const companyCount: Record<string, number> = {};
    contacts.forEach((contact) => {
      const company = contact.company || "No Company";
      companyCount[company] = (companyCount[company] || 0) + 1;
    });

    return Object.entries(companyCount)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([company, count]) => ({
        company:
          company.length > 15 ? company.substring(0, 15) + "..." : company,
        contacts: count,
      }));
  };

  // ✅ Chart 2: Activities Timeline (Last 30 days)
  const getActivitiesTimeline = () => {
    const last30Days: Array<{ date: string; day: number; activities: number }> =
      [];
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      last30Days.push({
        date: dateStr,
        day: date.getDate(),
        activities: 0,
      });
    }
    activities.forEach((activity) => {
      const activityDate = new Date(activity.timestamp)
        .toISOString()
        .split("T")[0];
      const dayData = last30Days.find((day) => day.date === activityDate);
      if (dayData) {
        dayData.activities++;
      }
    });

    return last30Days;
  };

  // ✅ Chart 3: Tag Distribution
  const getTagDistribution = () => {
    return tags
      .map((tag) => ({
        name: tag.tagName,
        value: tag.usageCount || 0,
        color: tag.color,
      }))
      .filter((tag) => tag.value > 0);
  };

  const companyData = getContactsByCompany();
  const timelineData = getActivitiesTimeline();
  const tagData = getTagDistribution();

  // Colors for pie chart
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

  // Summary Card Component
  const SummaryCard = ({
    title,
    value,
    icon,
    trend,
    trendValue,
    color = "blue",
  }: {
    title: string;
    value: number;
    icon: React.ReactNode;
    trend?: "up" | "down";
    trendValue?: number;
    color?: string;
  }) => {
    const colorClasses = {
      blue: "bg-blue-50 text-blue-600 border-blue-200",
      green: "bg-green-50 text-green-600 border-green-200",
      purple: "bg-purple-50 text-purple-600 border-purple-200",
      orange: "bg-orange-50 text-orange-600 border-orange-200",
    };

    return (
      <div className="bg-white rounded-lg border shadow-sm p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
            {trend && trendValue !== undefined && (
              <div className="flex items-center mt-2">
                {trend === "up" ? (
                  <svg
                    className="w-4 h-4 text-green-500 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L10 4.414 4.707 9.707a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4 text-red-500 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L10 15.586l5.293-5.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                <span
                  className={`text-sm font-medium ${
                    trend === "up" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {trendValue} this week
                </span>
              </div>
            )}
          </div>
          <div
            className={`p-3 rounded-lg ${
              colorClasses[color as keyof typeof colorClasses]
            }`}
          >
            {icon}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

        {/* Summary Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <SummaryCard
            title="Total Contacts"
            value={contacts.length}
            color="blue"
            icon={
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
            }
          />

          <SummaryCard
            title="New Contacts This Week"
            value={getContactsCreatedThisWeek()}
            trend="up"
            trendValue={getContactsCreatedThisWeek()}
            color="green"
            icon={
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
            }
          />

          <SummaryCard
            title="Total Activities"
            value={activities.length}
            color="purple"
            icon={
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                  clipRule="evenodd"
                />
              </svg>
            }
          />

          <SummaryCard
            title="Active Tags"
            value={tags.length}
            color="orange"
            icon={
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z"
                  clipRule="evenodd"
                />
              </svg>
            }
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contacts by Company Chart */}
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Top 5 Companies by Contacts
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={companyData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="company" type="category" width={120} />
                <Tooltip />
                <Bar dataKey="contacts" fill="#3B82F6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Activities Timeline Chart */}
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Activities Timeline (Last 30 Days)
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip
                  labelFormatter={(value) => `Day ${value}`}
                  formatter={(value) => [value, "Activities"]}
                />
                <Line
                  type="monotone"
                  dataKey="activities"
                  stroke="#10B981"
                  strokeWidth={3}
                  dot={{ fill: "#10B981", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Tag Distribution Chart */}
          <div className="bg-white rounded-lg border shadow-sm p-6 lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Tag Usage Distribution
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={tagData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${((percent || 0) * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  innerRadius={40}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {tagData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color || COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
