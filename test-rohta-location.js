// Test the route progress with simulated rohta bypass location
// You can paste this in the browser console to test

// Simulate being at rohta bypass
const simulateRohtaLocation = () => {
  const rohtaCoords = { lat: 29.045, lng: 77.704 };
  
  // Override the getUserCurrentLocation function temporarily
  window.originalGetUserLocation = window.getUserCurrentLocation;
  window.getUserCurrentLocation = () => Promise.resolve({
    lat: rohtaCoords.lat,
    lng: rohtaCoords.lng,
    accuracy: 10,
    timestamp: Date.now()
  });
  
  console.log('🧪 Simulating location at rohta bypass:', rohtaCoords);
  console.log('📱 Refresh the page to see the updated route progress!');
  console.log('Expected results:');
  console.log('  - Current Stop: "Near rohta bypass"');
  console.log('  - Progress: 33%');
  console.log('  - Next Stop: "Meerut Cantt"');
};

// Restore original location function
const restoreRealLocation = () => {
  if (window.originalGetUserLocation) {
    window.getUserCurrentLocation = window.originalGetUserLocation;
    console.log('🔄 Restored real GPS location - refresh to see your actual location');
  }
};

console.log('🎯 Route Progress Test Functions Available:');
console.log('1. simulateRohtaLocation() - Test with rohta bypass coordinates');
console.log('2. restoreRealLocation() - Go back to your real GPS');
console.log('');
console.log('Type: simulateRohtaLocation() and then refresh the page');
