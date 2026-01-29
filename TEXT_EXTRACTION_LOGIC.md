# Text-Based Comparison Logic Implementation

## Overview
The system has been updated to use **extracted text from images** as the primary matching criterion for comparisons. This improves accuracy and consistency by comparing text content rather than image properties.

## Flow Architecture

### 1. Image Upload & Text Extraction (`/exam/:examCode/upload`)
```
User uploads image
    ↓
Mistral AI OCR extracts text
    ↓
Text is normalized
    ↓
Image hash is generated (for future use)
    ↓
Stored in database:
  - extractedText (original OCR output)
  - normalizedText (cleaned version)
  - imageUrl
  - imageHash
  - examCode
```

**Response includes:**
- Full extracted text
- Character count
- OCR quality status (GOOD/FAIR)

---

### 2. Comparison & Matching (`/exam/compare`)
```
User uploads image for comparison
    ↓
Mistral AI OCR extracts text from uploaded image
    ↓
Text is normalized
    ↓
Compare against ALL stored questions:
  - Calculate text similarity score (0-1)
  - Filter by textThreshold (default: 0.55)
    ↓
Results sorted by similarity score (descending)
    ↓
Return matching results with:
  - Matched exam code
  - Matched extracted text
  - Text similarity score
  - Confidence level (HIGH/MEDIUM/LOW)
  - Image URL of match
```

---

### 3. Result Display & Analysis

#### For Individual Question Retrieval (`/exam/:examCode/questions`)
Shows all questions for an exam with:
- Full extracted text (not truncated)
- Character count
- Upload timestamp
- Image URL

#### For Comparison Results (`/exam/compare`)
Returns top matches with:
- **Text similarity score**: How well the uploaded text matches stored text
- **Confidence level**: 
  - HIGH: Score ≥ 0.85
  - MEDIUM: Score ≥ 0.70
  - LOW: Score < 0.70
- **Matched extracted text preview**: First 300 characters
- **Full match report**: Summary statistics

---

## Key Changes

### Comparison Service (`src/services/comparisonService.js`)
**Before:** Dual matching (text + image similarity, both required)
**After:** Text-based matching (primary criterion)

**Changes:**
1. Removed `calculateImageSimilarity` dependency
2. Simplified confidence level calculation (text-only)
3. Removed image threshold parameter
4. Compare against stored `extractedText` field

### Exam Controller (`src/controllers/examController.js`)
**Changes:**
1. `compareImage`: Removed `imageThreshold` parameter
2. Added `uploadedTextPreview` to response
3. `getQuestionsForExam`: Shows full extracted text (not truncated)
4. Result includes text length metrics

---

## Database Schema

**Questions Collection:**
```json
{
  "_id": "uuid",
  "examCode": "EXM001",
  "imageUrl": "/uploads/image.jpg",
  "imageHash": "hash-string",
  "extractedText": "Full text extracted by Mistral AI",
  "normalizedText": "cleaned version of extracted text",
  "createdAt": "2026-01-28T...",
  "updatedAt": "2026-01-28T..."
}
```

---

## API Endpoints

### Upload Question
```bash
POST /exam/:examCode/upload
Content-Type: multipart/form-data
- image: [file]

Response:
{
  "message": "Question uploaded and processed successfully",
  "question": {
    "_id": "...",
    "examCode": "...",
    "imageUrl": "/uploads/...",
    "extractedText": "...",
    "extractedCharCount": 1250,
    "uploadedAt": "..."
  },
  "ocrQuality": {
    "extractedChars": 1250,
    "status": "GOOD"
  }
}
```

### Compare Image
```bash
POST /exam/compare
Content-Type: multipart/form-data
- image: [file]
- textThreshold: 0.55 (optional)

Response:
{
  "status": "SUCCESS",
  "uploadedTextPreview": "...",
  "uploadedTextLength": 500,
  "topMatch": {
    "_id": "...",
    "examCode": "...",
    "textSimilarityScore": 0.92,
    "matchedExtractedText": "...",
    "confidence": "HIGH",
    "matchedImageUrl": "..."
  },
  "results": [
    // Array of matches sorted by similarity
  ],
  "report": {
    "totalMatches": 5,
    "highConfidenceMatches": 3,
    "mediumConfidenceMatches": 2,
    "lowConfidenceMatches": 0
  }
}
```

### Get Questions for Exam
```bash
GET /exam/:examCode/questions

Response:
{
  "examCode": "EXM001",
  "totalQuestions": 10,
  "questions": [
    {
      "_id": "...",
      "imageUrl": "/uploads/...",
      "extractedText": "Full text content",
      "extractedTextLength": 2500,
      "createdAt": "..."
    }
  ]
}
```

---

## Thresholds & Tuning

### Text Similarity Threshold
- **Default**: 0.55 (55% match)
- **Recommended Range**: 0.50 - 0.70
- **Lower values**: More matches (higher false positives)
- **Higher values**: Stricter matching (may miss similar items)

### Confidence Levels
- **HIGH (≥0.85)**: Excellent match, high confidence
- **MEDIUM (0.70-0.84)**: Good match, reasonable confidence  
- **LOW (<0.70)**: Partial match, may be false positive

---

## Testing Workflow

### 1. Create Exam Code
```bash
POST /exam/create
{"examCode": "TEST001"}
```

### 2. Upload Questions
```bash
POST /exam/TEST001/upload
[Upload image 1] → Gets stored with extracted text
[Upload image 2] → Gets stored with extracted text
[Upload image 3] → Gets stored with extracted text
```

### 3. View Stored Texts
```bash
GET /exam/TEST001/questions
→ See all extracted texts for the exam
```

### 4. Test Comparison
```bash
POST /exam/compare
[Upload similar image] → Returns matching questions with extracted text
```

---

## Benefits of Text-Based Approach

1. **Accuracy**: Directly comparing content instead of visual similarity
2. **Consistency**: OCR variations handled by text similarity algorithm
3. **Flexibility**: Easy to adjust text threshold without regenerating hashes
4. **Performance**: Text comparison faster than image hash calculation
5. **Transparency**: Clear what text matched, not abstract image scores
6. **Scaling**: Works well with large databases (text indexing possible)

---

## Future Enhancements

1. Add full-text search indexing on `extractedText`
2. Store alternative text representations (embeddings)
3. Implement fuzzy matching for OCR errors
4. Add keyword extraction and tagging
5. Batch processing for large document sets
6. Text confidence scoring from Mistral AI

---

## Migration Notes

- All newly uploaded images will automatically have extracted text
- Existing questions in database remain functional
- Both old and new questions work with comparison logic
- No database migration required (MongoDB is flexible)
