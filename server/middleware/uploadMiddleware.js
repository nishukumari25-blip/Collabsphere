import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Uploads stored securely outside public static directory
const uploadDir = path.resolve(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Allowed file extensions
const ALLOWED_EXTENSIONS = new Set([
  '.js', '.jsx', '.ts', '.tsx', '.html', '.css', '.json',
  '.py', '.md', '.txt', '.png', '.jpg', '.jpeg', '.webp', '.pdf',
  '.svg', '.sql', '.env.example', '.sh', '.yaml', '.yml'
]);

// Determine category based on extension
export const getFileCategory = (ext) => {
  const extension = ext.toLowerCase();
  if (['.png', '.jpg', '.jpeg', '.webp', '.svg'].includes(extension)) return 'image';
  if (['.js', '.jsx', '.ts', '.tsx', '.html', '.css', '.json', '.py', '.sql', '.sh', '.yaml', '.yml'].includes(extension)) return 'code';
  if (['.pdf', '.md', '.txt'].includes(extension)) return 'document';
  return 'other';
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate safe unique randomized filename
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
    const cleanExt = path.extname(file.originalname).toLowerCase();
    cb(null, `file-${uniqueSuffix}${cleanExt}`);
  }
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_EXTENSIONS.has(ext)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Unsupported file type "${ext}". Supported types: .js, .jsx, .ts, .tsx, .html, .css, .json, .py, .md, .txt, .png, .jpg, .jpeg, .webp, .pdf`
      ),
      false
    );
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024 // 15MB limit
  },
  fileFilter
});
