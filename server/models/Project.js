import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'],
      default: 'MEMBER'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a project name'],
      trim: true,
      maxlength: [100, 'Project name cannot exceed 100 characters']
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    visibility: {
      type: String,
      enum: ['private', 'public'],
      default: 'private'
    },
    status: {
      type: String,
      enum: ['planning', 'active', 'completed', 'on_hold'],
      default: 'active'
    },
    goals: {
      type: String,
      trim: true,
      default: ''
    },
    technologies: {
      type: [String],
      default: []
    },
    deadline: {
      type: Date
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    members: [memberSchema],
    publicShare: {
      enabled: {
        type: Boolean,
        default: false
      },
      shareToken: {
        type: String,
        sparse: true,
        index: true
      }
    }
  },
  {
    timestamps: true
  }
);

projectSchema.index({ 'members.user': 1 });

const Project = mongoose.model('Project', projectSchema);
export default Project;
