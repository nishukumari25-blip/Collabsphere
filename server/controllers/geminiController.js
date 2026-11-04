import {
  explainCodeService,
  generateDocsService,
  generateReadmeService,
  improveNoteService,
  explainNoteService,
  reviewCodeService
} from '../services/geminiService.js';
import { logActivity } from '../services/activityService.js';

// @desc    Explain code with Gemini
// @route   POST /api/gemini/explain
// @access  Private
export const explainCode = async (req, res, next) => {
  try {
    const { code, language = 'javascript', projectId } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide code to explain'
      });
    }

    const explanation = await explainCodeService({ code, language });

    if (projectId) {
      await logActivity({
        projectId,
        userId: req.user._id,
        action: 'ai_request',
        entityType: 'ai',
        details: { tool: 'explain_code', language }
      });
    }

    res.status(200).json({
      success: true,
      result: explanation
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to explain code with Gemini AI'
    });
  }
};

// @desc    Generate technical documentation with Gemini
// @route   POST /api/gemini/docs
// @access  Private
export const generateDocs = async (req, res, next) => {
  try {
    const { code, language = 'javascript', projectId } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide code to document'
      });
    }

    const documentation = await generateDocsService({ code, language });

    if (projectId) {
      await logActivity({
        projectId,
        userId: req.user._id,
        action: 'ai_request',
        entityType: 'ai',
        details: { tool: 'generate_docs', language }
      });
    }

    res.status(200).json({
      success: true,
      result: documentation
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to generate documentation with Gemini AI'
    });
  }
};

// @desc    Generate professional README.md with Gemini
// @route   POST /api/gemini/readme
// @access  Private
export const generateReadme = async (req, res, next) => {
  try {
    const {
      projectName,
      description,
      technologies,
      features,
      installation,
      usage,
      contributing,
      projectId
    } = req.body;

    if (!projectName || !description) {
      return res.status(400).json({
        success: false,
        message: 'Project name and description are required to generate README'
      });
    }

    const readme = await generateReadmeService({
      projectName,
      description,
      technologies,
      features,
      installation,
      usage,
      contributing
    });

    if (projectId) {
      await logActivity({
        projectId,
        userId: req.user._id,
        action: 'ai_request',
        entityType: 'ai',
        details: { tool: 'generate_readme', projectName }
      });
    }

    res.status(200).json({
      success: true,
      result: readme
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to generate README with Gemini AI'
    });
  }
};

// @desc    Improve Markdown note with Gemini
// @route   POST /api/gemini/improve-note
// @access  Private
export const improveNote = async (req, res, next) => {
  try {
    const { title, content, instructions, projectId } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Note content is required to improve'
      });
    }

    const improvedContent = await improveNoteService({
      title: title || 'Untitled Note',
      content,
      instructions
    });

    if (projectId) {
      await logActivity({
        projectId,
        userId: req.user._id,
        action: 'ai_request',
        entityType: 'ai',
        details: { tool: 'improve_note', title: title || 'Untitled Note' }
      });
    }

    res.status(200).json({
      success: true,
      result: improvedContent
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to improve note with Gemini AI'
    });
  }
};

// @desc    Explain Markdown note with Gemini
// @route   POST /api/gemini/explain-note
// @access  Private
export const explainNote = async (req, res, next) => {
  try {
    const { title, content, projectId } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Note content is required to explain'
      });
    }

    const explanation = await explainNoteService({
      title: title || 'Untitled Note',
      content
    });

    if (projectId) {
      await logActivity({
        projectId,
        userId: req.user._id,
        action: 'ai_request',
        entityType: 'ai',
        details: { tool: 'explain_note', title: title || 'Untitled Note' }
      });
    }

    res.status(200).json({
      success: true,
      result: explanation
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to explain note with Gemini AI'
    });
  }
};

// @desc    Perform code review with Gemini
// @route   POST /api/gemini/review-code
// @access  Private
export const reviewCode = async (req, res, next) => {
  try {
    const { code, language = 'javascript', projectId } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide code for review'
      });
    }

    const review = await reviewCodeService({ code, language });

    if (projectId) {
      await logActivity({
        projectId,
        userId: req.user._id,
        action: 'ai_request',
        entityType: 'ai',
        details: { tool: 'review_code', language }
      });
    }

    res.status(200).json({
      success: true,
      result: review
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to review code with Gemini AI'
    });
  }
};
