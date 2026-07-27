#!/usr/bin/env node
/*
 * build.js — assembles the single-file `collaborati.html` from the sources in src/.
 *
 * There is no bundler and no dependency: the pieces are concatenated in filename
 * order and inlined into the shell, so the output is byte-for-byte what you get by
 * hand-writing one file. Edit files under src/ — never edit collaborati.html directly.
 *
 *   node build.js            # writes ./collaborati.html
 *   node build.js --check    # builds in memory and fails if ./collaborati.html is stale
 *
 * See CLAUDE.md for the source layout and conventions.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SRC = path.join(ROOT, 'src');
const OUT = path.join(ROOT, 'collaborati.html');

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
	const current = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
	if (current !== html) {
		console.error('collaborati.html is out of date — run `node build.js` and commit the result.');
		process.exit(1);
	}
	console.log('collaborati.html is up to date.');
} else {
	fs.writeFileSync(OUT, html);
	console.log('Built collaborati.html (%d bytes).', Buffer.byteLength(html));
}
