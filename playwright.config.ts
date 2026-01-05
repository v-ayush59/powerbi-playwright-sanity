import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
/**
 * See https://playwright.dev/docs/test-configuration.
 */

// Load .env file
dotenv.config();

export default defineConfig({
  timeout: 5 * 60 * 1000, // 5 minutes for slow Power BI reports
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry */
  retries: 0,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  /* Thanks to link for config settings: https://ultimateqa.com/playwright-reporters-how-to-integrate-with-azure-devops-pipelines/*/
  reporter: [['html', {open: 'never'}],['junit', { outputFile: 'test-results/results.xml' }]],
  use: {
    /* Maximum time each action such as `click()` can take. 
        Defaults to 0 (no limit). */
    actionTimeout: 60 * 1000,
    navigationTimeout: 60 * 1000,

    /* Collect trace when retrying the failed test. 
    See https://playwright.dev/docs/trace-viewer */
    trace: 'on',
    screenshot: 'only-on-failure',
    video: {
      mode: 'on'
    },
    headless: true
  },
  globalSetup: require.resolve('./global-setup')
});
