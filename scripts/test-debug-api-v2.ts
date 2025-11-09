/**
 * Test debug API with cache busting
 */

async function testDebugAPI() {
  const exhibitionId = '26a52798-cf61-4740-9488-d4bcb37e33f7'; // Production Full Dome ID
  const url = `https://mgm-museum.vercel.app/api/debug/time-slots?exhibitionId=${exhibitionId}&t=${Date.now()}`;
  
  console.log('Testing debug API (production Full Dome ID)...');
  console.log('URL:', url);
  console.log('');
  
  try {
    const response = await fetch(url, { cache: 'no-store' });
    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:');
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

testDebugAPI();
