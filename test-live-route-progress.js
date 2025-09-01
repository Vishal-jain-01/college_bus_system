// Live test for route progress functionality
import fs from 'fs';

// Import the actual LocationService
import { LocationService } from './src/utils/locationService.js';

console.log("🚀 Live Route Progress Test");
console.log("===========================");

// Test the actual LocationService
console.log("\n📍 Testing Real LocationService:");

const testBusId = '66d0123456a1b2c3d4e5f601';
console.log("Bus ID:", testBusId);

// Test getCurrentLocation
const location = LocationService.getCurrentLocation(testBusId);
console.log("\nSimulated Location Data:");
console.log("  Lat/Lng:", location?.lat, location?.lng);
console.log("  Current Stop:", location?.currentStop);
console.log("  Next Stop:", location?.nextStop);
console.log("  Route Progress:", location?.routeProgress + "%");

// Test student data matching
const studentData = JSON.parse(fs.readFileSync('public/student.json', 'utf-8'));
const testStudent = studentData.find(s => s.bus.$oid === testBusId);

console.log("\n👤 Student Data:");
console.log("  Name:", testStudent.name);
console.log("  Route:", testStudent.bus.route);
console.log("  Stops:", testStudent.bus.stops);

// Test the route progress calculation logic (same as in StudentDashboard)
if (location && testStudent.bus.stops) {
  console.log("\n🛤️ Route Progress Calculation:");
  
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
    
    // Visual representation
    console.log("\n🚏 Visual Route Progress:");
    testStudent.bus.stops.forEach((stop, index) => {
      const isPassed = index < currentStopIndex;
      const isCurrent = index === currentStopIndex;
      const isNext = index === currentStopIndex + 1;
      
      let icon = "⚪"; // upcoming
      let status = "upcoming";
      
      if (isPassed) {
        icon = "🟢"; // passed
        status = "✅ completed";
      } else if (isCurrent) {
        icon = "🔵"; // current
        status = "📍 current location";
      } else if (isNext) {
        icon = "🟡"; // next
        status = "⏭️ next stop";
      }
      
      console.log(`    ${icon} ${index + 1}. ${stop} - ${status}`);
    });
    
    // Progress bar visualization
    const totalSegments = 20;
    const filledSegments = Math.floor((progressPercentage / 100) * totalSegments);
    const progressBar = "█".repeat(filledSegments) + "░".repeat(totalSegments - filledSegments);
    console.log(`\n📊 Progress Bar: [${progressBar}] ${progressPercentage}%`);
    
  } else {
    console.log("  ❌ Stop not found in route");
  }
}

// Test multiple times to see movement
console.log("\n⏰ Testing Movement (5 snapshots):");
for (let i = 0; i < 5; i++) {
  setTimeout(() => {
    const newLocation = LocationService.getCurrentLocation(testBusId);
    console.log(`  Snapshot ${i + 1}: ${newLocation?.currentStop} (${newLocation?.routeProgress}%)`);
  }, i * 2000); // Every 2 seconds
}

console.log("\n✅ Test Complete! Check above for route progress behavior.");
