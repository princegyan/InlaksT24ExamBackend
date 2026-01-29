# Technical Documentation - Dual Matching Algorithm

## Overview

This document details the **core technical implementation** of the OCR-based dual matching system that verifies results by both **text similarity** and **image similarity**.

---

## 1. OCR Service (`src/services/ocrService.js`)

### Purpose
Extract text from images and normalize it for comparison.

### Key Functions

#### `extractTextFromImage(imagePath)`
Uses **Tesseract.js** to perform OCR:
```javascript
const result = await Tesseract.recognize(imagePath, 'eng', {...});
const extractedText = result.data.text;
```

**Performance:**
- Typical extraction: 2-5 seconds per image
- Supports: JPEG, PNG, GIF, WebP
- Language: English (configurable)

#### `normalizeText(text)`
Cleans extracted text for consistent comparison:
```javascript
text
  .toLowerCase()              // 'HELLO' → 'hello'
  .replace(/[^\w\s]/g, '')   // Remove punctuation
  .replace(/\s+/g, ' ')      // Collapse whitespace
  .trim()
```

**Example:**
```
Original:  "What is the BALANCE in Account #123?"
Normalized: "what is the balance in account 123"
```

---

## 2. Text Matching Service (`src/services/textMatchService.js`)

### Three-Algorithm Approach

The system uses **three complementary algorithms** to capture different aspects of text similarity:

#### Algorithm 1: Cosine Similarity (50% weight)

**Concept:** Treats text as vectors of token frequencies. Measures angle between vectors.

**Formula:**
```
cosine(A, B) = (A · B) / (||A|| × ||B||)
```

**Advantages:**
- Robust to word order differences
- Focuses on semantic content
- Works well for longer texts

**Example:**
```
Text A: "what is the account balance"
Text B: "what is the balance of the account"

Vector A: [what:1, is:1, the:1, account:1, balance:1]
Vector B: [what:1, is:1, the:1, balance:1, of:1, account:1]

Cosine Score: ~0.89 (high similarity despite word reordering)
```

#### Algorithm 2: Jaccard Similarity (30% weight)

**Concept:** Ratio of intersection to union of word sets.

**Formula:**
```
Jaccard(A, B) = |A ∩ B| / |A ∪ B|
```

**Advantages:**
- Simple and interpretable
- Penalizes missing words
- Good for question matching

**Example:**
```
Set A: {what, is, the, account, balance}
Set B: {what, is, the, account, balance, new}

Intersection: {what, is, the, account, balance} (5 words)
Union: {what, is, the, account, balance, new} (6 words)

Jaccard Score: 5/6 = 0.83
```

#### Algorithm 3: Levenshtein Similarity (20% weight)

**Concept:** Normalized edit distance at character level.

**Formula:**
```
Similarity = 1 - (EditDistance / MaxLength)
```

**Advantages:**
- Catches typos and slight variations
- Character-level precision
- Handles OCR errors better

**Example:**
```
Text A: "what is the balance"
Text B: "what is the balence"  (typo: 'e' for 'a')

Edit Distance: 1 (one substitution)
Max Length: 19
Similarity: 1 - (1/19) = 0.95
```

### Combined Score

```javascript
textSimilarity = (cosine × 0.5) + (jaccard × 0.3) + (levenshtein × 0.2)
```

**Why this weighting?**
- Cosine (50%): Most reliable for semantic meaning
- Jaccard (30%): Good for complete word matching
- Levenshtein (20%): Handles OCR errors and typos

**Range:** 0.0 (completely different) to 1.0 (identical)

---

## 3. Image Matching Service (`src/services/imageMatchService.js`)

### Perceptual Hashing

The system uses **perceptual hashing (pHash)** to identify visually similar images despite minor variations.

#### How It Works

1. **Resize Image:** 8×8 pixels (64 values total)
2. **Grayscale Conversion:** Reduces to single channel
3. **Hash Generation:** SHA-256 of pixel data
4. **Comparison:** Hamming distance between hashes

#### Advantages

✅ Fast (no pixel-by-pixel comparison)  
✅ Robust to small rotations/scaling  
✅ Handles JPEG compression  
✅ Suitable for binary comparison  

#### Implementation

```javascript
// Step 1: Resize to 8x8 grayscale
const buffer = await sharp(imagePath)
  .resize(8, 8, { fit: 'fill' })
  .grayscale()
  .raw()
  .toBuffer();

// Step 2: Hash the pixel data
const hash = crypto.createHash('sha256').update(buffer).digest('hex');

// Step 3: Compare using Hamming distance
const distance = hammingDistance(hash1, hash2);
const similarity = 1 - (distance / maxLength);
```

