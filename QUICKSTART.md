# Quick Start Guide

## 5-Minute Setup

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure MongoDB

Sign up for [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (free tier available).

Create a `.env` file:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/inlaks_t24?retryWrites=true&w=majority
PORT=5000
NODE_ENV=development
UPLOAD_DIR=./uploads
```

### Step 3: Start Server

```bash
npm run dev
```

Expected output:
```
✅ Server running on port 5000
📍 Environment: development
✅ Connected to MongoDB Atlas
```

### Step 4: Test the API

Open Postman or cURL and test:

```bash
# Health check
curl http://localhost:5000/health

# Create exam code
curl -X POST http://localhost:5000/api/exam/create \
  -H "Content-Type: application/json" \
  -d '{"examCode":"TEST_001"}'
```

---

## Example Workflow

### 1️⃣ Create Exam Code
```bash
curl -X POST http://localhost:5000/api/exam/create \
  -H "Content-Type: application/json" \
  -d '{
    "examCode": "TEMENOS_T24_BASICS"
  }'
```

**Response:**
```json
{
  "message": "Exam code created successfully",
  "exam": {
    "_id": "uuid-here",
    "examCode": "TEMENOS_T24_BASICS",
    "createdAt": "2026-01-26T10:00:00Z",
    "questionCount": 0
  }
}
```

### 2️⃣ Upload Question Screenshot
```bash
curl -X POST http://localhost:5000/api/exam/TEMENOS_T24_BASICS/upload \
  -F "image=@/path/to/question_screenshot.jpg"
```

**Response:**
```json
{
  "message": "Question uploaded and processed successfully",
  "question": {
    "_id": "uuid-here",
    "examCode": "TEMENOS_T24_BASICS",
    "imageUrl": "/uploads/1674745200000_123456789.jpg",
    "extractedText": "What is the primary function of...",
    "uploadedAt": "2026-01-26T10:05:00Z"
  }
}
```

### 3️⃣ Upload More Questions
Repeat step 2 with different question screenshots (5-10 questions recommended for testing).

### 4️⃣ Compare New Image
```bash
curl -X POST http://localhost:5000/api/exam/compare \
  -F "image=@/path/to/test_screenshot.jpg" \
  -F "textThreshold=0.65" \
  -F "imageThreshold=0.65"
```

**Response (Success):**
```json
{
  "status": "SUCCESS",
  "topMatch": {
    "_id": "uuid",
    "examCode": "TEMENOS_T24_BASICS",
    "textSimilarityScore": 0.92,
    "imageSimilarityScore": 0.88,
    "matchedTextSnippet": "What is the primary function of...",
    "matchedImageUrl": "/uploads/1674745200000_123456789.jpg",
    "confidence": "HIGH",
    "combinedScore": 0.90
  },
  "report": {
    "totalMatches": 3,
    "highConfidenceMatches": 2,
    "mediumConfidenceMatches": 1,
    "lowConfidenceMatches": 0,
    "examCodeBreakdown": {
      "TEMENOS_T24_BASICS": 3
    }
  }
}
```

---

## File Recommendations for Testing

Use **exam question screenshots** with:
- ✅ Clear, readable text
- ✅ High contrast (black text on white background)
- ✅ Horizontal text orientation
- ✅ JPEG/PNG format
- ✅ Size: 500×500px to 2000×2000px

**Avoid:**
- ❌ Blurry images
- ❌ Rotated text
- ❌ Very small fonts
- ❌ Handwritten text

---

## Useful Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/health` | Check server status |
| POST | `/api/exam/create` | Create exam code |
| GET | `/api/exam/list` | List all exams |
| POST | `/api/exam/:examCode/upload` | Upload question |
| GET | `/api/exam/:examCode/questions` | View exam questions |
| POST | `/api/exam/compare` | Compare image (main feature) |
| DELETE | `/api/exam/question/:id` | Delete question |
| GET | `/api/exam/stats` | View statistics |

---

## Troubleshooting

### Error: "Cannot find module 'mongodb'"
```bash
npm install
```

### Error: "MONGODB_URI not found"
- Create `.env` file with valid MongoDB URI
- Verify IP whitelist in MongoDB Atlas

### Error: "Cannot extract text from image"
- Use higher quality image
- Ensure text is horizontal
- Increase image contrast
- Try a different image format

### Error: "Port 5000 already in use"
```bash
# Change port in .env
PORT=5001
```

---

## Next Steps

1. ✅ Install and run the server
2. ✅ Create exam codes and upload questions
3. ✅ Test the comparison API
4. ✅ Read [TECHNICAL_DOCUMENTATION.md](TECHNICAL_DOCUMENTATION.md) for deep dive
5. ✅ Check [README.md](README.md) for full API reference

---

## API Testing Tools

### Option 1: Postman
1. Download [Postman](https://www.postman.com/downloads/)
2. Import `API_TESTING.json`
3. Update `localhost:5000` if using different port
4. Click "Send" on each endpoint

### Option 2: Insomnia
1. Download [Insomnia](https://insomnia.rest/)
2. Import `API_TESTING.json`
3. Test endpoints

### Option 3: cURL (Command Line)
```bash
# Create exam
curl -X POST http://localhost:5000/api/exam/create \
  -H "Content-Type: application/json" \
  -d '{"examCode":"TEST"}'

# Upload image
curl -X POST http://localhost:5000/api/exam/TEST/upload \
  -F "image=@image.jpg"

# Compare
curl -X POST http://localhost:5000/api/exam/compare \
  -F "image=@image.jpg"
```

---

## Performance Tips

1. **Optimize images** before upload (resize to ~1000×1000px)
2. **Adjust thresholds** based on OCR quality:
   - High quality images → textThreshold: 0.75
   - Medium quality → textThreshold: 0.65
   - Low quality → textThreshold: 0.55
3. **Monitor database** - Check MongoDB Atlas dashboard
4. **Add indexes** for faster queries (already configured)

---

## Support & Documentation

- **Technical Deep Dive:** [TECHNICAL_DOCUMENTATION.md](TECHNICAL_DOCUMENTATION.md)
- **Full API Reference:** [README.md](README.md)
- **API Examples:** [API_TESTING.json](API_TESTING.json)

Enjoy! 🚀
