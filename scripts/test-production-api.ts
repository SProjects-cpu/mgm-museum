/**
 * Test production API for available dates
 */

async function testProductionAPI() {
  const exhibitionId = 'acdc4a68-553e-42bf-9b1f-da0b170c03a1'; // Full Dome Digital Planetarium
  const url = `https://mgm-museum.vercel.app/api/exhibitions/${exhibitionId}/available-dates`;
  
  console.log('Testing production API...');
  console.log('URL:', url);
  console.log('');
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.success && data.data.dates) {
      console.log(`\nFound ${data.data.dates.length} available dates`);
      if (data.data.dates.length > 0) {
        console.log('First 5 dates:');
        data.data.dates.slice(0, 5).forEach((d: any) => {
          console.log(`  ${d.date}: ${d.isAvailable ? 'Available' : 'Not available'} (${d.capacity} capacity, ${d.bookedCount} booked)`);
        });
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testProductionAPI();
