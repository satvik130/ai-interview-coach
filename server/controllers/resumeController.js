import pdfParse from 'pdf-parse';
import { cleanText, chunkText } from '../utils/textUtils.js';
import { generateEmbedding } from '../services/embeddingService.js';
import { upsertResumeChunks } from '../services/vectorService.js';


/**
 * @desc    Upload, parse, chunk, embed, and store resume vectors in Pinecone
 * @route   POST /api/resume/upload
 * @access  Private (Protected by authMiddleware)
 */
export const uploadResume = async (req, res) => {
  try {
    // 1. Validate file presence
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No resume file uploaded. Please select a PDF file.',
      });
    }

    console.log(`[ResumeController] Processing upload: ${req.file.originalname} (${(req.file.size / 1024).toFixed(1)} KB) for user ${req.user.id}`);

    // 2. Extract text using pdf-parse
    let parsedData;
    try {
      parsedData = await pdfParse(req.file.buffer);
    } catch (parseError) {
      console.error(`[ResumeController] PDF extraction failed: ${parseError.message}`);
      return res.status(400).json({
        success: false,
        message: 'Failed to read PDF. The file may be corrupt or encrypted.',
      });
    }

    const rawText = parsedData.text;

    // 3. Handle empty PDF
    if (!rawText || rawText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'The uploaded PDF contains no extractable text. Please ensure it is not an image-only scanned document.',
      });
    }

    // 4. Clean extracted text
    const cleanedText = cleanText(rawText);

    if (cleanedText.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'After cleaning, no usable text was found in the PDF.',
      });
    }

    // 5. Chunk text (~500-800 words per chunk with overlap)
    const chunks = chunkText(cleanedText, 600, 80);
    console.log('[DEBUG] Cleaned text length:', cleanedText.length);
console.log('[DEBUG] Number of chunks:', chunks.length);
console.log('[DEBUG] First chunk:', chunks[0]?.slice(0, 200));
    console.log(`[ResumeController] Generated ${chunks.length} chunk(s) from resume text`);

    // 6. Generate Hugging Face embeddings (384 dimensions) for each chunk
    const embeddings = [];
    for (let i = 0; i < chunks.length; i++) {
      console.log(`[ResumeController] Generating embedding for chunk ${i + 1}/${chunks.length}...`);
      const embedding = await generateEmbedding(chunks[i]);
      embeddings.push(embedding);
    }

    // 7. Upsert vectors into Pinecone under user's isolated namespace
    await upsertResumeChunks(req.user.id, chunks, embeddings);

    // 8. Return success response
    return res.status(200).json({
      success: true,
      message: 'Resume processed successfully',
      chunksCreated: chunks.length,
    });
  } catch (error) {
    console.error(`[ResumeController Error]: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: error.message || 'An error occurred while processing the resume',
    });
  }
};

export default {
  uploadResume,
};
