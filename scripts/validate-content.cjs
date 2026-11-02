#!/usr/bin/env node
/**
 * Backyard Content & Integrity Validator
 * Validates editorial schemas, verifies markdown/HTML post file existence,
 * checks image asset references, and confirms key site routes.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

let errors = 0;
let warnings = 0;

function logError(msg) {
  console.error(`❌ ERROR: ${msg}`);
  errors++;
}

function logWarn(msg) {
  console.warn(`⚠️  WARN: ${msg}`);
  warnings++;
}

function logSuccess(msg) {
  console.log(`✅ ${msg}`);
}

// 1. Verify Core Site Routes
const corePages = [
  'index.html',
  'ht.html',
  'sp.html',
  'lss.html',
  'blog.html',
  'about.html',
  'ht_article.html',
  'spacesound_article.html',
  'lss_article.html',
  'blog_article.html',
  'tokens.css',
  'style.css',
  'ht.css',
  'archive-engine.js',
  'article-engine.js',
  'media-embeds.js'
];

console.log('--- Step 1: Checking core routes & engine assets ---');
corePages.forEach(file => {
  if (fs.existsSync(file)) {
    logSuccess(`Found ${file}`);
  } else {
    logError(`Missing core page: ${file}`);
  }
});

// 2. Validate Data Registries & Content Schemas
function loadRegistry(filePath, varName) {
  if (!fs.existsSync(filePath)) {
    logError(`Registry file ${filePath} does not exist`);
    return {};
  }
  try {
    const code = fs.readFileSync(filePath, 'utf8');
    const sandbox = { window: {} };
    vm.createContext(sandbox);
    vm.runInContext(code, sandbox);
    return sandbox.window[varName] || {};
  } catch (err) {
    logError(`Failed to parse ${filePath}: ${err.message}`);
    return {};
  }
}

console.log('\n--- Step 2: Validating content schemas & post bodies ---');
const registries = [
  { file: 'ht_data.js', varName: 'HT_ARTICLES', pub: 'Heralding Time' },
  { file: 'spacesound_data.js', varName: 'SPACESOUND_ARTICLES', pub: 'Space of Sound' },
  { file: 'lss_data.js', varName: 'LSS_ARTICLES', pub: 'Last Scattering Surface' },
  { file: 'blog_data.js', varName: 'BLOG_ARTICLES', pub: 'The Blog' }
];

let totalArticles = 0;

registries.forEach(reg => {
  const data = loadRegistry(reg.file, reg.varName);
  const count = Object.keys(data).length;
  totalArticles += count;
  console.log(`\nValidating ${reg.pub} (${count} entries in ${reg.file}):`);

  for (const [id, article] of Object.entries(data)) {
    if (!article.title) {
      logError(`[${reg.pub} ID ${id}] Missing 'title'`);
    }
    if (!article.date) {
      logWarn(`[${reg.pub} ID ${id}] Missing 'date'`);
    }
    if (!article.markdownFile) {
      logError(`[${reg.pub} ID ${id}] Missing 'markdownFile'`);
    } else {
      const fullPath = path.resolve(article.markdownFile);
      if (!fs.existsSync(fullPath)) {
        logError(`[${reg.pub} ID ${id}] File does not exist: ${article.markdownFile}`);
      }
    }

    if (article.image && !article.image.startsWith('http://') && !article.image.startsWith('https://')) {
      const imgPath = path.resolve(article.image);
      if (!fs.existsSync(imgPath)) {
        logWarn(`[${reg.pub} ID ${id}] Local image not found: ${article.image}`);
      }
    }
  }
});

// Summary
console.log('\n========================================');
console.log(`Validation completed: ${totalArticles} articles verified across 4 registries.`);
console.log(`Errors: ${errors}, Warnings: ${warnings}`);
console.log('========================================');

if (errors > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
