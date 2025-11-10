/**
 * Network Diagnostic Script for Exhibition Pricing and Time-Slots APIs
 * 
 * This script tests the exhibition-specific endpoints to diagnose
 * why they're failing in production with "c.from is not a function" errors
 */

import { createClient } from '@supabase/supabase-js';

const PRODUCTION_URL = 'https://mgm-museum.vercel.app';
const LOCAL_URL = 'http://localhost:3000';

// Use production URL for testing
const BASE_URL = process.env.TEST_URL || PRODUCTION_URL;

interface DiagnosticResult {
  endpoint: string;
  method: string;
  status: number;
  success: boolean;
  data?: any;
  error?: string;
  responseTime: number;
}

const results: DiagnosticResult[] = [];

async function testEndpoint(
  endpoint: string,
  method: string = 'GET',
  body?: any
): Promise<DiagnosticResult> {
  const startTime = Date.now();
  
  try {
    console.log(`\n🔍 Testing ${method} ${endpoint}`);
    
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const responseTime = Date.now() - startTime;
    
    let data;
    try {
      data = await response.json();
    } catch (e) {
      data = await response.text();
    }

    const result: DiagnosticResult = {
      endpoint,
      method,
      status: response.status,
      success: response.ok,
      data,
      responseTime,
    };

    if (!response.ok) {
      result.error = data.error || data.message || 'Unknown error';
      console.log(`❌ FAILED (${response.status}): ${result.error}`);
    } else {
      console.log(`✅ SUCCESS (${response.status}) - ${responseTime}ms`);
    }

    return result;
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    console.log(`💥 ERROR: ${error.message}`);
    
    return {
      endpoint,
      method,
      status: 0,
      success: false,
      error: error.message,
      responseTime,
    };
  }
}

async function getExhibitionId(): Promise<string | null> {
  console.log('\n📋 Fetching exhibition list to get a valid ID...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/admin/exhibitions`);
    const data = await response.json();
    
    if (data.exhibitions && data.exhibitions.length > 0) {
      const exhibitionId = data.exhibitions[0].id;
      console.log(`✅ Found exhibition ID: ${exhibitionId}`);
      return exhibitionId;
    }
    
    console.log('❌ No exhibitions found');
    return null;
  } catch (error: any) {
    console.log(`❌ Failed to fetch exhibitions: ${error.message}`);
    return null;
  }
}

async function runDiagnostics() {
  console.log('🏥 Exhibition API Network Diagnostics');
  console.log('=====================================');
  console.log(`Testing against: ${BASE_URL}`);
  console.log(`Timestamp: ${new Date().toISOString()}\n`);

  // Step 1: Get a valid exhibition ID
  const exhibitionId = await getExhibitionId();
  
  if (!exhibitionId) {
    console.log('\n❌ Cannot proceed without a valid exhibition ID');
    console.log('Please ensure exhibitions exist in the database');
    return;
  }

  console.log('\n🧪 Testing Exhibition-Specific Endpoints');
  console.log('=========================================');

  // Test 1: Fetch pricing for exhibition
  results.push(
    await testEndpoint(`/api/admin/exhibitions/${exhibitionId}/pricing`, 'GET')
  );

  // Test 2: Fetch time-slots for exhibition
  results.push(
    await testEndpoint(`/api/admin/exhibitions/${exhibitionId}/time-slots`, 'GET')
  );

  // Test 3: Fetch single exhibition details
  results.push(
    await testEndpoint(`/api/admin/exhibitions/${exhibitionId}`, 'GET')
  );

  // Test 4: Create pricing (will fail if exists, but tests the endpoint)
  results.push(
    await testEndpoint(`/api/admin/exhibitions/${exhibitionId}/pricing`, 'POST', {
      ticketType: 'test_diagnostic',
      price: 10.00,
      active: true,
    })
  );

  // Test 5: Create time-slot (will fail if exists, but tests the endpoint)
  results.push(
    await testEndpoint(`/api/admin/exhibitions/${exhibitionId}/time-slots`, 'POST', {
      startTime: '10:00',
      endTime: '11:00',
      capacity: 50,
      active: true,
    })
  );

  // Generate Report
  console.log('\n\n📊 DIAGNOSTIC REPORT');
  console.log('====================\n');

  const successCount = results.filter(r => r.success).length;
  const failureCount = results.filter(r => !r.success).length;
  const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;

  console.log(`Total Tests: ${results.length}`);
  console.log(`✅ Passed: ${successCount}`);
  console.log(`❌ Failed: ${failureCount}`);
  console.log(`⏱️  Avg Response Time: ${avgResponseTime.toFixed(0)}ms\n`);

  console.log('Detailed Results:');
  console.log('-----------------');
  
  results.forEach((result, index) => {
    console.log(`\n${index + 1}. ${result.method} ${result.endpoint}`);
    console.log(`   Status: ${result.status} ${result.success ? '✅' : '❌'}`);
    console.log(`   Time: ${result.responseTime}ms`);
    
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    
    if (result.data && typeof result.data === 'object') {
      console.log(`   Response:`, JSON.stringify(result.data, null, 2).substring(0, 200));
    }
  });

  // Specific error analysis
  console.log('\n\n🔬 ERROR ANALYSIS');
  console.log('=================\n');

  const fromErrors = results.filter(r => 
    r.error && r.error.includes('from is not a function')
  );

  if (fromErrors.length > 0) {
    console.log('⚠️  CRITICAL: "from is not a function" errors detected!');
    console.log('This indicates Supabase client initialization issues.');
    console.log('\nAffected endpoints:');
    fromErrors.forEach(r => console.log(`  - ${r.method} ${r.endpoint}`));
    console.log('\n💡 Solution: Ensure verifyAdminAuth() is used instead of createClient()');
  } else {
    console.log('✅ No "from is not a function" errors detected');
  }

  const authErrors = results.filter(r => 
    r.status === 401 || r.status === 403
  );

  if (authErrors.length > 0) {
    console.log('\n⚠️  Authentication/Authorization errors detected:');
    authErrors.forEach(r => console.log(`  - ${r.method} ${r.endpoint} (${r.status})`));
    console.log('\n💡 This is expected when testing without admin credentials');
  }

  console.log('\n\n✅ Diagnostics Complete');
  console.log(`Report saved to: exhibition-api-diagnostics-${Date.now()}.json`);
  
  // Save results to file
  const fs = require('fs');
  fs.writeFileSync(
    `exhibition-api-diagnostics-${Date.now()}.json`,
    JSON.stringify({ timestamp: new Date().toISOString(), baseUrl: BASE_URL, results }, null, 2)
  );
}

// Run diagnostics
runDiagnostics().catch(console.error);
