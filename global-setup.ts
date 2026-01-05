import fs from "fs";
import path from "path";
import { FullConfig } from "@playwright/test";
import { getAccessToken, TestSettings } from "./helper-functions/token-helpers";

async function globalSetup(config: FullConfig) {
  // Ensure required environment variables
  if (!process.env.CLIENT_ID || !process.env.TENANT_ID || !process.env.FEDERATED_CREDENTIAL_NAME || !process.env.ENVIRONMENT) {
    throw new Error("Missing required environment variables.");
  }

  const settings: TestSettings = {
    clientId: process.env.CLIENT_ID!,
    tenantId: process.env.TENANT_ID!,
    federatedCredentialName: process.env.FEDERATED_CREDENTIAL_NAME!,
    environment: process.env.ENVIRONMENT!,
  };

  // Fetch the token using federated credentials
  const token = await getAccessToken(settings);

  const tokenPath = path.join(__dirname, "pbi-token.json");
  fs.writeFileSync(tokenPath, JSON.stringify({ token }));
  console.log("Power BI token saved for tests.");
}

export default globalSetup;
