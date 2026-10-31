import mongoose from 'mongoose';

const invitationSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true
    },
    inviter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    inviteeEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    role: {
      type: String,
      enum: ['ADMIN', 'MEMBER', 'VIEWER'],
      default: 'MEMBER'
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'cancelled'],
      default: 'pending'
    },
    token: {
      type: String,
      required: true,
      unique: true
    },
    expiresAt: {
      type: Date,
      required: true
    }
  },
  {
    timestamps: true
  }
);

invitationSchema.index({ project: 1, inviteeEmail: 1 });
invitationSchema.index({ token: 1 });

const Invitation = mongoose.model('Invitation', invitationSchema);
export default Invitation;
