# Inlaks T24 Backend - OCR-Based Exam Question Comparison System

## Overview

This is a **production-ready backend system** for managing and comparing image-based Temenos exam questions using OCR (Optical Character Recognition) and dual-level verification (text + image matching).

**Core Technology:**
- **OCR:** Tesseract.js for text extraction
- **Text Matching:** Cosine similarity, Jaccard similarity, Levenshtein distance
- **Image Matching:** Perceptual hashing (pHash) with Hamming distance
- **Database:** MongoDB Atlas
- **Framework:** Node.js + Express.js

---

## Features

✅ **OCR Text Extraction** - Extract text from exam question screenshots  
✅ **Dual Matching Verification** - Confirm matches by both text AND image  
✅ **Multi-Algorithm Text Comparison** - Cosine, Jaccard, Levenshtein  
✅ **Perceptual Image Hashing** - Find visually similar images  
✅ **Exam Code Organization** - Group questions by Temenos exam codes  
✅ **Confidence Scoring** - HIGH/MEDIUM/LOW confidence results  
✅ **Detailed Match Reports** - Breakdown of matches by exam code  
✅ **RESTful API** - Clean endpoints for all operations  

---

## Installation & Setup

### 1. Prerequisites

- Node.js 16+ and npm
- MongoDB Atlas account (free tier available)
- Git

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
PORT=5000
NODE_ENV=development
UPLOAD_DIR=./uploads
```

Replace `<username>`, `<password>`, and `<cluster>` with your MongoDB Atlas credentials.

### 4. Start the Server

**Development mode** (with auto-reload):
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

Server will run on `http://localhost:5000`

---

## API Endpoints

### 1. Create Exam Code
**POST** `/api/exam/create`

Create a new exam code for organizing questions.

**Request:**
```json
{
  "examCode": "TEMENOS_T24_001"
}
```

**Response:**
```json
{
  "message": "Exam code created successfully",
  "exam": {
    "_id": "uuid",
    "examCode": "TEMENOS_T24_001",
    "createdAt": "2026-01-26T10:00:00Z",
    "questionCount": 0
  }
}
```

---

### 2. List All Exam Codes
**GET** `/api/exam/list`

Retrieve all created exam codes with question counts.

**Response:**
```json
{
  "totalExams": 2,
  "exams": [
    {
      "_id": "uuid1",
      "examCode": "TEMENOS_T24_001",
      "createdAt": "2026-01-26T10:00:00Z",
      "questionCount": 5
    },
    {
      "_id": "uuid2",
      "examCode": "TEMENOS_T24_002",
      "createdAt": "2026-01-26T10:05:00Z",
      "questionCount": 3
    }
  ]
}
```

---

### 3. Upload Question to Exam
**POST** `/api/exam/:examCode/upload`

Upload a screenshot question to an exam code. The system will:
1. Extract text via OCR
2. Normalize the text
3. Generate perceptual hash
4. Store in database

**Request:**
- Content-Type: `multipart/form-data`
- Field name: `image` (image file)

**Response:**
```json
{
  "message": "Question uploaded and processed successfully",
  "question": {
    "_id": "uuid",
    "examCode": "TEMENOS_T24_001",
    "imageUrl": "/uploads/1674745200000_123456789.jpg",
    "extractedText": "What is the balance in account...",
    "uploadedAt": "2026-01-26T10:00:00Z"
  }
}
```

---

### 4. Get Questions for Exam Code
**GET** `/api/exam/:examCode/questions`

Retrieve all questions stored for a specific exam code.

**Response:**
```json
{
  "examCode": "TEMENOS_T24_001",
  "totalQuestions": 5,
  "questions": [
    {
      "_id": "uuid1",
      "imageUrl": "/uploads/file1.jpg",
      "extractedText": "What is the balance...",
      "createdAt": "2026-01-26T10:00:00Z"
    }
  ]
}
```

---

### 5. Compare Image (Dual Matching) ⭐ CORE ENDPOINT
**POST** `/api/exam/compare`

Upload an image to compare against ALL stored questions. Returns matches validated by **both** text and image similarity.

**Request:**
- Content-Type: `multipart/form-data`
- Field name: `image` (image file)
- Optional fields (JSON):
  - `textThreshold`: 0-1 (default: 0.65)
  - `imageThreshold`: 0-1 (default: 0.65)

