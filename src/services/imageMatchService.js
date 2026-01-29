const crypto = require('crypto');
const sharp = require('sharp');
const fs = require('fs');

/**
 * Generate perceptual hash (pHash) for an image
 * Uses a simplified version: resize image and hash pixel values
 * @param {string} imagePath - Path to the image
 * @returns {Promise<string>} - Hash string
 */
const generatePerceptualHash = async (imagePath) => {
  try {
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Image file not found: ${imagePath}`);
    }

    // Resize to 8x8 grayscale for quick hashing
    const buffer = await sharp(imagePath)
      .resize(8, 8, { fit: 'fill' })
      .grayscale()
      .raw()
      .toBuffer();

    // Convert to hash based on pixel values
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');
    return hash;
  } catch (error) {
    console.error('❌ Hash generation failed:', error);
    throw error;
  }
};

/**
 * Calculate Hamming distance between two hashes
 * @param {string} hash1 - First hash
 * @param {string} hash2 - Second hash
 * @returns {number} - Hamming distance
 */
const hammingDistance = (hash1, hash2) => {
  if (hash1.length !== hash2.length) {
    return Math.max(hash1.length, hash2.length);
  }

  let distance = 0;
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] !== hash2[i]) {
      distance++;
    }
  }
  return distance;
};

/**
 * Calculate image similarity based on perceptual hash
 * @param {string} hash1 - First image hash
 * @param {string} hash2 - Second image hash
 * @returns {number} - Similarity score (0-1)
 */
const calculateImageSimilarity = (hash1, hash2) => {
  const maxDistance = Math.max(hash1.length, hash2.length);
  const distance = hammingDistance(hash1, hash2);

  if (maxDistance === 0) {
    return 1;
  }

  const similarity = 1 - distance / maxDistance;
  return Math.round(similarity * 100) / 100; // Round to 2 decimals
};

/**
 * Compare multiple images with a query image
 * @param {string} queryImageHash - Hash of query image
 * @param {Array} documents - Array of documents with imageHash field
 * @param {number} threshold - Minimum similarity threshold (default 0.6)
 * @returns {Array} - Sorted results with image similarity scores
 */
const findImageMatches = (queryImageHash, documents, threshold = 0.6) => {
  const matches = documents
    .map(doc => ({
      ...doc,
      imageSimilarity: calculateImageSimilarity(queryImageHash, doc.imageHash),
    }))
    .filter(doc => doc.imageSimilarity >= threshold)
    .sort((a, b) => b.imageSimilarity - a.imageSimilarity);

  return matches;
};

module.exports = {
  generatePerceptualHash,
  hammingDistance,
  calculateImageSimilarity,
  findImageMatches,
};
