import { Pinecone } from '@pinecone-database/pinecone';

/**
 * Service to manage Pinecone vector storage and retrieval.
 */

let pineconeClient = null;

/**
 * Lazily initializes and returns the Pinecone client.
 */
const getPineconeClient = () => {
  if (!pineconeClient) {
    const apiKey = process.env.PINECONE_API_KEY;
    if (!apiKey) {
      throw new Error('PINECONE_API_KEY is missing in environment variables');
    }
    pineconeClient = new Pinecone({ apiKey });
  }
  return pineconeClient;
};

/**
 * Gets reference to the target Pinecone index.
 */
const getTargetIndex = () => {
  const indexName = process.env.PINECONE_INDEX_NAME;
  if (!indexName) {
    throw new Error('PINECONE_INDEX_NAME is missing in environment variables');
  }
  const pc = getPineconeClient();
  return pc.index(indexName);
};

/**
 * Upserts resume chunks and their embeddings into Pinecone under the user's namespace.
 *
 * @param {string} userId - Authenticated user's ID (used as Pinecone namespace)
 * @param {string[]} chunks - Array of text chunks
 * @param {number[][]} embeddings - Array of 384-dimensional embedding vectors
 * @returns {Promise<object>} Pinecone upsert response
 */
export const upsertResumeChunks = async (userId, chunks, embeddings) => {
  try {
    const index = getTargetIndex();
    const namespace = String(userId);

    // Format vectors conforming to Pinecone schema
    const vectors = chunks.map((chunkText, i) => ({
      id: `${namespace}_chunk_${i}_${Date.now()}`,
      values: embeddings[i],
      metadata: {
        userId: namespace,
        source: 'resume',
        chunkIndex: i,
        text: chunkText,
      },
    }));

    // Target the user's isolated namespace
    const nsIndex = index.namespace(namespace);
   const result = await nsIndex.upsert({ records: vectors });

    console.log(`[VectorService] Upserted ${vectors.length} vectors for user ${namespace} to Pinecone`);
    return result;
  } catch (error) {
    console.error(`[VectorService Upsert Error]: ${error.message}`);
    throw error;
  }
};

/**
 * Queries Pinecone for relevant resume chunks matching a query vector.
 * Prepares the foundation for upcoming RAG retrieval steps.
 *
 * @param {string} userId - Authenticated user's ID
 * @param {number[]} queryVector - 384-dimensional query embedding
 * @param {number} topK - Number of top relevant chunks to retrieve (default: 3)
 * @returns {Promise<object[]>} Array of matched records with scores and metadata
 */
export const queryResumeChunks = async (userId, queryVector, topK = 3) => {
  try {
    const index = getTargetIndex();
    const namespace = String(userId);

    const queryResponse = await index.namespace(namespace).query({
      vector: queryVector,
      topK,
      includeMetadata: true,
    });

    return queryResponse.matches || [];
  } catch (error) {
    console.error(`[VectorService Query Error]: ${error.message}`);
    throw error;
  }
};

export default {
  upsertResumeChunks,
  queryResumeChunks,
};
