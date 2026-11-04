import crypto from 'crypto';
import Project from '../models/Project.js';
import Note from '../models/Note.js';
import File from '../models/File.js';
import Activity from '../models/Activity.js';
import { logActivity } from '../services/activityService.js';

// Helper to safely escape user-provided strings for RegExp
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// @desc    Get all projects for current user (as owner or member)
// @route   GET /api/projects
// @access  Private
export const getProjects = async (req, res, next) => {
  try {
    const { search, status, visibility } = req.query;

    const query = {
      $or: [
        { owner: req.user._id },
        { 'members.user': req.user._id }
      ]
    };

    if (status && status !== 'all') {
      query.status = status;
    }

    if (visibility && visibility !== 'all') {
      query.visibility = visibility;
    }

    if (search && search.trim()) {
      const safeSearch = escapeRegex(search.trim());
      query.$and = [
        {
          $or: [
            { name: { $regex: safeSearch, $options: 'i' } },
            { description: { $regex: safeSearch, $options: 'i' } },
            { technologies: { $in: [new RegExp(safeSearch, 'i')] } }
          ]
        }
      ];
    }

    const projects = await Project.find(query)
      .populate('owner', 'name username email avatar')
      .populate('members.user', 'name username email avatar')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: projects.length,
      projects
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private
export const createProject = async (req, res, next) => {
  try {
    const { name, description, visibility, status, goals, technologies, deadline } = req.body;

    const parsedTech = Array.isArray(technologies)
      ? technologies
      : typeof technologies === 'string' && technologies.trim()
      ? technologies.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    const project = await Project.create({
      name,
      description: description || '',
      visibility: visibility || 'private',
      status: status || 'active',
      goals: goals || '',
      technologies: parsedTech,
      deadline: deadline ? new Date(deadline) : null,
      owner: req.user._id,
      members: [
        {
          user: req.user._id,
          role: 'OWNER',
          joinedAt: new Date()
        }
      ]
    });

    await logActivity({
      projectId: project._id,
      userId: req.user._id,
      action: 'created_project',
      entityType: 'project',
      entityId: project._id,
      details: { name: project.name }
    });

    const populated = await Project.findById(project._id)
      .populate('owner', 'name username email avatar')
      .populate('members.user', 'name username email avatar');

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      project: populated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single project by ID
// @route   GET /api/projects/:id
// @access  Private (or Public if project visibility is public)
export const getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name username email avatar bio githubUrl')
      .populate('members.user', 'name username email avatar bio githubUrl');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Determine current user's role
    const userId = req.user._id.toString();
    const isOwner = project.owner._id.toString() === userId;
    const memberObj = project.members.find((m) => m.user._id.toString() === userId);
    const userRole = isOwner ? 'OWNER' : memberObj ? memberObj.role : null;

    if (!userRole && project.visibility !== 'public') {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this private project'
      });
    }

    // Attach counts
    const notesCount = await Note.countDocuments({ project: project._id });
    const filesCount = await File.countDocuments({ project: project._id });

    res.status(200).json({
      success: true,
      project,
      userRole: userRole || 'VIEWER',
      stats: {
        notesCount,
        filesCount,
        membersCount: project.members.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (ADMIN or OWNER)
export const updateProject = async (req, res, next) => {
  try {
    const { name, description, visibility, status, goals, technologies, deadline } = req.body;
    const project = req.project;

    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (visibility) project.visibility = visibility;
    if (status) project.status = status;
    if (goals !== undefined) project.goals = goals;
    if (deadline !== undefined) project.deadline = deadline ? new Date(deadline) : null;
    if (technologies !== undefined) {
      project.technologies = Array.isArray(technologies)
        ? technologies
        : technologies.split(',').map((t) => t.trim()).filter(Boolean);
    }

    await project.save();

    await logActivity({
      projectId: project._id,
      userId: req.user._id,
      action: 'updated_project',
      entityType: 'project',
      entityId: project._id,
      details: { name: project.name }
    });

    const populated = await Project.findById(project._id)
      .populate('owner', 'name username email avatar')
      .populate('members.user', 'name username email avatar');

    res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      project: populated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (OWNER only)
export const deleteProject = async (req, res, next) => {
  try {
    const project = req.project;

    // Delete associated notes, files, activities
    await Note.deleteMany({ project: project._id });
    await File.deleteMany({ project: project._id });
    await Activity.deleteMany({ project: project._id });
    await Project.findByIdAndDelete(project._id);

    res.status(200).json({
      success: true,
      message: 'Project and all associated resources deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle or regenerate public share link
// @route   POST /api/projects/:id/share-token
// @access  Private (ADMIN or OWNER)
export const togglePublicShare = async (req, res, next) => {
  try {
    const { enabled, regenerate } = req.body;
    const project = req.project;

    if (enabled) {
      if (!project.publicShare.shareToken || regenerate) {
        project.publicShare.shareToken = crypto.randomBytes(16).toString('hex');
      }
      project.publicShare.enabled = true;
    } else {
      project.publicShare.enabled = false;
    }

    await project.save();

    await logActivity({
      projectId: project._id,
      userId: req.user._id,
      action: 'public_share_toggled',
      entityType: 'project',
      entityId: project._id,
      details: { enabled: project.publicShare.enabled }
    });

    res.status(200).json({
      success: true,
      message: project.publicShare.enabled
        ? 'Public sharing enabled'
        : 'Public sharing disabled',
      publicShare: project.publicShare
    });
  } catch (error) {
    next(error);
  }
};
