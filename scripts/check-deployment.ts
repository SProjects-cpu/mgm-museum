/**
 * Check Deployment Status
 * Verifies if the latest changes are deployed
 */

const API_URL = 'https://mgm-museum.vercel.app';

async function checkDeployment() {
  console.log('🔍 Checking Deployment Status\n');
  console.log('═'.repeat(60));
  console.log(`URL: ${API_URL}`);
  console.log(`Checking for: Schedule tab removal, Users section removal`);
  console.log('═'.repeat(60));

  try {
    // Check if the page loads
    console.log('\n📥 Fetching admin page...');
    const response = await fetch(`${API_URL}/admin`);
    console.log(`Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const html = await response.text();
      
      // Check for Users section (should NOT be present)
      const hasUsersSection = html.includes('/admin/users') || html.includes('Users</span>');
      
      // Check for Schedule tab (should NOT be present)
      const hasScheduleTab = html.includes('Schedule</button>') || html.includes('value="schedule"');
      
      console.log('\n📊 Deployment Check Results:');
      console.log(`Users section found: ${hasUsersSection ? '❌ YES (should be removed)' : '✅ NO (correct)'}`);
      console.log(`Schedule tab found: ${hasScheduleTab ? '❌ YES (should be removed)' : '✅ NO (correct)'}`);
      
      if (!hasUsersSection && !hasScheduleTab) {
        console.log('\n✅ DEPLOYMENT SUCCESSFUL!');
        console.log('All changes have been deployed correctly.');
      } else {
        console.log('\n⚠️ DEPLOYMENT PENDING');
        console.log('Changes are in GitHub but not yet deployed to Vercel.');
        console.log('Wait 2-3 more minutes and try again.');
      }
    } else {
      console.log('\n❌ Could not fetch page');
    }

  } catch (error) {
    console.error('\n💥 Error:', error);
  }

  console.log('\n' + '═'.repeat(60));
  console.log('\n📝 If deployment is successful but you still see old version:');
  console.log('1. Clear browser cache (Ctrl+Shift+Delete)');
  console.log('2. Hard refresh 3-5 times (Ctrl+Shift+R)');
  console.log('3. Try incognito/private mode');
  console.log('4. Close and reopen browser');
}

checkDeployment()
  .then(() => {
    console.log('\n✅ Check complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Check failed:', error);
    process.exit(1);
  });
