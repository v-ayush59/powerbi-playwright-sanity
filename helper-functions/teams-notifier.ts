import fetch from 'node-fetch';
import * as fs from 'fs';
import * as path from 'path';

interface TestResult {
  reportName: string;
  status: 'Passed' | 'Failed';
  page?: string;
}

export async function sendTeamsNotification(webhookUrl: string) {
  // Read test results
  const resultsPath = path.join(process.cwd(), 'test-results', 'results.xml');
  
  if (!fs.existsSync(resultsPath)) {
    console.log('No test results found');
    return;
  }

  const resultsXml = fs.readFileSync(resultsPath, 'utf-8');
  
  // Parse results
  const testResults = parseTestResults(resultsXml);
  const totalTests = testResults.length;
  const passedTests = testResults.filter(r => r.status === 'Passed').length;
  const failedTests = totalTests - passedTests;
  
  // Determine overall status
  const overallStatus = failedTests === 0 ? '✅ All Tests Passed' : `⚠️ ${failedTests} Test(s) Failed`;
  const statusColor = failedTests === 0 ? '28a745' : 'dc3545';
  
  // Build table rows
  const tableRows = testResults.map(result => {
    const icon = result.status === 'Passed' ? '✅' : '❌';
    return `| ${icon} | ${result.reportName} | ${result.page || 'N/A'} | **${result.status}** |`;
  }).join('\n');

  // Create Teams message card
  const card = {
    "@type": "MessageCard",
    "@context": "https://schema.org/extensions",
    "summary": "Power BI Test Results",
    "themeColor": statusColor,
    "title": "🔍 Power BI Visual Testing Report",
    "sections": [
      {
        "activityTitle": overallStatus,
        "activitySubtitle": `Test Run: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })} IST`,
        "facts": [
          {
            "name": "Total Tests:",
            "value": totalTests.toString()
          },
          {
            "name": "Passed:",
            "value": `✅ ${passedTests}`
          },
          {
            "name": "Failed:",
            "value": `❌ ${failedTests}`
          }
        ]
      },
      {
        "text": `### Test Results\n\n| Status | Report Name | Page | Result |\n|:---:|:---|:---|:---:|\n${tableRows}`
      }
    ],
    "potentialAction": [
      {
        "@type": "OpenUri",
        "name": "View Full Report",
        "targets": [
          {
            "os": "default",
            "uri": "file:///" + path.join(process.cwd(), 'playwright-report', 'index.html').replace(/\\/g, '/')
          }
        ]
      }
    ]
  };

  // Send to Teams
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(card)
    });

    if (response.ok) {
      console.log('✅ Teams notification sent successfully');
    } else {
      console.error('❌ Failed to send Teams notification:', response.statusText);
    }
  } catch (error) {
    console.error('❌ Error sending Teams notification:', error);
  }
}

function parseTestResults(xmlContent: string): TestResult[] {
  const results: TestResult[] = [];
  
  // Simple XML parsing (you can use a proper XML parser if needed)
  const testcaseRegex = /<testcase[^>]*name="([^"]*)"[^>]*>/g;
  const failureRegex = /<failure/g;
  
  let match;
  const testcases: string[] = [];
  
  while ((match = testcaseRegex.exec(xmlContent)) !== null) {
    testcases.push(match[0] + '...');
  }
  
  // Reset regex
  testcaseRegex.lastIndex = 0;
  
  // Extract test info
  const testcaseFullRegex = /<testcase[^>]*name="([^"]*)"[^>]*>(.*?)<\/testcase>/gs;
  
  while ((match = testcaseFullRegex.exec(xmlContent)) !== null) {
    const testName = match[1];
    const testBody = match[2];
    const hasFailed = failureRegex.test(testBody);
    
    // Parse report name from test name
    let reportName = 'Unknown Report';
    let page = '';
    
    if (testName.includes('Visual test for')) {
      const parts = testName.split(' - ');
      if (parts.length > 1) {
        reportName = parts[1].replace(/'/g, '');
        const pageMatch = testName.match(/Visual test for (.+?) -/);
        if (pageMatch) {
          page = pageMatch[1];
        }
      }
    } else if (testName.includes('Test')) {
      reportName = testName.split(' - ')[0] || testName;
    }
    
    results.push({
      reportName,
      page,
      status: hasFailed ? 'Failed' : 'Passed'
    });
  }
  
  return results;
}
