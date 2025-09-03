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
    console.log('📍 Buses data count:', busesData.length);
    
    // Show just the IDs and numbers for reference
    busesData.forEach(bus => {
      console.log(`   ${bus.busNumber}: ${bus._id} (${bus.stops.length} stops)`);
    });
    
    // Test route progress with the new IDs
    console.log('\n🛤️ Testing route progress with actual bus ID...');
    const testBusId = busesData[0]._id; // Use the first bus ID
    const locationResponse = await fetch(`https://college-bus-system-main.onrender.com/api/location/current-location/${testBusId}`);
    const locationData = await locationResponse.json();
    console.log('📍 Location data for', testBusId, ':', JSON.stringify(locationData, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testSeedEndpoint();
