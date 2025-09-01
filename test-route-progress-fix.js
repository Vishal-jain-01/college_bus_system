// Test route progress fix functionality
import fs from 'fs';

// Simulate the LocationService getCurrentLocation method
class TestLocationService {
  static busRoutes = {
    '66d0123456a1b2c3d4e5f601': [
      { lat: 29.0167, lng: 77.6833, name: 'MIET Campus' },
      { lat: 29.0456, lng: 77.7042, name: 'rohta bypass' },
      { lat: 28.9845, lng: 77.7036, name: 'Meerut Cantt' },
      { lat: 29.1234, lng: 77.7456, name: 'modipuram' }
    ]
  };

  static getCurrentLocation(busId) {
    const route = this.busRoutes[busId];
    if (!route) return null;

    // Simulate movement
    const currentTime = Date.now();
    const cycleLength = route.length * 10000; // 10 seconds per stop
    const cyclePosition = (currentTime % cycleLength) / cycleLength;
    const totalStops = route.length;
    
    const exactPosition = cyclePosition * totalStops;
    const currentStopIndex = Math.floor(exactPosition) % totalStops;
    const nextStopIndex = (currentStopIndex + 1) % totalStops;
    const progress = exactPosition - Math.floor(exactPosition);
    
    const currentStop = route[currentStopIndex];
    const nextStop = route[nextStopIndex];
    
    let currentStopName;
    if (progress < 0.1) {
      currentStopName = `At ${currentStop.name}`;
    } else if (progress > 0.9) {
      currentStopName = `Approaching ${nextStop.name}`;
    } else {
      currentStopName = `En route to ${nextStop.name}`;
    }

    return {
      lat: currentStop.lat,
      lng: currentStop.lng,
      currentStop: currentStopName,
      nextStop: nextStop.name,
      routeProgress: Math.round((currentStopIndex + progress) / totalStops * 100)
    };
  }
}

console.log("🧪 Testing Route Progress Fix");
console.log("==============================");

// Test student data
const studentData = JSON.parse(fs.readFileSync('public/student.json', 'utf-8'));
const testStudent = studentData.find(s => s.bus.$oid === '66d0123456a1b2c3d4e5f601');

console.log("\n📋 Student Info:");
console.log("  Name:", testStudent.name);
console.log("  Bus Route:", testStudent.bus.route);
console.log("  Stops:", testStudent.bus.stops);

// Test location service
console.log("\n📍 Location Service Test:");
const location = TestLocationService.getCurrentLocation('66d0123456a1b2c3d4e5f601');
console.log("  Current Location:", location);

// Test route progress calculation
console.log("\n🛤️ Route Progress Calculation Test:");
if (location && testStudent.bus.stops) {
  const cleanCurrentStop = location.currentStop
    .replace('At ', '')
    .replace('Near ', '')
    .replace('Approaching ', '')
    .replace('En route to ', '')
    .split(',')[0]
    .trim();
  
  console.log("  Raw current stop:", location.currentStop);
  console.log("  Cleaned stop name:", cleanCurrentStop);
  
  const currentStopIndex = testStudent.bus.stops.findIndex(stop => 
    stop.toLowerCase().includes(cleanCurrentStop.toLowerCase()) ||
    cleanCurrentStop.toLowerCase().includes(stop.toLowerCase())
  );
  
  console.log("  Found stop index:", currentStopIndex);
  
  if (currentStopIndex >= 0) {
    const progressPercentage = Math.round((currentStopIndex / (testStudent.bus.stops.length - 1)) * 100);
    console.log("  Progress percentage:", progressPercentage + "%");
    
    // Test stop states
    console.log("\n🚏 Stop States:");
    testStudent.bus.stops.forEach((stop, index) => {
      const isPassed = index < currentStopIndex;
      const isCurrent = index === currentStopIndex;
      const isNext = index === currentStopIndex + 1;
      
      let state = "upcoming";
      if (isPassed) state = "✅ passed";
      if (isCurrent) state = "🔵 current";
      if (isNext) state = "🔸 next";
      
      console.log(`    ${index + 1}. ${stop} - ${state}`);
    });
  } else {
    console.log("  ❌ Stop not found in route");
  }
}

console.log("\n✅ Test Complete!");