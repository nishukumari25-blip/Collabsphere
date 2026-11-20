import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts & Route Guards
import { Layout } from './components/Layout';
import { PublicLayout } from './components/PublicLayout';
import { ProtectedRoute } from './components/ProtectedRoute';

// Public Pages
import { LandingPage } from './pages/public/LandingPage';
import { RegisterPage } from './pages/public/RegisterPage';
import { LoginPage } from './pages/public/LoginPage';
import { ForgotPasswordPage } from './pages/public/ForgotPasswordPage';
import { PublicSharePage } from './pages/public/PublicSharePage';

// Authenticated Pages
import { MainDashboard } from './pages/dashboard/MainDashboard';
import { MyProjectsPage } from './pages/dashboard/MyProjectsPage';
import { CreateProjectPage } from './pages/dashboard/CreateProjectPage';
import { ProjectOverviewPage } from './pages/dashboard/ProjectOverviewPage';
import { ProjectMembersPage } from './pages/dashboard/ProjectMembersPage';
import { ProjectSettingsPage } from './pages/dashboard/ProjectSettingsPage';

// Markdown Notes
import { MarkdownNotesPage } from './pages/notes/MarkdownNotesPage';
import { CreateNotePage } from './pages/notes/CreateNotePage';
import { EditNotePage } from './pages/notes/EditNotePage';
import { NotePreviewPage } from './pages/notes/NotePreviewPage';

// Files
import { ProjectFilesPage } from './pages/files/ProjectFilesPage';
import { FilePreviewPage } from './pages/files/FilePreviewPage';

// AI Studio
import { CodeSnippetEditorPage } from './pages/ai/CodeSnippetEditorPage';
import { AICodeExplainerPage } from './pages/ai/AICodeExplainerPage';
import { AIDocsGeneratorPage } from './pages/ai/AIDocsGeneratorPage';
import { AIReadmeGeneratorPage } from './pages/ai/AIReadmeGeneratorPage';
import { AICodeReviewPage } from './pages/ai/AICodeReviewPage';
import { ProjectAnalyzerPage } from './pages/ai/ProjectAnalyzerPage';

// Analytics & Activities
import { ContributionAnalyticsPage } from './pages/analytics/ContributionAnalyticsPage';
import { ActivityTimelinePage } from './pages/analytics/ActivityTimelinePage';

// User & Preferences
import { UserProfilePage } from './pages/user/UserProfilePage';
import { AccountSettingsPage } from './pages/user/AccountSettingsPage';
import { NotificationsPage } from './pages/user/NotificationsPage';

// 404
import { NotFoundPage } from './pages/NotFoundPage';

export function App() {
  return (
    <Routes>
      {/* Public Pages */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/share/:shareToken" element={<PublicSharePage />} />
        <Route path="/analyzer" element={<ProjectAnalyzerPage />} />
      </Route>

      {/* Authenticated Workspace Pages */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<MainDashboard />} />
        <Route path="/projects" element={<MyProjectsPage />} />
        <Route path="/projects/new" element={<CreateProjectPage />} />
        <Route path="/projects/:id" element={<ProjectOverviewPage />} />
        <Route path="/projects/:id/members" element={<ProjectMembersPage />} />
        <Route path="/projects/:id/settings" element={<ProjectSettingsPage />} />

        {/* Markdown Notes */}
        <Route path="/projects/:id/notes" element={<MarkdownNotesPage />} />
        <Route path="/projects/:id/notes/new" element={<CreateNotePage />} />
        <Route path="/projects/:id/notes/:noteId" element={<NotePreviewPage />} />
        <Route path="/projects/:id/notes/:noteId/edit" element={<EditNotePage />} />

        {/* Files */}
        <Route path="/projects/:id/files" element={<ProjectFilesPage />} />
        <Route path="/projects/:id/files/:fileId" element={<FilePreviewPage />} />

        {/* Analytics & Timeline */}
        <Route path="/projects/:id/analytics" element={<ContributionAnalyticsPage />} />
        <Route path="/projects/:id/timeline" element={<ActivityTimelinePage />} />

        {/* Gemini AI Suite */}
        <Route path="/ai/editor" element={<CodeSnippetEditorPage />} />
        <Route path="/ai/explain" element={<AICodeExplainerPage />} />
        <Route path="/ai/docs" element={<AIDocsGeneratorPage />} />
        <Route path="/ai/readme" element={<AIReadmeGeneratorPage />} />
        <Route path="/ai/review" element={<AICodeReviewPage />} />
        <Route path="/ai/analyzer" element={<ProjectAnalyzerPage />} />

        {/* User Account & Notifications */}
        <Route path="/profile" element={<UserProfilePage />} />
        <Route path="/settings" element={<AccountSettingsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />

        {/* 404 inside layout */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;
