#!/usr/bin/env node
/**
 * Lint for hardcoded Tailwind colors that should use theme variables.
 * Run with: npm run lint:colors
 *
 * Excludes:
 * - components/ui/ (shadcn components - managed separately)
 * - bg-black/50, bg-black/70 (overlay backdrops - intentional)
 * - Semantic colors (green, red, yellow, orange, blue for status)
 */

const fs = require('fs');
const path = require('path');

// Patterns to check
const FORBIDDEN_PATTERNS = [
  /\bbg-gray-\d+\b/,
  /\btext-gray-\d+\b/,
  /\bborder-gray-\d+\b/,
  /\bbg-white\b(?!\/)/,  // bg-white but not bg-white/50
  /\bbg-slate-/,
  /\btext-slate-/,
  /\bbg-zinc-/,
  /\btext-zinc-/,
  /\bbg-neutral-/,
  /\btext-neutral-/,
  /\bbg-stone-/,
  /\btext-stone-/,
  /\bhover:bg-gray-/,
  /\bhover:text-gray-/,
  /\bdark:bg-gray-/,
  /\bdark:text-gray-/,
];

// Directories to exclude
const EXCLUDED_DIRS = [
  'components/ui',  // shadcn components
  'node_modules',
];

// Files to exclude
const EXCLUDED_FILES = [
  'lint-colors.js',
];

// Patterns that are allowed (intentional design decisions)
const ALLOWED_PATTERNS = [
  /bg-black\/\d+/,      // Overlay backdrops with opacity
  /bg-white\/\d+/,      // Overlay elements with opacity
  /text-white.*bg-black/, // White text on black overlay
];

const srcDir = path.join(__dirname, '..', 'src');

function getAllFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const relativePath = path.relative(srcDir, fullPath).replace(/\\/g, '/');

    // Skip excluded directories
    if (EXCLUDED_DIRS.some(ex => relativePath.startsWith(ex))) continue;
    if (EXCLUDED_FILES.includes(item)) continue;

    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      getAllFiles(fullPath, files);
    } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
      files.push(fullPath);
    }
  }
  return files;
}

console.log('🔍 Checking for hardcoded colors...\n');

let hasErrors = false;
const errors = [];

const files = getAllFiles(srcDir);

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  const relativePath = path.relative(srcDir, file).replace(/\\/g, '/');

  lines.forEach((line, idx) => {
    // Skip if line contains an allowed pattern
    if (ALLOWED_PATTERNS.some(p => p.test(line))) return;

    for (const pattern of FORBIDDEN_PATTERNS) {
      if (pattern.test(line)) {
        errors.push({
          file: relativePath,
          line: idx + 1,
          content: line.trim(),
          pattern: pattern.source,
        });
      }
    }
  });
}

if (errors.length > 0) {
  hasErrors = true;
  console.log('❌ Found hardcoded colors:\n');

  // Group by file
  const byFile = errors.reduce((acc, err) => {
    if (!acc[err.file]) acc[err.file] = [];
    acc[err.file].push(err);
    return acc;
  }, {});

  for (const [file, fileErrors] of Object.entries(byFile)) {
    console.log(`📄 ${file}`);
    for (const err of fileErrors) {
      console.log(`   Line ${err.line}: ${err.content.substring(0, 80)}${err.content.length > 80 ? '...' : ''}`);
    }
    console.log('');
  }
}

if (hasErrors) {
  console.log('💡 Use theme variables instead:');
  console.log('   bg-gray-* → bg-muted or bg-background');
  console.log('   text-gray-* → text-muted-foreground or text-foreground');
  console.log('   bg-white → bg-background or bg-card');
  console.log('   border-gray-* → border-border');
  console.log('');
  console.log('📚 See CLAUDE.md for full mapping.');
  console.log('');
  console.log(`Found ${errors.length} issue(s) in ${Object.keys(errors.reduce((a, e) => ({...a, [e.file]: 1}), {})).length} file(s).`);
  process.exit(1);
} else {
  console.log('✅ No hardcoded colors found!');
}
