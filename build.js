#!/usr/bin/env node
/*
 * build.js — assembles the single-file `detritus.html` from the sources in src/.
 *
 * There is no bundler and no dependency: the pieces are concatenated in filename
 * order and inlined into the shell, so the output is byte-for-byte what you get by
 * hand-writing one file. Edit files under src/ — never edit detritus.html directly.
 *
 *   node build.js            # writes ./detritus.html
 *   node build.js --check    # builds in memory and fails if ./detritus.html is stale
 *
 * See CLAUDE.md for the source layout and conventions.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SRC = path.join(ROOT, 'src');

// The app ships under two names, both committed and identical:
//   detritus.html — the portable, shareable single file (openable from file://)
//   index.html       — so any static host (Vercel included) serves it at "/" with
//                      no rewrite needed. Identical content, so git stores one blob.
const OUTPUTS = ['detritus.html', 'index.html'].map((f) => path.join(ROOT, f));

const STYLES_MARKER = '/*__BUILD_STYLES__*/\n';
const SCRIPTS_MARKER = '//__BUILD_SCRIPTS__\n';

// Concatenate every file in `dir` (sorted by name) into one Buffer.
function concatDir(dir) {
	const files = fs.readdirSync(dir).filter((f) => !f.startsWith('.')).sort();
	return Buffer.concat(files.map((f) => fs.readFileSync(path.join(dir, f))));
}

function build() {
	const shell = fs.readFileSync(path.join(SRC, 'index.html'), 'utf8');
	const styles = concatDir(path.join(SRC, 'styles')).toString('utf8');
	const scripts = concatDir(path.join(SRC, 'app')).toString('utf8');

	if (!shell.includes(STYLES_MARKER)) throw new Error('src/index.html: missing styles marker');
	if (!shell.includes(SCRIPTS_MARKER)) throw new Error('src/index.html: missing scripts marker');

	// Use function replacers so `$` sequences in the content are inserted literally
	// (a string replacement would treat `$'`, `$&`, etc. as special patterns).
	return shell
		.replace(STYLES_MARKER, () => styles)
		.replace(SCRIPTS_MARKER, () => scripts);
}

const html = build();

if (process.argv.includes('--check')) {
	const stale = OUTPUTS.filter(
		(p) => (fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '') !== html,
	);
	if (stale.length) {
		console.error(
			'Stale build output: ' +
				stale.map((p) => path.basename(p)).join(', ') +
				' — run `node build.js` and commit the result.',
		);
		process.exit(1);
	}
	console.log('Build output is up to date.');
} else {
	for (const p of OUTPUTS) fs.writeFileSync(p, html);
	console.log(
		'Built %s (%d bytes).',
		OUTPUTS.map((p) => path.basename(p)).join(' + '),
		Buffer.byteLength(html),
	);
}
