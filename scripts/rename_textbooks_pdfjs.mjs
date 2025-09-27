#!/usr/bin/env node

import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import url from 'url';
import process from 'process';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure pdfjs to use its worker from node_modules (legacy build for Node)
pdfjsLib.GlobalWorkerOptions.workerSrc = path.join(
  __dirname,
  'node_modules',
  'pdfjs-dist',
  'legacy',
  'build',
  'pdf.worker.mjs',
);

const INVALID_FILENAME_CHARS = /[\\/:*?"<>|]/g;
const MULTI_SPACE = /\s+/g;

const CHAPTER_PATTERNS = [
  /\bChapter\s+(\d+)\s*[:\-–—\.]?\s*(.+)/i,
  /\bLesson\s+(\d+)\s*[:\-–—\.]?\s*(.+)/i,
  /\bUnit\s+(\d+)\s*[:\-–—\.]?\s*(.+)/i,
  /\bCh\.?\s*(\d+)\s*[:\-–—\.]?\s*(.+)/i,
];

const WORD_NUMBERS = Object.freeze({
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
});

const CHAPTER_WORD_PATTERN = /\bChapter\s+(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen)\b\s*(.+)?/i;
const SKIP_TITLE_TOKENS = /^(contents|index|copyright|ncert|government of|acknowledg|preface|foreword)\b/i;

function normalizeText(text) {
  return text
    .replace(/\u00ad/g, '') // soft hyphen
    .replace(MULTI_SPACE, ' ')
    .trim();
}

function sanitizeFilenameComponent(name, maxLen = 100) {
  let out = normalizeText(name);
  out = out.replace(INVALID_FILENAME_CHARS, ' ');
  out = out.replace(/[\n\r]/g, ' ');
  out = out.replace(MULTI_SPACE, ' ').trim();
  if (out.length > maxLen) out = out.slice(0, maxLen).trimEnd();
  return out;
}

async function* walkDir(dir) {
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkDir(fullPath);
    } else {
      yield fullPath;
    }
  }
}

function deriveSubjectFromPath(pdfPath, baseDir) {
  const relative = path.relative(baseDir, pdfPath);
  const parts = relative.split(path.sep);
  const subjectDir = parts.length >= 2 ? parts[0] : path.basename(path.dirname(pdfPath));
  return sanitizeFilenameComponent(subjectDir, 80);
}

function shouldSkip(pdfPath) {
  return pdfPath.split(path.sep).some((p) => p.includes('Mathematics'));
}

function tryDetectChapter(lines) {
  // Pass 1: direct patterns with title on same line
  for (const line of lines) {
    for (const pattern of CHAPTER_PATTERNS) {
      const match = line.match(pattern);
      if (!match) continue;
      const numberStr = match[1];
      const title = (match[2] || '').trim();
      const chapterNumber = parseInt(numberStr, 10);
      if (!Number.isFinite(chapterNumber)) continue;
      if (!title || title.length < 3) continue;
      return { chapterNumber, chapterTitle: title };
    }
  }

  // Pass 2: number line followed by title lines
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    for (const pattern of CHAPTER_PATTERNS) {
      const match = line.match(pattern);
      if (!match) continue;
      const chapterNumber = parseInt(match[1], 10);
      if (!Number.isFinite(chapterNumber)) continue;
      for (let j = 1; j <= 4 && i + j < lines.length; j += 1) {
        const candidate = (lines[i + j] || '').trim();
        if (!candidate) continue;
        if (SKIP_TITLE_TOKENS.test(candidate)) continue;
        if (/^\d+$/.test(candidate)) continue;
        if (candidate.length < 5) continue;
        return { chapterNumber, chapterTitle: candidate };
      }
    }
  }

  // Pass 3: CHAPTER ONE style
  for (let i = 0; i < lines.length; i += 1) {
    const match = lines[i].match(CHAPTER_WORD_PATTERN);
    if (!match) continue;
    const word = (match[1] || '').toLowerCase();
    const chapterNumber = WORD_NUMBERS[word];
    if (!chapterNumber) continue;
    const remainder = (match[2] || '').trim();
    if (remainder && remainder.length > 3) {
      return { chapterNumber, chapterTitle: remainder };
    }
    for (let j = 1; j <= 4 && i + j < lines.length; j += 1) {
      const candidate = (lines[i + j] || '').trim();
      if (!candidate || candidate.length < 5) continue;
      if (/^\d+$/.test(candidate)) continue;
      return { chapterNumber, chapterTitle: candidate };
    }
  }

  return null;
}