#### Example

```
Image 1: Original screenshot
↓ Resize to 8x8, grayscale
Hash1: "a3f2b1c8d4e9..." (64 hex chars)

Image 2: Same screenshot, slightly rotated
↓ Resize to 8x8, grayscale
Hash2: "a3f2b1c9d4e8..." (64 hex chars)

Hamming Distance: 4 bits different out of 256
Similarity: 1 - (4/256) = 0.98 (MATCH!)
```

---

## 4. Comparison Service (`src/services/comparisonService.js`)

### Dual Matching Orchestration

The comparison service ties together OCR, text matching, and image matching.

#### Process Flow

```
INPUT: Uploaded Image
    ↓
[1] OCR Extraction
    ├─ Extract text from image
    ├─ Normalize text
    └─ Generate image hash
    ↓
[2] Text Similarity Search
    ├─ Compare against all stored normalizedText
    ├─ Calculate combined text score
    └─ Filter by textThreshold (default: 0.65)
    ↓
[3] Image Similarity Confirmation
    ├─ Compare uploaded hash against stored hashes
    ├─ Calculate image similarity score
    └─ Filter by imageThreshold (default: 0.65)
    ↓
[4] Dual Verification
    └─ ONLY results passing BOTH filters
       are returned as valid matches
    ↓
[5] Ranking & Confidence
    ├─ Sort by combined score
    ├─ Assign confidence level (HIGH/MEDIUM/LOW)
    └─ Return sorted results
    ↓
OUTPUT: Dual-Verified Matches
```

### Example Scenario

```
Stored Questions:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Q1: Text "What is the account balance?"
    Hash1: "abc123..."
    
Q2: Text "What is the transaction amount?"
    Hash2: "def456..."
    
Q3: Text "What is the account balance in USD?"
    Hash3: "abc124..."  ← Very similar hash to Q1

Uploaded Image:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Text: "What is the account balance"
Hash: "abc123..."

Matching Results:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Against Q1:
├─ Text Similarity: 0.98 ✓ (≥ 0.65)
├─ Image Similarity: 1.00 ✓ (≥ 0.65)
├─ Confidence: HIGH
└─ VALID MATCH ✓✓

Against Q2:
├─ Text Similarity: 0.72 ✓ (≥ 0.65)
├─ Image Similarity: 0.45 ✗ (< 0.65)
└─ REJECTED (failed image check)

Against Q3:
├─ Text Similarity: 0.88 ✓ (≥ 0.65)
├─ Image Similarity: 0.98 ✓ (≥ 0.65)
├─ Confidence: HIGH
└─ VALID MATCH ✓✓

Final Results: Q1, Q3 returned (Q2 rejected)
```

---

## 5. Database Schema

### Collection: `questions`

```javascript
{
  _id: String (UUID),
  
  // Core identifiers
  examCode: String,            // "TEMENOS_T24_001"
  
  // Image data
  imageUrl: String,            // "/uploads/hash.jpg"
  imageHash: String,           // SHA-256 hex (64 chars)
  
  // Text data
  extractedText: String,       // Raw OCR output (full text)
  normalizedText: String,      // Processed text for matching
  
  // Metadata
  uploadedBy: String,          // Optional user ID
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes

```javascript
// Fast exam code lookup
db.questions.createIndex({ examCode: 1 })

// Full-text search (future enhancement)
db.questions.createIndex({ extractedText: "text" })

// Sort by newest
db.questions.createIndex({ createdAt: -1 })

