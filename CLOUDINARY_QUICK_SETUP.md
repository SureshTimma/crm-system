# Cloudinary Configuration Guide

## Quick Setup

### Step 1: Add your Cloudinary URL to .env.local
```bash
# Copy your Cloudinary URL from your dashboard
CLOUDINARY_URL=cloudinary://your_api_key:your_api_secret@your_cloud_name
```

### Step 2: Verify Configuration (Optional)
You can test the configuration by temporarily adding this to any API route:

```javascript
import cloudinary from '@/lib/cloudinary';

// Test configuration
console.log('Cloudinary config:', {
  cloud_name: cloudinary.config().cloud_name,
  api_key: cloudinary.config().api_key ? '✓ Set' : '✗ Missing'
});
```

### Step 3: Usage
The image upload is already integrated into your profile page. Just:
1. Go to `/profile`
2. Click "Edit Profile" 
3. Upload an image
4. Save changes

Your image will be automatically uploaded to Cloudinary! 🎉

## Format Examples

### Single URL Format (What you have):
```
CLOUDINARY_URL=cloudinary://123456789012345:abcdefghijklmnopqrstuvwxyz123456@mycompany-crm
```

### Individual Format (Alternative):
```
CLOUDINARY_CLOUD_NAME=mycompany-crm
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz123456
```

Both formats work identically - use whichever you prefer!
