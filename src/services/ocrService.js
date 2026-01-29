require('dotenv').config();
const fs = require('fs');
const path = require('path');
const Tesseract = require('tesseract.js');

/**
 * Extract text from image using Tesseract.js OCR (local processing)
 * No API calls needed - processes locally
 * @param {string} imagePath - Path to the image file
 * @returns {Promise<string>} - Extracted text
 */
const extractTextFromImage = async (imagePath) => {
  try {
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Image file not found: ${imagePath}`);
    }

    console.log(`🔍 Starting OCR on image: ${path.basename(imagePath)}`);
    const startTime = Date.now();

    // Use Tesseract.js for local OCR processing
    const { data: { text, confidence } } = await Tesseract.recognize(imagePath, 'eng', {
      logger: m => console.log(`   Tesseract progress: ${Math.round(m.progress * 100)}%`),
    });

    const duration = Date.now() - startTime;

    if (!text || text.trim().length === 0) {
      console.warn('⚠️ Tesseract returned empty text. Image may not contain readable text.');
      return '';
    }

    // Clean the extracted text
    const cleanedText = cleanOCRText(text);

    console.log(`✅ OCR completed in ${duration}ms. Confidence: ${Math.round(confidence * 100)}%`);
    console.log(`   Extracted ${cleanedText.length} characters`);
    console.log(`   First 100 chars: "${cleanedText.substring(0, 100)}..."`);

    return cleanedText;
  } catch (error) {
    console.error('❌ OCR extraction failed:', error.message);
    throw error;
  }
};

/**
 * Clean OCR text - remove noise and common errors
 * @param {string} text - Raw OCR output
 * @returns {string} - Cleaned text
 */
const cleanOCRText = (text) => {
  if (!text) return '';

  return text
    // Remove excessive spaces and newlines
    .replace(/\s{3,}/g, ' ')           // Multiple spaces -> single space
    .replace(/\n{3,}/g, '\n\n')        // Multiple newlines -> double newline
    // Clean up punctuation
    .replace(/([.!?])\1{2,}/g, '$1')   // Multiple punctuation -> single
    .trim();
};

/**
 * Normalize text for comparison
 * @param {string} text - Raw text to normalize
 * @returns {string} - Normalized text
 */
const normalizeText = (text) => {
  if (!text) return '';

  return text
    .toLowerCase()
    // Handle accented characters
    .replace(/é|è|ê|ë/g, 'e')
    .replace(/á|à|â|ä|ã/g, 'a')
    .replace(/í|ì|î|ï/g, 'i')
    .replace(/ó|ò|ô|ö|õ/g, 'o')
    .replace(/ú|ù|û|ü/g, 'u')
    // Remove special characters but preserve spaces
    .replace(/[^\w\s]/g, '')
    // Collapse multiple spaces
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Clean text for better OCR comparison
 * Removes stopwords and normalizes variations
 * @param {string} text - Raw text
 * @returns {string} - Cleaned text
 */
const cleanTextForComparison = (text) => {
  if (!text) return '';

  const stopwords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
    'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that',
    'these', 'those', 'which', 'who', 'what', 'when', 'where', 'why', 'how',
  ]);

  return normalizeText(text)
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopwords.has(word))
    .join(' ')
    .trim();
};

/**
 * Extract meaningful tokens from text
 * Focuses on content words, not grammatical words
 * @param {string} text - Raw text
 * @returns {Array} - Array of tokens
 */
const extractTokens = (text) => {
  const normalized = normalizeText(text);
  if (!normalized) return [];

  // Split into tokens and remove very short ones (likely noise)
  return normalized
    .split(/\s+/)
    .filter(token => token.length > 2)
    .map(token => token.toLowerCase());
};

/**
 * Calculate OCR confidence based on text characteristics
 * @param {string} text - Extracted text
 * @returns {string} - Confidence level
 */
const calculateOCRConfidence = (text) => {
  if (!text || text.length === 0) return 'VERY_LOW';

  // Count suspicious patterns
  let suspiciousCount = 0;
  const suspicious = /[0O]{2,}|[1l|]{2,}|[~`^]{2,}/g;
  const matches = text.match(suspicious);
  if (matches) suspiciousCount = matches.length;

  // Calculate ratio
  const ratio = suspiciousCount / (text.length / 10);

  if (ratio < 0.1) return 'HIGH';
  if (ratio < 0.3) return 'MEDIUM';
  if (ratio < 0.5) return 'LOW';
  return 'VERY_LOW';
};

module.exports = {
  extractTextFromImage,
  normalizeText,
  cleanOCRText,
  cleanTextForComparison,
  extractTokens,
  calculateOCRConfidence,
};
