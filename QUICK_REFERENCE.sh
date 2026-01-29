#!/bin/bash
# Quick Reference Commands for Inlaks T24 Backend

# ==================================================
# INSTALLATION & SETUP
# ==================================================

# 1. Install all dependencies
npm install

# 2. Create environment file
cp .env.example .env
# Then edit .env with your MongoDB URI

# ==================================================
# DEVELOPMENT
# ==================================================

# Start development server with auto-reload
npm run dev

# Start production server
npm start

# ==================================================
# API TESTING WITH CURL
# ==================================================

# Health check
curl http://localhost:5000/health

# Create exam code
curl -X POST http://localhost:5000/api/exam/create \
  -H "Content-Type: application/json" \
  -d '{"examCode":"TEMENOS_T24_001"}'

# Get all exam codes
curl http://localhost:5000/api/exam/list

# Upload question screenshot
curl -X POST http://localhost:5000/api/exam/TEMENOS_T24_001/upload \
  -F "image=@path/to/image.jpg"

# Get questions for exam
curl http://localhost:5000/api/exam/TEMENOS_T24_001/questions

# Compare image (dual matching) - MAIN FEATURE
curl -X POST http://localhost:5000/api/exam/compare \
  -F "image=@path/to/test_image.jpg" \
  -F "textThreshold=0.65" \
  -F "imageThreshold=0.65"

# Get system statistics
curl http://localhost:5000/api/exam/stats

# Delete a question
curl -X DELETE http://localhost:5000/api/exam/question/QUESTION_ID

# ==================================================
# DOCUMENTATION
# ==================================================

# Quick start (5 minutes)
open QUICKSTART.md

# Complete API reference
open README.md

# Technical deep dive
open TECHNICAL_DOCUMENTATION.md

# Deployment guide
open DEPLOYMENT.md

# Implementation summary
open IMPLEMENTATION_SUMMARY.md

# ==================================================
# MONGODB ATLAS
# ==================================================

# Get MongoDB URI from:
# https://www.mongodb.com/cloud/atlas

# Format: mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority

# ==================================================
# GIT COMMANDS
# ==================================================

# Initialize git repository
git init

# Add all files
git add .

# Commit changes
git commit -m "Initial commit: OCR exam comparison system"

# Add remote
git remote add origin https://github.com/yourusername/inlaks-t24-backend.git

# Push to GitHub
git push -u origin main

# ==================================================
# DEPLOYMENT (Choose one)
# ==================================================

# Option 1: Heroku
heroku login
heroku create your-app-name
heroku config:set MONGODB_URI="your_mongodb_uri"
git push heroku main

# Option 2: Railway.app
# Go to https://railway.app and connect GitHub repo

# Option 3: Render.com
# Go to https://render.com and create new service

# ==================================================
# TROUBLESHOOTING
# ==================================================

# Clear npm cache if install fails
npm cache clean --force
npm install

# Check Node.js version (needs 16+)
node --version

# Check npm version
npm --version

# View server logs
tail -f ~/.pm2/logs/inlaks-backend-error.log
tail -f ~/.pm2/logs/inlaks-backend-out.log

# Kill process on port 5000 (if stuck)
# Linux/Mac:
lsof -ti:5000 | xargs kill -9

# Windows (PowerShell):
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# ==================================================
# ENVIRONMENT SETUP
# ==================================================

# Install Node.js from: https://nodejs.org/

# Install MongoDB Compass (GUI for MongoDB):
# https://www.mongodb.com/products/compass

# Create MongoDB Atlas account:
# https://www.mongodb.com/cloud/atlas

# ==================================================
# USEFUL LINKS
# ==================================================

# MongoDB Docs: https://docs.mongodb.com/
# Express Docs: https://expressjs.com/
# Node.js Docs: https://nodejs.org/docs/
# Tesseract.js: https://github.com/naptha/tesseract.js
# Sharp: https://sharp.pixelplumbing.com/

# ==================================================
# PROJECT STRUCTURE
# ==================================================

# src/
#   index.js                 - Main entry point
#   config/database.js       - MongoDB connection
#   controllers/             - Route handlers
#   services/                - Business logic
#   middleware/              - Express middleware
#   routes/                  - API routes
#
# Documentation:
#   README.md                - Full API reference
#   QUICKSTART.md            - 5-min setup
#   TECHNICAL_DOCUMENTATION.md - Deep dive
#   DEPLOYMENT.md            - Deployment guide
#   API_TESTING.json         - Test endpoints

# ==================================================
# PERFORMANCE TIPS
# ==================================================

# 1. Use high-quality images for OCR
#    - Clear text, high contrast
#    - Horizontal orientation
#    - 500x500 to 2000x2000 pixels

# 2. Adjust thresholds based on needs
#    - Strict: 0.75 / 0.75
#    - Moderate: 0.65 / 0.65 (default)
#    - Lenient: 0.50 / 0.50

# 3. Monitor MongoDB usage
#    - Check Atlas dashboard
#    - Enable auto-scaling if needed

# 4. Use CDN for uploaded images
#    - Cloudinary integration ready
#    - See DEPLOYMENT.md

# ==================================================
# NEXT STEPS
# ==================================================

# 1. Copy .env.example to .env
# 2. Add MongoDB Atlas connection string
# 3. Run: npm run dev
# 4. Test endpoints with curl or Postman
# 5. Deploy to production
# 6. Monitor logs and metrics

echo "Ready to start developing! 🚀"
