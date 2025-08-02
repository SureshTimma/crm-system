// Script to create sample tags for testing the contact display
// Run this in your MongoDB or through the tags API

const sampleTagsToCreate = [
  {
    tagName: "lead",
    color: "#3B82F6", // blue-500
    usageCount: 0
  },
  {
    tagName: "customer", 
    color: "#10B981", // green-500
    usageCount: 0
  },
  {
    tagName: "prospect",
    color: "#F59E0B", // yellow-500
    usageCount: 0
  },
  {
    tagName: "vip",
    color: "#8B5CF6", // purple-500
    usageCount: 0
  },
  {
    tagName: "partner",
    color: "#EF4444", // red-500
    usageCount: 0
  },
  {
    tagName: "vendor",
    color: "#6B7280", // gray-500
    usageCount: 0
  },
  {
    tagName: "urgent",
    color: "#DC2626", // red-600
    usageCount: 0
  },
  {
    tagName: "follow-up",
    color: "#059669", // green-600
    usageCount: 0
  }
];

// To create these tags, you can either:
// 1. Use MongoDB directly:
//    db.tags.insertMany(sampleTagsToCreate)
//
// 2. Use the API endpoint (POST /api/tags) for each tag:
//    for each tag in sampleTagsToCreate, make a POST request to /api/tags

console.log("Sample tags to create:", sampleTagsToCreate);

// If you want to create them via API, you can use this function:
async function createSampleTags() {
  for (const tag of sampleTagsToCreate) {
    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tag)
      });
      
      if (response.ok) {
        console.log(`Created tag: ${tag.tagName}`);
      } else {
        console.log(`Failed to create tag: ${tag.tagName}`);
      }
    } catch (error) {
      console.error(`Error creating tag ${tag.tagName}:`, error);
    }
  }
}

// Uncomment the line below to create tags via API:
// createSampleTags();
