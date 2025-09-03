// Test the exact frontend request scenario
async function testFrontendScenario() {
  try {
    console.log('🎯 Testing exact frontend scenario...');
    
    // This is the exact request the frontend makes
    const frontendBusId = '66d0123456a1b2c3d4e5f601';
    const url = `https://college-bus-system-main.onrender.com/api/location/current-location/${frontendBusId}?t=${Date.now()}`;
    
    console.log('📡 Frontend request URL:', url);
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('📍 Frontend response:', JSON.stringify(data, null, 2));
    
    // Also test with one of the actual database IDs
    console.log('\n🔄 Testing with current database bus ID...');
    const dbBusId = '68b81fd043a49d87e2892690';
    const dbUrl = `https://college-bus-system-main.onrender.com/api/location/current-location/${dbBusId}`;
    
    const dbResponse = await fetch(dbUrl);
    const dbData = await dbResponse.json();
    
    console.log('📍 Database ID response:', JSON.stringify(dbData, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testFrontendScenario();
