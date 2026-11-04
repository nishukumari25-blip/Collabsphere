import test from 'node:test';
import assert from 'node:assert/strict';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const BASE_URL = 'http://localhost:5000/api';

// Unique run identifier to prevent any collision
const RUN_ID = Date.now().toString(36);

let ownerToken = '';
let ownerUser = null;
let memberToken = '';
let memberUser = null;
let outsiderToken = '';
let outsiderUser = null;

let testProjectId = '';
let testNoteId = '';
let publicShareToken = '';

test.describe('CollabSphere Complete API Verification', () => {

  test('1. Health Check & Platform Metadata', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, 'online');
    assert.equal(data.platform, 'CollabSphere Backend API');
  });

  test('2. CORS Policy Enforcement', async () => {
    // Allowed origin
    const resAllowed = await fetch(`${BASE_URL}/health`, {
      headers: { Origin: 'http://localhost:5173' }
    });
    assert.equal(resAllowed.status, 200);

    // Blocked malicious origin
    const resBlocked = await fetch(`${BASE_URL}/health`, {
      headers: { Origin: 'http://unauthorized-domain.com' }
    });
    assert.equal(resBlocked.status, 403);
    const blockedData = await resBlocked.json();
    assert.equal(blockedData.success, false);
    assert.match(blockedData.message, /CORS blocked/i);
  });

  test('3. Authentication: Registration & Validation', async () => {
    // Register Project Owner
    const ownerRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Owner Test ${RUN_ID}`,
        username: `owner_${RUN_ID}`,
        email: `owner_${RUN_ID}@example.com`,
        password: 'Password123!',
        confirmPassword: 'Password123!'
      })
    });
    assert.equal(ownerRes.status, 201);
    const ownerData = await ownerRes.json();
    assert.equal(ownerData.success, true);
    assert.ok(ownerData.token);
    ownerToken = ownerData.token;
    ownerUser = ownerData.user;

    // Register Team Member
    const memberRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Member Test ${RUN_ID}`,
        username: `member_${RUN_ID}`,
        email: `member_${RUN_ID}@example.com`,
        password: 'Password123!',
        confirmPassword: 'Password123!'
      })
    });
    assert.equal(memberRes.status, 201);
    const memberData = await memberRes.json();
    memberToken = memberData.token;
    memberUser = memberData.user;

    // Register Outsider
    const outsiderRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Outsider Test ${RUN_ID}`,
        username: `outsider_${RUN_ID}`,
        email: `outsider_${RUN_ID}@example.com`,
        password: 'Password123!',
        confirmPassword: 'Password123!'
      })
    });
    assert.equal(outsiderRes.status, 201);
    const outsiderData = await outsiderRes.json();
    outsiderToken = outsiderData.token;
    outsiderUser = outsiderData.user;

    // Duplicate email registration should fail
    const dupRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Duplicate',
        username: `diff_${RUN_ID}`,
        email: `owner_${RUN_ID}@example.com`,
        password: 'Password123!',
        confirmPassword: 'Password123!'
      })
    });
    assert.equal(dupRes.status, 400);

    // Invalid email regex validation
    const invalidEmailRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Invalid Email',
        username: `invemail_${RUN_ID}`,
        email: 'not-an-email',
        password: 'Password123!',
        confirmPassword: 'Password123!'
      })
    });
    assert.equal(invalidEmailRes.status, 400);
  });

  test('4. Authentication: Login & Profile & Password Reset', async () => {
    // Valid login
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        login: `owner_${RUN_ID}`,
        password: 'Password123!'
      })
    });
    assert.equal(loginRes.status, 200);
    const loginData = await loginRes.json();
    assert.equal(loginData.success, true);
    assert.ok(loginData.token);

    // Invalid login password
    const badLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        login: `owner_${RUN_ID}`,
        password: 'WrongPassword!'
      })
    });
    assert.equal(badLoginRes.status, 401);

    // Protected /me endpoint
    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });
    assert.equal(meRes.status, 200);
    const meData = await meRes.json();
    assert.equal(meData.user.username, `owner_${RUN_ID}`);

    // Forgot password does not expose tokens (returns 503 when email unconfigured)
    const forgotRes = await fetch(`${BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `owner_${RUN_ID}@example.com` })
    });
    assert.equal(forgotRes.status, 503);
    const forgotData = await forgotRes.json();
    assert.equal(forgotData.success, false);
    assert.equal(forgotData.resetToken, undefined);
  });

  test('5. Project Collaboration & Role Enforcement', async () => {
    // Create Project
    const createProjectRes = await fetch(`${BASE_URL}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`
      },
      body: JSON.stringify({
        name: `Automated Test Project ${RUN_ID}`,
        description: 'Testing end-to-end Phase 8 features',
        visibility: 'private',
        technologies: 'Node.js, Express, React, MongoDB',
        goals: 'Pass all tests'
      })
    });
    assert.equal(createProjectRes.status, 201);
    const createProjectData = await createProjectRes.json();
    assert.equal(createProjectData.success, true);
    testProjectId = createProjectData.project._id;

    // Outsider cannot access private project
    const outsiderAccessRes = await fetch(`${BASE_URL}/projects/${testProjectId}`, {
      headers: { Authorization: `Bearer ${outsiderToken}` }
    });
    assert.equal(outsiderAccessRes.status, 403);

    // Add Member as MEMBER
    const addMemberRes = await fetch(`${BASE_URL}/projects/${testProjectId}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`
      },
      body: JSON.stringify({
        identifier: memberUser.username,
        role: 'MEMBER'
      })
    });
    assert.equal(addMemberRes.status, 201);

    // Member can now access project
    const memberAccessRes = await fetch(`${BASE_URL}/projects/${testProjectId}`, {
      headers: { Authorization: `Bearer ${memberToken}` }
    });
    assert.equal(memberAccessRes.status, 200);

    // Update Member Role to ADMIN
    const updateRoleRes = await fetch(`${BASE_URL}/projects/${testProjectId}/members/${memberUser._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`
      },
      body: JSON.stringify({ role: 'ADMIN' })
    });
    assert.equal(updateRoleRes.status, 200);

    // Cannot remove project OWNER
    const removeOwnerRes = await fetch(`${BASE_URL}/projects/${testProjectId}/members/${ownerUser._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${memberToken}` }
    });
    assert.equal(removeOwnerRes.status, 400);

    // Non-member (outsider) cannot remove anyone
    const outsiderRemoveRes = await fetch(`${BASE_URL}/projects/${testProjectId}/members/${memberUser._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${outsiderToken}` }
    });
    assert.equal(outsiderRemoveRes.status, 403);
  });

  test('6. Markdown Notes CRUD & Safe Regex Filtering', async () => {
    // Create Note
    const createNoteRes = await fetch(`${BASE_URL}/projects/${testProjectId}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`
      },
      body: JSON.stringify({
        title: `Test Architecture Note ${RUN_ID}`,
        content: '# Architecture Spec\n\n- System: Distributed Mesh\n- State: Replicated',
        category: 'architecture',
        tags: 'test, spec, raft'
      })
    });
    assert.equal(createNoteRes.status, 201);
    const createNoteData = await createNoteRes.json();
    assert.equal(createNoteData.success, true);
    testNoteId = createNoteData.note._id;

    // Retrieve Note
    const getNoteRes = await fetch(`${BASE_URL}/projects/${testProjectId}/notes/${testNoteId}`, {
      headers: { Authorization: `Bearer ${memberToken}` }
    });
    assert.equal(getNoteRes.status, 200);
    const getNoteData = await getNoteRes.json();
    assert.equal(getNoteData.note.title, `Test Architecture Note ${RUN_ID}`);

    // Test Search with special regex characters (must not crash with RegExp syntax error)
    const regexSearchRes = await fetch(`${BASE_URL}/projects/${testProjectId}/notes?search=[test.*+?^$]`, {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });
    assert.equal(regexSearchRes.status, 200);
    const regexSearchData = await regexSearchRes.json();
    assert.equal(regexSearchData.success, true);

    // Update Note
    const updateNoteRes = await fetch(`${BASE_URL}/projects/${testProjectId}/notes/${testNoteId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${memberToken}`
      },
      body: JSON.stringify({
        title: `Updated Note ${RUN_ID}`,
        content: '# Updated Spec\n\nNew section added.'
      })
    });
    assert.equal(updateNoteRes.status, 200);
  });

  test('7. Gemini AI Integration: Explain Note & Validation', async () => {
    // Missing content validation
    const invalidAiRes = await fetch(`${BASE_URL}/gemini/explain-note`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`
      },
      body: JSON.stringify({ content: '   ' })
    });
    assert.equal(invalidAiRes.status, 400);

    // Real Gemini Explain Note
    const aiRes = await fetch(`${BASE_URL}/gemini/explain-note`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`
      },
      body: JSON.stringify({
        title: 'Distributed Log Consensus',
        content: 'Raft divides time into terms of arbitrary length, numbered with consecutive integers.',
        projectId: testProjectId
      })
    });
    assert.equal(aiRes.status, 200);
    const aiData = await aiRes.json();
    assert.equal(aiData.success, true);
    assert.ok(aiData.result && aiData.result.length > 50);
  });

  test('8. File Upload & Restrictions: Multer 400 Response', async () => {
    // Unsupported file type (.exe) must return 400
    const form = new FormData();
    form.append('file', new Blob(['binary payload'], { type: 'application/octet-stream' }), 'malicious.exe');

    const uploadBadRes = await fetch(`${BASE_URL}/projects/${testProjectId}/files`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: form
    });
    assert.equal(uploadBadRes.status, 400);
    const badUploadData = await uploadBadRes.json();
    assert.equal(badUploadData.success, false);
    assert.match(badUploadData.message, /Unsupported file type/i);
  });

  test('9. Public Shareable Project & Link Revocation', async () => {
    // Enable public share
    const enableShareRes = await fetch(`${BASE_URL}/projects/${testProjectId}/share-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`
      },
      body: JSON.stringify({ enabled: true })
    });
    assert.equal(enableShareRes.status, 200);
    const enableData = await enableShareRes.json();
    assert.ok(enableData.publicShare.shareToken);
    publicShareToken = enableData.publicShare.shareToken;

    // Anonymous public access (zero auth)
    const publicRes = await fetch(`${BASE_URL}/public/projects/${publicShareToken}`);
    assert.equal(publicRes.status, 200);
    const publicData = await publicRes.json();
    assert.equal(publicData.success, true);
    assert.equal(publicData.project.name, `Automated Test Project ${RUN_ID}`);
    // Verify NO emails or credentials exposed in public response
    assert.equal(publicData.project.owner.email, undefined);

    // Regenerate public link (revokes the previous token)
    const regenRes = await fetch(`${BASE_URL}/projects/${testProjectId}/share-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`
      },
      body: JSON.stringify({ enabled: true, regenerate: true })
    });
    assert.equal(regenRes.status, 200);
    const regenData = await regenRes.json();
    const newShareToken = regenData.publicShare.shareToken;
    assert.notEqual(newShareToken, publicShareToken);

    // Old revoked link must now return 404
    const oldLinkRes = await fetch(`${BASE_URL}/public/projects/${publicShareToken}`);
    assert.equal(oldLinkRes.status, 404);

    // New link works
    const newLinkRes = await fetch(`${BASE_URL}/public/projects/${newShareToken}`);
    assert.equal(newLinkRes.status, 200);

    // Disabling public share
    const disableRes = await fetch(`${BASE_URL}/projects/${testProjectId}/share-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`
      },
      body: JSON.stringify({ enabled: false })
    });
    assert.equal(disableRes.status, 200);

    // Link now returns 404
    const disabledLinkRes = await fetch(`${BASE_URL}/public/projects/${newShareToken}`);
    assert.equal(disabledLinkRes.status, 404);
  });

  test('10. Contribution Analytics & Dashboard Aggregations', async () => {
    // Project analytics
    const analyticsRes = await fetch(`${BASE_URL}/projects/${testProjectId}/analytics`, {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });
    assert.equal(analyticsRes.status, 200);
    const analyticsData = await analyticsRes.json();
    assert.equal(analyticsData.success, true);
    assert.ok(analyticsData.analytics.totalActivities >= 1);
    assert.ok(analyticsData.analytics.totalNotes >= 1);

    // User dashboard stats
    const dashboardRes = await fetch(`${BASE_URL}/analytics/dashboard`, {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });
    assert.equal(dashboardRes.status, 200);
    const dashboardData = await dashboardRes.json();
    assert.equal(dashboardData.success, true);
    assert.ok(dashboardData.stats.totalProjects >= 1);
  });

  test('11. Cleanup Test Artifacts', async () => {
    // Clean up test project and users
    if (testProjectId) {
      await fetch(`${BASE_URL}/projects/${testProjectId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${ownerToken}` }
      });
    }

    // Direct database cleanup of the 3 test users created during this run
    const mongoose = (await import('mongoose')).default;
    await mongoose.connect(process.env.MONGODB_URI);
    const User = (await import('../models/User.js')).default;
    await User.deleteMany({
      email: { $in: [
        `owner_${RUN_ID}@example.com`,
        `member_${RUN_ID}@example.com`,
        `outsider_${RUN_ID}@example.com`
      ]}
    });
    await mongoose.disconnect();
  });

});
