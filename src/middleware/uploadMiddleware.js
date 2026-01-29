/**
 * Upload Middleware - Multi-Storage Support
 * 
 * Supports both Cloudinary (cloud) and local storage.
 * Automatically uses Cloudinary if credentials are provided.
 * Falls back to local storage for development.
 * 
 * For Vercel deployment, set these environment variables:
 * - CLOUDINARY_CLOUD_NAME
 * - CLOUDINARY_API_KEY
 * - CLOUDINARY_API_SECRET
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Detect if Cloudinary credentials are available
const USE_CLOUDINARY = process.env.CLOUDINARY_CLOUD_NAME && 
                       process.env.CLOUDINARY_API_KEY && 
                       process.env.CLOUDINARY_API_SECRET;

let upload;
let storage;
let fileFilter;

// File filter (used by both storage types)
fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (JPEG, PNG, GIF, WebP)'), false);
  }
};

if (USE_CLOUDINARY) {
  // ============================================
  // CLOUDINARY STORAGE (Recommended for Vercel)
  // ============================================
  try {
    const cloudinary = require('cloudinary').v2;
    const { CloudinaryStorage } = require('multer-storage-cloudinary');

    // Configure Cloudinary
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    // Setup Cloudinary storage
    storage = new CloudinaryStorage({
      cloudinary: cloudinary,
      params: {
        folder: 'inlaks-t24/questions',
        resource_type: 'auto',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      },
    });

    upload = multer({
      storage: storage,
      fileFilter,
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    });

    console.log('✅ Using Cloudinary cloud storage');
  } catch (err) {
    console.error('⚠️  Cloudinary packages not installed. Install with: npm install cloudinary multer-storage-cloudinary');
    throw err;
  }

} else {
  // ============================================
  // LOCAL STORAGE (Development/Testing)
  // ============================================
  const uploadDir = process.env.UPLOAD_DIR || './uploads';

  // Create upload directory if it doesn't exist
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const { v4: uuidv4 } = require('uuid');
      const ext = path.extname(file.originalname);
      const uniqueName = `${Date.now()}-${uuidv4()}${ext}`;
      cb(null, uniqueName);
    },
  });

  upload = multer({
    storage: storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  });

  console.warn('⚠️  Using LOCAL storage. For Vercel/production, configure CLOUDINARY environment variables.');
}

module.exports = upload;
