/**
 * End-to-End Test Execution Script
 * 
 * This script runs the automated E2E tests for PDF ticket generation
 * and generates a comprehensive test report.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

interface TestResult {
  scenario: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  duration: number;
  error?: string;
}

class E2ETestRunner {
  private results: TestResult[] = [];
  private startTime: number = 0;

  async run() {
    console.log('🚀 Starting End-to-End Tests for PDF Ticket Generation\n');
    console.log('=' .repeat(60));
    
    this.startTime = Date.now();

    try {
      // Check prerequisites
      await this.checkPrerequisites();

      // Run automated tests
      await this.runAutomatedTests();

      // Generate report
      await this.generateReport();

      // Display summary
      this.displaySummary();

    } catch (error) {
      console.error('\n❌ Test execution failed:', error);
      process.exit(1);
    }
  }

  private async checkPrerequisites() {
    console.log('\n📋 Checking Prerequisites...\n');

    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    ];

    const missing: string[] = [];

    requiredEnvVars.forEach((envVar) => {
      if (!process.env[envVar]) {
        missing.push(envVar);
        console.log(`   ❌ ${envVar} - Missing`);
      } else {
        console.log(`   ✅ ${envVar} - Set`);
      }
    });

    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    console.log('\n✅ All prerequisites met\n');
  }

  private async runAutomatedTests() {
    console.log('🧪 Running Automated Tests...\n');

    try {
      // Run vitest with the E2E test file
      const output = execSync(
        'npm run test -- __tests__/e2e/pdf-ticket-generation.e2e.test.ts',
        {
          encoding: 'utf-8',
          stdio: 'pipe',
        }
      );

      console.log(output);
      
      // Parse test results from output
      this.parseTestResults(output);

    } catch (error: any) {
      // Tests failed, but we still want to generate a report
      console.error('Some tests failed. Continuing to generate report...\n');
      if (error.stdout) {
        console.log(error.stdout);
        this.parseTestResults(error.stdout);
      }
    }
  }

  private parseTestResults(output: string) {
    // Simple parsing of vitest output
    // This is a basic implementation - you may need to adjust based on actual output format
    const lines = output.split('\n');
    
    lines.forEach((line) => {
      if (line.includes('✓') || line.includes('PASS')) {
        const match = line.match(/✓\s+(.+?)\s+\((\d+)ms\)/);
        if (match) {
          this.results.push({
            scenario: match[1].trim(),
            status: 'PASS',
            duration: parseInt(match[2]),
          });
        }
      } else if (line.includes('✗') || line.includes('FAIL')) {
        const match = line.match(/✗\s+(.+)/);
        if (match) {
          this.results.push({
            scenario: match[1].trim(),
            status: 'FAIL',
            duration: 0,
            error: 'Test failed - see details above',
          });
        }
      }
    });
  }

  private async generateReport() {
    console.log('\n📊 Generating Test Report...\n');

    const totalDuration = Date.now() - this.startTime;
    const passCount = this.results.filter((r) => r.status === 'PASS').length;
    const failCount = this.results.filter((r) => r.status === 'FAIL').length;
    const totalCount = this.results.length;

    const report = `
# PDF Ticket Generation - E2E Test Report

**Generated**: ${new Date().toISOString()}
**Duration**: ${(totalDuration / 1000).toFixed(2)}s
**Total Tests**: ${totalCount}
**Passed**: ${passCount}
**Failed**: ${failCount}
**Success Rate**: ${totalCount > 0 ? ((passCount / totalCount) * 100).toFixed(2) : 0}%

---

## Test Results

${this.results.map((result, index) => `
### ${index + 1}. ${result.scenario}

- **Status**: ${result.status === 'PASS' ? '✅ PASS' : '❌ FAIL'}
- **Duration**: ${result.duration}ms
${result.error ? `- **Error**: ${result.error}` : ''}
`).join('\n')}

---

## Summary

${passCount === totalCount 
  ? '✅ All tests passed! The PDF ticket generation feature is working as expected.' 
  : `⚠️ ${failCount} test(s) failed. Please review the failures above and fix the issues.`}

---

## Next Steps

${passCount === totalCount 
  ? `
1. ✅ Proceed with manual testing using the guide: \`__tests__/e2e/MANUAL_TESTING_GUIDE.md\`
2. ✅ Test on multiple browsers and devices
3. ✅ Verify QR code scanning functionality
4. ✅ Test PDF printing on physical printers
5. ✅ Complete the manual testing checklist
` 
  : `
1. ❌ Fix the failing tests
2. ❌ Re-run the automated tests
3. ❌ Once all tests pass, proceed with manual testing
`}

---

## Manual Testing

After all automated tests pass, complete the manual testing checklist:

- [ ] Complete booking flow from payment to PDF download
- [ ] Verify Razorpay Payment ID appears correctly in PDF
- [ ] Test QR code scanning with mobile device
- [ ] Test PDF printing on physical printer
- [ ] Test download on multiple browsers (Chrome, Firefox, Safari)
- [ ] Test mobile download on iOS and Android devices
- [ ] Verify multiple bookings generate separate PDFs correctly

See \`__tests__/e2e/MANUAL_TESTING_GUIDE.md\` for detailed instructions.

---

## Environment

- **Node Version**: ${process.version}
- **Platform**: ${process.platform}
- **Architecture**: ${process.arch}
- **Supabase URL**: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Not Set'}

---

## Additional Resources

- [Requirements Document](.kiro/specs/pdf-ticket-generation/requirements.md)
- [Design Document](.kiro/specs/pdf-ticket-generation/design.md)
- [Implementation Tasks](.kiro/specs/pdf-ticket-generation/tasks.md)
- [Manual Testing Guide](__tests__/e2e/MANUAL_TESTING_GUIDE.md)
`;

    const reportPath = path.join(process.cwd(), '__tests__', 'e2e', 'TEST_REPORT.md');
    fs.writeFileSync(reportPath, report);

    console.log(`✅ Test report generated: ${reportPath}\n`);
  }

  private displaySummary() {
    console.log('=' .repeat(60));
    console.log('\n📊 Test Execution Summary\n');

    const totalDuration = Date.now() - this.startTime;
    const passCount = this.results.filter((r) => r.status === 'PASS').length;
    const failCount = this.results.filter((r) => r.status === 'FAIL').length;
    const totalCount = this.results.length;

    console.log(`   Total Tests: ${totalCount}`);
    console.log(`   ✅ Passed: ${passCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    console.log(`   ⏱️  Duration: ${(totalDuration / 1000).toFixed(2)}s`);
    console.log(`   📈 Success Rate: ${totalCount > 0 ? ((passCount / totalCount) * 100).toFixed(2) : 0}%\n`);

    if (passCount === totalCount) {
      console.log('🎉 All automated tests passed!\n');
      console.log('📝 Next Steps:');
      console.log('   1. Review the test report: __tests__/e2e/TEST_REPORT.md');
      console.log('   2. Complete manual testing: __tests__/e2e/MANUAL_TESTING_GUIDE.md');
      console.log('   3. Test on multiple browsers and devices');
      console.log('   4. Verify QR code scanning functionality');
      console.log('   5. Test PDF printing\n');
    } else {
      console.log('⚠️  Some tests failed. Please review the failures and fix the issues.\n');
      console.log('📝 Next Steps:');
      console.log('   1. Review the test report: __tests__/e2e/TEST_REPORT.md');
      console.log('   2. Fix the failing tests');
      console.log('   3. Re-run the tests: npm run test:e2e\n');
    }

    console.log('=' .repeat(60));
  }
}

// Run the tests
const runner = new E2ETestRunner();
runner.run().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
