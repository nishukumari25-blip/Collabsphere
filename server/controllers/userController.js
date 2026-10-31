import User from '../models/User.js';

// @desc    Search registered users for inviting to projects
// @route   GET /api/users/search
// @access  Private
export const searchUsers = async (req, res, next) => {
  try {
    const query = req.query.q?.trim();
    if (!query || query.length < 2) {
      return res.status(200).json({ success: true, users: [] });
    }

    const users = await User.find({
      _id: { $ne: req.user._id },
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { name: { $regex: query, $options: 'i' } }
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
