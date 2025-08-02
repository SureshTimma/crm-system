// Sample tags for testing the dropdown functionality
// You can use this data to create tags via the API

const sampleTags = [
  {
    tagName: "lead",
    color: "#3B82F6", // blue
    usageCount: 0
  },
  {
    tagName: "customer",
    color: "#10B981", // green
    usageCount: 0
  },
  {
    tagName: "prospect",
    color: "#F59E0B", // yellow/orange
    usageCount: 0
  },
  {
    tagName: "vip",
    color: "#8B5CF6", // purple
    usageCount: 0
  },
  {
    tagName: "partner",
    color: "#EF4444", // red
    usageCount: 0
  },
  {
    tagName: "vendor",
    color: "#6B7280", // gray
    usageCount: 0
  },
  {
    tagName: "urgent",
    color: "#DC2626", // dark red
    usageCount: 0
  },
  {
    tagName: "follow-up",
    color: "#059669", // dark green
    usageCount: 0
  }
];

// To create these tags, you can:
// 1. Use the tags API endpoint (POST /api/tags) 
// 2. Or add them directly to your database
// 3. Or use this data in a seeding script

export default sampleTags;
