import React, { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import Layout from '../components/Layout';
import Card from '../components/Card';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [apiStatus, setApiStatus] = useState({
    loading: true,
    data: null,
    error: null,
  });

  // Resume Upload State
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(null);

  // AI Interview Coach State
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [aiError, setAiError] = useState('');

  // Backend Health Check
  useEffect(() => {
    api
      .get('/health')
      .then((res) => {
        setApiStatus({
          loading: false,
          data: res.data,
          error: null,
        });
      })
      .catch((err) => {
        setApiStatus({
          loading: false,
          data: null,
          error: err.message || 'Unable to connect to API',
        });
      });
  }, []);

  // Resume file selection
  const handleFileChange = (e) => {
    setUploadError('');
    setUploadSuccess(null);

    const file = e.target.files?.[0];

    if (!file) return;

    if (
      file.type !== 'application/pdf' &&
      !file.name.toLowerCase().endsWith('.pdf')
    ) {
      setUploadError('Please select a valid PDF file.');
      setSelectedFile(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError(
        'File size exceeds the 5MB limit. Please choose a smaller PDF.'
      );
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  // Resume upload
  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadError('Please select a resume PDF file first.');
      return;
    }

    setUploading(true);
    setUploadError('');
    setUploadSuccess(null);

    setUploadProgress(
      'Extracting text, generating 384-dim embeddings, and upserting vectors to Pinecone...'
    );

    try {
      const formData = new FormData();
      formData.append('resume', selectedFile);

      const response = await api.post('/resume/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUploadSuccess({
        message: response.data.message || 'Resume processed successfully',
        chunksCreated: response.data.chunksCreated,
      });

      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Resume upload error:', err);

      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to upload and process resume.';

      setUploadError(msg);
    } finally {
      setUploading(false);
      setUploadProgress('');
    }
  };

  // Generate AI interview question
  const handleGenerateQuestion = async () => {
    setLoadingQuestion(true);
    setAiError('');
    setQuestion('');
    setAnswer('');
    setFeedback('');

    try {
      const response = await api.get('/resume/interview-question');

      setQuestion(response.data.question);
    } catch (err) {
      console.error('Question generation error:', err);

      setAiError(
        err.response?.data?.message ||
          err.message ||
          'Failed to generate interview question.'
      );
    } finally {
      setLoadingQuestion(false);
    }
  };

  // Evaluate candidate answer
  const handleEvaluateAnswer = async () => {
    if (!question || !answer.trim()) {
      setAiError(
        'Please generate a question and enter your answer first.'
      );
      return;
    }

    setEvaluating(true);
    setAiError('');
    setFeedback('');

    try {
      const response = await api.post('/resume/evaluate-answer', {
        question,
        answer,
      });

      setFeedback(response.data.feedback);
    } catch (err) {
      console.error('Answer evaluation error:', err);

      setAiError(
        err.response?.data?.message ||
          err.message ||
          'Failed to evaluate answer.'
      );
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">

        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-600 rounded-2xl p-6 sm:p-8 text-white shadow-md">
          <div className="max-w-3xl">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-sm mb-3">
              AI Interview Coach • RAG Powered
            </span>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Welcome back, {user?.name || 'Candidate'}!
            </h1>

            <p className="mt-2 text-indigo-100 text-sm sm:text-base leading-relaxed">
              Practice personalized technical interviews using your resume,
              vector search, and AI-powered feedback.
            </p>
          </div>
        </div>

        {/* Resume Ingestion */}
        <Card
          title="Resume Ingestion (PDF → Embeddings → Pinecone)"
          subtitle="Upload your PDF resume to extract text, generate embeddings, and store them in Pinecone"
        >
          <div className="space-y-4">

            {/* Upload Area */}
            <div className="border-2 border-dashed border-slate-300 hover:border-indigo-400 transition rounded-xl p-6 text-center bg-slate-50/50">
              <input
                ref={fileInputRef}
                id="resume-input"
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                disabled={uploading}
                className="hidden"
              />

              <div className="flex flex-col items-center justify-center space-y-3">

                <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>

                <div>
                  <label
                    htmlFor="resume-input"
                    className="cursor-pointer text-sm font-semibold text-indigo-600 hover:text-indigo-500"
                  >
                    Click to select a PDF resume
                  </label>

                  <p className="text-xs text-slate-500 mt-1">
                    Standard text-based PDF up to 5MB
                  </p>
                </div>

                {selectedFile && (
                  <div className="mt-2 flex items-center space-x-2 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 text-xs text-indigo-800">
                    <span className="font-semibold truncate max-w-xs">
                      {selectedFile.name}
                    </span>

                    <span className="text-indigo-500">
                      ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Upload Error */}
            {uploadError && (
              <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
                {uploadError}
              </div>
            )}

            {/* Upload Success */}
            {uploadSuccess && (
              <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm space-y-1">
                <div className="flex items-center space-x-2 font-semibold">
                  <span>✓</span>
                  <span>{uploadSuccess.message}</span>
                </div>

                <p className="text-xs text-emerald-700 pl-5">
                  Successfully created and indexed{' '}
                  <strong>
                    {uploadSuccess.chunksCreated} chunk(s)
                  </strong>{' '}
                  into Pinecone.
                </p>
              </div>
            )}

            {/* Upload Button */}
            <div className="flex items-center justify-between pt-2">

              <div className="text-xs text-slate-500">
                {uploading && (
                  <span className="flex items-center space-x-2 text-indigo-600 font-medium">
                    <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping"></span>
                    <span>{uploadProgress}</span>
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg shadow-sm transition"
              >
                {uploading
                  ? 'Processing Ingestion...'
                  : 'Upload & Process Resume'}
              </button>
            </div>
          </div>
        </Card>

        {/* AI Interview Coach */}
        <Card
          title="AI Interview Coach"
          subtitle="Resume-based technical interview practice"
        >
          <div className="space-y-5">

            {/* Generate Question */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Personalized Interview
                </p>

                <p className="text-xs text-slate-500 mt-1">
                  Questions are generated using your resume context.
                </p>
              </div>

              <button
                type="button"
                onClick={handleGenerateQuestion}
                disabled={loadingQuestion}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-sm font-medium rounded-lg shadow-sm transition"
              >
                {loadingQuestion
                  ? 'Generating...'
                  : 'Generate Question'}
              </button>
            </div>

            {/* Question */}
            {question && (
              <div className="p-5 rounded-xl bg-indigo-50 border border-indigo-100">
                <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-2">
                  Interview Question
                </p>

                <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                  {question}
                </p>
              </div>
            )}

            {/* Answer */}
            {question && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Your Answer
                </label>

                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Type your interview answer here..."
                  rows={7}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />

                <div className="flex justify-end mt-3">
                  <button
                    type="button"
                    onClick={handleEvaluateAnswer}
                    disabled={evaluating || !answer.trim()}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg shadow-sm transition"
                  >
                    {evaluating
                      ? 'Evaluating Answer...'
                      : 'Evaluate My Answer'}
                  </button>
                </div>
              </div>
            )}

            {/* AI Error */}
            {aiError && (
              <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
                {aiError}
              </div>
            )}

            {/* AI Feedback */}
            {feedback && (
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">

                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    AI Interview Feedback
                  </p>

                  <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 font-medium">
                    AI Evaluation
                  </span>
                </div>

                <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {feedback}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* User Session & API Connectivity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Candidate Profile */}
          <Card
            title="Candidate Profile"
            subtitle="Authenticated session via JWT"
          >
            <div className="space-y-3">

              <div className="flex justify-between py-2 border-b border-slate-100 text-sm">
                <span className="text-slate-500 font-medium">
                  Candidate Name:
                </span>

                <span className="text-slate-900 font-semibold">
                  {user?.name}
                </span>
              </div>

              <div className="flex justify-between py-2 border-b border-slate-100 text-sm">
                <span className="text-slate-500 font-medium">
                  Email Address:
                </span>

                <span className="text-slate-900 font-semibold">
                  {user?.email}
                </span>
              </div>

              <div className="flex justify-between py-2 border-b border-slate-100 text-sm">
                <span className="text-slate-500 font-medium">
                  Pinecone Namespace:
                </span>

                <span className="text-slate-600 font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">
                  {user?._id}
                </span>
              </div>

              <div className="flex justify-between py-2 text-sm">
                <span className="text-slate-500 font-medium">
                  Member Since:
                </span>

                <span className="text-slate-600">
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString()
                    : 'Today'}
                </span>
              </div>
            </div>
          </Card>

          {/* API Status */}
          <Card
            title="Backend API Status"
            subtitle="Connectivity check to Express server"
          >
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">

              <div className="flex items-center justify-between">

                <div className="flex items-center space-x-3">

                  <span className="relative flex h-3.5 w-3.5">
                    {apiStatus.loading ? (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    ) : apiStatus.data ? (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    ) : (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    )}

                    <span
                      className={`relative inline-flex rounded-full h-3.5 w-3.5 ${
                        apiStatus.loading
                          ? 'bg-amber-500'
                          : apiStatus.data
                          ? 'bg-emerald-500'
                          : 'bg-rose-500'
                      }`}
                    ></span>
                  </span>

                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Express Server
                    </p>

                    <p className="text-xs text-slate-500">
                      {apiStatus.loading &&
                        'Checking connection...'}

                      {apiStatus.data &&
                        `${apiStatus.data.message} (${apiStatus.data.status})`}

                      {apiStatus.error &&
                        `API Offline: ${apiStatus.error}`}
                    </p>
                  </div>
                </div>

                <span
                  className={`px-3 py-1 text-xs font-medium rounded-full ${
                    apiStatus.loading
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : apiStatus.data
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {apiStatus.loading
                    ? 'Checking...'
                    : apiStatus.data
                    ? 'Operational'
                    : 'Disconnected'}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Feature Cards */}
        
      </div>
    </Layout>
  );
};

export default Dashboard;