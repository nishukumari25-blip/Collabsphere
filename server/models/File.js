import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true
    },
    uploader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    originalName: {
      type: String,
      required: true,
      trim: true
    },
    storedName: {
      type: String,
      required: true
    },
    filePath: {
      type: String,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    extension: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    size: {
      type: Number,
      required: true
    },
    category: {
      type: String,
      enum: ['code', 'image', 'document', 'other'],
      default: 'other'
    }
  },
  {
    timestamps: true
  }
);

fileSchema.index({ project: 1, category: 1 });

const File = mongoose.model('File', fileSchema);
export default File;
