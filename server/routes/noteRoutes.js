import express from 'express';
import { body } from 'express-validator';
import {
  getNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote
} from '../controllers/noteController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireProjectRole } from '../middleware/roleMiddleware.js';
import { validate } from '../middleware/validationMiddleware.js';

const router = express.Router({ mergeParams: true });

router.route('/')
  .get(protect, requireProjectRole('VIEWER'), getNotes)
  .post(
    protect,
    requireProjectRole('MEMBER'),
    [
      body('title').trim().notEmpty().withMessage('Note title is required'),
      validate
    ],
    createNote
  );

router.route('/:noteId')
  .get(protect, requireProjectRole('VIEWER'), getNoteById)
  .put(
    protect,
    requireProjectRole('MEMBER'),
    [
      body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
      validate
    ],
    updateNote
  )
  .delete(protect, requireProjectRole('MEMBER'), deleteNote);

export default router;
