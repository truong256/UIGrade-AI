// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

/**
 * Portable documentation link & hygiene checker.
 * Scans markdown files for:
 * 1. Broken relative file links.
 * 2. Leaked machine-specific paths (file:///, C:/Users/, vscode-file://, .gemini/).
 */

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');

const docFiles = [
  'README.md',
  'CHANGELOG.md',
  'NOTICE.md',
  'CONTRIBUTING.md',
  'SECURITY.md',
  'CODE_OF_CONDUCT.md',
  'docs/SOLUTION_DESCRIPTION.md',
  'docs/ARCHITECTURE.md',
  'docs/AI_ARCHITECTURE.md',
  'docs/AI_GRADING.md',
  'docs/SECURITY.md',
  'docs/THIRD_PARTY_NOTICES.md',
  'docs/COMPETITION_COMPLIANCE.md',
  'web/site/README.md',
  'web/project-files/README.md',
];


const forbiddenPatterns = [
  { pattern: /file:\/\/\//i, label: 'file:///' },
  { pattern: /vscode-file:\/\//i, label: 'vscode-file://' },
  { pattern: /C:\/Users\//i, label: 'C:/Users/' },
  { pattern: /C:\\Users\\/i, label: 'C:\\Users\\' },
  { pattern: /\.gemini[\\\/]/i, label: '.gemini/' },
];

let totalErrors = 0;
let totalCheckedLinks = 0;

for (const relDoc of docFiles) {
  const fullDocPath = path.join(repoRoot, relDoc);
  if (!fs.existsSync(fullDocPath)) {
    console.warn(`[WARN] File not found to check: ${relDoc}`);
    continue;
  }

  const content = fs.readFileSync(fullDocPath, 'utf-8');
  const dir = path.dirname(fullDocPath);

  // Check forbidden local machine patterns
  for (const { pattern, label } of forbiddenPatterns) {
    if (pattern.test(content)) {
      console.error(`[ERROR] ${relDoc}: contains forbidden machine path pattern '${label}'`);
      totalErrors++;
    }
  }

  // Extract markdown links [text](target)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  while ((match = linkRegex.exec(content)) !== null) {
    const rawTarget = match[2].trim();
    totalCheckedLinks++;

    // Ignore web URLs, mailto, anchor-only links
    if (/^(https?:|mailto:|#)/i.test(rawTarget)) {
      continue;
    }

    // Strip anchor #section if present
    const cleanTarget = rawTarget.split('#')[0].trim();
    if (!cleanTarget) continue;

    const targetFullPath = path.resolve(dir, cleanTarget);
    if (!fs.existsSync(targetFullPath)) {
      console.error(`[ERROR] ${relDoc}: broken relative link -> '${rawTarget}' (resolved: '${path.relative(repoRoot, targetFullPath)}')`);
      totalErrors++;
    }
  }
}

console.log(`\nLink Check Summary:`);
console.log(`Checked ${totalCheckedLinks} links across ${docFiles.length} documentation files.`);
console.log(`Found ${totalErrors} errors.`);

if (totalErrors > 0) {
  process.exit(1);
} else {
  console.log(`All documentation links and hygiene checks PASSED.`);
  process.exit(0);
}
