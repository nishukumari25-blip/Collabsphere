import express from 'express';
import {
  getProjectAnalytics,
  getProjectActivities,
  getUserDashboardStats
} from '../controllers/analyticsController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireProjectRole } from '../middleware/roleMiddleware.js';

// Project-specific router (merged params)
export const projectAnalyticsRouter = express.Router({ mergeParams: true });
projectAnalyticsRouter.get('/analytics', protect, requireProjectRole('VIEWER'), getProjectAnalytics);
projectAnalyticsRouter.get('/activities', protect, requireProjectRole('VIEWER'), getProjectActivities);

// Global user analytics router
const globalAnalyticsRouter = express.Router();
globalAnalyticsRouter.get('/dashboard', protect, getUserDashboardStats);

export default globalAnalyticsRouter;