**Response (Success - Found Matches):**
```json
{
  "status": "SUCCESS",
  "topMatch": {
    "_id": "uuid",
    "examCode": "TEMENOS_T24_001",
    "textSimilarityScore": 0.92,
    "imageSimilarityScore": 0.88,
    "matchedTextSnippet": "What is the account balance...",
    "matchedImageUrl": "/uploads/file1.jpg",
    "confidence": "HIGH",
    "combinedScore": 0.90
  },
  "report": {
    "totalMatches": 3,
    "highConfidenceMatches": 2,
    "mediumConfidenceMatches": 1,
    "lowConfidenceMatches": 0,
    "examCodeBreakdown": {
      "TEMENOS_T24_001": 2,
      "TEMENOS_T24_002": 1
    },
    "matches": [
      {
        "_id": "uuid1",
        "examCode": "TEMENOS_T24_001",
        "textSimilarityScore": 0.92,
        "imageSimilarityScore": 0.88,
        "confidence": "HIGH",
        "combinedScore": 0.90
      }
    ]
  },
  "results": [
    // Complete list of all matches sorted by confidence
  ]
}
```

**Response (No Match Found):**
```json
{
  "status": "NO_CONFIRMED_MATCH",
  "reason": "No matches found satisfying both text and image similarity thresholds",
  "topMatch": null,
  "report": {
    "totalMatches": 0,
    "highConfidenceMatches": 0,
    "mediumConfidenceMatches": 0,
    "lowConfidenceMatches": 0,
    "examCodeBreakdown": {},
    "matches": []
  },
  "results": []
}
```

---

### 6. Delete Question
**DELETE** `/api/exam/question/:questionId`

Remove a question from the database.

**Response:**
```json
{
  "message": "Question deleted successfully",
  "deletedCount": 1
}
```

---

### 7. Get System Statistics
**GET** `/api/exam/stats`

Retrieve system-wide statistics.

**Response:**
```json
{
  "totalExams": 2,
  "totalQuestions": 8,
  "exams": [
    {
      "examCode": "TEMENOS_T24_001",
      "questionCount": 5
    },
    {
      "examCode": "TEMENOS_T24_002",
      "questionCount": 3
    }
  ]
}
```

---

## Dual Matching Algorithm

The **core requirement** of this system is **dual verification**: a match is considered valid ONLY if it passes BOTH text and image similarity checks.

### Process Flow

```
User uploads image
        ↓
[Step 1] OCR Text Extraction
        ↓
[Step 2] Text Normalization
        ↓
[Step 3] Perceptual Hash Generation
        ↓
[Step 4] Text Similarity Matching
        ├─ Compare normalized text against all stored texts
        ├─ Use: Cosine + Jaccard + Levenshtein
        └─ Filter by text threshold (default: 0.65)
        ↓
[Step 5] Image Similarity Confirmation
        ├─ Compare hashes using Hamming distance
        └─ Filter by image threshold (default: 0.65)
        ↓
[Step 6] Rank Results
        ├─ By combined score (text + image avg)
        └─ Assign confidence: HIGH / MEDIUM / LOW
        ↓
[Step 7] Return Dual-Verified Results
```

### Matching Algorithms

#### Text Similarity
- **Cosine Similarity** (50% weight) - Measures angle between token vectors
- **Jaccard Similarity** (30% weight) - Token set overlap ratio
- **Levenshtein Distance** (20% weight) - Character-level edit distance

**Formula:**
```
Combined Score = (Cosine × 0.5) + (Jaccard × 0.3) + (Levenshtein × 0.2)
```

#### Image Similarity
- **Perceptual Hash (pHash)** - Resizes image to 8×8, compares pixel values
- **Hamming Distance** - Counts differing bits between hashes

**Formula:**
```
Image Similarity = 1 - (Hamming Distance / Max Hash Length)
```

#### Confidence Levels
```
Average Score >= 0.85  →  HIGH confidence
Average Score >= 0.70  →  MEDIUM confidence
Average Score <  0.70  →  LOW confidence
```

---

## Database Schema

### Collection: `questions`

```javascript
{
  _id: UUID,
  examCode: String,           // "TEMENOS_T24_001"
  imageUrl: String,           // "/uploads/file.jpg"
  imageHash: String,          // Perceptual hash (SHA-256)
  extractedText: String,      // Raw OCR output
  normalizedText: String,     // Processed text for matching
  uploadedBy: String,         // Optional user identifier
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `examCode` - Fast lookup by exam code
- `extractedText` (text index) - Full-text search
- `createdAt` - Sort by upload time

### Collection: `exams`

```javascript
{
  _id: UUID,
  examCode: String,           // "TEMENOS_T24_001"
  createdAt: Date,
  questionCount: Number       // Total questions in exam
}
```

---

## File Structure

```
InlaksT24Backend/
├── src/
│   ├── index.js                      # Main entry point
│   ├── config/
│   │   └── database.js               # MongoDB connection
│   ├── controllers/
│   │   └── examController.js         # Route handlers
│   ├── services/
│   │   ├── ocrService.js             # OCR extraction & text normalization
│   │   ├── textMatchService.js       # Text similarity algorithms
│   │   ├── imageMatchService.js      # Image hashing & comparison
│   │   ├── comparisonService.js      # Dual matching orchestration
│   │   └── databaseService.js        # DB operations
│   ├── middleware/
│   │   ├── errorHandler.js           # Error handling
│   │   └── uploadMiddleware.js       # Multer file upload
│   └── routes/
│       └── examRoutes.js             # API routes
├── uploads/                          # Uploaded images (local storage)
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

