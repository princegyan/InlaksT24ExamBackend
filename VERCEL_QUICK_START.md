# Vercel Deployment - Quick Start

Your backend is now configured for Vercel! Follow these steps:

## Step 1: Install Cloudinary Packages (Development)

```bash
npm install cloudinary multer-storage-cloudinary
```

## Step 2: Get Cloudinary Credentials

1. Sign up free at: https://cloudinary.com
2. Go to Dashboard → Settings → API Keys
3. Copy: Cloud Name, API Key, API Secret

## Step 3: Push to GitHub

```bash
git add .
git commit -m "Configure Vercel deployment with Cloudinary"
git push origin main
```

## Step 4: Deploy to Vercel

**Option A: Using Vercel CLI**
```bash
npm install -g vercel
vercel
```

**Option B: Vercel Dashboard**
1. Go to https://vercel.com/dashboard
2. Click "New Project"
3. Select your GitHub repository
4. Click "Deploy"

## Step 5: Add Environment Variables

In Vercel Dashboard → Settings → Environment Variables:

```
MONGODB_URI = your_mongodb_uri
CLOUDINARY_CLOUD_NAME = your_cloud_name
CLOUDINARY_API_KEY = your_api_key
CLOUDINARY_API_SECRET = your_api_secret
NODE_ENV = production
```

## Step 6: Test

After deployment, visit your Vercel URL:
```bash
curl https://your-app.vercel.app/health
```

## That's it! 🚀

Your backend is now live on Vercel with cloud storage enabled.

**Files Created/Updated:**
- ✅ `vercel.json` - Vercel configuration
- ✅ `.vercelignore` - Files to exclude
- ✅ `src/middleware/uploadMiddleware.js` - Cloud storage integration
- ✅ `package.json` - Cloudinary dependencies
- ✅ `.env.example` - Environment variables template
- ✅ `VERCEL_SETUP.md` - Full deployment guide

For details, see [VERCEL_SETUP.md](VERCEL_SETUP.md)
