# Azure DevOps Setup Guide

This guide will help you set up automated daily testing using Azure DevOps Pipelines at 8 PM IST.

## Why Azure DevOps?
- ✅ Better integration with Azure/Microsoft environments
- ✅ Often easier permissions within organizations
- ✅ Built-in authentication with Azure services
- ✅ No need for federated credentials in many cases
- ✅ Free for small teams (1800 minutes/month)

## Setup Steps

### Step 1: Create Azure DevOps Project
1. Go to https://dev.azure.com/[YOUR_ORGANIZATION]
2. Click **+ New Project**
3. Name: `PowerBI-Testing` (or any name)
4. Visibility: Private
5. Click **Create**

### Step 2: Push Code to Azure Repos (or connect GitHub)

**Option A: Use Azure Repos**
```bash
git remote add azure https://[YOUR_ORG]@dev.azure.com/[YOUR_ORG]/PowerBI-Testing/_git/PowerBI-Testing
git push azure main
```

**Option B: Connect Existing GitHub Repo**
1. In Azure DevOps project → Pipelines → Create Pipeline
2. Select "GitHub"
3. Authorize Azure Pipelines
4. Select repository: `v-ayush59/powerbi-playwright-sanity`

### Step 3: Create Variable Group (Store Secrets)
1. In Azure DevOps → Pipelines → Library
2. Click **+ Variable group**
3. Name: `powerbi-test-secrets`
4. Add these variables (click "Make secret" 🔒 for each):
   - `CLIENT_ID` = [Your Azure App Client ID]
   - `TENANT_ID` = [Your Azure Tenant ID]
   - `FEDERATED_CREDENTIAL_NAME` = [Your credential name]
   - `ENVIRONMENT` = [Your environment: dev/prod]
   - `TEAMS_WEBHOOK_URL` = [Your Teams webhook URL]
5. Click **Save**

### Step 4: Create Pipeline
1. Go to Pipelines → Create Pipeline
2. Select where your code is (Azure Repos or GitHub)
3. Select your repository
4. Choose "Existing Azure Pipelines YAML file"
5. Select `/azure-pipelines.yml`
6. Click **Run**

### Step 5: Grant Permissions (If Needed)
If the pipeline fails with permission errors:
1. Go to Project Settings → Service connections
2. Ensure the pipeline has access to the Variable group
3. You may need to authorize the pipeline to use the variable group

### Step 6: Verify Schedule
1. Go to Pipelines → Your pipeline → Edit
2. Click the three dots (⋯) → Triggers
3. Verify the schedule: Daily at 2:30 PM UTC (8:00 PM IST)

## Authentication Options

### Option 1: Service Connection (Recommended)
If you have permissions, create an Azure Resource Manager service connection:
1. Project Settings → Service connections
2. New service connection → Azure Resource Manager
3. Choose authentication method (Managed Identity or Service Principal)

### Option 2: Environment Variables (Current Setup)
Uses the CLIENT_ID and TENANT_ID directly - Azure DevOps agents can often authenticate automatically within Azure environments.

### Option 3: Managed Identity
If running on Microsoft-hosted agents, they may have built-in Azure authentication.

## Benefits Over GitHub Actions
1. **Better Azure Integration**: Often works without additional federated credentials
2. **Easier Permissions**: May already have access through your organization
3. **Built-in Azure Auth**: Microsoft-hosted agents can authenticate to Azure automatically
4. **No Additional Setup**: May work with just environment variables

## Monitoring

### View Test Results
- Go to Pipelines → Select run → Tests tab
- View detailed test results with pass/fail status

### View Test Reports
- Click on a pipeline run
- Go to Artifacts
- Download `playwright-report` to view detailed HTML report

### View Logs
- Click on any pipeline run
- Expand each step to see detailed logs

## Troubleshooting

### Authentication Issues
If you get authentication errors:
1. Check variable group values are correct
2. Ask admin to create a Service Connection
3. Use Managed Identity if available

### Schedule Not Running
1. Ensure "always: true" is set in the schedule
2. Check that the main branch has recent commits
3. Verify the pipeline is enabled

## Cost
- **Free Tier**: 1800 minutes/month (parallel jobs: 1)
- **Your usage**: ~5 min/day × 30 days = 150 minutes/month
- **Conclusion**: Completely FREE within free tier

## Next Steps
Once set up, your tests will:
1. Run automatically at 8:00 PM IST daily
2. Send Teams notifications after completion
3. Generate test reports accessible in Azure DevOps
4. Work even when your laptop is off
