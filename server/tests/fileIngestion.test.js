import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Replicate the exact logic from FileUpload.jsx
const ACCEPTED_FILES = {
  "text/javascript": [".js", ".jsx", ".ts", ".tsx"],
  "text/html": [".html", ".htm"],
  "text/css": [".css"],
  "application/json": [".json"],
  "text/plain": [".txt", ".md", ".env", ".gitignore", ".sql", ".sh", ".yaml", ".yml"],
  "text/x-python": [".py"],
  "image/svg+xml": [".svg"],
};

const SKIPPED_BINARY_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".webp", ".gif", ".ico", ".bmp", ".tiff"
]);

function isFileTypeAccepted(name, mimeType = '') {
  const ext = '.' + name.split('.').pop().toLowerCase();
  const isExtensionAccepted = Object.values(ACCEPTED_FILES).some(exts => exts.includes(ext));
  if (isExtensionAccepted) return true;
  if (mimeType) {
    if (mimeType === 'image/svg+xml' && ext === '.svg') return true;
    if (mimeType.includes('python') && ext === '.py') return true;
    return Object.keys(ACCEPTED_FILES).some(t => {
      if (mimeType === t) return true;
      if (t.endsWith('/*')) return mimeType.startsWith(t.slice(0, -1));
      return false;
    });
  }
  return false;
}

function isSkippedBinaryFile(name, mimeType = '') {
  const ext = '.' + name.split('.').pop().toLowerCase();
  if (SKIPPED_BINARY_EXTENSIONS.has(ext)) return true;
  if (mimeType && mimeType.startsWith('image/') && ext !== '.svg') return true;
  return false;
}

console.log('=== TEST SUITE: FILE INGESTION & TYPE VALIDATION ===\n');

// Test files matching user description
const testFiles = [
  { name: 'hero.png', expected: 'SKIPPED_BINARY' },
  { name: '01_after_register.png', expected: 'SKIPPED_BINARY' },
  { name: 'vite.svg', expected: 'ACCEPTED' },
  { name: 'react.svg', expected: 'ACCEPTED' },
  { name: 'icons.svg', expected: 'ACCEPTED' },
  { name: 'favicon.svg', expected: 'ACCEPTED' },
  { name: 'analysis.py', expected: 'ACCEPTED' },
  { name: 'deep_learning.py', expected: 'ACCEPTED' },
  { name: 'App.jsx', expected: 'ACCEPTED' },
  { name: 'server.js', expected: 'ACCEPTED' },
  { name: 'package.json', expected: 'ACCEPTED' },
  { name: 'unknown_binary.exe', expected: 'REJECTED' }
];

let acceptedCount = 0;
let skippedCount = 0;
let rejectedErrors = [];

for (const tf of testFiles) {
  const accepted = isFileTypeAccepted(tf.name);
  const skipped = isSkippedBinaryFile(tf.name);

  let result = 'REJECTED';
  if (accepted) result = 'ACCEPTED';
  else if (skipped) result = 'SKIPPED_BINARY';

  assert.equal(result, tf.expected, `Mismatch for ${tf.name}: got ${result}, expected ${tf.expected}`);

  if (result === 'ACCEPTED') acceptedCount++;
  else if (result === 'SKIPPED_BINARY') skippedCount++;
  else rejectedErrors.push({ fileName: tf.name, error: 'File type not supported' });

  console.log(`✅ [${result}] ${tf.name} -> handled correctly as expected (${tf.expected})`);
}

console.log('\n--- Ingestion Summary ---');
console.log(`Analyzed files: ${acceptedCount}`);
console.log(`Safely skipped binary files: ${skippedCount}`);
console.log(`Genuine errors: ${rejectedErrors.length}`);

assert.equal(skippedCount, 2, 'hero.png and 01_after_register.png must be safely skipped');
assert.equal(acceptedCount, 9, 'SVG (4), Python (2), React (1), Node (2) must all be accepted');
assert.equal(rejectedErrors.length, 1, 'Only truly invalid files like .exe should generate errors');

console.log('\nAll ingestion unit assertions PASSED!\n');
