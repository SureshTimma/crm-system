// Data processing utilities for dashboard
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

export const getContactsByCompany = (contacts: Contact[]) => {
  const companyCount: Record<string, number> = {};
  contacts.forEach((contact) => {
    const company = contact.company || "No Company";
    companyCount[company] = (companyCount[company] || 0) + 1;
  });

  return Object.entries(companyCount)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 5)
    .map(([company, count]) => ({
      company: company.length > 15 ? company.substring(0, 15) + "..." : company,
      contacts: count,
    }));
};

export const getActivitiesTimeline = (activities: Activity[]) => {
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

export const getTagDistribution = (tags: Tag[]) => {
  return tags
    .map((tag) => ({
      name: tag.tagName,
      value: tag.usageCount || 0,
      color: tag.color,
    }))
    .filter((tag) => tag.value > 0);
};

export const getContactsCreatedThisWeek = (contacts: Contact[]) => {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  return contacts.filter((contact) => {
    const createdAt = new Date(contact.createdAt);
    return createdAt >= oneWeekAgo;
  }).length;
};
