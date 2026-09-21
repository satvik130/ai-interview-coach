AI Interview Coach

An AI-powered interview preparation platform that uses RAG
(Retrieval-Augmented Generation) to generate personalized technical
interview questions and evaluate candidate answers based on their
resume.

🚀 Live Demo

Frontend: https://ai-interview-coach-frontend-3rq0.onrender.com

Backend API: https://ai-interview-coach-3zdm.onrender.com

✨ Features

🔐 JWT-based user authentication

📄 Resume upload and PDF text extraction

✂️ Resume text cleaning and chunking

🧠 Semantic embeddings using Hugging Face

🔎 Vector search using Pinecone

🤖 AI-generated technical interview questions

📝 AI-powered answer evaluation

📊 Feedback with score, strengths, areas for improvement, and a
better sample answer

⚡ React-based interactive dashboard

☁️ Fully deployed full-stack application

🧠 How It Works

                    Resume PDF
                        │
                        ▼
                PDF Text Extraction
                        │
                        ▼
              Clean + Chunk Resume
                        │
                        ▼
             Hugging Face Embeddings
                        │
                        ▼
                   Pinecone
                Vector Database
                        │
                        │
        ┌───────────────┴────────────────┐
        │                                │
        ▼                                ▼
 Generate Interview Question       Evaluate Answer
        │                                │
        └───────────────┬────────────────┘
                        ▼
                   Groq LLM
                        │
                        ▼
                  AI Response
                        │
                        ▼
                 React Dashboard

🛠️ Tech Stack

Frontend

React

Vite

Tailwind CSS

Axios

Backend

Node.js

Express.js

JWT Authentication

bcryptjs

Multer

pdf-parse

AI / RAG

Groq LLM

Hugging Face sentence-transformers/all-MiniLM-L6-v2

Pinecone Vector Database

Database & Deployment

MongoDB Atlas

Render

🔐 Authentication

The application uses JWT-based authentication.

User registration

User login

Protected API routes

JWT stored on the client and attached to API requests through an
Axios interceptor

📄 Resume RAG Pipeline

When a user uploads a resume:

The PDF is parsed into text.

The text is cleaned.

The resume is divided into chunks.

Each chunk is converted into a 384-dimensional embedding using
Hugging Face.

Embeddings and resume metadata are stored in a user-specific
Pinecone namespace.

When an interview question or evaluation is requested, relevant
resume chunks are retrieved through semantic similarity search.

The retrieved context is passed to the Groq LLM.

The LLM generates a response grounded in the retrieved resume
context.

🤖 AI Interview Coach

The coach can:

Generate Questions

Generate technical interview questions based on the candidate's resume,
projects, skills, and experience.

Evaluate Answers

The candidate submits an answer and receives:

Score out of 10

Strengths

Areas for improvement

A better sample answer

The evaluation prompt is designed to avoid inventing technologies or
implementation details that are not supported by the available resume
context or candidate answer.

📁 Project Structure

ai-interview-coach/
│
├── client/
│   ├── src/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── components/
│   │   └── ...
│   ├── vite.config.js
│   └── package.json
│
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── server.js
│   └── package.json
│
├── .gitignore
└── README.md

⚙️ Local Setup

1. Clone the repository

git clone https://github.com/satvik130/ai-interview-coach.git
cd ai-interview-coach

2. Install backend dependencies

cd server
npm install

3. Configure backend environment variables

Create server/.env:

PORT=5000
MONGO_URI=your_mongodb_atlas_uri
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=ai-interview-coach
HF_TOKEN=your_huggingface_token
GROQ_API_KEY=your_groq_api_key

4. Start the backend

npm start

The backend runs on:

http://localhost:5000

5. Install frontend dependencies

Open another terminal:

cd client
npm install

6. Start the frontend

npm run dev

The frontend runs on:

http://localhost:5173

🔑 Frontend Environment Variable

For production, the frontend uses:

VITE_API_URL=https://ai-interview-coach-3zdm.onrender.com/api

For local development, the Vite proxy routes /api requests to the
local Express server.

🌐 Deployment

The application is deployed using Render:

Frontend: Render Static Site

Backend: Render Web Service

Database: MongoDB Atlas

Vector Database: Pinecone

AI Services: Groq + Hugging Face

🔒 Security

Environment variables are not committed to GitHub.

API keys are stored as environment variables.

JWT protects authenticated routes.

Passwords are hashed using bcryptjs.

User resume vectors are stored in user-specific Pinecone namespaces.

Never commit real API keys, database passwords, or JWT secrets to the
repository.

🎯 Future Improvements

More detailed interview categories

Difficulty selection

Interview session history

Voice-based mock interviews

Coding interview mode

More advanced personalized learning recommendations

Interview performance analytics

👨‍💻 Author

Satvik Mishra

Computer Science & Engineering
Institute of Engineering and Technology, Lucknow

GitHub: https://github.com/satvik130
