/**
 * Test Content Section Save
 * Tests if pricing_display section can be saved
 */

const EXHIBITION_ID = 'your-exhibition-id-here'; // Replace with actual exhibition ID
const API_URL = 'http://localhost:3000'; // Change to production URL if testing prod

async function testContentSectionSave() {
  console.log('🧪 Testing Content Section Save\n');
  console.log('═'.repeat(60));

  const testData = {
    sectionType: 'pricing_display',
    title: 'Starting from',
    content: 'per person',
    images: [],
    active: true,
    metadata: { showPrice: true },
  };

  console.log('Test Data:');
  console.log(JSON.stringify(testData, null, 2));
  console.log('\n' + '─'.repeat(60));

  try {
    console.log('\n🚀 Sending POST request...');
    const response = await fetch(`${API_URL}/api/admin/exhibitions/${EXHIBITION_ID}/content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    console.log(`\nResponse Status: ${response.status} ${response.statusText}`);

    const data = await response.json();
    console.log('\nResponse Data:');
    console.log(JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('\n✅ SUCCESS! Content section saved successfully');
    } else {
      console.log('\n❌ FAILED! Content section save failed');
      console.log('Error:', data.error || 'Unknown error');
      if (data.details) {
        console.log('Details:', data.details);
      }
    }
  } catch (error) {
    console.error('\n💥 EXCEPTION:', error);
  }

  console.log('\n' + '═'.repeat(60));
}

// Instructions
console.log(`
📝 INSTRUCTIONS:
1. Replace EXHIBITION_ID with an actual exhibition ID from your database
2. Make sure you're logged in as admin
3. Run: npx tsx scripts/test-content-section-save.ts

Note: This script tests the API directly without authentication.
For full testing, use the admin panel in the browser.
`);

testContentSectionSave()
  .then(() => {
    console.log('Test complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });
