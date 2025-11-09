/**
 * Test debug API endpoint
 */

async function testDebugAPI() {
  const url = 'https://mgm-museum.vercel.app/api/debug/time-slots?exhibitionId=acdc4a68-553e-42bf-9b1f-da0b170c03a1';
  
  console.log('Testing debug API...');
  console.log('URL:', url);
  console.log('');
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:');
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

testDebugAPI();
