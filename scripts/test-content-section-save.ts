/**
 * Test Content Section Save
 * Tests saving a pricing display section to diagnose the issue
 */

const EXHIBITION_ID = '44d3a98d-faff-4dcf-a255-436cefdd97ef';
const API_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

async function testContentSectionSave() {
  console.log('🧪 Testing Content Section Save\n');
  console.log('═'.repeat(60));

  try {
    // Test payload matching what the UI sends
    const payload = {
      sectionType: 'pricing_display',
      title: 'Test Pricing Display',
      content: 'Test content for pricing display section',
      images: [],
      active: true,
      metadata: {},
    };

    console.log('\n📤 Sending POST request...');
    console.log('URL:', `${API_URL}/api/admin/exhibitions/${EXHIBITION_ID}/content`);
    console.log('Payload:', JSON.stringify(payload, null, 2));

    const response = await fetch(
      `${API_URL}/api/admin/exhibitions/${EXHIBITION_ID}/content`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    console.log('\n📡 Response Status:', response.status, response.statusText);

    const data = await response.json();
    console.log('\n📦 Response Data:', JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('\n✅ SUCCESS: Content section saved successfully!');
      console.log('Section ID:', data.section?.id);
    } else {
      console.log('\n❌ FAILED: Content section save failed');
      console.log('Error:', data.error);
      console.log('Details:', data.details);
    }

  } catch (error: any) {
    console.error('\n💥 Exception:', error.message);
    console.error('Stack:', error.stack);
  }

  console.log('\n' + '═'.repeat(60));
}

testContentSectionSave()
  .then(() => {
    console.log('\n✅ Test complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
