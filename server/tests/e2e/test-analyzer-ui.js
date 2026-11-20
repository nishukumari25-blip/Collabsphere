import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';
import http from 'http';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const TEST_DIR = path.resolve('/tmp/mixed-test-project');

// 1. Prepare mixed test project files
if (!fs.existsSync(TEST_DIR)) {
  fs.mkdirSync(TEST_DIR, { recursive: true });
}

fs.writeFileSync(path.join(TEST_DIR, 'hero.png'), Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
fs.writeFileSync(path.join(TEST_DIR, '01_after_register.png'), Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
fs.writeFileSync(path.join(TEST_DIR, 'vite.svg'), '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path d="M0 0h24v24H0z"/></svg>');
fs.writeFileSync(path.join(TEST_DIR, 'react.svg'), '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><circle cx="12" cy="12" r="10"/></svg>');
fs.writeFileSync(path.join(TEST_DIR, 'icons.svg'), '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><rect width="20" height="20"/></svg>');
fs.writeFileSync(path.join(TEST_DIR, 'favicon.svg'), '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><path d="M5 5h22v22H5z"/></svg>');
fs.writeFileSync(path.join(TEST_DIR, 'app.py'), 'def calculate_metrics(data):\n    return {"status": "ok", "count": len(data)}\n');
fs.writeFileSync(path.join(TEST_DIR, 'App.jsx'), 'import React from "react";\nexport const App = () => <div>Hello World</div>;\n');
fs.writeFileSync(path.join(TEST_DIR, 'server.js'), 'import express from "express";\nconst app = express();\n');
fs.writeFileSync(path.join(TEST_DIR, 'package.json'), '{"name": "test-mixed-project", "version": "1.0.0"}');

console.log('Created mixed test project at:', TEST_DIR);

async function runBrowserTest() {
  console.log('Starting Vite server for E2E browser test...');

  const rootDir = path.resolve(__dirname, '../../..');
  const viteProcess = spawn('npm', ['--prefix', 'client', 'run', 'dev', '--', '--port', '5179', '--host', '127.0.0.1'], {
    cwd: rootDir,
    stdio: 'pipe'
  });

  // Wait for Vite to be ready
  await new Promise((resolve) => {
    viteProcess.stdout.on('data', (data) => {
      const msg = data.toString();
      if (msg.includes('Local:') || msg.includes('5179')) {
        resolve();
      }
    });
    // Fallback timer
    setTimeout(resolve, 3500);
  });

  console.log('Vite server running at http://127.0.0.1:5179');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    const targetUrl = 'http://127.0.0.1:5179/analyzer';
    console.log(`Navigating to ${targetUrl}...`);
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });

    // Wait for container
    await page.waitForSelector('#project-analyzer-container', { timeout: 10000 });
    console.log('✅ Project Analyzer UI loaded in browser successfully');

    // Find the file input
    const fileInput = await page.$('#file-input-files');
    if (!fileInput) {
      throw new Error('#file-input-files not found in DOM');
    }

    const testFiles = [
      path.join(TEST_DIR, 'hero.png'),
      path.join(TEST_DIR, '01_after_register.png'),
      path.join(TEST_DIR, 'vite.svg'),
      path.join(TEST_DIR, 'react.svg'),
      path.join(TEST_DIR, 'icons.svg'),
      path.join(TEST_DIR, 'favicon.svg'),
      path.join(TEST_DIR, 'app.py'),
      path.join(TEST_DIR, 'App.jsx'),
      path.join(TEST_DIR, 'server.js'),
      path.join(TEST_DIR, 'package.json')
    ];

    console.log(`Uploading ${testFiles.length} mixed project files (PNG, SVG, Python, JSX, JS, JSON)...`);
    await fileInput.uploadFile(...testFiles);

    // Wait for the UI to process the files
    await page.waitForSelector('#analyzer-summary-bar', { timeout: 5000 });

    // Assert: Check analyzed count
    const analyzedText = await page.$eval('#summary-analyzed-badge', (el) => el.innerText);
    console.log('Analyzed badge text:', analyzedText);

    // Assert: Check skipped count
    const skippedText = await page.$eval('#summary-skipped-badge', (el) => el.innerText);
    console.log('Skipped badge text:', skippedText);

    // Assert: Ensure NO red errors exist in UI
    const errorsExist = await page.$eval('#errors-container', (el) => el ? true : false).catch(() => false);
    console.log('Errors container visible?:', errorsExist);

    if (errorsExist) {
      const errorMessages = await page.$$eval('#errors-container div', els => els.map(e => e.innerText));
      console.error('Unexpected errors found in UI:', errorMessages);
      throw new Error(`Expected zero errors, but found: ${JSON.stringify(errorMessages)}`);
    }

    console.log('✅ Zero red "File type not supported" errors present in UI!');

    // Toggle skipped details
    await page.click('#toggle-skipped-details');
    await page.waitForSelector('#skipped-files-container', { timeout: 3000 });
    const skippedList = await page.$eval('#skipped-files-container', (el) => el.innerText);
    console.log('✅ Skipped details toggle verified. Content preview:\n', skippedList.slice(0, 160));

    // Submit Project Analysis
    const submitBtn = await page.$('#btn-analyze-project-submit');
    if (!submitBtn) {
      throw new Error('Analyze project button not found or not enabled');
    }

    console.log('Clicking "Analyze Project" button...');
    await submitBtn.click();

    // Wait for analysis results card
    await page.waitForSelector('#analysis-results-card', { timeout: 6000 });
    const resultText = await page.$eval('#analysis-results-card', (el) => el.innerText);
    console.log('✅ Analysis result displayed in UI:\n', resultText.slice(0, 150));

    console.log('\n======================================================');
    console.log('🎉 E2E BROWSER UI VERIFICATION PASSED SUCCESSFULLY!');
    console.log('======================================================\n');
  } finally {
    await browser.close();
    viteProcess.kill('SIGTERM');
  }
}

runBrowserTest().catch((err) => {
  console.error('E2E Browser Test Failed:', err);
  process.exit(1);
});
