import Project from '../models/Project.js';
import User from '../models/User.js';
import { logActivity } from '../services/activityService.js';
import { createNotification } from '../services/notificationService.js';

// @desc    Get all members of a project
// @route   GET /api/projects/:id/members
// @access  Private (VIEWER+)
export const getMembers = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name username email avatar bio githubUrl')
      .populate('members.user', 'name username email avatar bio githubUrl');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    res.status(200).json({
      success: true,
      owner: project.owner,
      members: project.members
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add member to project
// @route   POST /api/projects/:id/members
// @access  Private (ADMIN or OWNER)
export const addMember = async (req, res, next) => {
  try {
    const { identifier, role = 'MEMBER' } = req.body;
    const project = req.project;

    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: 'Please provide the user email or username'
      });
    }

    const targetUser = await User.findOne({
      $or: [
        { email: identifier.toLowerCase().trim() },
        { username: identifier.toLowerCase().trim() }
      ]
    });

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'No registered user found with that email or username'
      });
    }

    const targetIdStr = targetUser._id.toString();

    // Check if user is already owner
    if (project.owner.toString() === targetIdStr) {
      return res.status(400).json({
        success: false,
        message: 'This user is already the owner of this project'
      });
    }

    // Check if user is already a member
    const existing = project.members.find(
      (m) => m.user.toString() === targetIdStr
    );
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'This user is already a member of this project'
      });
    }

    // Non-owner cannot assign OWNER or ADMIN unless permitted
    const validatedRole = ['ADMIN', 'MEMBER', 'VIEWER'].includes(role) ? role : 'MEMBER';
    if (validatedRole === 'ADMIN' && req.projectRole !== 'OWNER') {
      return res.status(403).json({
        success: false,
        message: 'Only the project OWNER can add or assign ADMIN members'
      });
    }

    project.members.push({
      user: targetUser._id,
      role: validatedRole,
      joinedAt: new Date()
    });

    await project.save();

    await logActivity({
      projectId: project._id,
      userId: req.user._id,
      action: 'added_member',
      entityType: 'member',
      entityId: targetUser._id,
      details: {
        memberName: targetUser.name,
        username: targetUser.username,
        role: validatedRole
      }
    });

    await createNotification({
      recipient: targetUser._id,
      sender: req.user._id,
      project: project._id,
      type: 'member_added',
      title: `Added to project: ${project.name}`,
      message: `${req.user.name} added you to the project "${project.name}" as a ${validatedRole}.`,
      link: `/projects/${project._id}`
    });

    const updated = await Project.findById(project._id)
      .populate('members.user', 'name username email avatar bio');

    res.status(201).json({
      success: true,
      message: `User ${targetUser.name} added successfully as ${validatedRole}`,
      members: updated.members
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a member's role
// @route   PUT /api/projects/:id/members/:userId
// @access  Private (ADMIN or OWNER)
export const updateMemberRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const { userId } = req.params;
    const project = req.project;

    if (!['ADMIN', 'MEMBER', 'VIEWER'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be ADMIN, MEMBER, or VIEWER'
      });
    }

    // Only OWNER can promote someone to ADMIN or change an ADMIN
    if (req.projectRole !== 'OWNER' && role === 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Only the project OWNER can promote members to ADMIN'
      });
    }

    const member = project.members.find(
      (m) => m.user.toString() === userId
    );

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found in this project'
      });
    }

    if (member.user.toString() === project.owner.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change the role of the project owner'
      });
    }

    const oldRole = member.role;
    member.role = role;
    await project.save();

    await logActivity({
      projectId: project._id,
      userId: req.user._id,
      action: 'role_changed',
      entityType: 'member',
      entityId: member.user,
      details: { oldRole, newRole: role }
    });

    await createNotification({
      recipient: member.user,
      sender: req.user._id,
      project: project._id,
      type: 'role_changed',
      title: `Role updated in ${project.name}`,
      message: `Your role in project "${project.name}" has been changed to ${role}.`,
      link: `/projects/${project._id}`
    });

    const updated = await Project.findById(project._id)
      .populate('members.user', 'name username email avatar bio');

    res.status(200).json({
      success: true,
      message: 'Member role updated successfully',
      members: updated.members
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove member from project
// @route   DELETE /api/projects/:id/members/:userId
// @access  Private (ADMIN, OWNER, or Self-Leave)
export const removeMember = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const project = req.project;
    const isSelf = req.user._id.toString() === userId;

    if (userId === project.owner.toString()) {
      return res.status(400).json({
        success: false,
        message: 'The project owner cannot be removed. Transfer ownership or delete the project.'
      });
    }

    // If not self, must be ADMIN or OWNER
    if (!isSelf && !['ADMIN', 'OWNER'].includes(req.projectRole)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to remove members'
      });
    }

    const memberIndex = project.members.findIndex(
      (m) => m.user.toString() === userId
    );

    if (memberIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Member not found in this project'
      });
    }

    const targetMember = project.members[memberIndex];
    if (targetMember.role === 'ADMIN' && req.projectRole !== 'OWNER' && !isSelf) {
      return res.status(403).json({
        success: false,
        message: 'Only the project OWNER can remove ADMIN members'
      });
    }

    project.members.splice(memberIndex, 1);
    await project.save();

    await logActivity({
      projectId: project._id,
      userId: req.user._id,
      action: 'removed_member',
      entityType: 'member',
      details: {
        userId,
        reason: isSelf ? 'Member left voluntarily' : 'Removed by project admin'
      }
    });

    if (!isSelf) {
      await createNotification({
        recipient: userId,
        sender: req.user._id,
        project: project._id,
        type: 'member_removed',
        title: `Removed from ${project.name}`,
        message: `You were removed from the project "${project.name}".`,
        link: '/projects'
      });
    }

    res.status(200).json({
      success: true,
      message: isSelf ? 'You have left the project' : 'Member removed successfully'
    });
  } catch (error) {
    next(error);
  }
};
