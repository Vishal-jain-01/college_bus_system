// Simple debug to test what's happening with route progress
const testCoordinates = {
  lat: 29.045,
  lng: 77.704
};

const route = [
  { lat: 29.0167, lng: 77.6833, name: 'MIET Campus' },
  { lat: 29.0456, lng: 77.7042, name: 'rohta bypass' },
  { lat: 28.9845, lng: 77.7036, name: 'Meerut Cantt' },
  { lat: 29.1234, lng: 77.7456, name: 'modipuram' }
];

const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const getCurrentStop = (lat, lng) => {
  let closestStop = route[0];
  let minDistance = calculateDistance(lat, lng, route[0].lat, route[0].lng);

  route.forEach(stop => {
    const distance = calculateDistance(lat, lng, stop.lat, stop.lng);
    if (distance < minDistance) {
      minDistance = distance;
      closestStop = stop;
    }
  });

  if (minDistance < 0.5) {
    return `At ${closestStop.name}`;
  } else {
    return `Near ${closestStop.name}`;
  }
};

const getRouteProgress = (lat, lng) => {
  let currentStopIndex = 0;
  let minDistance = calculateDistance(lat, lng, route[0].lat, route[0].lng);

  route.forEach((stop, index) => {
    const distance = calculateDistance(lat, lng, stop.lat, stop.lng);
    if (distance < minDistance) {
      minDistance = distance;
      currentStopIndex = index;
    }
  });

  return {
    completed: currentStopIndex,
    total: route.length,
    percentage: Math.round((currentStopIndex / (route.length - 1)) * 100)
  };
};

console.log('🧪 Testing rohta area location:');
console.log(`Coordinates: ${testCoordinates.lat}, ${testCoordinates.lng}`);

console.log('\n📍 Distance to each stop:');
route.forEach((stop, index) => {
  const distance = calculateDistance(testCoordinates.lat, testCoordinates.lng, stop.lat, stop.lng);
  console.log(`  ${index}: ${stop.name}: ${distance.toFixed(3)} km`);
});

const currentStop = getCurrentStop(testCoordinates.lat, testCoordinates.lng);
const routeProgress = getRouteProgress(testCoordinates.lat, testCoordinates.lng);

console.log('\n✅ Expected Results:');
console.log(`Current Stop: "${currentStop}"`);
console.log(`Route Progress: ${routeProgress.percentage}%`);
console.log(`Current Stop Index: ${routeProgress.completed}`);
console.log(`Total Stops: ${routeProgress.total}`);

// Test the string matching logic
const cleanCurrentStop = currentStop
  .replace('At ', '')
  .replace('Near ', '')
  .replace('Approaching ', '')
  .replace('En route to ', '')
  .split(',')[0]
  .trim();

console.log('\n🔍 String matching test:');
console.log(`Raw current stop: "${currentStop}"`);
console.log(`Clean current stop: "${cleanCurrentStop}"`);

const stops = ['MIET Campus', 'rohta bypass', 'Meerut Cantt', 'modipuram'];
const foundIndex = stops.findIndex(stop => 
  stop.toLowerCase().includes(cleanCurrentStop.toLowerCase()) ||
  cleanCurrentStop.toLowerCase().includes(stop.toLowerCase())
);

console.log(`Found index in stops array: ${foundIndex}`);
console.log(`String-based progress: ${foundIndex >= 0 ? Math.round((foundIndex / (stops.length - 1)) * 100) : 0}%`);
