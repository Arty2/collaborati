// Build-integrity checks — no browser required. Run with: node --test
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'collaborati.html');

test('committed collaborati.html matches a fresh build (not stale)', () => {
	// build.js --check exits non-zero if the committed file differs from a rebuild.
	execFileSync('node', ['build.js', '--check'], { cwd: ROOT, stdio: 'pipe' });
});

test('built file carries the expected markers', () => {
	const html = fs.readFileSync(OUT, 'utf8');
	assert.match(html, /rel="manifest"/, 'inline manifest link present');
	assert.match(html, /0\.82 \(2026-07-27\)/, 'version string present');
	assert.match(html, /collaborati-v2/, 'service worker cache bumped to v2');
	assert.match(html, /rel="apple-touch-icon"/, 'apple-touch-icon present');
});

test('inline manifest is valid JSON with icons', () => {
	const html = fs.readFileSync(OUT, 'utf8');
	const m = html.match(/rel="manifest" href="data:application\/manifest\+json,([^"]+)"/);
	assert.ok(m, 'manifest data URI found');
	const manifest = JSON.parse(decodeURIComponent(m[1]));
	assert.equal(manifest.name, '/collaborati');
	assert.equal(manifest.display, 'standalone');
	const sizes = manifest.icons.map((i) => i.sizes);
	assert.ok(sizes.includes('192x192') && sizes.includes('512x512'), 'has 192 and 512 icons');
	assert.ok(
		manifest.icons.some((i) => (i.purpose || '').includes('maskable')),
		'has a maskable icon',
	);
});
