/**
 * Test Pricing Section API
 * Simulates the exact request the browser makes
 */

const EXHIBITION_ID = '44d3a98d-faff-4dcf-a255-436cefdd97ef';
const API_URL = 'https://mgm-museum.vercel.app';

async function testPricingSectionAPI() {
  console.log('🧪 Testing Pricing Section API\n');
  console.log('═'.repeat(60));
  console.log(`Exhibition ID: ${EXHIBITION_ID}`);
  console.log(`API URL: ${API_URL}`);

  // Exact data structure from the form
  const testData = {
    sectionType: 'pricing_display',
    title: 'discount',
    content: '100',
    images: [],
    active: true,
    metadata: { showPrice: true },
  };

  console.log('\n📦 Request Payload:');
  console.log(JSON.stringify(testData, null, 2));
  console.log('\n' + '─'.repeat(60));

  try {
    console.log('\n🚀 Sending POST request...');
    const url = `${API_URL}/api/admin/exhibitions/${EXHIBITION_ID}/content`;
    console.log(`URL: ${url}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    console.log(`\n📡 Response Status: ${response.status} ${response.statusText}`);
    
    const responseText = await response.text();
    console.log('\n📄 Response Body:');
    console.log(responseText);

    try {
      const data = JSON.parse(responseText);
      console.log('\n📊 Parsed Response:');
      console.log(JSON.stringify(data, null, 2));

      if (response.status === 401) {
        console.log('\n⚠️ Authentication required');
        console.log('This is expected when testing without cookies');
      } else if (response.status === 400) {
        console.log('\n❌ Bad Request - Data validation failed');
        console.log('Error:', data.error);
        if (data.details) console.log('Details:', data.details);
      } else if (response.status === 500) {
        console.log('\n❌ Server Error');
        console.log('Error:', data.error);
        if (data.details) console.log('Details:', data.details);
      } else if (response.status === 200 || response.status === 201) {
        console.log('\n✅ Success!');
      }
    } catch (e) {
      console.log('Response is not valid JSON');
    }

  } catch (error) {
    console.error('\n💥 Network Error:', error);
  }

  console.log('\n' + '═'.repeat(60));
  console.log('\n📝 Troubleshooting Steps:');
  console.log('1. Check if you are logged in as admin in the browser');
  console.log('2. Open browser DevTools > Network tab');
  console.log('3. Try to save the pricing section');
  console.log('4. Look at the failed request and check:');
  console.log('   - Request payload');
  console.log('   - Response body');
  console.log('   - Response headers');
  console.log('5. Copy the exact error message from the response');
}

testPricingSectionAPI()
  .then(() => {
    console.log('\n✅ Test complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
