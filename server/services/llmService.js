import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export const generateAnswer = async (question, context) => {
  const completion = await groq.chat.completions.create({
    model: 'openai/gpt-oss-20b',
    messages: [
      {
        role: 'system',
        content: `You are an AI Interview Coach.

Answer the user's question using the provided resume context.
Do not invent information that is not present in the context.
If the answer cannot be found in the context, clearly say so.

Resume Context:
${context}`,
      },
      {
        role: 'user',
        content: question,
      },
    ],
    temperature: 0.3,
    max_completion_tokens: 500,
  });

  return completion.choices[0]?.message?.content || '';
};
export const generateInterviewQuestion = async (context) => {
  const completion = await groq.chat.completions.create({
    model: 'openai/gpt-oss-20b',
    messages: [
      {
        role: 'system',
        content: `You are an AI Interview Coach.

Generate one technical interview question based strictly on the candidate's resume.
Focus on their projects, technologies, or technical skills.
Do not ask about information that is not present in the resume.

Resume Context:
${context}`,
      },
      {
        role: 'user',
        content: 'Generate one interview question for this candidate.',
      },
    ],
    temperature: 0.7,
    max_completion_tokens: 500,
  });

  console.log(
  '[Interview Question LLM Response]:',
  JSON.stringify(completion.choices[0]?.message, null, 2)
);

return completion.choices[0]?.message?.content || '';
};
export const evaluateInterviewAnswer = async (question, answer, context) => {
  const completion = await groq.chat.completions.create({
    model: 'openai/gpt-oss-20b',
    messages: [
      {
        role: 'system',
        content: `You are an AI Interview Coach.

Evaluate the candidate's interview answer using the question and resume context.

Return:
1. Score out of 10
2. Strengths
3. Areas for improvement
4. A better sample answer

Be concise and constructive. IMPORTANT: Never invent implementation details.
The sample answer must only use technologies, features, and implementation details explicitly present in the resume context or the candidate's answer.
If a detail is not known, do not include it.
Do not suggest made-up libraries, APIs, architecture, deployment methods, retries, streaming, monitoring, or other implementation details.

Resume Context:
${context}`,
      },
      {
        role: 'user',
        content: `Interview Question:
${question}

Candidate Answer:
${answer}`,
      },
    ],
    temperature: 0.2,
    max_completion_tokens: 1200,
  });

  return completion.choices[0]?.message?.content || '';
};

export default {
  generateAnswer,
  generateInterviewQuestion,
  evaluateInterviewAnswer,
};