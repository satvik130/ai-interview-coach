/**
 * Utility functions for text cleaning and chunking in the RAG pipeline
 */

/**
 * Cleans extracted text by normalizing whitespace, stripping non-printable characters,
 * and standardizing line breaks.
 *
 * @param {string} rawText - The uncleaned text extracted from PDF
 * @returns {string} Cleaned, normalized text
 */
export const cleanText = (rawText) => {
  if (!rawText || typeof rawText !== 'string') return '';

  return (
    rawText
      // Remove null bytes and non-printable control characters
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ')
      // Replace carriage returns with standard newlines
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Replace multiple horizontal spaces/tabs with single space
      .replace(/[ \t]+/g, ' ')
      // Replace 3+ consecutive newlines with 2 newlines (preserve paragraphs)
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  );
};

/**
 * Splits cleaned text into semantic chunks of approximately 500-800 words with overlap.
 *
 * @param {string} text - The cleaned text to chunk
 * @param {number} targetWordCount - Target words per chunk (default: 600)
 * @param {number} overlapWordCount - Number of overlapping words between consecutive chunks (default: 80)
 * @returns {string[]} Array of chunked text strings
 */
export const chunkText = (text, targetWordCount = 600, overlapWordCount = 80) => {
  if (!text || typeof text !== 'string') return [];

  const words = text.split(/\s+/).filter(Boolean);

  // If text is within reasonable chunk bounds, return it as a single chunk
  if (words.length <= targetWordCount) {
    return [words.join(' ')];
  }

  const chunks = [];
  let startIndex = 0;
  const step = targetWordCount - overlapWordCount;

  while (startIndex < words.length) {
    const endIndex = Math.min(startIndex + targetWordCount, words.length);
    const chunkWords = words.slice(startIndex, endIndex);

    if (chunkWords.length > 0) {
      chunks.push(chunkWords.join(' '));
    }

    // Stop if we reached the end of the text
    if (endIndex >= words.length) {
      break;
    }

    startIndex += step;
  }

  return chunks;
};
