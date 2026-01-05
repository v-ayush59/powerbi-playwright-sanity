# GitHub Actions Setup Guide

This guide will help you set up automated daily testing that runs in the cloud at 8 PM IST, even when your laptop is off.

## Prerequisites
- A GitHub account
- Your code pushed to a GitHub repository (public or private)

## Step-by-Step Setup

### 1. Initialize Git Repository (if not already done)
```bash
git init
git add .
git commit -m "Initial commit"
```

### 2. Create GitHub Repository
1. Go to https://github.com/new
2. Create a new repository (can be private)
3. Don't initialize with README (since you already have files)

### 3. Push Code to GitHub
```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

### 4. Add Secrets to GitHub Repository
GitHub Actions needs your credentials to run tests. Add these as secrets:

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add each of these:

| Secret Name | Value | Where to Find |
|-------------|-------|---------------|
| `CLIENT_ID` | Your Azure App Client ID | Your .env file |
| `TENANT_ID` | Your Azure Tenant ID | Your .env file |
| `FEDERATED_CREDENTIAL_NAME` | Federated credential name | Your .env file |
| `ENVIRONMENT` | Environment name | Your .env file |
| `TEAMS_WEBHOOK_URL` | Your Teams webhook URL | Your .env file |

**To add a secret:**
- Click "New repository secret"
- Enter the name (e.g., `CLIENT_ID`)
- Paste the value from your .env file
- Click "Add secret"

### 5. Verify the Workflow
1. After pushing your code, go to your repository on GitHub
2. Click the **Actions** tab
3. You should see "Scheduled Power BI Tests" workflow
4. The workflow will automatically run daily at 8:00 PM IST (2:30 PM UTC)

### 6. Test It Now (Optional)
To test immediately without waiting for 8 PM:
1. Go to **Actions** tab
2. Click **Scheduled Power BI Tests**
3. Click **Run workflow** button
4. Click the green **Run workflow** button

## What Happens Automatically
✅ Tests run daily at 8:00 PM IST on GitHub's servers  
✅ Teams notification sent after tests complete  
✅ Test results saved for 30 days  
✅ Works even when your laptop is off  
✅ Free for public repos, included in private repo free tier  

## Monitoring & Troubleshooting

### View Test Results
1. Go to **Actions** tab on GitHub
2. Click on any workflow run
3. Download test results from artifacts section

### Check Logs
Click on any workflow run to see detailed logs of each step

### Manual Run
Use the **Run workflow** button in Actions tab to trigger tests manually anytime

### Modify Schedule
Edit `.github/workflows/scheduled-tests.yml` and change the cron expression:
```yaml
schedule:
  - cron: '30 14 * * *'  # Current: 8:00 PM IST
```

Use https://crontab.guru/ to generate different schedules.

## Benefits Over Task Scheduler
- ✅ Runs in the cloud (laptop can be off)
- ✅ Reliable infrastructure (GitHub's servers)
- ✅ Email notifications on failure (GitHub can email you)
- ✅ Complete logs and history
- ✅ No maintenance required
- ✅ Free for most use cases

## Cost
- **Public repositories**: Completely FREE
- **Private repositories**: 2,000 free minutes/month (enough for daily 5-min tests)

## Support
If workflow fails, check the Actions tab for detailed error logs.
