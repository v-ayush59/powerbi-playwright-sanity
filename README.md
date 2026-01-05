# Power BI Visual Error Testing

Automated testing framework for Power BI reports using Microsoft Playwright. This project provides a robust framework to automate visual testing, ensuring that Power BI reports render correctly without broken visuals that could impact user experience.

## Table of Contents

- [Power BI Visual Error Testing](#power-bi-visual-error-testing)
  - [Table of Contents](#table-of-contents)
  - [Prerequisites](#prerequisites)
  - [Project Structure](#project-structure)
  - [Setup](#setup)
  - [Running Tests](#running-tests)
  - [Teams Notifications](#teams-notifications)
  - [Reading the Results](#reading-the-results)
  - [Broken Visuals Detected](#broken-visuals-detected)
  - [Limitations](#limitations)

## Prerequisites

Before setting up the project, ensure that the following prerequisites are met:

1. **Install Node.js**  
   Install Node.js and npm from [nodejs.org](https://nodejs.org/). Required to run Playwright and other JavaScript-based tools.

2. **Power BI Licensing**  
   Ensure your Power BI workspace is within at least a Premium Per User Capacity. This is necessary for programmatic access and automation capabilities.

3. **Azure Authentication (Federated Credentials)**  
   This project uses **Azure Default Credential** which supports:
   - **Managed Identity** (recommended for Azure-hosted environments)
   - **Workload Identity Federation** (for Azure DevOps pipelines)
   - **Azure CLI authentication** (for local development)
   
   **Setup steps:**
   - Register an application in Azure portal (Azure AD)
   - Grant the following API permissions with admin consent:
     - `App.Read.All`
     - `Dataset.Read.All`
     - `Report.Read.All`
     - `Workspace.Read.All`
   - Configure **Federated Credentials** for your identity provider
   - Note the **Client ID**, **Tenant ID**, and **Federated Credential Name**

4. **Workspace Permissions**  
   Ensure the managed identity or service principal has **Member** or **Admin** rights to the Power BI workspaces you want to test.

## Project Structure

```
pbi-dataops-visual-error-testing/
├── .env                          # Environment variables (credentials)
├── global-setup.ts               # Test initialization and authentication
├── playwright.config.ts          # Playwright configuration
├── package.json                  # Project dependencies
├── helper-functions/             # Utility functions
│   ├── token-helpers.ts          # Authentication and token management
│   ├── file-reader.ts            # CSV/JSON file reading
│   ├── logging.ts                # Logging utilities
│   └── teams-notifier.ts         # Teams notification sender
├── test-cases/                   # Test data files
│   ├── powerbi-reports.csv       # Standard report test cases
│   └── paginated-reports.json    # Paginated report test cases
├── tests/                        # Test specification files
│   ├── pbi.spec.ts               # Tests for standard Power BI reports
│   └── paginated.spec.ts         # Tests for paginated reports
└── send-teams-notification.ps1   # PowerShell script for Teams notifications
```

## Setup
   - `CLIENT_ID=""`  
     Set this to the Client ID from your Azure AD application.
   - `TENANT_ID=""`  
     Set this to the Tenant ID from your Azure AD.
   - `FEDERATED_CREDENTIAL_NAME=""`  
     Set this to the federated credential name configured in Azure AD (e.g., "DevDatabricks").
   - `ENVIRONMENT=""`  
     Set to `dev`, `test`, or `prod`.

   **Note:** This project uses **federated credentials** (workload identity) instead of client secrets for enhanced security. No secrets are stored in the `.env` file.

### 1. Configure Environment Variables

Create or update the `.env` file in the project root with the following variables:

```env
CLIENT_ID=your-azure-app-client-id
TENANT_ID=your-azure-tenant-id
FEDERATED_CREDENTIAL_NAME=your-federated-credential-name
ENVIRONMENT=dev
TEAMS_WEBHOOK_URL=your-teams-webhook-url
```

**Variable Descriptions:**
- `CLIENT_ID` - Client ID from your Azure AD application
- `TENANT_ID` - Tenant ID from your Azure AD
- `FEDERATED_CREDENTIAL_NAME` - Federated credential name configured in Azure AD (e.g., "DevDatabricks")
- `ENVIRONMENT` - Set to `dev`, `test`, or `prod`
- `TEAMS_WEBHOOK_URL` - (Optional) Microsoft Teams webhook URL for test notifications

**Note:** This project uses **federated credentials** (workload identity) instead of client secrets for enhanced security.

### 2. Add Test Cases

#### Standard Power BI Reports

Edit `test-cases/powerbi-reports.csv` and add your reports:

```csv
workspace_id,report_id,test_all_pages,page_id,report_name,test_case,bookmark_id,dataset_ids
70dc31be-6f12-4d8a-9c0d-c043f2268661,4934379d-ae24-4957-b760-b5337a45e9d5,true,,,test_case_1,,
```

**Columns:**
- `workspace_id` - Power BI workspace GUID
- `report_id` - Power BI report GUID
- `test_all_pages` - Set to `true` to test all pages, `false` for specific page
- `page_id` - (Optional) Specific page name to test
- `report_name` - (Optional) Report name for identification
- `test_case` - Test case identifier
- `bookmark_id` - (Optional) Bookmark to apply
- `dataset_ids` - (Optional) Dataset IDs

**How to get IDs:**
- Open your report in Power BI Service
- Check the URL: `https://app.powerbi.com/groups/{workspace_id}/reports/{report_id}/...`

#### Paginated Reports

Edit `test-cases/paginated-reports.json` for paginated reports:

```json
[
  {
    "test_case": "MyPaginatedReport",
    "workspace_id": "workspace-guid",
    "report_id": "report-guid",
    "report_name": "My Report Name",
    "dataset_ids": [{"id": "dataset-guid"}],
    "report_parameters": [
      {"name": "StartDate", "value": "2024-01-01"},
      {"name": "EndDate", "value": "2024-12-31"}
    ]
  }
]
```

**For multi-value parameters**, repeat the parameter name:
```json
"report_parameters": [
  {"name": "Region", "value": "West"},
  {"name": "Region", "value": "East"}
]
```

## Running Tests

### Install Dependencies

```bash
npm install
```

### Install Playwright Browsers

```bash
npx playwright install chromium
```

### Run Tests

```bash
npx playwright test
```

### Run Tests with UI (headed mode)

```bash
npx playwright test --headed
```

### View Test Report

```bash
npx playwright show-report
```

The tests will:
- Authenticate with Power BI using your Azure credentials
- Generate embed tokens for each report
- Render reports in a browser and verify no broken visuals
- Generate detailed HTML test reports with traces and screenshots

## Teams Notifications

Send test results to Microsoft Teams automatically after test execution.

### Setup Teams Webhook

1. In Microsoft Teams, go to your channel
2. Click "..." → "Connectors" → "Incoming Webhook"
3. Create a webhook and copy the URL
4. Add the URL to your `.env` file as `TEAMS_WEBHOOK_URL`

### Send Notifications

**Run tests and send notification:**
```bash
npm run test:notify
```

**Send notification manually (after tests):**
```bash
npm run notify
```

**Or use PowerShell directly:**
```powershell
.\send-teams-notification.ps1
```

The notification includes:
- Overall test status (passed/failed)
- Test summary with counts
- Details of failed tests with links to reports
- Timestamp of test execution

## Reading the Results

After tests complete, view the results in the generated HTML report:

1. Open the `playwright-report` folder (automatically created after test execution)
2. Double-click `index.html` to open in your browser
3. Review test results, screenshots, and traces for failed tests

The report includes:
- Test execution summary
- Individual test results
- Screenshots of failures
- Detailed traces for debugging

## Broken Visuals Detected

This testing tool will look for various issues in Power BI visuals as described in the official documentation on troubleshooting tile errors. The types of errors detected include:

1. Power BI encountered an unexpected error while loading the model.

2. Couldn't retrieve the data model.

3. You don't have permission to view this tile or open the workbook.

4. Power BI visuals have been disabled by your administrator.

5. Data shapes must contain at least one group or calculation that outputs data. 

6. Can't display the data because Power BI can't determine the relationship between two or more fields.

7. The groups in the primary axis and the secondary axis overlap. Groups in the primary axis can't have the same keys as groups in the secondary axis.

8. This visual has exceeded the available resources. 

9. We are not able to identify the following fields: {0}.

10. Couldn't retrieve the data for this visual. 

## Limitations

1. Testing reports that use [composite models](https://learn.microsoft.com/en-us/power-bi/transform-model/desktop-composite-models) does not work due to a limitation with Microsoft's [PowerBI-JavaScript](https://github.com/microsoft/PowerBI-JavaScript) library.  Trying to test reports that use composite models will always indicate a broken visual with this tool.