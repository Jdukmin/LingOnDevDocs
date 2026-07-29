#!/usr/bin/env node
// Regenerates assets/manifest.json by scanning backend/docs and frontend/docs
// for Markdown files. Run this after adding/removing/renaming doc files:
//   node scripts/build-manifest.js

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT_FILE = path.join(ROOT, 'assets', 'manifest.json');

const SOURCES = [
  { app: 'docs', label: 'Strategy', dir: path.join(ROOT, 'docs') },
  { app: 'requirements', label: 'Requirements', dir: path.join(ROOT, 'requirements') },
  { app: 'backend', label: 'Backend', dir: path.join(ROOT, 'backend', 'docs') },
  { app: 'frontend', label: 'Frontend', dir: path.join(ROOT, 'frontend', 'docs') },
  { app: 'changelog', label: 'ChangeLog', dir: path.join(ROOT, 'changelog') },
  { app: 'verification', label: 'Verification', dir: path.join(ROOT, 'verification') },
];

function toPosix(p) {
  return p.split(path.sep).join('/');
}

function extractTitle(content, fallback) {
  const match = content.match(/^\s*#\s+(.+?)\s*$/m);
  if (!match) return fallback;
  return match[1].replace(/`/g, '').trim();
}

function walk(baseDir, dir, app, entries) {
  const items = fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
  for (const item of items) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      walk(baseDir, full, app, entries);
      continue;
    }
    if (!item.isFile() || !item.name.toLowerCase().endsWith('.md')) continue;

    const relToDocs = toPosix(path.relative(baseDir, full));
    const relToRoot = toPosix(path.relative(ROOT, full));
    const segments = relToDocs.split('/');
    const category = segments.length > 1 ? segments[0] : '';
    const content = fs.readFileSync(full, 'utf8');
    const title = extractTitle(content, path.basename(item.name, '.md'));

    entries.push({
      app,
      category,
      path: relToRoot,
      title,
    });
  }
}

function build() {
  const entries = [];

  const rootReadme = path.join(ROOT, 'README.md');
  if (fs.existsSync(rootReadme)) {
    const content = fs.readFileSync(rootReadme, 'utf8');
    entries.push({
      app: 'root',
      category: '',
      path: 'README.md',
      title: extractTitle(content, 'README'),
    });
  }

  const rootClaude = path.join(ROOT, 'CLAUDE.md');
  if (fs.existsSync(rootClaude)) {
    const content = fs.readFileSync(rootClaude, 'utf8');
    entries.push({
      app: 'root',
      category: '',
      path: 'CLAUDE.md',
      title: extractTitle(content, 'CLAUDE.md'),
    });
  }

  for (const source of SOURCES) {
    if (!fs.existsSync(source.dir)) continue;
    walk(source.dir, source.dir, source.app, entries);
  }

  entries.sort((a, b) => {
    const appOrder = { root: 0, docs: 1, requirements: 2, backend: 3, frontend: 4, verification: 5, changelog: 6 };
    if (appOrder[a.app] !== appOrder[b.app]) return appOrder[a.app] - appOrder[b.app];
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return a.path.localeCompare(b.path);
  });

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify({ generatedAt: new Date().toISOString(), docs: entries }, null, 2) + '\n');
  console.log(`Wrote ${entries.length} doc entries to ${toPosix(path.relative(ROOT, OUT_FILE))}`);
}

build();
