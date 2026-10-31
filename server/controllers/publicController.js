import Project from '../models/Project.js';
import Note from '../models/Note.js';
import File from '../models/File.js';

// @desc    Get public project by share token (read-only, zero auth required)
// @route   GET /api/public/projects/:shareToken
// @access  Public
export const getPublicProject = async (req, res, next) => {
  try {
    const { shareToken } = req.params;

    if (!shareToken) {
      return res.status(400).json({
        success: false,
        message: 'Share token is required'
      });
    }

    const project = await Project.findOne({
      'publicShare.shareToken': shareToken,
      'publicShare.enabled': true
    })
      .populate('owner', 'name username avatar bio githubUrl')
      .populate('members.user', 'name username avatar bio githubUrl');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Public project not found or sharing has been disabled by the project owner'
      });
    }

    // Fetch notes for public reading (safely without internal author emails)
    const notes = await Note.find({ project: project._id })
      .select('title content category tags createdAt updatedAt author')
      .populate('author', 'name username avatar')
      .sort({ updatedAt: -1 });

    // Fetch file summaries (names, categories, sizes - no direct private download links or paths)
    const files = await File.find({ project: project._id })
      .select('originalName category size extension createdAt')
      .sort({ createdAt: -1 });

    // Sanitized response: strictly NO member emails or private system credentials
    const sanitizedProject = {
      _id: project._id,
      name: project.name,
      description: project.description,
      status: project.status,
      goals: project.goals,
      technologies: project.technologies,
      deadline: project.deadline,
      owner: {
        name: project.owner.name,
        username: project.owner.username,
        avatar: project.owner.avatar,
        bio: project.owner.bio,
        githubUrl: project.owner.githubUrl
      },
      members: project.members.map((m) => ({
        role: m.role,
        joinedAt: m.joinedAt,
        user: {
          name: m.user?.name,
          username: m.user?.username,
          avatar: m.user?.avatar,
          bio: m.user?.bio,
          githubUrl: m.user?.githubUrl
        }
      })),
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
    };

    res.status(200).json({
      success: true,
      project: sanitizedProject,
      notes,
      files,
      stats: {
        membersCount: project.members.length,
        notesCount: notes.length,
        filesCount: files.length
      }
    });
  } catch (error) {
    next(error);
  }
};
