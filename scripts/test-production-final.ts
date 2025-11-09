/**
 * Final test of production API
 */

async function testProduction() {
  const exhibitionId = '26a52798-cf61-4740-9488-d4bcb37e33f7'; // Production Full Dome ID
  const url = `https://mgm-museum.vercel.app/api/exhibitions/${exhibitionId}/available-dates?t=${Date.now()}`;
  
  console.log('Testing production available-dates API...');
  console.log('Exhibition: Full Dome Digital Planetarium');
  console.log('URL:', url);
  console.log('');
  
  try {
    const response = await fetch(url, { cache: 'no-store' });
    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('');
    
    if (data.success && data.data.dates) {
      console.log(`✅ Found ${data.data.dates.length} available dates`);
      console.log('');
      console.log('First 10 dates:');
      data.data.dates.slice(0, 10).forEach((d: any) => {
        console.log(`  ${d.date}: ${d.isAvailable ? '✓ Available' : '✗ Not available'} (${d.capacity} capacity, ${d.bookedCount} booked)`);
      });
    } else {
      console.log('❌ No dates returned or error');
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testProduction();
