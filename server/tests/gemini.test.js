import test from 'node:test';
import assert from 'node:assert/strict';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const BASE_URL = 'http://localhost:5000/api';
let authToken = '';

test.describe('Gemini AI Suite Verification', () => {

  test('0. Setup: Generate Valid Auth Token', async () => {
    const jwt = (await import('jsonwebtoken')).default;
    const mongoose = (await import('mongoose')).default;
    await mongoose.connect(process.env.MONGODB_URI);
    const User = (await import('../models/User.js')).default;
    const user = await User.findOne({ email: 'demo_lead@collabsphere.dev' });
    assert.ok(user, 'Demo lead user must exist');
    authToken = jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '1h' });
    await mongoose.disconnect();
  });

  test('1. Explain Code Route (/api/gemini/explain)', async () => {
    // Missing code -> 400
    const badRes = await fetch(`${BASE_URL}/gemini/explain`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({ code: '' })
    });
    assert.equal(badRes.status, 400);

    // Valid code explanation
    const res = await fetch(`${BASE_URL}/gemini/explain`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({
        code: 'function binarySearch(arr, target) { let l = 0, r = arr.length - 1; while(l <= r) { const m = Math.floor((l+r)/2); if (arr[m] === target) return m; if (arr[m] < target) l = m + 1; else r = m - 1; } return -1; }',
        language: 'javascript'
      })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.result && data.result.length > 50);
  });

  test('2. Generate Documentation Route (/api/gemini/docs)', async () => {
    const res = await fetch(`${BASE_URL}/gemini/docs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({
        code: 'export const calculateThroughput = (requests, durationMs) => (requests / (durationMs / 1000));',
        language: 'javascript'
      })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.result && data.result.length > 50);
  });

  test('3. Generate README Route (/api/gemini/readme)', async () => {
    const res = await fetch(`${BASE_URL}/gemini/readme`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({
        projectName: 'CollabSphere Test Suite',
        description: 'Developer Collaboration Platform with Gemini AI',
        technologies: ['Node.js', 'React', 'MongoDB'],
        features: ['Notes', 'Files', 'Analytics', 'AI Assistance']
      })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.result && data.result.length > 50);
  });

  test('4. Improve Note Route (/api/gemini/improve-note)', async () => {
    const res = await fetch(`${BASE_URL}/gemini/improve-note`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({
        title: 'Draft Architecture',
        content: 'we need leader election. raft algorithm has terms. candidate asks for votes. if majority then becomes leader.'
      })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.result && data.result.length > 50);
  });

  test('5. Review Code Route (/api/gemini/review-code)', async () => {
    const res = await fetch(`${BASE_URL}/gemini/review-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({
        code: 'app.get("/user", (req, res) => { db.query("SELECT * FROM users WHERE id = " + req.query.id); });',
        language: 'javascript'
      })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.result && data.result.length > 50);
  });

});
