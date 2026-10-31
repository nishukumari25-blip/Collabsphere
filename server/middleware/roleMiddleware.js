import Project from '../models/Project.js';

const ROLE_HIERARCHY = {
  OWNER: 4,
  ADMIN: 3,
  MEMBER: 2,
  VIEWER: 1
};

/**
 * Middleware to check project membership and require a minimum role
 * @param {'VIEWER' | 'MEMBER' | 'ADMIN' | 'OWNER'} requiredRole
 */
export const requireProjectRole = (requiredRole = 'VIEWER') => {
  return async (req, res, next) => {
    try {
      const projectId = req.params.projectId || req.params.id || req.body.projectId;

      if (!projectId) {
        return res.status(400).json({
          success: false,
          message: 'Project ID is required'
        });
      }

      const project = await Project.findById(projectId);

      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      const userId = req.user._id.toString();

      // Check if user is owner
      const isOwner = project.owner.toString() === userId;

      let userRole = null;
      if (isOwner) {
        userRole = 'OWNER';
      } else {
        const member = project.members.find(
          (m) => m.user.toString() === userId
        );
        if (member) {
          userRole = member.role;
        }
      }

      // If project is public, VIEWER level is allowed for read operations (GET)
      if (!userRole && project.visibility === 'public' && req.method === 'GET' && requiredRole === 'VIEWER') {
        req.project = project;
        req.projectRole = 'VIEWER';
        return next();
      }

      if (!userRole) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You are not a member of this project.'
        });
      }

      const userRoleLevel = ROLE_HIERARCHY[userRole] || 0;
      const requiredRoleLevel = ROLE_HIERARCHY[requiredRole] || 1;

      if (userRoleLevel < requiredRoleLevel) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Requires at least ${requiredRole} role in this project.`
        });
      }

      req.project = project;
      req.projectRole = userRole;
      next();
    } catch (error) {
      next(error);
    }
  };
};
