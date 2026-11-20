import { GoogleGenAI } from '@google/genai';

const getGenAIClient = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here' || apiKey.trim() === '') {
    const error = new Error('GEMINI_API_KEY is not configured on the server. Please set your valid Google Gemini API key in server/.env.');
    error.status = 503;
    throw error;
  }
  return new GoogleGenAI({ apiKey: apiKey.trim() });
};

const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

/**
 * Universal Gemini generation runner with error handling
 */
const runGemini = async (systemInstruction, userPrompt) => {
  const ai = getGenAIClient();

  try {
    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            { text: `${systemInstruction}\n\n---\n\n${userPrompt}` }
          ]
        }
      ]
    });

    if (!response || !response.text) {
      throw new Error('Gemini API returned an empty response.');
    }

    return response.text;
  } catch (error) {
    console.error('[GeminiService Error]:', error.message);
    if (error.status === 503) {
      throw error;
    }
    // Rate limit or quota error
    if (error.message?.includes('429') || error.message?.toLowerCase().includes('quota')) {
      const rateLimitErr = new Error('Gemini API rate limit or quota exceeded. Please wait a moment or check your API quota.');
      rateLimitErr.status = 429;
      throw rateLimitErr;
    }
    // Invalid key error
    if (error.message?.toLowerCase().includes('api key') || error.message?.includes('403') || error.message?.includes('401')) {
      const keyErr = new Error('Invalid Google Gemini API key. Please verify your GEMINI_API_KEY in server/.env.');
      keyErr.status = 401;
      throw keyErr;
    }
    // General API error
    const genErr = new Error(`Gemini AI service error: ${error.message}`);
    genErr.status = 502;
    throw genErr;
  }
};

/**
 * 1. Explain Code
 */
export const explainCodeService = async ({ code, language = 'javascript' }) => {
  const systemInstruction = `You are an expert software engineer and technical educator.
Analyze the following ${language} code thoroughly.
Provide your response in structured, beautifully formatted Markdown with the following sections:
1. **Overview**: High-level summary of what the code accomplishes.
2. **Step-by-Step Logic**: Detailed breakdown of the execution flow.
3. **Key Functions & Components**: Purpose and mechanics of core components/functions.
4. **Complex Sections Explained**: In-depth clarification of non-trivial logic, edge cases, or algorithms.
5. **Potential Bugs & Edge Cases**: Identification of any vulnerabilities, unhandled errors, or edge cases.
6. **Suggested Improvements**: Concrete, actionable refactoring and modern best-practice recommendations.`;

  const userPrompt = `Here is the ${language} code to explain:\n\`\`\`${language}\n${code}\n\`\`\``;
  return await runGemini(systemInstruction, userPrompt);
};

/**
 * 2. Generate Technical Documentation
 */
export const generateDocsService = async ({ code, language = 'javascript' }) => {
  const systemInstruction = `You are a Principal Software Architect and Technical Writer.
Generate comprehensive, enterprise-grade technical documentation for the following ${language} code.
Format the output in clean, professional Markdown with:
1. **Module / Component Overview**
2. **Architecture & Design Patterns**
3. **API & Function Specifications** (including Parameters, Types, Return values, and Exceptions/Errors)
4. **Data Models / State Management** (if applicable)
5. **Usage Examples** (clear, runnable code samples demonstrating usage)
6. **Dependencies & Prerequisites**`;

  const userPrompt = `Here is the ${language} code to document:\n\`\`\`${language}\n${code}\n\`\`\``;
  return await runGemini(systemInstruction, userPrompt);
};

/**
 * 3. Generate README.md
 */
export const generateReadmeService = async ({
  projectName,
  description,
  technologies = [],
  features = [],
  installation = '',
  usage = '',
  contributing = ''
}) => {
  const systemInstruction = `You are an open-source maintainer and developer relations expert.
Generate a high-quality, professional, modern GitHub README.md for this software project.
Include:
- Project title and modern badge placeholders
- Engaging project description
- Key Features list
- Architecture / Tech Stack table or list
- Getting Started / Prerequisites
- Step-by-step Installation guide
- Usage details with code snippets or terminal commands
- Contributing guidelines
- License section`;

  const userPrompt = `Project Name: ${projectName}
Description: ${description}
Technologies: ${Array.isArray(technologies) ? technologies.join(', ') : technologies}
Features: ${Array.isArray(features) ? features.join('; ') : features}
Installation details: ${installation || 'Standard package installation (npm install / yarn)'}
Usage details: ${usage || 'Run dev server and test'}
Contributing details: ${contributing || 'Fork, create feature branch, submit pull request'}`;

  return await runGemini(systemInstruction, userPrompt);
};

/**
 * 4. Improve Markdown Notes
 */
export const improveNoteService = async ({ title, content, instructions = '' }) => {
  const systemInstruction = `You are a technical editor and knowledge management specialist.
Improve the provided technical Markdown note while strictly preserving its original technical meaning and intent.
Goals:
- Enhance readability, structure, and professional tone
- Correct grammatical or stylistic errors
- Improve formatting with clear headers, bullet points, callouts, and code blocks
- Identify and suggest missing sections or points of clarification
${instructions ? `User-specified guidance: ${instructions}` : ''}
Return the full improved note in clean Markdown.`;

  const userPrompt = `Note Title: ${title}\n\nNote Content:\n${content}`;
  return await runGemini(systemInstruction, userPrompt);
};

/**
 * 5. Explain Markdown Notes
 */
export const explainNoteService = async ({ title, content }) => {
  const systemInstruction = `You are an expert technical educator and documentation specialist.
Analyze and explain the provided Markdown note in clear, accessible terms for developers and engineering team members.
Structure your explanation in clean, professional Markdown with:
1. **Summary & Objective**: High-level synopsis of the note's topic and core purpose.
2. **Key Concepts & Breakdown**: Clarification of main concepts, architectures, or technical specifications described.
3. **Engineering Relevance & Context**: Why this note matters in the context of the software development lifecycle.
4. **Actionable Takeaways & Next Steps**: Practical points or decisions engineers should implement.`;

  const userPrompt = `Note Title: ${title || 'Untitled Note'}\n\nNote Content:\n${content}`;
  return await runGemini(systemInstruction, userPrompt);
};

/**
 * 5. Code Review
 */
export const reviewCodeService = async ({ code, language = 'javascript' }) => {
  const systemInstruction = `You are a Senior Staff Code Reviewer and Security Specialist.
Perform a rigorous, constructive code review on the provided ${language} snippet.
Structure your review in Markdown with:
1. **Executive Summary**: Score / verdict (e.g., Critical, Warning, Good) and brief overview.
2. **Potential Bugs & Logic Flaws**: Specific lines or patterns that could fail.
3. **Security & Vulnerability Analysis**: Injection, auth, sanitization, memory or resource leaks.
4. **Performance & Scalability**: Time/space complexity considerations, redundant operations.
5. **Code Style & Readability**: Clean code principles, naming conventions, separation of concerns.
6. **Refactored Version**: Improved code snippet with key fixes applied.`;

  const userPrompt = `Here is the ${language} code for review:\n\`\`\`${language}\n${code}\n\`\`\``;
  return await runGemini(systemInstruction, userPrompt);
};
