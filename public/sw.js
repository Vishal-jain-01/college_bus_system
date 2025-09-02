console.log('🔄 Service Worker installed');

// Suppress cache warnings
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Background location tracking variables
let locationInterval = null;
let isTrackingActive = false;
let driverData = null;
let lastLocation = null; // Store last known location

// Listen for messages from main thread
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  console.log('📨 Service Worker received message:', type);
  
  switch (type) {
    case 'START_LOCATION_TRACKING':
      startBackgroundLocationTracking(data);
      break;
    case 'STOP_LOCATION_TRACKING':
      stopBackgroundLocationTracking();
      break;
    case 'UPDATE_DRIVER_DATA':
      driverData = data;
      break;
    case 'POST_LOCATION':
      // Handle direct location posting from main thread
      if (data) {
        console.log('📤 Service Worker: Received location from main thread');
        lastLocation = data; // Store the fresh location
        sendLocationToBackend(data);
      }
      break;
  }
});

// Start background location tracking
function startBackgroundLocationTracking(data) {
  if (isTrackingActive) {
    console.log('⚠️ Background tracking already active');
    return;
  }
  
  console.log('🎯 Starting background location tracking');
  isTrackingActive = true;
  driverData = data;
  
  // Continue posting last known location when app is backgrounded
  locationInterval = setInterval(() => {
    if (lastLocation && driverData) {
      console.log('📍 Background: Posting last known location');
      sendLocationToBackend(lastLocation);
    }
  }, 15000); // Post every 15 seconds in background
}

// Stop background location tracking
function stopBackgroundLocationTracking() {
  console.log('⏹️ Stopping background location tracking');
  if (locationInterval) {
    clearInterval(locationInterval);
    locationInterval = null;
  }
  isTrackingActive = false;
  lastLocation = null;
}

// Send location to backend
async function sendLocationToBackend(locationData) {
  if (!driverData || !locationData) {
    console.log('❌ Missing driver data or location data');
    return;
  }
  
  try {
    const backendUrl = 'https://busmate-backend.onrender.com';
    
    const response = await fetch(`${backendUrl}/api/driver-location/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        driverId: driverData.id,
        driverName: driverData.name,
        busNumber: driverData.busNumber,
        location: {
          latitude: locationData.latitude,
          longitude: locationData.longitude
        },
        timestamp: new Date().toISOString()
      })
    });
    
    if (response.ok) {
      console.log('✅ Background location posted successfully');
    } else {
      console.log('❌ Failed to post background location:', response.status);
    }
  } catch (error) {
    console.log('❌ Error posting background location:', error);
  }
}
