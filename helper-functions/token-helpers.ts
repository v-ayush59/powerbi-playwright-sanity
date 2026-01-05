import { DefaultAzureCredential, ClientSecretCredential, TokenCredential } from "@azure/identity";
import fetch from "node-fetch";

export interface TestSettings {
  clientId: string;
  tenantId: string;
  environment: string;
  federatedCredentialName?: string;
}

// Get Access Token using appropriate credential method
export async function getAccessToken(settings: TestSettings): Promise<string> {
  let credential: TokenCredential;
  
  // Check if running in CI/CD with client secret
  const clientSecret = process.env.AZURE_CLIENT_SECRET || process.env.CLIENT_SECRET;
  
  if (clientSecret) {
    // Use ClientSecretCredential for CI/CD environments
    console.log("Using ClientSecretCredential for authentication");
    credential = new ClientSecretCredential(
      settings.tenantId,
      settings.clientId,
      clientSecret
    );
  } else {
    // Use DefaultAzureCredential for local development
    console.log("Using DefaultAzureCredential for authentication");
    credential = new DefaultAzureCredential();
  }
  
  const scope = "https://analysis.windows.net/powerbi/api/.default";
  const accessToken = await credential.getToken(scope);

  if (!accessToken || !accessToken.token) {
    throw new Error("Failed to get access token.");
  }

  return accessToken.token;
}

// Get API endpoints based on environment
export function getAPIEndpoints(environment: string) {
  const endpoints: Record<string, any> = {
    dev: { apiPrefix: "https://api.powerbi.com" },
    prod: { apiPrefix: "https://api.powerbi.com" },
    test: { apiPrefix: "https://api.powerbi.com/test" },
  };

  if (!endpoints[environment]) {
    throw new Error(`Unknown environment: ${environment}`);
  }

  return endpoints[environment];
}

// Create embed info for a report
export function createReportEmbedInfo(record: any) {
  return {
    reportId: record.report_id,
    workspaceId: record.workspace_id,
    pageName: record.page_id,
    bookmark: record.bookmark_id,
  };
}

// Get embed token for a report
export async function getReportEmbedToken(embedInfo: any, endpoints: any, accessToken: string): Promise<string> {
  const url = `${endpoints.apiPrefix}/v1.0/myorg/groups/${embedInfo.workspaceId}/reports/${embedInfo.reportId}/GenerateToken`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      accessLevel: "View",
      identities: embedInfo.bookmark ? [{ username: "user", roles: [], datasets: [] }] : []
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to get embed token: ${response.statusText}`);
  }

  const data = await response.json();
  return data.token;
}

// For paginated reports
export interface PaginatedEmbedInfo {
  datasets: string[];
  reports: { id: string }[];
}

export async function getPaginatedEmbedToken(embedInfo: PaginatedEmbedInfo, endpoints: any, accessToken: string): Promise<string> {
  // For simplicity, assume we take the first report
  const reportId = embedInfo.reports[0].id;
  const url = `${endpoints.apiPrefix}/v1.0/myorg/reports/${reportId}/GenerateToken`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ datasets: embedInfo.datasets.map(d => ({ id: d })) })
  });

  if (!response.ok) {
    throw new Error(`Failed to get paginated embed token: ${response.statusText}`);
  }

  const data = await response.json();
  return data.token;
}
