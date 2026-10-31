import Notification from '../models/Notification.js';

export const createNotification = async ({
  recipient,
  sender = null,
  project = null,
  type = 'system',
  title,
  message,
  link = ''
}) => {
  try {
    const notification = await Notification.create({
      recipient,
      sender,
      project,
      type,
      title,
      message,
      link
    });
    return notification;
  } catch (error) {
    console.error('[NotificationService] Failed to create notification:', error.message);
    return null;
  }
};
