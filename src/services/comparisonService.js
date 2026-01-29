/**
 * Comparison Service
 * Orchestrates text-based matching using extracted text from database
 */

const { extractTextFromImage, normalizeText } = require('./ocrService');
const { calculateTextSimilarity } = require('./textMatchService');

/**
 * Determine confidence level based on text similarity score
 * @param {number} textScore - Text similarity score
 * @returns {string} - Confidence level (HIGH, MEDIUM, LOW)
 */
const getConfidenceLevel = (textScore) => {
  if (textScore >= 0.85) return 'HIGH';
  if (textScore >= 0.70) return 'MEDIUM';
  return 'LOW';
};

/**
 * Perform text-based matching using extracted text from database
 * @param {string} uploadedImagePath - Path to uploaded image
 * @param {Array} storedDocuments - Stored question documents (with extractedText)
 * @param {number} textThreshold - Minimum text similarity threshold
 * @returns {Promise<Object>} - Matching results sorted by similarity
 */
const performDualMatching = async (
  uploadedImagePath,
  storedDocuments,
  uploadedImageHash,
  textThreshold = 0.55
) => {
  try {
    // Step 1: OCR extraction from uploaded image
    const uploadedText = await extractTextFromImage(uploadedImagePath);
    const normalizedUploadedText = normalizeText(uploadedText);

    if (!normalizedUploadedText || normalizedUploadedText.length === 0) {
      return {
        status: 'NO_MATCH',
        reason: 'Could not extract text from uploaded image',
        results: [],
        debug: {
          ocrOutput: uploadedText,
          normalizedLength: normalizedUploadedText.length,
        },
      };
    }

    // Step 2: Compare uploaded text against all stored extracted texts
    const textMatches = storedDocuments
      .map(doc => {
        // Ensure extractedText exists in the document
        const storedExtractedText = doc.extractedText || '';
        const normalizedStoredText = normalizeText(storedExtractedText);
        
        return {
          ...doc,
          textSimilarity: calculateTextSimilarity(
            normalizedUploadedText,
            normalizedStoredText
          ),
          normalizedStoredText,
        };
      })
      .filter(doc => doc.textSimilarity >= textThreshold)
      .map(doc => ({
        _id: doc._id,
        examCode: doc.examCode,
        textSimilarityScore: doc.textSimilarity,
        matchedExtractedText: doc.extractedText.substring(0, 300),
        matchedImageUrl: doc.imageUrl,
        confidence: getConfidenceLevel(doc.textSimilarity),
        combinedScore: doc.textSimilarity, // Primary score is text similarity
        uploadedAt: doc.createdAt,
      }))
      .sort((a, b) => b.combinedScore - a.combinedScore);

    console.log(`📊 Text comparison completed. Found ${textMatches.length} matches.`);

    if (textMatches.length === 0) {
      // Return partial matches for debugging
      const allMatches = storedDocuments.map(doc => {
        const storedExtractedText = doc.extractedText || '';
        const normalizedStoredText = normalizeText(storedExtractedText);
        
        return {
          ...doc,
          textSimilarity: calculateTextSimilarity(
            normalizedUploadedText,
            normalizedStoredText
          ),
        };
      }).sort((a, b) => b.textSimilarity - a.textSimilarity);

      const partialMatches = allMatches.slice(0, 3);

      return {
        status: 'NO_CONFIRMED_MATCH',
        reason: `No matches found above text similarity threshold (${textThreshold})`,
        results: [],
        suggestedThresholds: {
          textThreshold: Math.max(...allMatches.map(m => m.textSimilarity)) - 0.1,
        },
        debugInfo: {
          topTextMatches: partialMatches.map(m => ({
            examCode: m.examCode,
            textSimilarity: m.textSimilarity,
            extractedTextPreview: m.extractedText.substring(0, 100),
          })),
        },
      };
    }

    return {
      status: 'SUCCESS',
      results: textMatches,
      topMatch: textMatches[0],
    };
  } catch (error) {
    console.error('❌ Text matching failed:', error);
    throw error;
  }
};

/**
 * Get detailed match report
 * @param {Array} matches - Matched results
 * @returns {Object} - Detailed report
 */
const generateMatchReport = (matches) => {
  if (matches.length === 0) {
    return {
      totalMatches: 0,
      highConfidenceMatches: 0,
      mediumConfidenceMatches: 0,
      lowConfidenceMatches: 0,
      report: 'No matches found',
    };
  }

  const report = {
    totalMatches: matches.length,
    highConfidenceMatches: matches.filter(m => m.confidence === 'HIGH').length,
    mediumConfidenceMatches: matches.filter(m => m.confidence === 'MEDIUM')
      .length,
    lowConfidenceMatches: matches.filter(m => m.confidence === 'LOW').length,
    examCodeBreakdown: {},
    matches: matches.slice(0, 10), // Top 10 matches
  };

  // Group by exam code
  matches.forEach(match => {
    if (!report.examCodeBreakdown[match.examCode]) {
      report.examCodeBreakdown[match.examCode] = 0;
    }
    report.examCodeBreakdown[match.examCode]++;
  });

  return report;
};

module.exports = {
  performDualMatching,
  generateMatchReport,
  getConfidenceLevel,
};
