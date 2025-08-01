import React from "react";
import SummaryCard from "./SummaryCard";

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

interface DashboardSummaryProps {
  contacts: Contact[];
  activities: Activity[];
  tags: Tag[];
}

const DashboardSummary: React.FC<DashboardSummaryProps> = ({
  contacts,
  activities,
  tags,
}) => {
  const getContactsCreatedThisWeek = () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    return contacts.filter((contact) => {
      const createdAt = new Date(contact.createdAt);
      return createdAt >= oneWeekAgo;
    }).length;
  };

  return (
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
  );
};

export default DashboardSummary;
