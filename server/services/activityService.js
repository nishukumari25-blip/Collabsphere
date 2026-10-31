import Activity from '../models/Activity.js';

export const logActivity = async ({
  projectId,
  userId,
  action,
  entityType,
  entityId = null,
  details = {}
}) => {
  try {
    const activity = await Activity.create({
      project: projectId,
      user: userId,
      action,
      entityType,
      entityId,
      details
    });
    return activity;
  } catch (error) {
    console.error('[ActivityService] Failed to log activity:', error.message);
    return null;
  }
};
