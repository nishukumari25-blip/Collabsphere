import User from '../models/User.js';

// Helper to safely escape user-provided strings for RegExp
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// @desc    Search registered users for inviting to projects
// @route   GET /api/users/search
// @access  Private
export const searchUsers = async (req, res, next) => {
  try {
    const rawQuery = req.query.q?.trim();
    if (!rawQuery || rawQuery.length < 2) {
      return res.status(200).json({ success: true, users: [] });
    }

    const safeQuery = escapeRegex(rawQuery);

    const users = await User.find({
      _id: { $ne: req.user._id },
      $or: [
        { username: { $regex: safeQuery, $options: 'i' } },
        { email: { $regex: safeQuery, $options: 'i' } },
        { name: { $regex: safeQuery, $options: 'i' } }
      ]
    })
      .select('name username email avatar bio')
      .limit(10);

    res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    next(error);
  }
};
