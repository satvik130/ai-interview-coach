import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import resumeRoutes from './routes/resumeRoutes.js';

// Load environment variables from .env file


// Initialize MongoDB connection
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Standard Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Health Check Route
 * GET /api/health
 */
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'AI Interview Coach API is running'
  });
});

// Authentication Routes
app.use('/api/auth', authRoutes);

// Resume Ingestion Routes
app.use('/api/resume', resumeRoutes);

// Start Express server
app.listen(PORT, () => {
  console.log(`[Server] AI Interview Coach API running on port ${PORT}`);
  console.log(`[Server] Health check available at: http://localhost:${PORT}/api/health`);
});
