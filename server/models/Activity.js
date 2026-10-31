import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    action: {
      type: String,
      required: true,
      enum: [
        'created_project',
        'updated_project',
        'deleted_project',
        'added_member',
        'removed_member',
        'role_changed',
        'created_note',
        'updated_note',
        'deleted_note',
        'uploaded_file',
        'deleted_file',
        'ai_request',
        'public_share_toggled'
      ]
    },
    entityType: {
      type: String,
      required: true,
      enum: ['project', 'member', 'note', 'file', 'ai']
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

activitySchema.index({ project: 1, createdAt: -1 });
activitySchema.index({ user: 1, createdAt: -1 });

const Activity = mongoose.model('Activity', activitySchema);
export default Activity;
