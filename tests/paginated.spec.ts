import { test, expect, chromium } from '@playwright/test';
import { getAccessToken, getPaginatedEmbedToken, TestSettings, getAPIEndpoints, PaginatedEmbedInfo } from '../helper-functions/token-helpers';
import { readJSONFilesFromFolder } from '../helper-functions/file-reader';
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

// Load test records
const testRecords = readJSONFilesFromFolder('./test-cases');
const endPoints = getAPIEndpoints(testSettings.environment);
const isVerboseLogging = true;

let testAccessToken = '';

test.beforeAll(async () => {
  testAccessToken = await getAccessToken(testSettings);
});

// ✅ Test access token
test('Check access token (Paginated Report)', async () => {
  logToConsole('Checking access token...', isVerboseLogging);
  expect(testAccessToken).not.toBeUndefined();
});

// ✅ Test embed token for paginated reports
testRecords.forEach((record) => {
  test(`Embed token for ${record.test_case} - '${record.report_name}'`, async () => {
    const tmpEmbedInfo: PaginatedEmbedInfo = {
      datasets: record.dataset_ids,
      reports: [{ id: record.report_id }],
    };
    const embedToken = await getPaginatedEmbedToken(tmpEmbedInfo, endPoints, testAccessToken);
    expect(embedToken).not.toBeUndefined();
  });
});
