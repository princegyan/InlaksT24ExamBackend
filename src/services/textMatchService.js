/**
 * Text Matching Service
 * Provides multiple similarity matching algorithms
 */

/**
 * Calculate TF-IDF + Cosine Similarity
 * @param {string} text1 - First text
 * @param {string} text2 - Second text
 * @returns {number} - Similarity score (0-1)
 */
const cosineSimilarity = (text1, text2) => {
  const tokens1 = text1.split(/\s+/).filter(t => t.length > 0);
  const tokens2 = text2.split(/\s+/).filter(t => t.length > 0);

  if (tokens1.length === 0 || tokens2.length === 0) {
    return 0;
  }

  const allTokens = new Set([...tokens1, ...tokens2]);
  const vector1 = Array.from(allTokens).map(token =>
    tokens1.filter(t => t === token).length
  );
  const vector2 = Array.from(allTokens).map(token =>
    tokens2.filter(t => t === token).length
  );

  const dotProduct = vector1.reduce((sum, val, i) => sum + val * vector2[i], 0);
  const magnitude1 = Math.sqrt(vector1.reduce((sum, val) => sum + val * val, 0));
  const magnitude2 = Math.sqrt(vector2.reduce((sum, val) => sum + val * val, 0));

  if (magnitude1 === 0 || magnitude2 === 0) {
    return 0;
  }

  return dotProduct / (magnitude1 * magnitude2);
};

/**
 * Calculate Jaccard Similarity
 * @param {string} text1 - First text
 * @param {string} text2 - Second text
 * @returns {number} - Similarity score (0-1)
 */
const jaccardSimilarity = (text1, text2) => {
  const set1 = new Set(text1.split(/\s+/));
  const set2 = new Set(text2.split(/\s+/));

  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  if (union.size === 0) {
    return 0;
  }

  return intersection.size / union.size;
};

/**
 * Calculate Levenshtein Distance (normalized)
 * @param {string} text1 - First text
 * @param {string} text2 - Second text
 * @returns {number} - Similarity score (0-1)
 */
const levenshteinSimilarity = (text1, text2) => {
  const len1 = text1.length;
  const len2 = text2.length;
  const maxLen = Math.max(len1, len2);

  if (maxLen === 0) {
    return 1;
  }

  const matrix = Array(len1 + 1)
    .fill(null)
    .map(() => Array(len2 + 1).fill(0));

  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = text1[i - 1] === text2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const distance = matrix[len1][len2];
  return 1 - distance / maxLen;
};

/**
 * Fuzzy token matching - handles OCR variations
 * Matches tokens even if they have small differences
 * @param {Array} tokens1 - First set of tokens
 * @param {Array} tokens2 - Second set of tokens
 * @returns {number} - Match ratio (0-1)
 */
const fuzzyTokenMatch = (tokens1, tokens2) => {
  if (tokens1.length === 0 || tokens2.length === 0) {
    return 0;
  }

  let matches = 0;
  const maxTokens = Math.max(tokens1.length, tokens2.length);

  // For each token in first set, find best match in second
  for (const token1 of tokens1) {
    for (const token2 of tokens2) {
      // Exact match
      if (token1 === token2) {
        matches++;
        break;
      }
      // Fuzzy match (token similarity >= 0.85)
      const similarity = levenshteinSimilarity(token1, token2);
      if (similarity >= 0.85) {
        matches += similarity;
        break;
      }
    }
  }

  return matches / maxTokens;
};

/**
 * Combined Text Similarity Score (weighted average with fuzzy matching)
 * @param {string} text1 - First text
 * @param {string} text2 - Second text
 * @returns {number} - Combined similarity score (0-1)
 */
const calculateTextSimilarity = (text1, text2) => {
  if (!text1 || !text2) return 0;

  const cosine = cosineSimilarity(text1, text2);
  const jaccard = jaccardSimilarity(text1, text2);
  const levenshtein = levenshteinSimilarity(text1, text2);

  // Weighted average: cosine (40%), jaccard (30%), levenshtein (30%)
  // Increased levenshtein weight to handle OCR variations better
  const combined = cosine * 0.4 + jaccard * 0.3 + levenshtein * 0.3;

  return Math.round(combined * 100) / 100; // Round to 2 decimals
};

/**
 * Search for text matches in a list of documents
 * @param {string} queryText - Normalized query text
 * @param {Array} documents - Array of documents with normalizedText field
 * @param {number} threshold - Minimum similarity threshold (default 0.6)
 * @returns {Array} - Sorted results with similarity scores
 */
const findTextMatches = (queryText, documents, threshold = 0.6) => {
  const matches = documents
    .map(doc => ({
      ...doc,
      textSimilarity: calculateTextSimilarity(queryText, doc.normalizedText),
    }))
    .filter(doc => doc.textSimilarity >= threshold)
    .sort((a, b) => b.textSimilarity - a.textSimilarity);

  return matches;
};

module.exports = {
  cosineSimilarity,
  jaccardSimilarity,
  levenshteinSimilarity,
  fuzzyTokenMatch,
  calculateTextSimilarity,
  findTextMatches,
};
