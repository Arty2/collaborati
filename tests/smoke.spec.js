// @ts-check
const { test, expect } = require('@playwright/test');

const APP = '/collaborati.html';

test('boots with a rendered board and no uncaught errors', async ({ page }) => {
	const pageErrors = [];
	page.on('pageerror', (e) => pageErrors.push(e.message));

	await page.goto(APP);
	await expect(page).toHaveTitle('/collaborati');

	// Default board seeds a set of stage columns.
	const board = page.locator('#board');
	await expect(board).toBeVisible();
	await expect.poll(() => board.evaluate((el) => el.children.length)).toBeGreaterThan(3);

	expect(pageErrors, 'no uncaught page errors on boot').toEqual([]);
});

test('adds a card via quick capture', async ({ page }) => {
	await page.goto(APP);
	const badge = page.locator('#inbox-badge');
	await expect(badge).toBeVisible();
	const before = Number((await badge.textContent())?.trim() || '0');

	await page.fill('#quick-input', 'PlaywrightSmokeCard');
	await page.press('#quick-input', 'Enter');

	await expect
		.poll(async () => Number((await badge.textContent())?.trim() || '0'))
		.toBe(before + 1);
	await expect(page.locator('#inbox-list')).toContainText('PlaywrightSmokeCard');
});

test('help panel shows the current version', async ({ page }) => {
	await page.goto(APP);
	// The help modal overlays the button once open, so force the toggle click.
	await page.locator('#btn-help').click({ force: true });
	const panel = page.locator('.help-panel');
	await expect(panel).toBeVisible();
	await expect(panel).toContainText('0.82 (2026-07-27)');
});

test('exposes a valid inline web app manifest', async ({ page }) => {
	await page.goto(APP);
	const link = page.locator('link[rel="manifest"]');
	await expect(link).toHaveCount(1);

	const manifest = await page.evaluate(async () => {
		const href = document.querySelector('link[rel="manifest"]').getAttribute('href');
		const res = await fetch(href);
		return res.json();
	});

	expect(manifest.name).toBe('/collaborati');
	expect(manifest.short_name).toBe('collaborati');
	expect(manifest.display).toBe('standalone');
	expect(manifest.icons.length).toBeGreaterThanOrEqual(2);
	const sizes = manifest.icons.map((i) => i.sizes);
	expect(sizes).toContain('192x192');
	expect(sizes).toContain('512x512');
	expect(manifest.icons.some((i) => i.purpose && i.purpose.includes('maskable'))).toBe(true);
});