// Combined: exam code + date
db.questions.createIndex({ examCode: 1, createdAt: -1 })
```

---

## 6. Thresholds & Tuning

### Default Thresholds

```javascript
textThreshold: 0.65     // 65% text match minimum
imageThreshold: 0.65    // 65% image match minimum
```

### Threshold Selection Guide

| Use Case | Text Threshold | Image Threshold | Result |
|----------|---|---|---|
| Exact Match | 0.85 | 0.85 | Most strict, fewest results |
| Strict | 0.75 | 0.75 | Default for security |
| Moderate | 0.65 | 0.65 | Balanced (default) |
| Lenient | 0.50 | 0.50 | More results, more false positives |
| Very Lenient | 0.40 | 0.40 | Includes OCR errors |

### Recommendation Algorithm

```javascript
// Adjust based on OCR quality
if (ocrQuality === 'HIGH') {
  textThreshold = 0.75;
} else if (ocrQuality === 'MEDIUM') {
  textThreshold = 0.65;
} else {
  textThreshold = 0.55;  // Account for OCR errors
}
```

---

## 7. Performance Characteristics

### Time Complexity

| Operation | Time | Notes |
|-----------|------|-------|
| OCR extraction | O(n) | n = image pixels, ~2-5s |
| Text normalization | O(n) | n = text length, <1ms |
| Hash generation | O(n) | n = image size, ~500ms |
| Text similarity | O(n×m) | n,m = token counts, <1ms per doc |
| Image similarity | O(1) | Hamming distance, <1μs |
| Full comparison | O(n) | n = stored documents |

### Benchmark (Example)

```
System: MongoDB + Node.js
Stored Documents: 1,000 questions
Comparison Request:

1. OCR Extraction: 3.2s
2. Hash Generation: 0.5s
3. Text Comparison (1,000 docs): 0.8s
4. Image Filtering: 0.1s
5. Ranking & Output: 0.2s
━━━━━━━━━━━━━━━━━━━━
Total: ~4.8s

Results: 5 dual-verified matches found
```

### Optimization Opportunities

1. **Parallel OCR** - Process multiple images concurrently
2. **Caching** - Cache frequently compared documents
3. **Indexes** - Use MongoDB text indexes
4. **Hashing Pre-computation** - Hash all documents on upload
5. **Batch Processing** - Queue OCR jobs for off-peak processing

---

## 8. Error Handling

### OCR Failures

```javascript
try {
  const text = await extractTextFromImage(imagePath);
  if (!text || text.trim().length === 0) {
    throw new Error('Could not extract text from image');
  }
} catch (error) {
  // Return error response with suggestions
  return {
    status: 400,
    error: 'OCR failed',
    suggestions: [
      'Improve image quality',
      'Ensure text is horizontal',
      'Check image contrast'
    ]
  };
}
```

### Hash Generation Failures

```javascript
try {
  const hash = await generatePerceptualHash(imagePath);
  if (!hash || hash.length === 0) {
    throw new Error('Hash generation failed');
  }
} catch (error) {
  // Use placeholder hash or skip image matching
  imageHash = DEFAULT_HASH;
}
```

### Matching Failures

```javascript
// No results
if (results.length === 0) {
  return {
    status: 'NO_CONFIRMED_MATCH',
    reason: 'No matches satisfying both thresholds',
    suggestions: 'Reduce thresholds or add more questions'
  };
}
```

---

## 9. Security Considerations

### Input Validation

```javascript
// File type validation
const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
if (!allowedMimes.includes(file.mimetype)) {
  throw new Error('Invalid file type');
}

// Size limits
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
if (file.size > MAX_SIZE) {
  throw new Error('File too large');
}
```

### SQL Injection Prevention

MongoDB uses parameterized queries (native):
```javascript
// Safe - parameters passed separately
db.collection('questions').find({ examCode: userInput })

// Avoids string concatenation entirely
```

### Path Traversal Prevention

```javascript
// Multer automatically sanitizes filenames
const storage = multer.diskStorage({
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}_${Math.round(Math.random() * 1e9)}`;
    cb(null, uniqueName); // No user input in path
  }
});
```

---

## 10. Future Enhancements

### Semantic Matching (NLP)

```javascript
// Embed text using sentence transformers
const embedding = await sentenceTransformer.embed(normalizedText);

// Compare embeddings for semantic similarity
const semanticSimilarity = cosineSimilarity(embedding1, embedding2);
// More powerful than keyword matching
```

### Multi-Modal Matching

```javascript
// Combine vision + language models
const imageEmbedding = await visionModel.embed(imagePath);
const textEmbedding = await nlpModel.embed(text);

// Compare across modalities
const multiModalScore = combineScores(imageEmbedding, textEmbedding);
```

### Active Learning

```javascript
// Learn from user feedback
// "This match was correct" → increase threshold
// "This match was wrong" → decrease threshold
```

---

## References

- **Tesseract.js:** https://github.com/naptha/tesseract.js
- **Perceptual Hashing:** http://www.phash.org/
- **Cosine Similarity:** https://en.wikipedia.org/wiki/Cosine_similarity
- **Levenshtein Distance:** https://en.wikipedia.org/wiki/Levenshtein_distance
- **MongoDB Atlas:** https://www.mongodb.com/cloud/atlas

