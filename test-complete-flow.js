// Test the complete flow: send GPS data and verify route progress calculation
async function testCompleteFlow() {
  try {
    console.log('🧪 Testing complete GPS to route progress flow...');
    
    const busId = '66d0123456a1b2c3d4e5f601';
    
    // First, seed the routes
    console.log('🌱 Step 1: Seeding route data...');
    const seedResponse = await fetch('https://college-bus-system-main.onrender.com/api/seed-routes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (seedResponse.ok) {
      const seedData = await seedResponse.json();
      console.log('✅ Routes seeded:', seedData.message);
    } else {
      console.log('⚠️ Seed endpoint not available, continuing with existing data...');
    }
    
    // Step 2: Send GPS location data for the bus
    console.log('\n📍 Step 2: Sending GPS location data...');
    
    // Simulate GPS data at the first stop (MIET Campus)
    const gpsData = {
      lat: 28.9730,
      lng: 77.6410,
      timestamp: new Date().toISOString(),
      driverName: "Rajesh Kumar",
      speed: 0,
      accuracy: 10,
      source: "driver_gps"
    };
    
    const locationResponse = await fetch(`https://college-bus-system-main.onrender.com/api/location/update-location/${busId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(gpsData)
    });
    
    const locationResult = await locationResponse.json();
    console.log('📡 Location update response:', JSON.stringify(locationResult, null, 2));
    
    // Step 3: Retrieve the location with calculated route progress
    console.log('\n🛤️ Step 3: Retrieving calculated route progress...');
    
    const progressResponse = await fetch(`https://college-bus-system-main.onrender.com/api/location/current-location/${busId}?t=${Date.now()}`);
    const progressData = await progressResponse.json();
    
    console.log('🎯 Route progress result:', JSON.stringify(progressData, null, 2));
    
    // Test different GPS positions along the route
    console.log('\n🚌 Step 4: Testing progress calculation at different stops...');
    
    const testPositions = [
      { name: 'Near rohta bypass', lat: 28.9954, lng: 77.6456 },
      { name: 'Near Meerut Cantt', lat: 28.9938, lng: 77.6822 },
      { name: 'Near modipuram', lat: 29.0661, lng: 77.7104 }
    ];
    
    for (const pos of testPositions) {
      console.log(`\n🗺️ Testing at ${pos.name}...`);
      
      const testGPS = {
        ...gpsData,
        lat: pos.lat,
        lng: pos.lng,
        timestamp: new Date().toISOString()
      };
      
      await fetch(`https://college-bus-system-main.onrender.com/api/location/update-location/${busId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testGPS)
      });
      
      // Wait a moment then check progress
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const testResponse = await fetch(`https://college-bus-system-main.onrender.com/api/location/current-location/${busId}?t=${Date.now()}`);
      const testData = await testResponse.json();
      
      if (testData.success) {
        console.log(`   📊 Progress: ${testData.location.routeProgress}% | Current: ${testData.location.currentStop} | Next: ${testData.location.nextStop}`);
      } else {
        console.log(`   ❌ Error: ${testData.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error in complete flow test:', error.message);
  }
}

testCompleteFlow();
