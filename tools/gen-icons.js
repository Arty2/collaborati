#!/usr/bin/env node
/*
 * gen-icons.js — rasterize the PWA icons in icons/ from the brand mark.
 *
 * The brand glyph is the single <path> of `.brand-svg--main` in src/index.html.
 * We render it centered on the brand background and screenshot it with the
 * Playwright Chromium that's already a devDependency, so there's nothing extra
 * to install. Icons are committed, so this only needs re-running when the brand
 * mark or colors change.
 *
 *   node tools/gen-icons.js          # -> icons/*.png   (npm run gen:icons)
 *   PW_CHROMIUM_PATH=/path/to/chrome node tools/gen-icons.js
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

const ROOT = path.join(__dirname, '..');
const ICONS_DIR = path.join(ROOT, 'icons');

// The mark sits white on a full-bleed accent field, matching the app icon
// artwork in src/icons/icon.png. Full bleed matters for the maskable variant:
// it gets cropped to a circle or squircle, so the background has to reach the
// edges — hence a flat field rather than the artwork's drawn badge outline.
const BG = '#bd1e2e'; // --accent
const FG = '#ffffff';

// (filename, size px, padding % of the square)
const SPECS = [
	['icon-192.png', 192, 9],
	['icon-512.png', 512, 9],
	['icon-maskable-512.png', 512, 20], // extra padding for the maskable safe zone
	['apple-touch-icon-180.png', 180, 9],
];

function brandMark() {
	const html = fs.readFileSync(path.join(ROOT, 'src', 'index.html'), 'utf8');
	const m = html.match(
		/class="brand-svg brand-svg--main"[^>]*viewBox="([^"]+)"[^>]*>\s*<path d="([^"]+)"/,
	);
	if (!m) throw new Error('could not find the .brand-svg--main <path> in src/index.html');
	return { viewBox: m[1], d: m[2] };
}

function iconHtml({ viewBox, d }, size, padPct) {
	const inner = 100 - 2 * padPct;
	return `<!DOCTYPE html><html><head><style>*{margin:0;padding:0}html,body{width:${size}px;height:${size}px;overflow:hidden}</style></head><body>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">
<rect width="100" height="100" fill="${BG}"/>
<svg x="${padPct}" y="${padPct}" width="${inner}" height="${inner}" viewBox="${viewBox}" preserveAspectRatio="xMidYMid meet">
<path fill="${FG}" d="${d}"/>
</svg></svg></body></html>`;
}

(async () => {
	const mark = brandMark();
	fs.mkdirSync(ICONS_DIR, { recursive: true });

	const browser = await chromium.launch({
		executablePath: process.env.PW_CHROMIUM_PATH || undefined,
	});
	try {
		for (const [name, size, padPct] of SPECS) {
			const page = await browser.newPage({ viewport: { width: size, height: size } });
			await page.setContent(iconHtml(mark, size, padPct), { waitUntil: 'load' });
			const buf = await page.screenshot({ clip: { x: 0, y: 0, width: size, height: size } });
			fs.writeFileSync(path.join(ICONS_DIR, name), buf);
			await page.close();
			console.log('wrote icons/%s (%d bytes)', name, buf.length);
		}
	} finally {
		await browser.close();
	}
})().catch((err) => {
	console.error(err);
	process.exit(1);
});
