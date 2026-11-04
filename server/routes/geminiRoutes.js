import express from 'express';
import { body } from 'express-validator';
import {
  explainCode,
  generateDocs,
  generateReadme,
  improveNote,
  explainNote,
  reviewCode
} from '../controllers/geminiController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validationMiddleware.js';

const router = express.Router();

router.use(protect); // All Gemini routes require authentication

router.post(
  '/explain',
  [body('code').trim().notEmpty().withMessage('Code is required'), validate],
  explainCode
);

router.post(
  '/docs',
  [body('code').trim().notEmpty().withMessage('Code is required'), validate],
  generateDocs
);

router.post(
  '/readme',
  [
    body('projectName').trim().notEmpty().withMessage('Project name is required'),
    body('description').trim().notEmpty().withMessage('Project description is required'),
    validate
  ],
  generateReadme
);

router.post(
  '/improve-note',
  [body('content').trim().notEmpty().withMessage('Note content is required'), validate],
  improveNote
);

router.post(
  '/explain-note',
  [body('content').trim().notEmpty().withMessage('Note content is required'), validate],
  explainNote
);

router.post(
  '/review-code',
  [body('code').trim().notEmpty().withMessage('Code is required'), validate],
  reviewCode
);

export default router;
