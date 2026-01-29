# Vercel Deployment Setup Guide

## Overview
Your Express.js backend is now configured for Vercel deployment. This guide walks you through the deployment process.

---

## Prerequisites

1. **Vercel Account** - Sign up at https://vercel.com
2. **Git Repository** - Push your code to GitHub, GitLab, or Bitbucket
3. **MongoDB Atlas** - Already configured (cloud database)
4. **Cloud Storage** - For handling file uploads (see below)

---

## Important: File Upload Handling

Vercel is a **serverless platform** with **no persistent file storage**. The local `./uploads/` directory won't work in production.

### Solution: Use Cloud Storage

You have two options:

#### Option 1: AWS S3 (Recommended for large files)
```
Pros: Cost-effective, highly scalable
Cons: Setup complexity
Cost: $0.023 per GB stored
```

#### Option 2: Cloudinary (Easiest for images)
```
Pros: Free tier, simple integration, automatic image optimization
Cons: Limited free tier (25GB)
Cost: Free tier available
```

#### Option 3: Firebase Storage
```
Pros: Integrated with Google services
Cons: Pricing model
Cost: Free tier available
```

**Quick Start with Cloudinary (Recommended):**
1. Sign up at https://cloudinary.com (free tier)
2. Install package: `npm install cloudinary`
3. Set environment variables:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`

---

## Step-by-Step Deployment

### 1. Prepare Your Code

✅ Already done:
- `vercel.json` - Configuration file
- `.vercelignore` - Files to exclude
- Updated `package.json` - Start script configured

### 2. Set Up Git Repository

```bash
git init
git add .
git commit -m "Initial commit: Vercel-ready backend"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/InlaksT24Backend.git
git push -u origin main
```

### 3. Deploy to Vercel

**Option A: Using Vercel CLI (Recommended)**

```bash
# Install Vercel CLI globally
npm install -g vercel

# Deploy
vercel
```

**Option B: Using Vercel Web Dashboard**

1. Go to https://vercel.com/dashboard
2. Click "New Project"
3. Select your GitHub repository
4. Configure project:
   - **Framework Preset**: Node.js
   - **Build Command**: Leave empty (no build needed)
   - **Output Directory**: Leave empty
5. Click "Deploy"

### 4. Add Environment Variables

In Vercel Dashboard:
1. Go to your project → Settings → Environment Variables
2. Add the following:

```
MONGODB_URI = mongodb+srv://user:pass@cluster.mongodb.net/database
CLOUDINARY_CLOUD_NAME = your_cloud_name
CLOUDINARY_API_KEY = your_api_key
CLOUDINARY_API_SECRET = your_api_secret
NODE_ENV = production
```

### 5. Test Deployment

After deployment, Vercel gives you a URL (e.g., `https://your-app.vercel.app`)

Test it:
```bash
curl https://your-app.vercel.app/health
```

Expected response:
```json
{"status": "OK", "timestamp": "2026-01-29T..."}
```

---

## Update Upload Middleware for Cloud Storage

Your current `uploadMiddleware.js` uses local storage. Here's how to update it:

### Install Cloudinary (if using Cloudinary)

```bash
npm install cloudinary multer-storage-cloudinary
```

### Update `src/middleware/uploadMiddleware.js`

```javascript
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Setup Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'inlaks-t24/questions',
    resource_type: 'auto',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images are allowed.'));
    }
  },
});

module.exports = upload;
```

### Update `index.js` (remove static upload route)

Remove or comment out this line:
```javascript
// app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
```

Cloudinary will handle file serving via URLs.

---

## Vercel Configuration Details

### `vercel.json` Breakdown

