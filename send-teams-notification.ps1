# PowerShell script to send Teams notification
param(
    [string]$ResultsFile = "test-results\results.xml"
)

# Load environment variables
$envFile = ".env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]*?)\s*=\s*(.*?)\s*$') {
            $name = $matches[1]
            $value = $matches[2]
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
}

$webhookUrl = $env:TEAMS_WEBHOOK_URL

if (-not $webhookUrl) {
    Write-Host "⚠️  TEAMS_WEBHOOK_URL not set in .env file. Skipping Teams notification." -ForegroundColor Yellow
    exit 0
}

if (-not (Test-Path $ResultsFile)) {
    Write-Host "⚠️  No test results found at $ResultsFile" -ForegroundColor Yellow
    exit 0
}

# Parse XML results
[xml]$results = Get-Content $ResultsFile
$total = [int]$results.testsuites.tests
$failures = [int]$results.testsuites.failures
$passed = $total - $failures
$date = Get-Date -Format "MMM dd, yyyy h:mm tt"

# Load report links from CSV
$reportLinks = @{}
$csvPath = "test-cases\powerbi-reports.csv"
if (Test-Path $csvPath) {
    Import-Csv $csvPath | ForEach-Object {
        $workspaceId = $_.workspace_id
        $reportId = $_.report_id
        $reportName = $_.report_name
        $link = "https://app.powerbi.com/groups/$workspaceId/reports/$reportId"
        if (-not $reportLinks.ContainsKey($reportName)) {
            $reportLinks[$reportName] = $link
        }
    }
}

# Get individual test results - Only show Visual Rendering tests (one per report)
$reportStatus = @{}

$results.testsuites.testsuite | ForEach-Object {
    $_.testcase | ForEach-Object {
        $testName = $_.name
        $failed = if ($_.failure) { $true } else { $false }
        
        # Only process Visual test results (skip token generation and auth tests)
        if ($testName -match "Visual test for.*? - '([^']*)'") {
            $reportName = $matches[1]
            
            # Track if ANY visual test for this report failed
            if (-not $reportStatus.ContainsKey($reportName)) {
                $reportStatus[$reportName] = $false
            }
            if ($failed) {
                $reportStatus[$reportName] = $true
            }
        }
    }
}

# Convert to array with status
$testResults = $reportStatus.GetEnumerator() | ForEach-Object {
    $reportLink = if ($reportLinks.ContainsKey($_.Key)) { $reportLinks[$_.Key] } else { "N/A" }
    [PSCustomObject]@{
        Date = $date
        ReportName = $_.Key
        Status = if ($_.Value) { "❌ Failed" } else { "✅ Passed" }
        ReportLink = $reportLink
    }
}

# Create table rows
$tableRows = $testResults | ForEach-Object {
    "| $($_.Date) | $($_.ReportName) | $($_.Status) |"
}

# Create simple message
$statusEmoji = if ($failures -eq 0) { "✅" } else { "⚠️" }
$statusText = if ($failures -eq 0) { "All Tests Passed" } else { "$failures Test(s) Failed" }

$message = @"
**$statusEmoji Power BI Sanity Test Results - $statusText**

**Summary:**
- Total Tests: $total
- Passed: ✅ $passed
- Failed: ❌ $failures

**Test Results:**

| Date | Report Name | Status |
|------|-------------|--------|
$($tableRows -join "`n")
"@

# Create adaptive card with ColumnSet for table-like layout - entire row is clickable
$reportRows = $testResults | ForEach-Object {
    $statusText = if ($_.Status -like "*Failed*") { "FAILED" } else { "PASSED" }
    @{
        type = "ColumnSet"
        columns = @(
            @{
                type = "Column"
                width = "stretch"
                items = @(
                    @{
                        type = "TextBlock"
                        text = $_.ReportName
                        wrap = $true
                    }
                )
            }
            @{
                type = "Column"
                width = "auto"
                items = @(
                    @{
                        type = "TextBlock"
                        text = $statusText
                        wrap = $false
                        color = if ($_.Status -like "*Failed*") { "Attention" } else { "Good" }
                        weight = "Bolder"
                    }
                )
            }
            @{
                type = "Column"
                width = "auto"
                items = @(
                    @{
                        type = "TextBlock"
                        text = "Open"
                        wrap = $false
                        color = "Accent"
                    }
                )
            }
        )
        selectAction = @{
            type = "Action.OpenUrl"
            url = $_.ReportLink
        }
        separator = $true
    }
}

# Create status text without emojis
$statusEmoji = if ($failures -eq 0) { "SUCCESS" } else { "WARNING" }
$statusText = if ($failures -eq 0) { "All Tests Passed" } else { "$failures Test(s) Failed" }

$body = @{
    type = "message"
    attachments = @(
        @{
            contentType = "application/vnd.microsoft.card.adaptive"
            content = @{
                type = "AdaptiveCard"
                body = @(
                    @{
                        type = "TextBlock"
                        size = "Large"
                        weight = "Bolder"
                        text = "Power BI Sanity Test Results - $statusText"
                        color = if ($failures -eq 0) { "Good" } else { "Attention" }
                    }
                    @{
                        type = "FactSet"
                        facts = @(
                            @{ title = "Total Tests"; value = "$total" }
                            @{ title = "Passed"; value = "$passed" }
                            @{ title = "Failed"; value = "$failures" }
                            @{ title = "Date"; value = "$date" }
                        )
                    }
                    @{
                        type = "TextBlock"
                        text = "Report Status"
                        weight = "Bolder"
                        size = "Medium"
                        separator = $true
                    }
                    @{
                        type = "ColumnSet"
                        columns = @(
                            @{
                                type = "Column"
                                width = "stretch"
                                items = @(@{
                                    type = "TextBlock"
                                    text = "Report Name"
                                    weight = "Bolder"
                                })
                            }
                            @{
                                type = "Column"
                                width = "auto"
                                items = @(@{
                                    type = "TextBlock"
                                    text = "Status"
                                    weight = "Bolder"
                                })
                            }
                            @{
                                type = "Column"
                                width = "auto"
                                items = @(@{
                                    type = "TextBlock"
                                    text = "Link"
                                    weight = "Bolder"
                                })
                            }
                        )
                    }
                ) + $reportRows
                '$schema' = "http://adaptivecards.io/schemas/adaptive-card.json"
                version = "1.4"
            }
        }
    )
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri $webhookUrl -Method Post -Body $body -ContentType 'application/json; charset=utf-8' -TimeoutSec 10
    Write-Host "✅ Teams notification sent successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to send Teams notification: $($_.Exception.Message)" -ForegroundColor Red
}
