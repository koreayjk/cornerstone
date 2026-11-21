// Automated checks for the static site and the portal demo.
// Run locally:  npm install  &&  npx playwright test   (starts its own static server)
// CI: .github/workflows/ci.yml runs the same on every pull request and push to main.
const { defineConfig } = require('@playwright/test');

const PORT = 4173;
module.exports = defineConfig({
  testDir: 'tests',
  timeout: 90_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}/`,
    trace: 'off',
    reducedMotion: 'reduce',
    locale: 'en-US'
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true } }
  ],
  webServer: {
    command: `python3 -m http.server ${PORT}`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
    stderr: 'ignore'
  }
});
