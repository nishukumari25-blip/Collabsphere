import express from 'express';
import { body } from 'express-validator';
import {
  getProjects,
  createProject,
  getProjectById,
  updateProject,
  deleteProject,
  togglePublicShare
} from '../controllers/projectController.js';
import {
  getMembers,
  addMember,
  updateMemberRole,
  removeMember
} from '../controllers/memberController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireProjectRole } from '../middleware/roleMiddleware.js';
import { validate } from '../middleware/validationMiddleware.js';

const router = express.Router();

// Project routes
router.route('/')
  .get(protect, getProjects)
  .post(
    protect,
    [
      body('name').trim().notEmpty().withMessage('Project name is required'),
      validate
    ],
    createProject
  );

router.route('/:id')
  .get(protect, getProjectById)
  .put(protect, requireProjectRole('ADMIN'), updateProject)
  .delete(protect, requireProjectRole('OWNER'), deleteProject);

router.post(
  '/:id/share-token',
  protect,
  requireProjectRole('ADMIN'),
  togglePublicShare
);

// Member routes
router.route('/:id/members')
  .get(protect, requireProjectRole('VIEWER'), getMembers)
  .post(
    protect,
    requireProjectRole('ADMIN'),
    [
      body('identifier').trim().notEmpty().withMessage('Username or email is required to add a member'),
      validate
    ],
    addMember
  );

router.route('/:id/members/:userId')
  .put(
    protect,
    requireProjectRole('ADMIN'),
    [
      body('role').isIn(['ADMIN', 'MEMBER', 'VIEWER']).withMessage('Valid role is required'),
      validate
    ],
    updateMemberRole
  )
  .delete(protect, requireProjectRole('VIEWER'), removeMember);

export default router;
