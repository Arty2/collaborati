// @ts-check
const { defineConfig, devices } = require('@playwright/test');

// The app is a static file. Serve the repo root and drive /detrita.html.
// Use the environment's preinstalled Chromium when present (PLAYWRIGHT_BROWSERS_PATH),
// so CI and the sandbox don't need to download a browser.
const executablePath = process.env.PW_CHROMIUM_PATH || undefined;

module.exports = defineConfig({
	testDir: './tests',
	testMatch: '**/*.spec.js',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? [['github'], ['list']] : 'list',
	use: {
		baseURL: 'http://127.0.0.1:8080',
		trace: 'on-first-retry',
	},
	projects: [
		{
			name: 'chromium',
			use: {
				...devices['Desktop Chrome'],
				...(executablePath ? { launchOptions: { executablePath } } : {}),
			},
		},
	],
	webServer: {
		command: 'python3 -m http.server 8080 --bind 127.0.0.1',
		url: 'http://127.0.0.1:8080/detrita.html',
		reuseExistingServer: !process.env.CI,
		timeout: 30_000,
	},
});
