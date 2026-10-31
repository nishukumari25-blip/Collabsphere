import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import File from '../models/File.js';
import { getFileCategory } from '../middleware/uploadMiddleware.js';
import { logActivity } from '../services/activityService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, '../uploads');

// @desc    Get all files for a project
// @route   GET /api/projects/:projectId/files
// @access  Private (VIEWER+)
export const getFiles = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { category, search } = req.query;

    const query = { project: projectId };

    if (category && category !== 'all') {
      query.category = category;
    }

    if (search) {
      query.originalName = { $regex: search, $options: 'i' };
    }

    const files = await File.find(query)
      .populate('uploader', 'name username avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: files.length,
      files
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload file to project
// @route   POST /api/projects/:projectId/files
// @access  Private (MEMBER+)
export const uploadFile = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided for upload'
      });
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    const category = getFileCategory(ext);

    const fileDoc = await File.create({
      project: projectId,
      uploader: req.user._id,
      originalName: req.file.originalname,
      storedName: req.file.filename,
      filePath: req.file.path,
      mimeType: req.file.mimetype,
      extension: ext,
      size: req.file.size,
      category
    });

    await logActivity({
      projectId,
      userId: req.user._id,
      action: 'uploaded_file',
      entityType: 'file',
      entityId: fileDoc._id,
      details: {
        fileName: fileDoc.originalName,
        size: fileDoc.size,
        category: fileDoc.category
      }
    });

    const populated = await File.findById(fileDoc._id).populate(
      'uploader',
      'name username avatar'
    );

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      file: populated
    });
  } catch (error) {
    // If database insertion failed, clean up the disk file
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkErr) {
        console.error('Failed to remove orphaned file:', unlinkErr);
      }
    }
    next(error);
  }
};

// @desc    Get single file metadata
// @route   GET /api/projects/:projectId/files/:fileId
// @access  Private (VIEWER+)
export const getFileMetadata = async (req, res, next) => {
  try {
    const { projectId, fileId } = req.params;

    const fileDoc = await File.findOne({ _id: fileId, project: projectId })
      .populate('uploader', 'name username avatar email');

    if (!fileDoc) {
      return res.status(404).json({
        success: false,
        message: 'File not found in this project'
      });
    }

    res.status(200).json({
      success: true,
      file: fileDoc
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Download file
// @route   GET /api/projects/:projectId/files/:fileId/download
// @access  Private (VIEWER+)
export const downloadFile = async (req, res, next) => {
  try {
    const { projectId, fileId } = req.params;

    const fileDoc = await File.findOne({ _id: fileId, project: projectId });

    if (!fileDoc) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    const safePath = path.resolve(uploadDir, path.basename(fileDoc.storedName));

    if (!fs.existsSync(safePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on storage disk'
      });
    }

    res.download(safePath, fileDoc.originalName);
  } catch (error) {
    next(error);
  }
};

// @desc    Preview file content (text, code, image, or PDF)
// @route   GET /api/projects/:projectId/files/:fileId/preview
// @access  Private (VIEWER+)
export const previewFile = async (req, res, next) => {
  try {
    const { projectId, fileId } = req.params;

    const fileDoc = await File.findOne({ _id: fileId, project: projectId });

    if (!fileDoc) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    const safePath = path.resolve(uploadDir, path.basename(fileDoc.storedName));

    if (!fs.existsSync(safePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on disk'
      });
    }

    // Check if query wants text content as JSON for code/markdown editor
    if (req.query.raw === 'true' || fileDoc.category === 'code' || ['.md', '.txt', '.json'].includes(fileDoc.extension)) {
      // If client requests raw text content
      if (req.query.format === 'json') {
        const content = fs.readFileSync(safePath, 'utf8');
        return res.status(200).json({
          success: true,
          content,
          file: fileDoc
        });
      }
    }

    // Otherwise stream with appropriate Content-Type for browser inline preview
    let contentType = fileDoc.mimeType || 'application/octet-stream';
    if (fileDoc.extension === '.js' || fileDoc.extension === '.jsx') contentType = 'text/javascript';
    if (fileDoc.extension === '.ts' || fileDoc.extension === '.tsx') contentType = 'text/plain';
    if (fileDoc.extension === '.py') contentType = 'text/x-python';
    if (fileDoc.extension === '.md') contentType = 'text/markdown';
    if (fileDoc.extension === '.css') contentType = 'text/css';
    if (fileDoc.extension === '.html') contentType = 'text/plain'; // prevent XSS execution!
    if (fileDoc.extension === '.pdf') contentType = 'application/pdf';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(fileDoc.originalName)}"`);

    const stream = fs.createReadStream(safePath);
    stream.pipe(res);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete file
// @route   DELETE /api/projects/:projectId/files/:fileId
// @access  Private (MEMBER+)
export const deleteFile = async (req, res, next) => {
  try {
    const { projectId, fileId } = req.params;

    const fileDoc = await File.findOne({ _id: fileId, project: projectId });

    if (!fileDoc) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Role check: Uploader can delete; ADMIN/OWNER can delete
    const isUploader = fileDoc.uploader.toString() === req.user._id.toString();
    const isAdminOrOwner = ['ADMIN', 'OWNER'].includes(req.projectRole);

    if (!isUploader && !isAdminOrOwner) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete files you uploaded, or request an admin to remove it'
      });
    }

    const safePath = path.resolve(uploadDir, path.basename(fileDoc.storedName));
    if (fs.existsSync(safePath)) {
      try {
        fs.unlinkSync(safePath);
      } catch (err) {
        console.error('Failed to delete file from disk:', err);
      }
    }

    const fileName = fileDoc.originalName;
    await File.findByIdAndDelete(fileId);

    await logActivity({
      projectId,
      userId: req.user._id,
      action: 'deleted_file',
      entityType: 'file',
      details: { fileName }
    });

    res.status(200).json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
