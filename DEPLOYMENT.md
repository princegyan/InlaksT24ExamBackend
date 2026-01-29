# Deployment Guide

## Prerequisites

- Node.js 16+ installed
- MongoDB Atlas account (free tier OK)
- Cloud hosting account (Heroku, Railway, Render, etc.)
- Git repository

---

## Local Development Setup

### 1. Clone Repository
```bash
git clone <your-repo>
cd InlaksT24Backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Create `.env` File
```bash
cp .env.example .env
# Edit .env with your MongoDB credentials
```

### 4. Start Development Server
```bash
npm run dev
```

Server runs on `http://localhost:5000`

---

## Production Deployment

### Option 1: Heroku (Easiest)

#### Step 1: Create Heroku App
```bash
heroku login
heroku create your-app-name
```

#### Step 2: Add MongoDB Atlas URL
```bash
heroku config:set MONGODB_URI="your_mongodb_uri"
heroku config:set NODE_ENV="production"
heroku config:set PORT="5000"
```

#### Step 3: Deploy
```bash
git push heroku main
```

#### Step 4: View Logs
```bash
heroku logs --tail
```

### Option 2: Railway.app (Recommended)

#### Step 1: Connect GitHub
1. Go to [Railway](https://railway.app)
2. Connect your GitHub account
3. Select repository

#### Step 2: Add MongoDB
1. Click "Add Service" → "MongoDB"
2. Railway creates managed MongoDB instance

#### Step 3: Deploy
- Railway auto-deploys on git push
- Environment variables auto-configured

#### Step 4: Monitor
- Dashboard shows logs and metrics

### Option 3: Render.com

#### Step 1: Create Service
1. Go to [Render](https://render.com)
2. Create "New Web Service"
3. Connect GitHub repository

#### Step 2: Configure
```
Build: npm install
Start: npm start
Environment: Production
```

#### Step 3: Add MongoDB
In Render dashboard:
- Set `MONGODB_URI` environment variable
- Use MongoDB Atlas connection string

#### Step 4: Deploy
- Automatic deployment on git push

### Option 4: AWS EC2

#### Step 1: Launch EC2 Instance
```bash
# Ubuntu 20.04 LTS, t2.micro (free tier)
# Security group: Allow ports 22, 80, 443, 5000
```

#### Step 2: SSH and Setup
```bash
ssh -i key.pem ubuntu@your-ec2-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone and setup
git clone <your-repo>
cd InlaksT24Backend
npm install

# Create .env with MongoDB URI
nano .env
```

#### Step 3: Use PM2 for Process Management
```bash
sudo npm install -g pm2

# Start app
pm2 start src/index.js --name "inlaks-backend"

# Auto-restart on reboot
pm2 startup
pm2 save
```

#### Step 4: Setup Nginx Reverse Proxy
```bash
sudo apt install nginx

# Configure /etc/nginx/sites-available/default
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Restart Nginx
sudo systemctl restart nginx
```

#### Step 5: Setup HTTPS (SSL)
```bash
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --standalone -d your-domain.com

# Auto-renewal
sudo systemctl enable certbot.timer
```

---

## Environment Variables for Production

```env
# Production MongoDB Atlas (use dedicated cluster)
MONGODB_URI=mongodb+srv://produser:securepassword@prod-cluster.mongodb.net/inlaks_t24_prod?retryWrites=true&w=majority

# Server settings
PORT=5000
NODE_ENV=production

# File upload
UPLOAD_DIR=/var/uploads/inlaks

# Security (optional)
JWT_SECRET=your-secret-key-here
API_KEY=your-api-key-here

# Cloud storage (optional)
USE_CLOUDINARY=true
CLOUDINARY_CLOUD_NAME=your_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
```

---

## Pre-Deployment Checklist

- [ ] All dependencies in `package.json`
- [ ] `.env.example` has all required variables
- [ ] MongoDB Atlas whitelist includes production IPs
- [ ] Error handling for all endpoints
- [ ] CORS configured correctly
- [ ] Rate limiting added (optional)
- [ ] Logging configured
- [ ] Tests pass (if applicable)
- [ ] `.gitignore` excludes `.env`, `node_modules/`, `uploads/`

---

## Performance Optimization

### 1. Enable Compression
```javascript
const compression = require('compression');
app.use(compression());
```

### 2. Add Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);
```

### 3. Database Optimization
```javascript
// MongoDB connection pooling
const options = {
  maxPoolSize: 10,
  minPoolSize: 5
};
```

### 4. Caching
```javascript
const redis = require('redis');
const client = redis.createClient();
// Cache OCR results and comparison results
```

---

## Monitoring & Logging

### 1. Setup Morgan (HTTP Logger)
```javascript
const morgan = require('morgan');
app.use(morgan('combined'));
```

### 2. Error Tracking (Sentry)
```javascript
const Sentry = require("@sentry/node");
Sentry.init({ dsn: "your-sentry-dsn" });
app.use(Sentry.Handlers.errorHandler());
```

### 3. Performance Monitoring
- Use application performance monitoring (APM):
  - New Relic
  - Datadog
  - Elastic APM

---

## Scaling Considerations

### Horizontal Scaling
```
┌─────────────────┐
│   Load Balancer │
└────────┬────────┘
         │
    ┌────┴────┬────────┬────────┐
    │          │        │        │
┌───▼──┐  ┌───▼──┐ ┌───▼──┐ ┌───▼──┐
│App 1 │  │App 2 │ │App 3 │ │App 4 │
└───┬──┘  └───┬──┘ └───┬──┘ └───┬──┘
    │         │        │        │
    └────────┬┴────────┴───────┘
             │
       ┌─────▼─────┐
       │ MongoDB   │
       │  Atlas    │
       │(Replica   │
       │ Set)      │
       └───────────┘
```

### Caching Layer
```
Client
   ↓
Load Balancer
   ↓
┌─ Redis Cache ─┐
│  (Session,    │
│   OCR results)│
└────────┬──────┘
         ↓
  Node.js Instances
         ↓
  MongoDB Atlas
```

### Queue System (for heavy OCR)
```
Upload Request
   ↓
Bull Queue
   ↓
OCR Worker Pool
   ↓
Store Results
   ↓
Webhook to Client
```

---

## Backup & Recovery

### MongoDB Atlas Backups
1. Enable automatic daily backups in MongoDB Atlas
2. Set retention period to 35 days
3. Test restore procedures monthly

### Application Backups
```bash
# Backup uploads directory
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz uploads/

# Store in S3
aws s3 cp uploads_backup_*.tar.gz s3://your-bucket/backups/
```

---

## Troubleshooting Production Issues

### High Memory Usage
```bash
# Monitor with PM2
pm2 monit

# Increase Node heap
NODE_OPTIONS="--max-old-space-size=4096" pm2 start app.js
```

### Database Connection Timeouts
```javascript
// Add retry logic
const options = {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};
```

### Slow OCR Performance
```javascript
// Implement queue
const Queue = require('bull');
const ocrQueue = new Queue('ocr', redisConfig);

ocrQueue.process(5, async (job) => {
  return await extractTextFromImage(job.data.imagePath);
});
```

---

## Cost Estimation

| Service | Free Tier | Production Cost |
|---------|-----------|-----------------|
| **MongoDB Atlas** | 512MB | $57/month (shared) to $500+/month |
| **Heroku** | None | $50-100/month |
| **Railway/Render** | 0.5GB RAM | $5-20/month |
| **AWS EC2** | 750h/month | $10-50/month |
| **Cloud Storage** | N/A | $0.023/GB |

**Estimated Monthly Cost:** $20-200 depending on usage

---

## Security Checklist

- [ ] MongoDB requires authentication
- [ ] API keys rotated monthly
- [ ] HTTPS/SSL enabled
- [ ] CORS restricted to trusted domains
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] Secrets not in code (use `.env`)
- [ ] Regular security updates
- [ ] Logs monitored for suspicious activity

---

## Rollback Procedure

```bash
# If deployed with git
git revert <commit-hash>
git push heroku main

# If using PM2
pm2 restart app.js

# If using Docker
docker pull your-image:previous-tag
docker run -d -p 5000:5000 your-image:previous-tag
```

---

## Support & Help

- **MongoDB Docs:** https://docs.mongodb.com/
- **Express Docs:** https://expressjs.com/
- **Heroku Docs:** https://devcenter.heroku.com/
- **Railway Docs:** https://docs.railway.app/

