// Use built-in fetch for Node.js 18+
async function testSeedEndpoint() {
  try {
    console.log('🌱 Testing seed endpoint on production...');
    
    const response = await fetch('https://college-bus-system-main.onrender.com/api/seed-routes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('✅ Seed response:', JSON.stringify(data, null, 2));
    
    // Now test if buses are populated
    console.log('\n🚌 Testing buses endpoint...');
    const busesResponse = await fetch('https://college-bus-system-main.onrender.com/api/buses');
    const busesData = await busesResponse.json();
    console.log('📍 Buses data:', JSON.stringify(busesData, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testSeedEndpoint();
