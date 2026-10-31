import express from 'express';
import {
  getFiles,
  uploadFile,
  getFileMetadata,
  downloadFile,
  previewFile,
  deleteFile
} from '../controllers/fileController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireProjectRole } from '../middleware/roleMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router({ mergeParams: true });

router.route('/')
  .get(protect, requireProjectRole('VIEWER'), getFiles)
  .post(
    protect,
    requireProjectRole('MEMBER'),
    upload.single('file'),
    uploadFile
  );

router.route('/:fileId')
  .get(protect, requireProjectRole('VIEWER'), getFileMetadata)
  .delete(protect, requireProjectRole('MEMBER'), deleteFile);

router.get('/:fileId/download', protect, requireProjectRole('VIEWER'), downloadFile);
router.get('/:fileId/preview', protect, requireProjectRole('VIEWER'), previewFile);

export default router;
