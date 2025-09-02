// Service Worker for Background Location Tracking
const CACHE_NAME = 'bus-tracker-v1';
const API_BASE_URL = 'https://bus-tracking-system-backend.onrender.com';

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/src/main.jsx'
      ]);
    })
  );
  self.skipWaiting();
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
  
  // Start aggressive location tracking every 5 seconds
  locationInterval = setInterval(() => {
    if (isTrackingActive && driverData) {
      getCurrentLocationAndSend();
    }
  }, 5000);
  
  // Send immediate location
  getCurrentLocationAndSend();
}

// Stop background location tracking
function stopBackgroundLocationTracking() {
  console.log('⏹️ Service Worker: Stopping background location tracking');
  
  isTrackingActive = false;
  if (locationInterval) {
    clearInterval(locationInterval);
    locationInterval = null;
  }
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
        accuracy: position.coords.accuracy,
        timestamp: new Date().toISOString(),
        source: 'service-worker-background',
        driverId: driverData?.driverId,
        busId: driverData?.busId,
        isRealLocation: true
      };
      
      console.log('📍 Service Worker: Got location:', locationData);
      
      // Send to backend API
      sendLocationToBackend(locationData);
      
      // Notify main thread if it's listening
      notifyMainThread('LOCATION_UPDATE', locationData);
    },
    (error) => {
      console.error('❌ Service Worker: Location error:', error);
      
      // Try to send last known location or fallback
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
      }
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000
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
    } else {
      console.error('❌ Service Worker: Backend error:', response.status);
    }
  } catch (error) {
    console.error('❌ Service Worker: Network error:', error);
    
    // Store in IndexedDB for later retry
    storeLocationForRetry(locationData);
  }
}

// Store location data for retry when network is available
function storeLocationForRetry(locationData) {
  // Simple localStorage fallback (IndexedDB would be better for production)
  try {
    const pendingLocations = JSON.parse(localStorage.getItem('pendingLocations') || '[]');
    pendingLocations.push(locationData);
    
    // Keep only last 50 locations
    if (pendingLocations.length > 50) {
      pendingLocations.splice(0, pendingLocations.length - 50);
    }
    
    localStorage.setItem('pendingLocations', JSON.stringify(pendingLocations));
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

// Background sync for retry failed requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'location-retry') {
    event.waitUntil(retryPendingLocations());
  }
});

// Retry pending location updates
async function retryPendingLocations() {
  try {
    const pendingLocations = JSON.parse(localStorage.getItem('pendingLocations') || '[]');
    
    for (const location of pendingLocations) {
      await sendLocationToBackend(location);
    }
    
    // Clear pending locations after successful retry
    localStorage.removeItem('pendingLocations');
    console.log('✅ Service Worker: Retried pending locations');
  } catch (error) {
    console.error('❌ Service Worker: Retry failed:', error);
  }
}

// Handle fetch events for caching (optional)
self.addEventListener('fetch', (event) => {
  // You can add caching logic here if needed
  event.respondWith(fetch(event.request));
});

console.log('🚀 Service Worker: Loaded and ready for background location tracking');