---

## Configuration Options

### Environment Variables

```env
# MongoDB connection string
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db

# Server port
PORT=5000

# Environment
NODE_ENV=development|production

# Upload directory
UPLOAD_DIR=./uploads

# Optional: Cloud storage (for future enhancement)
CLOUDINARY_CLOUD_NAME=your_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
```

### Matching Thresholds

Adjust thresholds per comparison request:
```json
{
  "textThreshold": 0.65,   // 0-1, default 0.65
  "imageThreshold": 0.65   // 0-1, default 0.65
}
```

**Recommendations:**
- **Strict matching:** textThreshold=0.80, imageThreshold=0.80
- **Moderate matching:** textThreshold=0.65, imageThreshold=0.65
- **Lenient matching:** textThreshold=0.50, imageThreshold=0.50

---

## Performance & Scalability

### Optimizations

1. **Database Indexes** - Fast lookups on `examCode`, full-text search
2. **Text Normalization** - Reduces noise before comparison
3. **Perceptual Hashing** - Quick image similarity without pixel-by-pixel comparison
4. **Dual Filtering** - Eliminates poor matches early (text → image)
5. **Caching Ready** - Services can be wrapped with Redis

### Scalability Considerations

- **Horizontal Scaling:** Stateless design allows load balancing
- **MongoDB Atlas:** Handles auto-scaling
- **Async Processing:** Long OCR operations won't block requests
- **Cloud Storage:** Replace local uploads with S3/Cloudinary
- **Batch Operations:** Add background jobs for bulk uploads
- **NLP Embeddings:** Future enhancement using sentence transformers

---

## Error Handling

### Common Error Responses

**400 Bad Request**
```json
{
  "error": "No image file provided"
}
```

**404 Not Found**
```json
{
  "error": "Route not found"
}
```

**500 Internal Server Error**
```json
{
  "error": "Internal server error",
  "status": 500
}
```

---

## Testing the API

### Using cURL

**1. Create Exam Code:**
```bash
curl -X POST http://localhost:5000/api/exam/create \
  -H "Content-Type: application/json" \
  -d '{"examCode":"TEMENOS_T24_001"}'
```

**2. Upload Question:**
```bash
curl -X POST http://localhost:5000/api/exam/TEMENOS_T24_001/upload \
  -F "image=@path/to/image.jpg"
```

**3. Compare Image:**
```bash
curl -X POST http://localhost:5000/api/exam/compare \
  -F "image=@path/to/test_image.jpg"
```

### Using Postman/Insomnia

- Import endpoints and test with GUI
- Set `textThreshold` and `imageThreshold` in request body
- View detailed match reports

---

## Future Enhancements

- [ ] **Authentication & Authorization** - JWT tokens, role-based access
- [ ] **Background Processing** - Bull queues for async OCR jobs
- [ ] **Caching Layer** - Redis for frequently accessed data
- [ ] **Cloud Storage** - AWS S3 / Cloudinary integration
- [ ] **NLP Embeddings** - Semantic similarity with sentence transformers
- [ ] **Webhook Support** - Notify clients when comparison completes
- [ ] **Batch Uploads** - Process multiple images simultaneously
- [ ] **Analytics Dashboard** - Track comparison metrics
- [ ] **Export Results** - CSV/PDF reports
- [ ] **Multi-language OCR** - Support additional languages

---

## Troubleshooting

### Issue: "Could not extract text from image"
- **Cause:** Image quality too low or text not readable
- **Solution:** Use clear, high-contrast images. Ensure text is horizontal.

### Issue: "No matches found"
- **Cause:** Thresholds too high or no similar questions in DB
- **Solution:** Reduce thresholds or ensure similar questions exist

### Issue: "MongoDB connection failed"
- **Cause:** Invalid connection string or network issue
- **Solution:** Check `.env` file, verify MongoDB Atlas credentials and IP whitelist

### Issue: "Multer: Unexpected field"
- **Cause:** Wrong field name in form data
- **Solution:** Use field name `image` for file uploads

---

## License

MIT

---

## Support

For issues or questions, refer to the code comments and service documentation in the `src/services/` directory.
