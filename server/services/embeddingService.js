/**
 * Embedding service using Hugging Face Inference API
 * Model: sentence-transformers/all-MiniLM-L6-v2 (384 dimensions)
 */

const HF_MODEL_URL =
  'https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2/pipeline/feature-extraction';

/**
 * Generates a 384-dimensional dense embedding vector for a given text snippet.
 *
 * @param {string} text - The input text string to embed
 * @returns {Promise<number[]>} 384-dimensional vector of floats
 */
export const generateEmbedding = async (text) => {
  const token = process.env.HF_TOKEN;

  if (!token) {
    throw new Error('HF_TOKEN is missing in environment variables');
  }

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    throw new Error('Text to embed must be a non-empty string');
  }

  try {
    const response = await fetch(HF_MODEL_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: text.trim(),
        options: {
          wait_for_model: true,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Hugging Face API returned status ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    // The feature-extraction pipeline returns an array of numbers (or 2D array if batched)
    if (Array.isArray(data)) {
      // If nested [[...]], flatten to single array
      const embedding = Array.isArray(data[0]) ? data[0] : data;

      if (embedding.length !== 384) {
        console.warn(
          `[EmbeddingService] Warning: Expected 384 dimensions, got ${embedding.length}`
        );
      }

      return embedding;
    }

    throw new Error(`Unexpected response format from Hugging Face: ${JSON.stringify(data)}`);
  } catch (error) {
    console.error(`[EmbeddingService Error]: ${error.message}`);
    throw error;
  }
};

export default {
  generateEmbedding,
};