```json
{
  "version": 2,                    // Vercel Platform v2
  "env": {                         // Default environment variables
    "MONGODB_URI": "@mongodb_uri",  // Reference to secret
    "NODE_ENV": "production"
  },
  "builds": [                      // Build configuration
    {
      "src": "src/index.js",        // Entry point
      "use": "@vercel/node"          // Use Node.js runtime
    }
  ],
  "routes": [                      // Route configuration
    {
      "src": "/(.*)",               // All routes
      "dest": "src/index.js"        // Route to Express app
    }
  ],
  "functions": {
    "src/index.js": {
      "memory": 3008,               // 3GB memory
      "maxDuration": 30             // 30 second timeout
    }
  }
}
```

---

## Performance & Costs

### Free Tier
- ✅ Unlimited deployments
- ✅ 100GB bandwidth/month
- ✅ Automatic HTTPS
- ✅ Global CDN
- **$0/month**

### Pro Plan (if needed)
- Increases bandwidth limits
- Advanced monitoring
- Team collaboration
- **$20/month**

---

## Troubleshooting

### Issue: 504 Timeout Error
**Solution:** OCR operations can take 2-5 seconds. Increase timeout in `vercel.json`:
```json
"maxDuration": 60
```

### Issue: Database Connection Error
**Solution:** Ensure MongoDB Atlas allows Vercel IPs:
1. Go to MongoDB Atlas → Network Access
2. Add IP: `0.0.0.0/0` (or specific Vercel IPs)

### Issue: Uploads Not Working
**Solution:** Update to cloud storage (Cloudinary/S3). Local storage won't work on Vercel.

### Issue: Dependencies Missing
**Solution:** Run `npm install` locally and commit `package-lock.json`:
```bash
npm install
git add package-lock.json
git commit -m "Update package-lock"
git push
```

---

## Monitoring

After deployment, monitor your app:

### Using Vercel Dashboard
1. Go to your project
2. Click "Deployments" tab
3. Click latest deployment
4. View logs under "Function Logs"

### Using Vercel CLI
```bash
vercel logs
```

---

## Custom Domain (Optional)

1. In Vercel Dashboard → Settings → Domains
2. Add your custom domain
3. Update DNS records (Vercel provides instructions)

---

## Environment Variables Reference

| Variable | Required | Example |
|----------|----------|---------|
| `MONGODB_URI` | ✅ Yes | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `CLOUDINARY_CLOUD_NAME` | ✅ If using Cloudinary | `your_cloud_name` |
| `CLOUDINARY_API_KEY` | ✅ If using Cloudinary | `123456789` |
| `CLOUDINARY_API_SECRET` | ✅ If using Cloudinary | `abc123xyz` |
| `NODE_ENV` | ✅ Yes | `production` |
| `PORT` | No | `3000` |

---

## Next Steps

1. **Choose cloud storage** - Cloudinary (easiest) or AWS S3
2. **Update upload middleware** - Use cloud storage instead of local
3. **Push to GitHub** - Ensure all files are committed
4. **Deploy to Vercel** - Use CLI or dashboard
5. **Add environment variables** - In Vercel dashboard
6. **Test endpoints** - Verify all APIs work

---

## API Endpoints After Deployment

Once deployed, your endpoints will be:

```
POST   https://your-app.vercel.app/api/exam/create
GET    https://your-app.vercel.app/api/exam/list
POST   https://your-app.vercel.app/api/exam/:examCode/upload
GET    https://your-app.vercel.app/api/exam/:examCode/questions
POST   https://your-app.vercel.app/api/exam/compare
DELETE https://your-app.vercel.app/api/exam/question/:id
GET    https://your-app.vercel.app/api/exam/stats
```

---

## Support & Documentation

- **Vercel Docs**: https://vercel.com/docs
- **Node.js Runtime**: https://vercel.com/docs/runtimes/nodejs
- **Cloudinary Integration**: https://cloudinary.com/documentation
- **MongoDB Deployment**: https://docs.mongodb.com/guides/

---

## Summary

✅ Vercel configuration ready  
✅ Serverless deployment enabled  
⚠️ TODO: Set up cloud storage for file uploads  
⚠️ TODO: Deploy to Vercel  
⚠️ TODO: Add environment variables  

**Estimated deployment time:** 10-15 minutes
