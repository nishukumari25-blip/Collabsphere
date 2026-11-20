
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import noteRoutes from './routes/noteRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import geminiRoutes from './routes/geminiRoutes.js';
import globalAnalyticsRouter, {
  projectAnalyticsRouter
} from './routes/analyticsRoutes.js';
import publicRoutes from './routes/publicRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import {
  notFound,
  errorHandler
} from './middleware/errorMiddleware.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Security HTTP headers
app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: 'cross-origin'
    }
  })
);

// ========================================
// CORS CONFIGURATION
// ========================================

const configuredClientUrl = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.replace(/\/+$/, '')
  : 'http://localhost:5173';

const allowedOrigins = new Set([
  configuredClientUrl,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'https://dev-v2.d1x9iq9nqly1of.amplifyapp.com',
  'https://collabspherenew.vercel.app',
  'https://collabspherenew1.vercel.app'
]);

// Add configured frontend URLs from environment variable
if (process.env.CLIENT_URL) {
  process.env.CLIENT_URL.split(',').forEach((url) => {
    const trimmed = url.trim().replace(/\/+$/, '');

    if (trimmed) {
      allowedOrigins.add(trimmed);
    }
  });
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an origin (Postman, mobile apps, etc.)
      if (!origin) {
        return callback(null, true);
      }

      const normalizedOrigin = origin.replace(/\/+$/, '');

      // Allow CollabSphere Vercel preview deployments
      const isVercelPreview =
  /^https:\/\/(?:collabsphere|collabspherenew|collabspherenew1)-[a-z0-9-]+-nishu9\.vercel\.app$/.test(
    normalizedOrigin
  );
      if (
        allowedOrigins.has(normalizedOrigin) ||
        isVercelPreview
      ) {
        return callback(null, true);
      }

      const error = new Error(
        `CORS blocked for origin: ${origin}`
      );

      error.status = 403;
      return callback(error);
    },

    credentials: true,
    methods: [
      'GET',
      'POST',
      'PUT',
      'DELETE',
      'PATCH',
      'OPTIONS'
    ],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With'
    ]
  })
);

// ========================================
// LOGGING
// ========================================

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Request parsers
app.use(express.json({ limit: '10mb' }));
app.use(
  express.urlencoded({
    extended: true,
    limit: '10mb'
  })
);
app.use(cookieParser());

// ========================================
// RATE LIMITERS
// ========================================

// General API rate limiter
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message:
      'Too many requests from this IP. Please try again after 15 minutes.'
  }
});

app.use('/api', generalLimiter);

// AI API rate limiter
const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message:
      'Too many AI requests. Please wait a minute before submitting another query.'
  }
});

app.use('/api/gemini', aiLimiter);

// ========================================
// HEALTH CHECK
// ========================================

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    platform: 'CollabSphere Backend API',
    timestamp: new Date().toISOString()
  });
});

// ========================================
// API ROUTES
// ========================================

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects/:projectId/notes', noteRoutes);
app.use('/api/projects/:projectId/files', fileRoutes);
app.use('/api/projects/:projectId', projectAnalyticsRouter);
app.use('/api/analytics', globalAnalyticsRouter);
app.use('/api/gemini', geminiRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/notifications', notificationRoutes);

// ========================================
// ERROR HANDLING
// ========================================

app.use(notFound);
app.use(errorHandler);

// ========================================
// SERVER
// ========================================

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(
    `[CollabSphere Server] Running on port ${PORT} in ${
      process.env.NODE_ENV || 'development'
    } mode`
  );
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(
    `[UnhandledRejection Error]: ${err.message}`
  );
});

export default app;
