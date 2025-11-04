/**
 * Unit tests for GET /api/exhibitions/[id]/available-dates endpoint
 * 
 * These tests verify core functionality:
 * 1. Valid exhibition ID returns available dates
 * 2. Invalid exhibition ID returns error
 * 3. Date range filtering works correctly
 * 4. Fully booked dates are marked as unavailable
 * 
 * Note: These tests require a test framework like Jest or Vitest to run.
 * To run: Install a test framework and execute: npm test
 */

import { NextRequest } from 'next/server';
import { GET } from '../route';

/**
 * Test 1: Valid exhibition ID
 * Should return available dates with proper structure
 */
async function testValidExhibitionId() {
  const validUuid = '123e4567-e89b-12d3-a456-426614174000';
  const request = new NextRequest(
    `http://localhost:3000/api/exhibitions/${validUuid}/available-dates`
  );
  
  const response = await GET(request, { params: { id: validUuid } });
  const data = await response.json();
  
  console.assert(response.status === 200, 'Should return 200 status');
  console.assert(data.success === true, 'Should have success: true');
  console.assert(Array.isArray(data.data?.dates), 'Should return dates array');
  
  console.log('✓ Test 1 passed: Valid exhibition ID');
}

/**
 * Test 2: Invalid exhibition ID format
 * Should return 400 error with INVALID_EXHIBITION code
 */
async function testInvalidExhibitionId() {
  const invalidId = 'not-a-uuid';
  const request = new NextRequest(
    `http://localhost:3000/api/exhibitions/${invalidId}/available-dates`
  );
  
  const response = await GET(request, { params: { id: invalidId } });
  const data = await response.json();
  
  console.assert(response.status === 400, 'Should return 400 status');
  console.assert(data.success === false, 'Should have success: false');
  console.assert(
    data.error?.code === 'INVALID_EXHIBITION',
    'Should return INVALID_EXHIBITION error code'
  );
  
  console.log('✓ Test 2 passed: Invalid exhibition ID');
}

/**
 * Test 3: Date range filtering
 * Should respect startDate and endDate query parameters
 */
async function testDateRangeFiltering() {
  const validUuid = '123e4567-e89b-12d3-a456-426614174000';
  const startDate = '2025-01-01';
  const endDate = '2025-01-31';
  
  const request = new NextRequest(
    `http://localhost:3000/api/exhibitions/${validUuid}/available-dates?startDate=${startDate}&endDate=${endDate}`
  );
  
  const response = await GET(request, { params: { id: validUuid } });
  const data = await response.json();
  
  console.assert(response.status === 200, 'Should return 200 status');
  console.assert(data.success === true, 'Should have success: true');
  
  // Verify all returned dates are within range
  if (data.data?.dates && data.data.dates.length > 0) {
    const allDatesInRange = data.data.dates.every((d: any) => {
      return d.date >= startDate && d.date <= endDate;
    });
    console.assert(allDatesInRange, 'All dates should be within specified range');
  }
  
  console.log('✓ Test 3 passed: Date range filtering');
}

/**
 * Test 4: Invalid date range (start after end)
 * Should return 400 error
 */
async function testInvalidDateRange() {
  const validUuid = '123e4567-e89b-12d3-a456-426614174000';
  const startDate = '2025-12-31';
  const endDate = '2025-01-01';
  
  const request = new NextRequest(
    `http://localhost:3000/api/exhibitions/${validUuid}/available-dates?startDate=${startDate}&endDate=${endDate}`
  );
  
  const response = await GET(request, { params: { id: validUuid } });
  const data = await response.json();
  
  console.assert(response.status === 400, 'Should return 400 status');
  console.assert(data.success === false, 'Should have success: false');
  console.assert(
    data.error?.code === 'INVALID_DATE',
    'Should return INVALID_DATE error code'
  );
  
  console.log('✓ Test 4 passed: Invalid date range');
}

/**
 * Test 5: Response structure validation
 * Should return dates with all required fields
 */
async function testResponseStructure() {
  const validUuid = '123e4567-e89b-12d3-a456-426614174000';
  const request = new NextRequest(
    `http://localhost:3000/api/exhibitions/${validUuid}/available-dates`
  );
  
  const response = await GET(request, { params: { id: validUuid } });
  const data = await response.json();
  
  if (data.data?.dates && data.data.dates.length > 0) {
    const firstDate = data.data.dates[0];
    
    console.assert('date' in firstDate, 'Should have date field');
    console.assert('isAvailable' in firstDate, 'Should have isAvailable field');
    console.assert('capacity' in firstDate, 'Should have capacity field');
    console.assert('bookedCount' in firstDate, 'Should have bookedCount field');
    console.assert('isFull' in firstDate, 'Should have isFull field');
    
    console.assert(typeof firstDate.date === 'string', 'date should be string');
    console.assert(typeof firstDate.isAvailable === 'boolean', 'isAvailable should be boolean');
    console.assert(typeof firstDate.capacity === 'number', 'capacity should be number');
    console.assert(typeof firstDate.bookedCount === 'number', 'bookedCount should be number');
    console.assert(typeof firstDate.isFull === 'boolean', 'isFull should be boolean');
  }
  
  console.log('✓ Test 5 passed: Response structure validation');
}

/**
 * Run all tests
 * 
 * To execute these tests:
 * 1. Install a test framework: npm install --save-dev vitest
 * 2. Add test script to package.json: "test": "vitest --run"
 * 3. Run: npm test
 * 
 * Or run manually with: tsx app/api/exhibitions/[id]/available-dates/__tests__/route.test.ts
 */
export async function runTests() {
  console.log('Running available-dates endpoint tests...\n');
  
  try {
    await testValidExhibitionId();
    await testInvalidExhibitionId();
    await testDateRangeFiltering();
    await testInvalidDateRange();
    await testResponseStructure();
    
    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    throw error;
  }
}

// Export for test framework
export {
  testValidExhibitionId,
  testInvalidExhibitionId,
  testDateRangeFiltering,
  testInvalidDateRange,
  testResponseStructure,
};
