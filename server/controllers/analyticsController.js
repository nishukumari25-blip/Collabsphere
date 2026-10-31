import mongoose from 'mongoose';
import Activity from '../models/Activity.js';
import Note from '../models/Note.js';
import File from '../models/File.js';
import Project from '../models/Project.js';

// @desc    Get comprehensive analytics for a specific project
// @route   GET /api/projects/:projectId/analytics
// @access  Private (VIEWER+)
export const getProjectAnalytics = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const projectObjectId = new mongoose.Types.ObjectId(projectId);

    // 1. Total activities count
    const totalActivities = await Activity.countDocuments({ project: projectObjectId });

    // 2. Action breakdown
    const actionBreakdown = await Activity.aggregate([
      { $match: { project: projectObjectId } },
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // 3. Entity type breakdown
    const entityBreakdown = await Activity.aggregate([
      { $match: { project: projectObjectId } },
      { $group: { _id: '$entityType', count: { $sum: 1 } } }
    ]);

    // 4. Member contribution statistics
    const memberContributions = await Activity.aggregate([
      { $match: { project: projectObjectId } },
      {
        $group: {
          _id: '$user',
          totalActions: { $sum: 1 },
          noteActions: {
            $sum: { $cond: [{ $in: ['$action', ['created_note', 'updated_note', 'deleted_note']] }, 1, 0] }
          },
          fileActions: {
            $sum: { $cond: [{ $in: ['$action', ['uploaded_file', 'deleted_file']] }, 1, 0] }
          },
          aiActions: {
            $sum: { $cond: [{ $eq: ['$action', 'ai_request'] }, 1, 0] }
          },
          lastActive: { $max: '$createdAt' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      { $unwind: '$userDetails' },
      {
        $project: {
          _id: 1,
          name: '$userDetails.name',
          username: '$userDetails.username',
          avatar: '$userDetails.avatar',
          email: '$userDetails.email',
          totalActions: 1,
          noteActions: 1,
          fileActions: 1,
          aiActions: 1,
          lastActive: 1
        }
      },
      { $sort: { totalActions: -1 } }
    ]);

    // 5. Notes statistics by category
    const notesByCategory = await Note.aggregate([
      { $match: { project: projectObjectId } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    const totalNotes = await Note.countDocuments({ project: projectObjectId });

    // 6. Files statistics by category and total size
    const filesStats = await File.aggregate([
      { $match: { project: projectObjectId } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalBytes: { $sum: '$size' }
        }
      }
    ]);
    const totalFiles = await File.countDocuments({ project: projectObjectId });
    const totalStorageBytes = filesStats.reduce((acc, curr) => acc + (curr.totalBytes || 0), 0);

    // 7. Activity frequency by date (last 14 days)
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const dailyActivity = await Activity.aggregate([
      {
        $match: {
          project: projectObjectId,
          createdAt: { $gte: fourteenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      success: true,
      analytics: {
        totalActivities,
        totalNotes,
        totalFiles,
        totalStorageBytes,
        actionBreakdown,
        entityBreakdown,
        memberContributions,
        notesByCategory,
        filesStats,
        dailyActivity
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get activity timeline for a project
// @route   GET /api/projects/:projectId/activities
// @access  Private (VIEWER+)
export const getProjectActivities = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { limit = 50, page = 1, entityType } = req.query;

    const query = { project: projectId };
    if (entityType && entityType !== 'all') {
      query.entityType = entityType;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const activities = await Activity.find(query)
      .populate('user', 'name username avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Activity.countDocuments(query);

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      activities
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get global dashboard statistics for current user
// @route   GET /api/analytics/dashboard
// @access  Private
export const getUserDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Total projects user participates in
    const totalProjects = await Project.countDocuments({
      $or: [{ owner: userId }, { 'members.user': userId }]
    });

    const ownedProjects = await Project.countDocuments({ owner: userId });

    // Total activities performed by this user
    const totalContributions = await Activity.countDocuments({ user: userId });

    // Recent 10 activities across all user's projects
    const recentActivities = await Activity.find({ user: userId })
      .populate('project', 'name')
      .populate('user', 'name username avatar')
      .sort({ createdAt: -1 })
      .limit(10);

    // AI requests count by user
    const totalAiRequests = await Activity.countDocuments({
      user: userId,
      action: 'ai_request'
    });

    res.status(200).json({
      success: true,
      stats: {
        totalProjects,
        ownedProjects,
        totalContributions,
        totalAiRequests,
        recentActivities
      }
    });
  } catch (error) {
    next(error);
  }
};
