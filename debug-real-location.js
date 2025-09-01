// Debug script to test real location route calculation
import { LocationService } from './src/utils/locationService.js';

console.log("🔍 Debugging Real Location Route Calculation");
console.log("=============================================");

const busId = '66d0123456a1b2c3d4e5f601';
const route = LocationService.busRoutes[busId];

console.log("📍 Bus Route Coordinates:");
route.forEach((stop, index) => {
  console.log(`  ${index + 1}. ${stop.name}: ${stop.lat}, ${stop.lng}`);
});

// Test with a location that should be near rohta bypass
const testLocations = [
  { lat: 29.0456, lng: 77.7042, description: "Exact rohta bypass coordinates" },
  { lat: 29.045, lng: 77.704, description: "Very close to rohta bypass" },
  { lat: 29.042, lng: 77.705, description: "Nearby rohta area" },
  { lat: 29.0167, lng: 77.6833, description: "MIET Campus coordinates" }
];

console.log("\n🧪 Testing Location Detection:");
testLocations.forEach(testLoc => {
  console.log(`\n📍 Testing: ${testLoc.description} (${testLoc.lat}, ${testLoc.lng})`);
  
  // Calculate distances to all stops
  console.log("  Distances to stops:");
  let closestStop = null;
  let minDistance = Infinity;
  
  route.forEach((stop, index) => {
    const distance = LocationService.calculateDistance(testLoc.lat, testLoc.lng, stop.lat, stop.lng);
    console.log(`    ${stop.name}: ${distance.toFixed(3)} km`);
    
    if (distance < minDistance) {
      minDistance = distance;
      closestStop = { ...stop, index };
    }
  });
  
  console.log(`  ✅ Closest stop: ${closestStop.name} (${minDistance.toFixed(3)} km)`);
  
  // Test the actual methods
  const currentStop = LocationService.getCurrentStop(testLoc.lat, testLoc.lng, busId);
  const nextStop = LocationService.getNextStop(testLoc.lat, testLoc.lng, busId);
  const routeProgress = LocationService.getRouteProgress(testLoc.lat, testLoc.lng, busId);
  
  console.log(`  📊 Results:`);
  console.log(`    Current Stop: "${currentStop}"`);
  console.log(`    Next Stop: "${nextStop}"`);
  console.log(`    Route Progress: ${routeProgress.percentage}%`);
});

console.log("\n✅ Debug Complete!");
