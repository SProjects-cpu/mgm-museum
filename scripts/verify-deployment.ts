/**
 * Deployment Verification Script
 * Verifies that the deployed application is working correctly
 */

const DEPLOYMENT_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

interface VerificationResult {
  name: string;
  status: 'success' | 'error';
  message: string;
  responseTime?: number;
}

async function checkEndpoint(url: string, name: string): Promise<VerificationResult> {
  const startTime = Date.now();
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'MGM-Museum-Deployment-Verifier',
      },
    });
    
    const responseTime = Date.now() - startTime;
    
    if (response.ok) {
      return {
        name,
        status: 'success',
        message: `✓ ${name} is accessible (${response.status})`,
        responseTime,
      };
    } else {
      return {
        name,
        status: 'error',
        message: `✗ ${name} returned status ${response.status}`,
        responseTime,
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      name,
      status: 'error',
      message: `✗ ${name} failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      responseTime,
    };
  }
}

async function checkGraphQL(url: string): Promise<VerificationResult> {
  const startTime = Date.now();
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: '{ __schema { types { name } } }',
      }),
    });
    
    const responseTime = Date.now() - startTime;
    const data = await response.json();
    
    if (response.ok && data.data) {
      return {
        name: 'GraphQL API',
        status: 'success',
        message: '✓ GraphQL API is operational',
        responseTime,
      };
    } else {
      return {
        name: 'GraphQL API',
        status: 'error',
        message: `✗ GraphQL API returned unexpected response`,
        responseTime,
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      name: 'GraphQL API',
      status: 'error',
      message: `✗ GraphQL API failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      responseTime,
    };
  }
}

async function verifyDeployment() {
  console.log('🚀 MGM Museum Deployment Verification\n');
  console.log(`Target URL: ${DEPLOYMENT_URL}\n`);
  
  const checks: Promise<VerificationResult>[] = [
    checkEndpoint(DEPLOYMENT_URL, 'Homepage'),
    checkEndpoint(`${DEPLOYMENT_URL}/admin`, 'Admin Panel'),
    checkEndpoint(`${DEPLOYMENT_URL}/api/health`, 'Health Check API'),
    checkGraphQL(`${DEPLOYMENT_URL}/api/graphql`),
  ];
  
  const results = await Promise.all(checks);
  
  console.log('📊 Verification Results:\n');
  
  let successCount = 0;
  let errorCount = 0;
  
  results.forEach(result => {
    console.log(`${result.message} ${result.responseTime ? `(${result.responseTime}ms)` : ''}`);
    
    if (result.status === 'success') {
      successCount++;
    } else {
      errorCount++;
    }
  });
  
  console.log(`\n📈 Summary: ${successCount} passed, ${errorCount} failed\n`);
  
  if (errorCount > 0) {
    console.error('❌ Deployment verification failed!');
    process.exit(1);
  } else {
    console.log('✅ Deployment verification successful!');
    process.exit(0);
  }
}

// Run verification
verifyDeployment().catch(error => {
  console.error('❌ Verification script error:', error);
  process.exit(1);
});
