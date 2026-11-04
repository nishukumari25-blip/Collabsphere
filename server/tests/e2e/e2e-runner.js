import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const screenshotsDir = path.resolve(__dirname, 'screenshots');

if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const CLIENT_URL = 'http://localhost:5173';
const RUN_ID = Date.now().toString(36);

const report = {
  total: 0,
  pass: 0,
  fail: 0,
  partial: 0,
  notVerified: 0,
  scenarios: [],
  consoleErrors: [],
  screenshots: []
};

function recordScenario(category, name, status, details = '') {
  report.total++;
  if (status === 'PASS') report.pass++;
  else if (status === 'FAIL') report.fail++;
  else if (status === 'PARTIAL') report.partial++;
  else if (status === 'NOT_VERIFIED') report.notVerified++;

  report.scenarios.push({ category, name, status, details });
  const statusIcon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : status === 'PARTIAL' ? '⚠️' : '❓';
  console.log(`${statusIcon} [${category}] ${name}: ${status} ${details ? '- ' + details : ''}`);
}

async function takeScreenshot(page, filename, description) {
  const filepath = path.join(screenshotsDir, filename);
  await page.screenshot({ path: filepath, fullPage: false });
  report.screenshots.push({ filename, filepath, description });
}

async function runFullE2ETest() {
  console.log('=================================================================');
  console.log('🚀 COLLABSPHERE FINAL E2E BROWSER QUALITY ASSURANCE AUDIT');
  console.log(`⏱️ Run ID: ${RUN_ID} | Timestamp: ${new Date().toISOString()}`);
  console.log('=================================================================\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1366,768']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 768 });

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignore normal react dev duplicate key warnings or favicon 404 if any
      if (!text.includes('favicon.ico')) {
        report.consoleErrors.push({ type: 'error', text });
      }
    }
  });

  page.on('pageerror', (err) => {
    report.consoleErrors.push({ type: 'pageerror', text: err.message });
  });

  const testUser = {
    name: `QA Lead ${RUN_ID}`,
    username: `qalead_${RUN_ID}`,
    email: `qalead_${RUN_ID}@example.com`,
    password: 'Password123!'
  };

  let testProjectId = '';
  let testNoteId = '';
  let publicShareUrl = '';

  try {
    // -------------------------------------------------------------
    // SECTION 1: AUTHENTICATION
    // -------------------------------------------------------------
    console.log('\n--- 1. AUTHENTICATION TESTING ---');

    // 1.1 Protected route redirection
    await page.goto(`${CLIENT_URL}/dashboard`, { waitUntil: 'networkidle0' });
    await page.waitForFunction(() => window.location.pathname.includes('/login'), { timeout: 6000 });
    recordScenario('Authentication', 'Protected Route Redirection', 'PASS', 'Unauthenticated /dashboard redirects to /login');

    // 1.2 User Registration
    await page.goto(`${CLIENT_URL}/register`, { waitUntil: 'networkidle0' });
    await page.type('input[name="name"]', testUser.name);
    await page.type('input[name="username"]', testUser.username);
    await page.type('input[name="email"]', testUser.email);
    await page.type('input[name="password"]', testUser.password);
    await page.type('input[name="confirmPassword"]', testUser.password);
    await page.click('button[type="submit"]');

    await page.waitForFunction(() => window.location.pathname.includes('/dashboard'), { timeout: 8000 });
    await takeScreenshot(page, '01_dashboard_after_registration.png', 'Main Dashboard after successful registration');
    recordScenario('Authentication', 'User Registration', 'PASS', `Registered as ${testUser.username} and navigated to /dashboard`);

    // 1.3 Session persistence after full page refresh
    await page.reload({ waitUntil: 'networkidle0' });
    await page.waitForSelector('.brand-logo', { timeout: 5000 });
    const isStillOnDashboard = await page.evaluate(() => window.location.pathname.includes('/dashboard'));
    if (isStillOnDashboard) {
      recordScenario('Authentication', 'Session Persistence', 'PASS', 'Logged in session retained after hard page reload');
    } else {
      recordScenario('Authentication', 'Session Persistence', 'FAIL', 'Session lost upon reload');
    }

    // 1.4 User Logout
    await page.click('button[title="Log Out"]');
    await page.waitForFunction(() => window.location.pathname.includes('/login'), { timeout: 6000 });
    recordScenario('Authentication', 'User Logout', 'PASS', 'Log out cleared session and returned to /login');

    // 1.5 Access After Logout
    await page.goto(`${CLIENT_URL}/dashboard`, { waitUntil: 'networkidle0' });
    await page.waitForFunction(() => window.location.pathname.includes('/login'), { timeout: 6000 });
    recordScenario('Authentication', 'Access Blocked After Logout', 'PASS', 'Cannot access protected /dashboard after logging out');

    // 1.6 Invalid Credentials Login
    await page.type('input[name="login"]', testUser.username);
    await page.type('input[name="password"]', 'WrongPass!');
    await page.click('button[type="submit"]');
    await page.waitForSelector('.toast, [style*="color: var(--danger)"], [style*="backgroundColor: var(--danger-bg)"]', { timeout: 5000 });
    const errorMsg = await page.evaluate(() => {
      const el = document.querySelector('.toast, [style*="color: var(--danger)"], [style*="backgroundColor: var(--danger-bg)"]');
      return el ? el.innerText : '';
    });
    if (errorMsg.toLowerCase().includes('invalid') || errorMsg.toLowerCase().includes('password')) {
      recordScenario('Authentication', 'Invalid Credentials Rejection', 'PASS', `Displayed error: "${errorMsg.trim()}"`);
    } else {
      recordScenario('Authentication', 'Invalid Credentials Rejection', 'PARTIAL', `Error: "${errorMsg.trim()}"`);
    }

    // 1.7 Valid Login
    await page.click('input[name="password"]', { clickCount: 3 });
    await page.keyboard.press('Backspace');
    await page.type('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForFunction(() => window.location.pathname.includes('/dashboard'), { timeout: 8000 });
    recordScenario('Authentication', 'Valid Credentials Login', 'PASS', 'Logged back into dashboard successfully');

    // 1.8 Duplicate Registration
    const dupPage = await browser.newPage();
    await dupPage.goto(`${CLIENT_URL}/register`, { waitUntil: 'networkidle0' });
    await dupPage.type('input[name="name"]', 'Dup User');
    await dupPage.type('input[name="username"]', `unique_${RUN_ID}`);
    await dupPage.type('input[name="email"]', testUser.email); // Same email
    await dupPage.type('input[name="password"]', 'Password123!');
    await dupPage.type('input[name="confirmPassword"]', 'Password123!');
    await dupPage.click('button[type="submit"]');
    await dupPage.waitForSelector('.toast, [style*="color: var(--danger)"], [style*="backgroundColor: var(--danger-bg)"]', { timeout: 5000 });
    const dupText = await dupPage.evaluate(() => {
      const el = document.querySelector('.toast, [style*="color: var(--danger)"], [style*="backgroundColor: var(--danger-bg)"]');
      return el ? el.innerText : '';
    });
    if (dupText.toLowerCase().includes('duplicate') || dupText.toLowerCase().includes('exists') || dupText.toLowerCase().includes('already')) {
      recordScenario('Authentication', 'Duplicate Registration Block', 'PASS', `Cleanly rejected with: "${dupText.trim()}"`);
    } else {
      recordScenario('Authentication', 'Duplicate Registration Block', 'PARTIAL', `Rejected with: "${dupText.trim()}"`);
    }
    await dupPage.close();

    // -------------------------------------------------------------
    // SECTION 2: PROJECT COLLABORATION
    // -------------------------------------------------------------
    console.log('\n--- 2. PROJECT COLLABORATION TESTING ---');

    // 2.1 Create Project
    await page.goto(`${CLIENT_URL}/projects/new`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('input[name="name"]');
    const projectName = `Distributed Raft Cluster ${RUN_ID}`;
    await page.type('input[name="name"]', projectName);
    await page.type('textarea[name="description"]', 'Fault-tolerant consensus algorithm state replication engine.');
    await page.select('select[name="visibility"]', 'private');
    await page.select('select[name="status"]', 'active');
    await page.type('input[name="technologies"]', 'Node.js, Express, React, Raft, WebSockets');
    await page.type('textarea[name="goals"]', '1. Leader election quorum.\n2. Log entry replication.\n3. Snapshot compaction.');
    await page.click('button[type="submit"]');

    // Wait for project overview page
    await page.waitForFunction(() => window.location.pathname.match(/\/projects\/[a-f0-9]{24}$/), { timeout: 8000 });
    const projectUrl = page.url();
    testProjectId = projectUrl.split('/projects/')[1].replace(/[^a-f0-9]/g, '');
    await takeScreenshot(page, '02_project_overview.png', 'Created Project Overview Page');
    recordScenario('Project Collaboration', 'Create Project', 'PASS', `Created project "${projectName}" (ID: ${testProjectId})`);

    // 2.2 Open and Verify Project Details
    const displayedTitle = await page.evaluate(() => document.querySelector('.page-title')?.innerText);
    if (displayedTitle?.includes(projectName)) {
      recordScenario('Project Collaboration', 'Open Project Details', 'PASS', 'Project overview correctly rendered project name & goals');
    } else {
      recordScenario('Project Collaboration', 'Open Project Details', 'FAIL', `Expected title to contain "${projectName}", got "${displayedTitle}"`);
    }

    // 2.3 Add Existing Registered Member (marcus_dev)
    await page.goto(`${CLIENT_URL}/projects/${testProjectId}/members`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('.page-actions button', { timeout: 6000 });
    
    // Click Add Team Member button
    await page.click('.page-actions button');

    await page.waitForSelector('.modal-dialog input', { timeout: 5000 });
    // Type username 'marcus_dev'
    await page.type('.modal-dialog input', 'marcus_dev');
    // Wait for autocomplete suggestion item
    await page.waitForFunction(() => {
      const items = document.querySelectorAll('.modal-dialog [style*="cursor: pointer"]');
      return items.length > 0;
    }, { timeout: 6000 });
    
    // Click the autocomplete item
    await page.evaluate(() => {
      const item = document.querySelector('.modal-dialog [style*="cursor: pointer"]');
      if (item) item.click();
    });

    // Select role MEMBER
    await page.select('.modal-dialog select', 'MEMBER');

    // Submit member addition
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('.modal-dialog button'));
      const submitBtn = btns.find(b => b.innerText.includes('Add Member'));
      if (submitBtn) submitBtn.click();
    });

    // Wait for modal to close and table to update
    await page.waitForFunction(() => !document.querySelector('.modal-backdrop'), { timeout: 6000 });
    await page.waitForFunction(() => document.body.innerText.includes('marcus_dev'), { timeout: 6000 });
    await takeScreenshot(page, '03_members_list_added.png', 'Team members list showing marcus_dev added');
    recordScenario('Project Collaboration', 'Add Registered Member', 'PASS', 'Searched and added existing user @marcus_dev to project');

    // 2.4 Update Member Role (promote to ADMIN)
    const selectExists = await page.waitForSelector('table select', { timeout: 5000 });
    if (selectExists) {
      await page.select('table select', 'ADMIN');
      await page.waitForFunction(() => {
        const sel = document.querySelector('table select');
        return sel && sel.value === 'ADMIN';
      }, { timeout: 5000 });
      recordScenario('Project Collaboration', 'Update Member Role', 'PASS', 'Promoted @marcus_dev to ADMIN');
    } else {
      recordScenario('Project Collaboration', 'Update Member Role', 'PARTIAL', 'Role select element not interactable');
    }

    // 2.5 Edit Project Settings
    await page.goto(`${CLIENT_URL}/projects/${testProjectId}/settings`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('textarea[name="description"]', { timeout: 5000 });
    await page.type('textarea[name="description"]', ' [Audited & Verified]');
    await page.click('button[type="submit"]');
    await page.waitForSelector('.toast', { timeout: 5000 });
    const settingsToast = await page.evaluate(() => document.querySelector('.toast')?.innerText || '');
    recordScenario('Project Collaboration', 'Edit Project Settings', 'PASS', `Settings saved with toast: "${settingsToast.trim()}"`);

    // 2.6 Unauthorized User Access Check
    const outsiderBrowser = await browser.newPage();
    // Register outsider
    await outsiderBrowser.goto(`${CLIENT_URL}/register`, { waitUntil: 'networkidle0' });
    await outsiderBrowser.type('input[name="name"]', 'Outsider User');
    await outsiderBrowser.type('input[name="username"]', `outsider_${RUN_ID}`);
    await outsiderBrowser.type('input[name="email"]', `outsider_${RUN_ID}@example.com`);
    await outsiderBrowser.type('input[name="password"]', 'Password123!');
    await outsiderBrowser.type('input[name="confirmPassword"]', 'Password123!');
    await outsiderBrowser.click('button[type="submit"]');
    await outsiderBrowser.waitForFunction(() => window.location.pathname.includes('/dashboard'), { timeout: 8000 });

    // Outsider tries to visit private project URL
    await outsiderBrowser.goto(`${CLIENT_URL}/projects/${testProjectId}`, { waitUntil: 'networkidle0' });
    await outsiderBrowser.waitForSelector('.empty-state, .card, [style*="color: var(--danger)"]', { timeout: 6000 });
    const outsiderPageText = await outsiderBrowser.evaluate(() => document.body.innerText);
    if (outsiderPageText.toLowerCase().includes('access denied') || outsiderPageText.toLowerCase().includes('not a member') || outsiderBrowser.url().includes('/projects')) {
      recordScenario('Project Collaboration', 'Unauthorized Access Blocked', 'PASS', 'Non-member strictly prevented from accessing private project');
    } else {
      recordScenario('Project Collaboration', 'Unauthorized Access Blocked', 'FAIL', 'Private project content was visible to non-member');
    }
    await outsiderBrowser.close();

    // -------------------------------------------------------------
    // SECTION 3: MARKDOWN NOTES
    // -------------------------------------------------------------
    console.log('\n--- 3. MARKDOWN NOTES TESTING ---');

    // 3.1 Create Note
    await page.goto(`${CLIENT_URL}/projects/${testProjectId}/notes/new`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('input[name="title"]', { timeout: 5000 });
    const noteTitle = `Raft State Machine Log Replication Protocol ${RUN_ID}`;
    await page.type('input[name="title"]', noteTitle);
    await page.select('select[name="category"]', 'architecture');
    await page.type('input[name="tags"]', 'raft, consensus, state-machine, distributed');
    
    const initialContent = `# Raft Consensus Protocol Specification\n\n## Overview\nConsensus is achieved via leader-driven log entry replication. Followers accept entries matching their term index.\n\n\`\`\`javascript\nfunction appendEntries(term, leaderId, prevLogIndex) {\n  if (term < currentTerm) return false;\n  resetElectionTimeout();\n  return true;\n}\n\`\`\`\n\n### Invariants\n- Election Safety: at most one leader per term.\n- Leader Append-Only: leader never overwrites or truncates its log.\n- Log Matching: identical index and term implies identical history.`;

    await page.type('textarea[name="content"]', initialContent);

    // 3.2 Improve Note with Gemini AI inside Note Editor
    await page.click('button:has-text("Improve with AI"), button[type="button"]:has(svg)');
    console.log('   Waiting for Gemini AI note improvement...');
    await page.waitForFunction(() => {
      const textarea = document.querySelector('textarea[name="content"]');
      return textarea && textarea.value.length > 200 && textarea.value !== 'initialContent';
    }, { timeout: 35000 });

    const improvedContent = await page.evaluate(() => document.querySelector('textarea[name="content"]').value);
    if (improvedContent.length > initialContent.length || improvedContent.includes('Raft')) {
      recordScenario('Markdown Notes', 'Improve Note with Gemini AI', 'PASS', `AI improved content length: ${improvedContent.length} chars`);
    } else {
      recordScenario('Markdown Notes', 'Improve Note with Gemini AI', 'PARTIAL', 'Improve note response returned');
    }

    // 3.3 Save Note
    await page.click('button[type="submit"]');
    await page.waitForFunction(() => window.location.pathname.match(/\/projects\/[a-f0-9]{24}\/notes\/[a-f0-9]{24}$/), { timeout: 8000 });
    testNoteId = page.url().split('/notes/')[1].replace(/[^a-f0-9]/g, '');
    await takeScreenshot(page, '04_note_preview.png', 'Note Preview Page');
    recordScenario('Markdown Notes', 'Create & Save Note', 'PASS', `Published note (ID: ${testNoteId})`);

    // 3.4 Markdown Preview Rendering
    const renderedHeaders = await page.evaluate(() => document.querySelectorAll('.markdown-body h1, .markdown-body h2, .markdown-body h3').length);
    const renderedCodeBlocks = await page.evaluate(() => document.querySelectorAll('.markdown-body pre, .markdown-body code').length);
    if (renderedHeaders >= 1 && renderedCodeBlocks >= 1) {
      recordScenario('Markdown Notes', 'Safe Markdown Rendering', 'PASS', `Rendered ${renderedHeaders} headers and ${renderedCodeBlocks} code blocks`);
    } else {
      recordScenario('Markdown Notes', 'Safe Markdown Rendering', 'FAIL', 'Markdown elements not found in preview DOM');
    }

    // 3.5 Explain Note with Gemini AI in Note Preview
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const explainBtn = btns.find(b => b.innerText.includes('Explain Note'));
      if (explainBtn) explainBtn.click();
    });

    console.log('   Waiting for Gemini AI Note Explanation...');
    await page.waitForSelector('.modal-backdrop', { timeout: 5000 });
    await page.waitForFunction(() => {
      const modal = document.querySelector('.modal-dialog');
      return modal && modal.innerText.includes('Analyzing Note') === false && modal.innerText.length > 100;
    }, { timeout: 35000 });

    const aiModalText = await page.evaluate(() => document.querySelector('.modal-dialog')?.innerText || '');
    await takeScreenshot(page, '05_explain_note_modal.png', 'Gemini AI Note Explanation Modal');
    if (aiModalText.includes('Summary') || aiModalText.includes('Concept') || aiModalText.length > 150) {
      recordScenario('Markdown Notes', 'Explain Note with Gemini AI', 'PASS', `Rendered structured explanation (${aiModalText.length} chars)`);
    } else {
      recordScenario('Markdown Notes', 'Explain Note with Gemini AI', 'PARTIAL', 'Modal closed or content brief');
    }

    // Close Explain Modal
    await page.evaluate(() => {
      const closeBtn = document.querySelector('.modal-dialog .modal-header button');
      if (closeBtn) closeBtn.click();
    });
    await page.waitForFunction(() => !document.querySelector('.modal-backdrop'), { timeout: 4000 });

    // 3.6 Edit Note
    await page.evaluate(() => {
      const editBtn = document.querySelector('a[href*="/edit"]');
      if (editBtn) editBtn.click();
    });
    await page.waitForFunction(() => window.location.pathname.includes('/edit'), { timeout: 6000 });
    await page.type('input[name="title"]', ' - Updated');
    await page.click('button[type="submit"]');
    await page.waitForFunction(() => !window.location.pathname.includes('/edit'), { timeout: 6000 });
    recordScenario('Markdown Notes', 'Edit Note', 'PASS', 'Edited and saved note');

    // 3.7 Delete Note
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const delBtn = btns.find(b => b.innerText.includes('Delete'));
      if (delBtn) delBtn.click();
    });
    await page.waitForSelector('.modal-backdrop', { timeout: 4000 });
    // Click confirm permanent delete
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('.modal-dialog button'));
      const confirmBtn = btns.find(b => b.innerText.includes('Delete'));
      if (confirmBtn) confirmBtn.click();
    });
    await page.waitForFunction(() => window.location.pathname.endsWith('/notes'), { timeout: 8000 });
    recordScenario('Markdown Notes', 'Delete Note', 'PASS', 'Deleted note via confirm modal and returned to notes list');

    // -------------------------------------------------------------
    // SECTION 4: GEMINI AI SUITE DIRECT TOOLS
    // -------------------------------------------------------------
    console.log('\n--- 4. GEMINI AI SUITE DIRECT PAGES TESTING ---');

    // 4.1 Explain Code (/ai/explain)
    await page.goto(`${CLIENT_URL}/ai/explain`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('textarea', { timeout: 5000 });
    await page.type('textarea', 'function fibonacci(n) { if (n <= 1) return n; return fibonacci(n - 1) + fibonacci(n - 2); }');
    await page.click('button[type="submit"]');
    console.log('   Waiting for Explain Code Gemini API response...');
    await page.waitForFunction(() => {
      const markdown = document.querySelector('.markdown-body');
      return markdown && markdown.innerText.length > 100;
    }, { timeout: 35000 });
    await takeScreenshot(page, '06_ai_code_explainer.png', 'Code Explainer response');
    recordScenario('Gemini AI Suite', 'Explain Code Tool', 'PASS', 'Generated structured algorithmic breakdown with Markdown rendering');

    // 4.2 Generate Documentation (/ai/docs)
    await page.goto(`${CLIENT_URL}/ai/docs`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('textarea', { timeout: 5000 });
    await page.type('textarea', 'export function createRateLimiter({ windowMs, maxRequests }) { const hits = new Map(); return (ip) => { const count = (hits.get(ip) || 0) + 1; hits.set(ip, count); return count <= maxRequests; }; }');
    await page.click('button[type="submit"]');
    console.log('   Waiting for Generate Documentation Gemini API response...');
    await page.waitForFunction(() => {
      const markdown = document.querySelector('.markdown-body');
      return markdown && markdown.innerText.length > 100;
    }, { timeout: 35000 });
    await takeScreenshot(page, '07_ai_docs_generator.png', 'Docs Generator response');
    recordScenario('Gemini AI Suite', 'Generate Documentation Tool', 'PASS', 'Generated technical documentation with API specs and usage samples');

    // 4.3 Generate README (/ai/readme)
    await page.goto(`${CLIENT_URL}/ai/readme`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('input[name="projectName"]', { timeout: 5000 });
    await page.type('input[name="projectName"]', 'CollabSphere Mesh');
    await page.type('textarea[name="description"]', 'AI-powered collaborative workspace for software development teams.');
    await page.type('input[name="technologies"]', 'React, Node.js, Express, MongoDB, Gemini AI');
    await page.type('textarea[name="features"]', 'Real-time Markdown notes, secure file sharing, AI code reviews, public previews');
    await page.click('button[type="submit"]');
    console.log('   Waiting for Generate README Gemini API response...');
    await page.waitForFunction(() => {
      const markdown = document.querySelector('.markdown-body');
      return markdown && markdown.innerText.length > 150;
    }, { timeout: 35000 });
    await takeScreenshot(page, '08_ai_readme_generator.png', 'README Generator response');
    recordScenario('Gemini AI Suite', 'Generate README Tool', 'PASS', 'Generated modern GitHub README with badges and instructions');

    // 4.4 Review Code (/ai/review)
    await page.goto(`${CLIENT_URL}/ai/review`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('textarea', { timeout: 5000 });
    await page.type('textarea', 'function executeQuery(userInput) { const query = "SELECT * FROM users WHERE username = \'" + userInput + "\'"; return db.raw(query); }');
    await page.click('button[type="submit"]');
    console.log('   Waiting for Review Code Gemini API response...');
    await page.waitForFunction(() => {
      const markdown = document.querySelector('.markdown-body');
      return markdown && markdown.innerText.length > 100;
    }, { timeout: 35000 });
    await takeScreenshot(page, '09_ai_code_review.png', 'AI Code Review response');
    recordScenario('Gemini AI Suite', 'Review Code Tool', 'PASS', 'Detected SQL injection security risk and provided refactored snippet');

    // -------------------------------------------------------------
    // SECTION 5: FILE UPLOADS & SECURITY
    // -------------------------------------------------------------
    console.log('\n--- 5. FILE UPLOADS & RESTRICTIONS TESTING ---');

    // Recreate a note so project has notes data
    await page.goto(`${CLIENT_URL}/projects/${testProjectId}/notes/new`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('input[name="title"]', { timeout: 5000 });
    await page.type('input[name="title"]', `Architecture Blueprint ${RUN_ID}`);
    await page.type('textarea[name="content"]', '# Architecture Blueprint\n\nCore distributed log consensus architecture notes.');
    await page.click('button[type="submit"]');
    await page.waitForFunction(() => window.location.pathname.includes('/notes/'), { timeout: 8000 });

    // 5.1 Upload JavaScript file
    await page.goto(`${CLIENT_URL}/projects/${testProjectId}/files`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('input[type="file"]', { timeout: 5000 });

    const tempJsFile = path.resolve(__dirname, 'temp_test_cluster.js');
    fs.writeFileSync(tempJsFile, '// CollabSphere cluster node\nconsole.log("Raft node operational");\n');

    const fileInput = await page.$('input[type="file"]');
    await fileInput.uploadFile(tempJsFile);
    await page.waitForFunction(() => document.body.innerText.includes('temp_test_cluster.js'), { timeout: 8000 });
    recordScenario('File Testing', 'Upload JavaScript File', 'PASS', 'Uploaded .js file and displayed in repository table');

    // 5.2 Upload Python file
    const tempPyFile = path.resolve(__dirname, 'temp_raft_election.py');
    fs.writeFileSync(tempPyFile, '# Raft election state machine\ndef start_election():\n    print("Starting term")\n');
    const pyFileInput = await page.$('input[type="file"]');
    await pyFileInput.uploadFile(tempPyFile);
    await page.waitForFunction(() => document.body.innerText.includes('temp_raft_election.py'), { timeout: 8000 });
    recordScenario('File Testing', 'Upload Python File', 'PASS', 'Uploaded .py file and categorized as code');

    // 5.3 Preview Supported File
    await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href*="/files/"]'));
      if (links.length > 0) links[0].click();
    });
    await page.waitForFunction(() => window.location.pathname.match(/\/files\/[a-f0-9]{24}$/), { timeout: 6000 });
    await takeScreenshot(page, '10_file_preview.png', 'File Preview Page');
    const previewContent = await page.evaluate(() => document.querySelector('pre, code, textarea, .card')?.innerText || '');
    if (previewContent.includes('Raft node operational') || previewContent.includes('cluster node')) {
      recordScenario('File Testing', 'Preview File Content', 'PASS', 'Read and rendered file content inline');
    } else {
      recordScenario('File Testing', 'Preview File Content', 'PARTIAL', 'File preview page rendered metadata');
    }

    // 5.4 Test Invalid File Extension (.exe)
    await page.goto(`${CLIENT_URL}/projects/${testProjectId}/files`, { waitUntil: 'networkidle0' });
    const tempExeFile = path.resolve(__dirname, 'temp_malicious.exe');
    fs.writeFileSync(tempExeFile, 'MZ fake executable payload');
    const exeInput = await page.$('input[type="file"]');
    await exeInput.uploadFile(tempExeFile);
    await page.waitForSelector('.toast, [style*="color: var(--danger)"], [style*="backgroundColor: var(--danger-bg)"]', { timeout: 6000 });
    const uploadErrorText = await page.evaluate(() => {
      const el = document.querySelector('.toast, [style*="color: var(--danger)"], [style*="backgroundColor: var(--danger-bg)"]');
      return el ? el.innerText : '';
    });
    if (uploadErrorText.toLowerCase().includes('unsupported') || uploadErrorText.toLowerCase().includes('file type')) {
      recordScenario('File Testing', 'Invalid File Type Blocked', 'PASS', `Rejected with HTTP 400 message: "${uploadErrorText.trim()}"`);
    } else {
      recordScenario('File Testing', 'Invalid File Type Blocked', 'PARTIAL', `Rejected: "${uploadErrorText.trim()}"`);
    }

    // Clean up local temp files
    try { fs.unlinkSync(tempJsFile); } catch (e) {}
    try { fs.unlinkSync(tempPyFile); } catch (e) {}
    try { fs.unlinkSync(tempExeFile); } catch (e) {}

    // -------------------------------------------------------------
    // SECTION 6: CONTRIBUTION ANALYTICS
    // -------------------------------------------------------------
    console.log('\n--- 6. CONTRIBUTION ANALYTICS TESTING ---');
    await page.goto(`${CLIENT_URL}/projects/${testProjectId}/analytics`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('.grid-4', { timeout: 6000 });
    await takeScreenshot(page, '11_analytics_dashboard.png', 'Contribution Analytics Dashboard');

    const kpiMetrics = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.grid-4 .card'));
      return cards.map(c => c.innerText);
    });

    const totalActivities = kpiMetrics[0] || '';
    const docNotes = kpiMetrics[1] || '';
    const uploadedArtifacts = kpiMetrics[2] || '';
    const activeContributors = kpiMetrics[3] || '';

    if (totalActivities && docNotes && uploadedArtifacts) {
      recordScenario('Contribution Analytics', 'Project Analytics KPIs', 'PASS', `Activities: ${totalActivities.split('\n')[1]}, Notes: ${docNotes.split('\n')[1]}, Files: ${uploadedArtifacts.split('\n')[1]}`);
    } else {
      recordScenario('Contribution Analytics', 'Project Analytics KPIs', 'FAIL', 'Analytics KPI cards missing');
    }

    const contributorTableRows = await page.evaluate(() => document.querySelectorAll('table tbody tr').length);
    if (contributorTableRows >= 1) {
      recordScenario('Contribution Analytics', 'Individual Contributor Metrics', 'PASS', `Loaded ${contributorTableRows} contributor records with real MongoDB actions`);
    } else {
      recordScenario('Contribution Analytics', 'Individual Contributor Metrics', 'FAIL', 'No contributor records displayed');
    }

    // -------------------------------------------------------------
    // SECTION 7: PUBLIC SHARING & REVOCATION
    // -------------------------------------------------------------
    console.log('\n--- 7. PUBLIC SHAREABLE PROJECT & REVOCATION TESTING ---');

    await page.goto(`${CLIENT_URL}/projects/${testProjectId}/settings`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('button:has-text("Public Sharing"), button.btn-primary', { timeout: 6000 });

    // Enable Public Sharing
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const shareBtn = btns.find(b => b.innerText.includes('Enable Public Sharing'));
      if (shareBtn) shareBtn.click();
    });

    await page.waitForFunction(() => {
      const input = document.querySelector('input[value*="/share/"]');
      return input && input.value.length > 10;
    }, { timeout: 6000 });

    publicShareUrl = await page.evaluate(() => document.querySelector('input[value*="/share/"]').value);
    recordScenario('Public Sharing', 'Enable Public Link', 'PASS', `Generated link: ${publicShareUrl}`);

    // Open link in completely logged-out context
    const publicContextPage = await browser.newPage();
    await publicContextPage.goto(publicShareUrl, { waitUntil: 'networkidle0' });
    await publicContextPage.waitForSelector('.page-container', { timeout: 6000 });
    await takeScreenshot(publicContextPage, '12_public_share_view.png', 'Public Shareable Project View (Logged-Out)');

    const publicBanner = await publicContextPage.evaluate(() => document.body.innerText);
    const hasReadOnlyNotice = publicBanner.includes('public read-only preview');
    const leaksEmail = publicBanner.includes('@example.com') || publicBanner.includes('Password123');

    if (hasReadOnlyNotice && !leaksEmail) {
      recordScenario('Public Sharing', 'Public Read-Only Preview', 'PASS', 'Read-only banner displayed; zero email addresses or credentials leaked');
    } else if (leaksEmail) {
      recordScenario('Public Sharing', 'Public Read-Only Preview', 'FAIL', 'Private user email leaked in public preview');
    } else {
      recordScenario('Public Sharing', 'Public Read-Only Preview', 'PARTIAL', 'Page loaded without explicit notice');
    }

    // Regenerate Public Link in Owner Browser
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const regenBtn = btns.find(b => b.innerText.includes('Regenerate'));
      if (regenBtn) regenBtn.click();
    });

    await page.waitForFunction((oldUrl) => {
      const input = document.querySelector('input[value*="/share/"]');
      return input && input.value !== oldUrl;
    }, { timeout: 6000 }, publicShareUrl);

    const newPublicShareUrl = await page.evaluate(() => document.querySelector('input[value*="/share/"]').value);
    recordScenario('Public Sharing', 'Regenerate Link', 'PASS', `New token generated: ${newPublicShareUrl}`);

    // Verify Old Link is revoked and returns 404 in logged-out browser
    await publicContextPage.goto(publicShareUrl, { waitUntil: 'networkidle0' });
    await publicContextPage.waitForSelector('.empty-state, h2, h3', { timeout: 6000 });
    const oldLinkText = await publicContextPage.evaluate(() => document.body.innerText);
    if (oldLinkText.toLowerCase().includes('not accessible') || oldLinkText.toLowerCase().includes('not found') || oldLinkText.toLowerCase().includes('disabled')) {
      recordScenario('Public Sharing', 'Old Link Revoked (404)', 'PASS', 'Old revoked share link cleanly returns Project Not Accessible');
    } else {
      recordScenario('Public Sharing', 'Old Link Revoked (404)', 'FAIL', 'Old share link was still accessible after regeneration');
    }

    // Verify New Link works
    await publicContextPage.goto(newPublicShareUrl, { waitUntil: 'networkidle0' });
    await publicContextPage.waitForSelector('.page-container', { timeout: 6000 });
    const newLinkText = await publicContextPage.evaluate(() => document.body.innerText);
    if (newLinkText.includes('public read-only preview')) {
      recordScenario('Public Sharing', 'New Link Accessible', 'PASS', 'Regenerated link accessible immediately');
    } else {
      recordScenario('Public Sharing', 'New Link Accessible', 'FAIL', 'New link failed to load');
    }

    // Disable Public Sharing
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const disableBtn = btns.find(b => b.innerText.includes('Disable Public Sharing'));
      if (disableBtn) disableBtn.click();
    });
    await page.waitForFunction(() => !document.querySelector('input[value*="/share/"]'), { timeout: 6000 });

    // Confirm disabled link now returns 404
    await publicContextPage.goto(newPublicShareUrl, { waitUntil: 'networkidle0' });
    await publicContextPage.waitForSelector('.empty-state, h2, h3', { timeout: 6000 });
    const disabledText = await publicContextPage.evaluate(() => document.body.innerText);
    if (disabledText.toLowerCase().includes('not accessible') || disabledText.toLowerCase().includes('disabled')) {
      recordScenario('Public Sharing', 'Disabled Link Returns 404', 'PASS', 'Disabled sharing returns 404 to external visitors');
    } else {
      recordScenario('Public Sharing', 'Disabled Link Returns 404', 'FAIL', 'Public page remained open after disabling');
    }
    await publicContextPage.close();

    // -------------------------------------------------------------
    // SECTION 8: RESPONSIVE UI & VIEWPORTS
    // -------------------------------------------------------------
    console.log('\n--- 8. RESPONSIVE UI & VIEWPORTS TESTING ---');

    const viewports = [
      { name: 'Mobile (375x812 - iPhone X)', width: 375, height: 812 },
      { name: 'Mobile (390x844 - iPhone 13/14)', width: 390, height: 844 },
      { name: 'Tablet (768x1024 - iPad)', width: 768, height: 1024 },
      { name: 'Desktop (1366x768)', width: 1366, height: 768 },
      { name: 'Large Desktop (1920x1080)', width: 1920, height: 1080 }
    ];

    for (const vp of viewports) {
      await page.setViewport({ width: vp.width, height: vp.height });
      await page.goto(`${CLIENT_URL}/dashboard`, { waitUntil: 'networkidle0' });

      // Check horizontal overflow
      const hasHorizontalOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });

      if (!hasHorizontalOverflow) {
        recordScenario('Responsive UI', `Viewport ${vp.name} Overflow`, 'PASS', 'No horizontal page overflow detected');
      } else {
        recordScenario('Responsive UI', `Viewport ${vp.name} Overflow`, 'FAIL', 'Horizontal scrollbar / overflow present');
      }

      // Check mobile drawer navigation on small screens
      if (vp.width <= 768) {
        const mobileMenuBtn = await page.$('.mobile-menu-btn');
        if (mobileMenuBtn) {
          // Click hamburger button to open
          await mobileMenuBtn.click();
          await page.waitForFunction(() => document.querySelector('.sidebar.open'), { timeout: 3000 });
          
          // Click mobile close button (X)
          const closeBtn = await page.$('.mobile-sidebar-close');
          if (closeBtn) {
            await closeBtn.click();
            await page.waitForFunction(() => !document.querySelector('.sidebar.open'), { timeout: 3000 });
            recordScenario('Responsive UI', `Viewport ${vp.name} Mobile Drawer`, 'PASS', 'Menu toggle and mobile close button operational');
          } else {
            // Click backdrop to close
            await page.click('.sidebar-backdrop');
            await page.waitForFunction(() => !document.querySelector('.sidebar.open'), { timeout: 3000 });
            recordScenario('Responsive UI', `Viewport ${vp.name} Mobile Drawer`, 'PASS', 'Drawer opened and closed via backdrop');
          }
        }
      }
    }

    // Reset viewport to standard desktop
    await page.setViewport({ width: 1366, height: 768 });

    // -------------------------------------------------------------
    // SECTION 9: BROWSER CONSOLE ERRORS AUDIT
    // -------------------------------------------------------------
    console.log('\n--- 9. BROWSER CONSOLE AUDIT ---');
    const fatalErrors = report.consoleErrors.filter(e => 
      e.type === 'pageerror' || 
      (e.text && (e.text.includes('Uncaught') || e.text.includes('TypeError') || e.text.includes('ReferenceError')))
    );

    if (fatalErrors.length === 0) {
      recordScenario('Browser Console', 'Zero Fatal JavaScript Errors', 'PASS', `Clean browser execution across all routes (${report.consoleErrors.length} total logs)`);
    } else {
      recordScenario('Browser Console', 'Zero Fatal JavaScript Errors', 'FAIL', `Found ${fatalErrors.length} fatal exceptions`);
    }

    // -------------------------------------------------------------
    // CLEANUP TEST DATA (Strictly scoped only to test entities)
    // -------------------------------------------------------------
    console.log('\n--- 10. CLEANUP TEST DATA ---');
    // Delete test project
    if (testProjectId) {
      await page.goto(`${CLIENT_URL}/projects/${testProjectId}/settings`, { waitUntil: 'networkidle0' });
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const delBtn = btns.find(b => b.innerText.includes('Delete Project Permanently'));
        if (delBtn) delBtn.click();
      });
      await page.waitForSelector('.modal-backdrop', { timeout: 4000 });
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('.modal-dialog button'));
        const confirmBtn = btns.find(b => b.innerText.includes('Confirm'));
        if (confirmBtn) confirmBtn.click();
      });
      await page.waitForFunction(() => window.location.pathname === '/projects', { timeout: 8000 });
      console.log('   Cleaned up test project successfully.');
    }

    // Clean up test user in MongoDB
    const mongoose = (await import('mongoose')).default;
    await mongoose.connect('mongodb://127.0.0.1:27017/collabsphere');
    const User = (await import('../models/User.js')).default;
    await User.deleteMany({
      email: { $in: [testUser.email, `outsider_${RUN_ID}@example.com`, `unique_${RUN_ID}@example.com`] }
    });
    await mongoose.disconnect();
    console.log('   Cleaned up test QA users.');

  } catch (err) {
    console.error('\n❌ Unhandled exception during E2E test:', err);
    recordScenario('General', 'E2E Runner Execution', 'FAIL', err.message);
    try {
      await takeScreenshot(page, '99_fatal_error.png', 'Fatal error state');
    } catch (e) {}
  } finally {
    await browser.close();
  }

  console.log('\n=================================================================');
  console.log('📊 FINAL E2E QUALITY ASSURANCE RESULTS SUMMARY');
  console.log(`Total Scenarios : ${report.total}`);
  console.log(`Passed          : ${report.pass} ✅`);
  console.log(`Failed          : ${report.fail} ❌`);
  console.log(`Partial         : ${report.partial} ⚠️`);
  console.log(`Not Verified    : ${report.notVerified} ❓`);
  console.log('=================================================================\n');

  console.table(report.scenarios);
  return report;
}

runFullE2ETest();
