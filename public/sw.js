// Service Worker for Background Location Tracking
const CACHE_NAME = 'bus-tracker-v1';
const API_BASE_URL = 'https://bus-tracking-system-backend.onrender.com';

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installing...');
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
let lastKnownLocation = null;

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
      if (data.lastKnownLocation) {
        lastKnownLocation = data.lastKnownLocation;
      }
      break;
    case 'MANUAL_LOCATION_UPDATE':
      // Receive location from main thread and send to backend
      if (data.location) {
        lastKnownLocation = data.location;
        sendLocationToBackend(data.location);
      }
      break;
  }
});

// Start background location tracking (using location from main thread)
function startBackgroundLocationTracking(data) {
  console.log('🎯 Service Worker: Starting background location tracking');
  
  driverData = data;
  isTrackingActive = true;
  
  if (data.lastKnownLocation) {
    lastKnownLocation = data.lastKnownLocation;
  }
  
  // Clear any existing interval
  if (locationInterval) {
    clearInterval(locationInterval);
  }
  
  // Send location updates every 8 seconds using last known location
  locationInterval = setInterval(() => {
    if (isTrackingActive && lastKnownLocation && driverData) {
      // Create updated location with current timestamp
      const updatedLocation = {
        ...lastKnownLocation,
        timestamp: new Date().toISOString(),
        source: 'service-worker-background',
        driverId: driverData?.driverId,
        busId: driverData?.busId,
        isRealLocation: false // Mark as background update
      };
      
      console.log('📍 Service Worker: Sending background location update');
      sendLocationToBackend(updatedLocation);
    }
  }, 8000);
  
  console.log('✅ Service Worker: Background tracking started with 8-second intervals');
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
      
      // Notify main thread of successful update
      notifyMainThread('BACKGROUND_UPDATE_SUCCESS', {
        timestamp: locationData.timestamp,
        source: 'service-worker'
      });
    } else {
      console.error('❌ Service Worker: Backend error:', response.status);
      storeLocationForRetry(locationData);
    }
  } catch (error) {
    console.error('❌ Service Worker: Network error:', error);
    storeLocationForRetry(locationData);
  }
}

// Store location data for retry when network is available
function storeLocationForRetry(locationData) {
  try {
    // Use IndexedDB for better storage in Service Worker
    const request = indexedDB.open('BusTrackerDB', 1);
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['pendingLocations'], 'readwrite');
      const store = transaction.objectStore('pendingLocations');
      
      store.add({
        ...locationData,
        retryTimestamp: Date.now()
      });
      
      console.log('💾 Service Worker: Stored location for retry');
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pendingLocations')) {
        db.createObjectStore('pendingLocations', { keyPath: 'retryTimestamp' });
      }
    };
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
    const request = indexedDB.open('BusTrackerDB', 1);
    
    request.onsuccess = async (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['pendingLocations'], 'readwrite');
      const store = transaction.objectStore('pendingLocations');
      const getAll = store.getAll();
      
      getAll.onsuccess = async () => {
        const pendingLocations = getAll.result;
        
        for (const location of pendingLocations) {
          await sendLocationToBackend(location);
          // Remove from storage after successful retry
          store.delete(location.retryTimestamp);
        }
        
        console.log('✅ Service Worker: Retried pending locations');
      };
    };
  } catch (error) {
    console.error('❌ Service Worker: Retry failed:', error);
  }
}

// Handle fetch events - avoid interfering with navigation
self.addEventListener('fetch', (event) => {
  // Only handle API requests, let navigation requests pass through normally
  if (event.request.url.includes('/api/') || event.request.url.includes('backend')) {
    event.respondWith(fetch(event.request));
  }
  // Let all other requests (including navigation) pass through unchanged
});

console.log('🚀 Service Worker: Loaded and ready for background location tracking');
