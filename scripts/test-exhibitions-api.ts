/**
 * Test exhibitions debug API
 */

async function testExhibitionsAPI() {
  const url = 'https://mgm-museum.vercel.app/api/debug/exhibitions';
  
  console.log('Testing exhibitions API...');
  console.log('URL:', url);
  console.log('');
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('');
    console.log('Exhibitions:');
    data.exhibitions?.forEach((ex: any) => {
      console.log(`  ${ex.status === 'active' ? '✓' : '✗'} ${ex.name}`);
      console.log(`    ID: ${ex.id}`);
      console.log(`    Slug: ${ex.slug}`);
      console.log(`    Time slots: ${ex.timeSlotCount}`);
      console.log('');
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

testExhibitionsAPI();