function buildNewFilename(pdfPath, baseDir, detected) {
  const subject = deriveSubjectFromPath(pdfPath, baseDir);
  const title = sanitizeFilenameComponent(detected.chapterTitle, 80);
  return `${subject} - Ch ${String(detected.chapterNumber).padStart(2, '0')} - ${title}.pdf`;
}

async function extractLinesFromPdf(pdfPath, maxPages = 10) {
  const raw = await fsp.readFile(pdfPath);
  const loadingTask = pdfjsLib.getDocument({ data: raw });
  const pdfDoc = await loadingTask.promise;
  const pageCount = Math.min(pdfDoc.numPages, maxPages);
  const lines = [];
  for (let i = 1; i <= pageCount; i += 1) {
    const page = await pdfDoc.getPage(i);
    const textContent = await page.getTextContent();
    for (const item of textContent.items) {
      if (typeof item.str === 'string') {
        const parts = item.str.split(/\r?\n/);
        for (const p of parts) {
          const line = normalizeText(p);
          if (line) lines.push(line);
        }
      }
    }
  }
  return lines;
}

async function ensureUniquePath(targetDir, proposedName) {
  let candidate = path.join(targetDir, proposedName);
  if (!fs.existsSync(candidate)) return candidate;
  const ext = path.extname(proposedName);
  const base = path.basename(proposedName, ext);
  let counter = 2;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const alt = path.join(targetDir, `${base} (${counter})${ext}`);
    if (!fs.existsSync(alt)) return alt;
    counter += 1;
  }
}

async function main() {
  const argv = process.argv.slice(2);
  let baseDir = '';
  let apply = false;
  let maxCount = 0;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--base') {
      baseDir = argv[++i] || '';
    } else if (arg === '--apply') {
      apply = true;
    } else if (arg === '--max') {
      maxCount = parseInt(argv[++i] || '0', 10) || 0;
    }
  }

  if (!baseDir) {
    console.error('Usage: rename_textbooks_pdfjs.mjs --base <dir> [--apply] [--max N]');
    process.exit(2);
  }

  baseDir = path.resolve(baseDir);
  const stat = await fsp.stat(baseDir).catch(() => null);
  if (!stat || !stat.isDirectory()) {
    console.error(`ERROR: Base directory not found: ${baseDir}`);
    process.exit(2);
  }

  let processed = 0;
  let renamed = 0;
  let skipped = 0;

  for await (const fullPath of walkDir(baseDir)) {
    if (!fullPath.toLowerCase().endsWith('.pdf')) continue;
    if (maxCount && processed >= maxCount) break;
    processed += 1;

    if (shouldSkip(fullPath)) {
      console.log(`SKIP [Mathematics]: ${fullPath}`);
      skipped += 1;
      continue;
    }

    let detected = null;
    try {
      const lines = await extractLinesFromPdf(fullPath, 10);
      detected = tryDetectChapter(lines);
    } catch (err) {
      skipped += 1;
      console.log(`SKIP [Parse error]: ${fullPath}`);
      continue;
    }

    if (!detected) {
      console.log(`SKIP [No chapter detected]: ${fullPath}`);
      skipped += 1;
      continue;
    }

    const proposedName = buildNewFilename(fullPath, baseDir, detected);
    const targetPath = await ensureUniquePath(path.dirname(fullPath), proposedName);
    if (path.basename(fullPath) === path.basename(targetPath)) {
      console.log(`OK [Already named]: ${path.basename(fullPath)}`);
      continue;
    }

    const action = apply ? 'RENAME' : 'DRY-RUN';
    console.log(`${action}: ${path.basename(fullPath)} -> ${path.basename(targetPath)}`);

    if (apply) {
      try {
        await fsp.rename(fullPath, targetPath);
        renamed += 1;
      } catch (e) {
        console.error(`ERROR renaming '${fullPath}': ${e}`);
      }
    }
  }

  console.log(`\nSummary: processed=${processed}, renamed=${renamed}, skipped=${skipped}, apply=${apply}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
