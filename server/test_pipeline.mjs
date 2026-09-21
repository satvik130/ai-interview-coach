/**
 * End-to-end test for Step 3: Resume Ingestion Pipeline
 * Run from: server/ directory
 * Tests: Auth → PDF upload → Pinecone vector verification
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { Pinecone } from '@pinecone-database/pinecone';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = 'http://127.0.0.1:5000';
const PDF_PATH = 'C:/Users/91930/.gemini/antigravity/brain/a0fddcce-d579-43e6-862b-a60e52f26caf/scratch/sample_resume.pdf';
const TEST_EMAIL = `pipeline_test_${Date.now()}@example.com`;
const TEST_PASSWORD = 'PipelineTest123!';
const TEST_NAME = 'Pipeline Tester';

let authToken = '';
let userId = '';

async function step1_register() {
  console.log('\n--- STEP 1: Register Test User ---');
  const res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: TEST_NAME, email: TEST_EMAIL, password: TEST_PASSWORD })
  });
  const data = await res.json();

  if (res.status === 201 && data.token) {
    authToken = data.token;
    userId = data.user._id;
    console.log(`✅ Registration PASSED | userId: ${userId}`);
    return true;
  } else {
    console.error('❌ Registration FAILED:', data);
    return false;
  }
}

async function step2_uploadResume() {
  console.log('\n--- STEP 2: Upload Resume PDF (PDF → chunks → embeddings → Pinecone) ---');

  const pdfBuffer = readFileSync(PDF_PATH);
  console.log(`   File: sample_resume.pdf (${(pdfBuffer.length / 1024).toFixed(1)} KB)`);
  console.log('   Sending to POST /api/resume/upload ...');
  console.log('   (This includes HF embedding generation and Pinecone upsert — may take 30-90s)');

  const boundary = '----FormBoundary' + Date.now();
  const CRLF = '\r\n';
  const header = `--${boundary}${CRLF}Content-Disposition: form-data; name="resume"; filename="sample_resume.pdf"${CRLF}Content-Type: application/pdf${CRLF}${CRLF}`;
  const footer = `${CRLF}--${boundary}--${CRLF}`;

  const body = Buffer.concat([
    Buffer.from(header, 'ascii'),
    pdfBuffer,
    Buffer.from(footer, 'ascii'),
  ]);

  const res = await fetch(`${BASE_URL}/api/resume/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    },
    body,
  });

  const data = await res.json();

  if (res.status === 200 && data.success) {
    console.log(`✅ Resume Upload PASSED | chunksCreated: ${data.chunksCreated}`);
    console.log(`   Message: ${data.message}`);
    return data.chunksCreated;
  } else {
    console.error('❌ Resume Upload FAILED:', data);
    return 0;
  }
}

async function step3_verifyPinecone(chunksCreated) {
  console.log('\n--- STEP 3: Verify Vectors in Pinecone ---');
  console.log(`   Index: ${process.env.PINECONE_INDEX_NAME}`);
  console.log(`   Namespace: ${userId}`);

  const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  const index = pc.index(process.env.PINECONE_INDEX_NAME);
  const ns = index.namespace(userId);

  // Query with a representative vector (small positive values to get nearest results)
  const queryVector = Array(384).fill(0.01);
  const queryResult = await ns.query({
    vector: queryVector,
    topK: 10,
    includeMetadata: true,
  });

  const matches = queryResult.matches || [];

  if (matches.length > 0) {
    console.log(`✅ Pinecone Verification PASSED | ${matches.length} vector(s) found in namespace`);
    console.log('\n   --- Sample Vector Records ---');
    matches.slice(0, 3).forEach((m, i) => {
      console.log(`\n   [Vector ${i + 1}]`);
      console.log(`     ID:          ${m.id}`);
      console.log(`     Score:       ${m.score?.toFixed(6)}`);
      console.log(`     userId:      ${m.metadata?.userId}`);
      console.log(`     source:      ${m.metadata?.source}`);
      console.log(`     chunkIndex:  ${m.metadata?.chunkIndex}`);
      console.log(`     text (80c):  ${String(m.metadata?.text || '').slice(0, 80)}...`);
    });
    return true;
  } else {
    console.error('❌ Pinecone Verification FAILED: No vectors found in namespace');
    return false;
  }
}

async function step4_errorHandlingTests() {
  console.log('\n--- STEP 4: Error Handling Validation ---');

  // 4a: No file
  const r1 = await fetch(`${BASE_URL}/api/resume/upload`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${authToken}` },
  });
  const d1 = await r1.json();
  console.log(`4a - Missing file:   ${r1.status === 400 ? '✅ PASSED' : '❌ FAILED'} | ${d1.message}`);

  // 4b: Non-PDF file (plain text)
  const b2 = '----B' + Date.now();
  const body2 = Buffer.from(
    `--${b2}\r\nContent-Disposition: form-data; name="resume"; filename="cv.txt"\r\nContent-Type: text/plain\r\n\r\nPlain text content.\r\n--${b2}--\r\n`
  );
  const r2 = await fetch(`${BASE_URL}/api/resume/upload`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': `multipart/form-data; boundary=${b2}` },
    body: body2,
  });
  const d2 = await r2.json();
  console.log(`4b - Non-PDF file:   ${r2.status === 400 ? '✅ PASSED' : '❌ FAILED'} | ${d2.message}`);

  // 4c: No JWT token
  const r3 = await fetch(`${BASE_URL}/api/resume/upload`, { method: 'POST' });
  const d3 = await r3.json();
  console.log(`4c - No auth token:  ${r3.status === 401 ? '✅ PASSED' : '❌ FAILED'} | ${d3.message}`);
}

async function runAll() {
  console.log('\n=====================================================');
  console.log('  AI Interview Coach — Step 3 E2E Pipeline Tests  ');
  console.log('=====================================================');

  try {
    const registered = await step1_register();
    if (!registered) { console.error('\nAborted: Registration failed.'); process.exit(1); }

    const chunksCreated = await step2_uploadResume();
    if (!chunksCreated) { console.error('\nAborted: Upload failed.'); process.exit(1); }

    await step3_verifyPinecone(chunksCreated);
    await step4_errorHandlingTests();

    console.log('\n=====================================================');
    console.log('  All pipeline tests complete!                      ');
    console.log('=====================================================\n');
  } catch (err) {
    console.error('\n❌ Unexpected error:', err.message);
    process.exit(1);
  }
}

runAll();
