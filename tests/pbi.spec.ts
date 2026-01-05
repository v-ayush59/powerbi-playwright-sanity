import { test, expect } from '@playwright/test';
import { chromium } from 'playwright';
import { getAccessToken, TestSettings, getReportEmbedToken, createReportEmbedInfo, getAPIEndpoints } from '../helper-functions/token-helpers';
import { readCSVFilesFromFolder } from '../helper-functions/file-reader';
import { logToConsole } from '../helper-functions/logging';

/* VARIABLES */
if (!process.env.CLIENT_ID || !process.env.TENANT_ID || !process.env.FEDERATED_CREDENTIAL_NAME || !process.env.ENVIRONMENT) {
  throw new Error('Missing required environment variables.');
}

const testSettings: TestSettings = {
  clientId: process.env.CLIENT_ID!,
  tenantId: process.env.TENANT_ID!,
  federatedCredentialName: process.env.FEDERATED_CREDENTIAL_NAME!,
  environment: process.env.ENVIRONMENT!,
};

// Load test cases and endpoints
const testRecords = readCSVFilesFromFolder('./test-cases');
const endPoints = getAPIEndpoints(testSettings.environment);
const isVerboseLogging = true;

let testAccessToken = '';

test.beforeAll(async () => {
  testAccessToken = await getAccessToken(testSettings);
});

// ✅ Test: Access token
test('Check if access token can be generated', async () => {
  logToConsole('Checking access token generation...', isVerboseLogging);
  expect(testAccessToken).not.toBeUndefined();
});

// ✅ Test: Embed token for each report
testRecords.forEach((record) => {
  test(`Test ${record.test_case} - '${record.report_name}' embed token`, async () => {
    const embedInfo = createReportEmbedInfo(record);
    const embedToken = await getReportEmbedToken(embedInfo, endPoints, testAccessToken);
    expect(embedToken).not.toBeUndefined();
  });
});

// ✅ Test: Visual embedding and render checks
testRecords.forEach((record) => {
  test(`Visual test for ${record.test_case} - '${record.report_name}'`, async () => {
    const browser = await chromium.launch({ args: ['--disable-web-security'], headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    const reportResponse = await fetch(
      `${endPoints.apiPrefix}/v1.0/myorg/groups/${record.workspace_id}/reports/${record.report_id}`,
      { headers: { Authorization: `Bearer ${testAccessToken}` } }
    ).then(res => res.json());

    await page.goto('about:blank');
    await page.addScriptTag({ url: 'https://cdnjs.cloudflare.com/ajax/libs/powerbi-client/2.23.7/powerbi.min.js' });

    const embedInfo = createReportEmbedInfo(record);
    const embedToken = await getReportEmbedToken(embedInfo, endPoints, testAccessToken);

    const reportConfig = {
      reportId: record.report_id,
      pageName: record.page_id,
      embedUrl: reportResponse.embedUrl,
      accessToken: embedToken,
      bookmark: record.bookmark_id || undefined,
    };

    const testResult = await page.evaluate(async (cfg: any) => {
      const pbi = (window as any)['powerbi-client'];
      const models = pbi.models;

      const embedConfig: any = {
        type: 'report',
        id: cfg.reportId,
        embedUrl: cfg.embedUrl,
        pageName: cfg.pageName,
        accessToken: cfg.accessToken,
        tokenType: models.TokenType.Embed,
        permissions: models.Permissions.Read,
        viewMode: models.ViewMode.View,
      };

      if (cfg.bookmark) embedConfig.bookmark = { name: cfg.bookmark };

      const service = new pbi.service.Service(pbi.factories.hpmFactory, pbi.factories.wpmpFactory, pbi.factories.routerFactory);
      service.embed(document.body, embedConfig);

      return new Promise<string>((resolve) => {
        document.body.addEventListener('rendered', () => resolve('passed'), { once: true });
        document.body.addEventListener('error', () => resolve('failed'), { once: true });
      });
    }, reportConfig);

    expect(testResult).toBe('passed');
    await browser.close();
  });
});
