import express from 'express';
import multer from 'multer';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';
import { uploadResume } from '../controllers/resumeController.js';
import { generateEmbedding } from '../services/embeddingService.js';
import { queryResumeChunks } from '../services/vectorService.js';
import { generateAnswer } from '../services/llmService.js';
import { generateInterviewQuestion } from '../services/llmService.js';
import { evaluateInterviewAnswer } from '../services/llmService.js';

const router = express.Router();

/**
 * Middleware wrapper to handle Multer upload errors gracefully
 */
const handleUpload = (req, res, next) => {
  const uploadSingle = upload.single('resume');

  uploadSingle(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File is too large. Maximum allowed size is 5MB.',
        });
      }
      return res.status(400).json({
        success: false,
        message: `Upload error: ${err.message}`,
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Invalid file uploaded. Only PDF files are allowed.',
      });
    }
    next();
  });
};

/**
 * @route   POST /api/resume/upload
 * @desc    Upload resume PDF and ingest vectors into Pinecone
 * @access  Private
 */
router.post('/upload', protect, handleUpload, uploadResume);
router.get('/search', protect, async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || !q.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Query is required',
      });
    }

    console.log(`[Resume Search] Query: ${q}`);

    // 1. Convert question into an embedding
    const queryEmbedding = await generateEmbedding(q);

    // 2. Retrieve relevant resume chunks from Pinecone
    const matches = await queryResumeChunks(
      req.user.id,
      queryEmbedding,
      3
    );

    // 3. Extract text from retrieved chunks
    const context = matches
      .map((match) => match.metadata?.text)
      .filter(Boolean)
      .join('\n\n');

    if (!context) {
      return res.status(404).json({
        success: false,
        message: 'No relevant resume information found',
      });
    }

    // 4. Send retrieved context to the LLM
    const answer = await generateAnswer(q, context);

    return res.status(200).json({
      success: true,
      query: q,
      answer,
      sources: matches.map((match) => ({
        score: match.score,
        chunkIndex: match.metadata?.chunkIndex,
      })),
    });
  } catch (error) {
    console.error('[Resume Search Error]:', error.message);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});
router.get('/interview-question', protect, async (req, res) => {
  try {
    // Create a generic query to retrieve relevant resume content
    const queryEmbedding = await generateEmbedding(
      'technical skills projects programming experience'
    );

    const matches = await queryResumeChunks(
      req.user.id,
      queryEmbedding,
      3
    );

    const context = matches
      .map((match) => match.metadata?.text)
      .filter(Boolean)
      .join('\n\n');

    if (!context) {
      return res.status(404).json({
        success: false,
        message: 'No resume information found',
      });
    }

    const question = await generateInterviewQuestion(context);

    return res.status(200).json({
      success: true,
      question,
    });
  } catch (error) {
    console.error('[Interview Question Error]:', error.message);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});
router.post('/evaluate-answer', protect, async (req, res) => {
  try {
    const { question, answer } = req.body;

    if (!question || !answer || !answer.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Question and answer are required',
      });
    }

    // Retrieve resume context
    const queryEmbedding = await generateEmbedding(
      `${question} technical skills projects experience`
    );

    const matches = await queryResumeChunks(
      req.user.id,
      queryEmbedding,
      3
    );

    const context = matches
      .map((match) => match.metadata?.text)
      .filter(Boolean)
      .join('\n\n');

    if (!context) {
      return res.status(404).json({
        success: false,
        message: 'No resume information found',
      });
    }

    // Evaluate the candidate's answer
    const feedback = await evaluateInterviewAnswer(
      question,
      answer,
      context
    );

    return res.status(200).json({
      success: true,
      feedback,
    });
  } catch (error) {
    console.error('[Answer Evaluation Error]:', error.message);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
