#!/usr/bin/env node
'use strict';
// Prepare a legacy-WebView copy of the player assets. Never rewrite web/ source.
// The API26 emulator's Chrome 69 cannot parse optional chaining/nullish coalescing.
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function fail(message) { throw new Error('Android WebView asset build: ' + message); }
const source = path.resolve(process.argv[2] || path.join(__dirname, '..', 'web'));
const output = path.resolve(process.argv[3] || '');
if (!process.argv[3] || output === source || output.startsWith(source + path.sep)) {
  fail('output must be a separate generated Android build directory');
}
if (!output.split(path.sep).includes('build')) fail('refusing to replace a non-build directory');
const html = fs.readFileSync(path.join(source, 'index.html'), 'utf8');
const entries = [...html.matchAll(/<script\s+src="([^"?#]+\.js)"\s*><\/script>/g)].map(match => match[1]);
if (entries.length < 30 || new Set(entries).size !== entries.length) {
  fail('missing or duplicated ordered game script entries');
}
for (const entry of entries) {
  if (path.basename(entry) !== entry || !fs.statSync(path.join(source, entry)).isFile()) {
    fail('unsafe or absent original game script: ' + entry);
  }
}
fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });
fs.cpSync(source, output, { recursive: true });
// Pinned compiler, no bundling, no minification, no IIFE wrapper. Keep classic
// script order and shared top-level scope; only lower unsupported syntax.
const args = ['--yes', 'esbuild@0.25.12',
  ...entries.map(entry => path.join(source, entry)),
  '--target=chrome69', '--platform=browser', '--log-level=warning',
  '--outdir=' + output];
const result = spawnSync('npx', args, { stdio: 'inherit', shell: false });
if (result.error) fail('esbuild invocation failed: ' + result.error.message);
if (result.status !== 0) fail('pinned esbuild failed with exit ' + result.status);
let changed = 0;
for (const entry of entries) {
  const original = fs.readFileSync(path.join(source, entry), 'utf8');
  const converted = fs.readFileSync(path.join(output, entry), 'utf8');
  if (!converted.trim()) fail('empty transpiled script: ' + entry);
  if (converted !== original) changed++;
}
if (changed === 0) fail('none of the modern game scripts were transpiled');
if (fs.readFileSync(path.join(output, 'index.html'), 'utf8') !== html) {
  fail('classic script order changed during build');
}
console.log('PASS: staged ' + entries.length + ' ordered game scripts for Chrome 69 (' +
  changed + ' transformed); original source unchanged, HTML preserved');
