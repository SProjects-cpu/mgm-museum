/**
 * Test Pricing Manager API
 * Tests the exhibition pricing API endpoints
 */

const EXHIBITION_ID = '44d3a98d-faff-4dcf-a255-436cefdd97ef';
const API_URL = 'https://mgm-museum.vercel.app';

async function testPricingManager() {
  console.log('🧪 Testing Pricing Manager API\n');
  console.log('═'.repeat(60));
  console.log(`Exhibition ID: ${EXHIBITION_ID}`);
  console.log(`API URL: ${API_URL}`);

  try {
    // Test GET pricing
    console.log('\n📥 Testing GET pricing...');
    const getResponse = await fetch(`${API_URL}/api/admin/exhibitions/${EXHIBITION_ID}/pricing`);
    console.log(`GET Status: ${getResponse.status} ${getResponse.statusText}`);
    
    if (getResponse.ok) {
      const getData = await getResponse.json();
      console.log('Current pricing:', JSON.stringify(getData, null, 2));
    } else {
      const errorData = await getResponse.json().catch(() => ({}));
      console.log('GET Error:', errorData);
    }

    // Test POST new pricing (this will fail without auth, but we can see the structure)
    console.log('\n📤 Testing POST new pricing...');
    const testPricing = {
      ticketType: 'adult',
      price: 150,
      active: true
    };

    const postResponse = await fetch(`${API_URL}/api/admin/exhibitions/${EXHIBITION_ID}/pricing`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPricing),
    });

    console.log(`POST Status: ${postResponse.status} ${postResponse.statusText}`);
    
    const postData = await postResponse.json().catch(() => ({}));
    console.log('POST Response:', JSON.stringify(postData, null, 2));

  } catch (error) {
    console.error('\n💥 Network Error:', error);
  }

  console.log('\n' + '═'.repeat(60));
  console.log('\n📝 Next Steps:');
  console.log('1. Check if you are logged in as admin in the browser');
  console.log('2. Try adding a new ticket type in the admin panel');
  console.log('3. Check browser DevTools > Network tab for failed requests');
  console.log('4. Look for any JavaScript errors in the console');
}

testPricingManager()
  .then(() => {
    console.log('\n✅ Test complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });