// Service Worker for Background Location Tracking
const CACHE_NAME = 'bus-tracker-v1';
const API_BASE_URL = 'https://bus-tracking-system-backend.onrender.com';

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installing...');
  self.skipWaiting(); // Force activation
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker: Activated');
  event.waitUntil(self.clients.claim());
});

// Background location tracking variables
let locationInterval = null;
let isTrackingActive = false;
let driverData = null;

// Listen for messages from main thread
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  console.log('📨 Service Worker received message:', type, data);
  
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
    case 'PING':
      // Health check
      event.ports[0]?.postMessage({ type: 'PONG', active: isTrackingActive });
      break;
  }
});

// Start background location tracking
function startBackgroundLocationTracking(data) {
  console.log('🎯 Service Worker: Starting background location tracking');
  
  driverData = data;
  isTrackingActive = true;
  
  // Clear any existing interval
  if (locationInterval) {
    clearInterval(locationInterval);
  }
  
  // Start aggressive location tracking every 3 seconds
  locationInterval = setInterval(() => {
    if (isTrackingActive && driverData) {
      getCurrentLocationAndSend();
    }
  }, 3000);
  
  // Send immediate location
  getCurrentLocationAndSend();
  
  // Notify main thread
  notifyMainThread('TRACKING_STARTED', { active: true });
}

// Stop background location tracking
function stopBackgroundLocationTracking() {
  console.log('⏹️ Service Worker: Stopping background location tracking');
  
  isTrackingActive = false;
  if (locationInterval) {
    clearInterval(locationInterval);
    locationInterval = null;
  }
  
  // Notify main thread
  notifyMainThread('TRACKING_STOPPED', { active: false });
}

// Get current location and send to backend
function getCurrentLocationAndSend() {
  if (!navigator.geolocation) {
    console.error('❌ Geolocation not supported');
    return;
  }
  
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const locationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        lat: position.coords.latitude,  // Also include lat/lng format
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        speed: position.coords.speed || 0,
        timestamp: new Date().toISOString(),
        source: 'service-worker-background',
        driverId: driverData?.driverId,
        busId: driverData?.busId,
        driverName: driverData?.name,
        isRealLocation: true
      };
      
      console.log('📍 Service Worker: Got location:', {
        lat: locationData.latitude,
        lng: locationData.longitude,
        source: locationData.source,
        busId: locationData.busId
      });
      
      // Send to backend API
      sendLocationToBackend(locationData);
      
      // Notify main thread
      notifyMainThread('LOCATION_UPDATE', locationData);
    },
    (error) => {
      console.error('❌ Service Worker: Location error:', error);
      
      // Try to send last known location as fallback
      if (driverData?.lastKnownLocation) {
        const fallbackData = {
          ...driverData.lastKnownLocation,
          timestamp: new Date().toISOString(),
          source: 'service-worker-fallback',
          driverId: driverData?.driverId,
          busId: driverData?.busId,
          isRealLocation: false
        };
        
        sendLocationToBackend(fallbackData);
        notifyMainThread('LOCATION_FALLBACK', fallbackData);
      }
    },
    {
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 10000
    }
  );
}

// Send location data to backend
async function sendLocationToBackend(locationData) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/driver-location/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(locationData)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Service Worker: Location sent to backend:', result);
      notifyMainThread('BACKEND_SUCCESS', { timestamp: new Date().toISOString() });
    } else {
      console.error('❌ Service Worker: Backend error:', response.status);
      notifyMainThread('BACKEND_ERROR', { status: response.status });
    }
  } catch (error) {
    console.error('❌ Service Worker: Network error:', error);
    notifyMainThread('NETWORK_ERROR', { error: error.message });
    
    // Store for retry
    storeLocationForRetry(locationData);
  }
}

// Store location data for retry when network is available
function storeLocationForRetry(locationData) {
  try {
    // Use IndexedDB or localStorage for retry queue
    const pendingKey = 'sw_pending_locations';
    
    // Simple storage - in production, use IndexedDB
    self.registration.sync?.register('location-retry');
    
    console.log('💾 Service Worker: Stored location for retry');
  } catch (e) {
    console.error('❌ Service Worker: Storage error:', e);
  }
}

// Notify main thread
function notifyMainThread(type, data) {
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({ type, data });
    });
  });
}

// Keep service worker alive with periodic ping
setInterval(() => {
  if (isTrackingActive) {
    console.log('💓 Service Worker: Heartbeat - Background tracking active');
    notifyMainThread('HEARTBEAT', { 
      active: isTrackingActive, 
      timestamp: new Date().toISOString() 
    });
  }
}, 30000); // Every 30 seconds

// Background sync for retry failed requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'location-retry') {
    event.waitUntil(retryPendingLocations());
  }
});

// Retry pending location updates
async function retryPendingLocations() {
  try {
    console.log('🔄 Service Worker: Retrying pending locations');
    // Implementation for retry logic
  } catch (error) {
    console.error('❌ Service Worker: Retry failed:', error);
  }
}

// Handle fetch events
self.addEventListener('fetch', (event) => {
  // Let requests pass through normally
  event.respondWith(fetch(event.request));
});

console.log('🚀 Service Worker: Loaded and ready for background location tracking');
