import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const screenshotsDir = path.resolve(__dirname, 'screenshots');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const CLIENT_URL = 'http://localhost:5173';
const RUN_ID = Date.now().toString(36);

const results = [];

const logResult = (name, status, details = '') => {
  results.push({ name, status, details });
  console.log(`[${status}] ${name} ${details ? '- ' + details : ''}`);
};

export async function runAuthTests() {
  console.log('\n--- STARTING SECTION 1: AUTHENTICATION E2E BROWSER TESTING ---');
  
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1366,768']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 768 });

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', (err) => consoleErrors.push(err.message));

  const testUser = {
    name: `QA User ${RUN_ID}`,
    username: `qa_user_${RUN_ID}`,
    email: `qa_user_${RUN_ID}@example.com`,
    password: 'Password123!'
  };

  try {
    // 1. Protected routes: visiting /dashboard unauthenticated must redirect to /login
    await page.goto(`${CLIENT_URL}/dashboard`, { waitUntil: 'networkidle0' });
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      logResult('Protected Route Redirect', 'PASS', 'Unauthenticated user redirected to /login');
    } else {
      logResult('Protected Route Redirect', 'FAIL', `Expected /login, got ${currentUrl}`);
    }

    // 2. User Registration
    await page.goto(`${CLIENT_URL}/register`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('input[name="name"]');
    await page.type('input[name="name"]', testUser.name);
    await page.type('input[name="username"]', testUser.username);
    await page.type('input[name="email"]', testUser.email);
    await page.type('input[name="password"]', testUser.password);
    await page.type('input[name="confirmPassword"]', testUser.password);
    
    // Submit registration
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      page.click('button[type="submit"]')
    ]);

    await page.screenshot({ path: path.join(screenshotsDir, '01_after_register.png') });
    
    if (page.url().includes('/dashboard')) {
      logResult('User Registration', 'PASS', `Registered & redirected to /dashboard as ${testUser.username}`);
    } else {
      logResult('User Registration', 'FAIL', `Expected /dashboard after register, got ${page.url()}`);
    }

    // 3. Session Persistence after Refresh
    await page.reload({ waitUntil: 'networkidle0' });
    if (page.url().includes('/dashboard')) {
      logResult('Session Persistence on Refresh', 'PASS', 'Remained logged in after full page reload');
    } else {
      logResult('Session Persistence on Refresh', 'FAIL', `Redirected away after reload: ${page.url()}`);
    }

    // 4. Logout
    // Click user profile/logout button in sidebar
    await page.waitForSelector('button[title="Log Out"]');
    await page.click('button[title="Log Out"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    if (page.url().includes('/login')) {
      logResult('User Logout', 'PASS', 'Successfully logged out and redirected to /login');
    } else {
      logResult('User Logout', 'FAIL', `Expected /login after logout, got ${page.url()}`);
    }

    // 5. Access Protected Route After Logout
    await page.goto(`${CLIENT_URL}/dashboard`, { waitUntil: 'networkidle0' });
    if (page.url().includes('/login')) {
      logResult('Access Blocked After Logout', 'PASS', 'Dashboard access blocked after logout');
    } else {
      logResult('Access Blocked After Logout', 'FAIL', `Could access dashboard after logout: ${page.url()}`);
    }

    // 6. Login with Invalid Credentials
    await page.goto(`${CLIENT_URL}/login`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('input[name="login"]');
    await page.type('input[name="login"]', testUser.username);
    await page.type('input[name="password"]', 'WrongPassword123!');
    await page.click('button[type="submit"]');

    // Wait for error toast or alert
    await page.waitForSelector('.toast, .alert, [style*="color: var(--danger)"], [style*="backgroundColor: var(--danger-bg)"]', { timeout: 5000 });
    const errorText = await page.evaluate(() => {
      const el = document.querySelector('.toast, .alert, [style*="color: var(--danger)"], [style*="backgroundColor: var(--danger-bg)"]');
      return el ? el.innerText : '';
    });
    
    if (errorText.toLowerCase().includes('invalid') || errorText.toLowerCase().includes('password') || errorText.toLowerCase().includes('credential')) {
      logResult('Invalid Credentials Error', 'PASS', `Error displayed: "${errorText.trim()}"`);
    } else {
      logResult('Invalid Credentials Error', 'PARTIAL', `Error element found: "${errorText.trim()}"`);
    }

    // 7. Login with Valid Credentials
    await page.click('input[name="password"]', { clickCount: 3 });
    await page.keyboard.press('Backspace');
    await page.type('input[name="password"]', testUser.password);
    
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      page.click('button[type="submit"]')
    ]);

    if (page.url().includes('/dashboard')) {
      logResult('Valid Login', 'PASS', 'Logged in successfully with correct credentials');
    } else {
      logResult('Valid Login', 'FAIL', `Login failed, on ${page.url()}`);
    }

    // 8. Duplicate Registration Rejection
    const incognitoPage = await browser.newPage();
    await incognitoPage.goto(`${CLIENT_URL}/register`, { waitUntil: 'networkidle0' });
    await incognitoPage.type('input[name="name"]', 'Duplicate Name');
    await incognitoPage.type('input[name="username"]', `diff_${RUN_ID}`);
    await incognitoPage.type('input[name="email"]', testUser.email); // Same email
    await incognitoPage.type('input[name="password"]', 'Password123!');
    await incognitoPage.type('input[name="confirmPassword"]', 'Password123!');
    await incognitoPage.click('button[type="submit"]');

    await incognitoPage.waitForSelector('.toast, .alert, [style*="color: var(--danger)"], [style*="backgroundColor: var(--danger-bg)"]', { timeout: 5000 });
    const dupErrorText = await incognitoPage.evaluate(() => {
      const el = document.querySelector('.toast, .alert, [style*="color: var(--danger)"], [style*="backgroundColor: var(--danger-bg)"]');
      return el ? el.innerText : '';
    });

    if (dupErrorText.toLowerCase().includes('duplicate') || dupErrorText.toLowerCase().includes('exists') || dupErrorText.toLowerCase().includes('registered') || dupErrorText.toLowerCase().includes('already')) {
      logResult('Duplicate Registration Block', 'PASS', `Rejected with message: "${dupErrorText.trim()}"`);
    } else {
      logResult('Duplicate Registration Block', 'PARTIAL', `Rejected: "${dupErrorText.trim()}"`);
    }
    await incognitoPage.close();

  } catch (err) {
    console.error('Auth test error:', err);
    logResult('Authentication Test Exception', 'FAIL', err.message);
  } finally {
    await browser.close();
  }

  return { testUser, results, consoleErrors };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runAuthTests().then(({ results }) => {
    console.log('\n--- SUMMARY ---');
    console.table(results);
  });
}
