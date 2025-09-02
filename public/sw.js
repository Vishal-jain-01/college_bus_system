// Enhanced Service Worker for Aggressive Background Location Tracking
const CACHE_NAME = 'bus-tracker-v2';
const API_BASE_URL = 'https://bus-tracking-system-backend.onrender.com';

// Install event
self.addEventListener('install', (event) => {
  console.log('🔧 Enhanced Service Worker: Installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('✅ Enhanced Service Worker: Activated');
  event.waitUntil(self.clients.claim());
});

// Background location tracking variables
let locationInterval = null;
let heartbeatInterval = null;
let isTrackingActive = false;
let driverData = null;
let lastKnownLocation = null;
let updateCounter = 0;

// Listen for messages from main thread
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  console.log('📨 Enhanced SW received message:', type);
  
  switch (type) {
    case 'START_AGGRESSIVE_TRACKING':
      startAggressiveBackgroundTracking(data);
      break;
    case 'STOP_TRACKING':
      stopBackgroundTracking();
      break;
    case 'UPDATE_LOCATION':
      updateLocationData(data);
      break;
    case 'HEARTBEAT':
      // Keep service worker alive
      respondToHeartbeat();
      break;
  }
});

// Start aggressive background tracking
function startAggressiveBackgroundTracking(data) {
  console.log('🚀 Enhanced SW: Starting AGGRESSIVE background tracking');
  
  driverData = data;
  isTrackingActive = true;
  lastKnownLocation = data.lastKnownLocation;
  
  // Clear any existing intervals
  if (locationInterval) clearInterval(locationInterval);
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  
  // Send location updates every 3 seconds (very aggressive)
  locationInterval = setInterval(() => {
    if (isTrackingActive && lastKnownLocation) {
      sendBackgroundLocationUpdate();
    }
  }, 3000);
  
  // Keep service worker alive with heartbeat every 10 seconds
  heartbeatInterval = setInterval(() => {
    if (isTrackingActive) {
      keepServiceWorkerAlive();
    }
  }, 10000);
  
  // Send immediate update
  if (lastKnownLocation) {
    sendBackgroundLocationUpdate();
  }
  
  console.log('✅ Enhanced SW: Aggressive tracking started with 3-second intervals');
}

// Stop background tracking
function stopBackgroundTracking() {
  console.log('⏹️ Enhanced SW: Stopping background tracking');
  
  isTrackingActive = false;
  if (locationInterval) {
    clearInterval(locationInterval);
    locationInterval = null;
  }
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

// Update location data from main thread
function updateLocationData(data) {
  if (data.location) {
    lastKnownLocation = data.location;
    console.log('📍 Enhanced SW: Location updated from main thread');
    
    // Send immediate update with fresh location
    sendBackgroundLocationUpdate();
  }
}

// Send background location update
function sendBackgroundLocationUpdate() {
  if (!lastKnownLocation || !driverData) return;
  
  updateCounter++;
  
  // Create background location update with current timestamp
  const backgroundLocation = {
    lat: lastKnownLocation.lat,
    lng: lastKnownLocation.lng,
    timestamp: new Date().toISOString(),
    busId: driverData.busId,
    driverName: driverData.name,
    speed: lastKnownLocation.speed || 0,
    accuracy: lastKnownLocation.accuracy || 50,
    source: 'service-worker-aggressive',
    isRealLocation: false, // Mark as service worker update
    updateCount: updateCounter
  };
  
  console.log(`� Enhanced SW: Sending background update #${updateCounter}`);
  
  // Send to backend
  sendLocationToBackend(backgroundLocation);
  
  // Notify main thread
  notifyMainThread('BACKGROUND_LOCATION_SENT', {
    timestamp: backgroundLocation.timestamp,
    updateCount: updateCounter
  });
}

// Keep service worker alive
function keepServiceWorkerAlive() {
  console.log('💓 Enhanced SW: Heartbeat - keeping alive');
  
  // Send heartbeat to backend to keep connection alive
  fetch(`${API_BASE_URL}/api/location/health`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  }).catch(error => {
    console.log('💓 Heartbeat failed (expected):', error.message);
  });
  
  // Notify main thread we're alive
  notifyMainThread('SW_HEARTBEAT', { 
    timestamp: new Date().toISOString(),
    isTracking: isTrackingActive 
  });
}

// Respond to heartbeat from main thread
function respondToHeartbeat() {
  notifyMainThread('SW_ALIVE', { 
    timestamp: new Date().toISOString(),
    isTracking: isTrackingActive,
    updateCount: updateCounter
  });
}

// Send location data to backend with retry
async function sendLocationToBackend(locationData) {
  const maxRetries = 3;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/location/update-location/${locationData.busId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(locationData)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Enhanced SW: Location sent (attempt ${attempt})`);
        return;
      } else {
        console.error(`❌ Enhanced SW: Backend error (attempt ${attempt}):`, response.status);
      }
    } catch (error) {
      console.error(`❌ Enhanced SW: Network error (attempt ${attempt}):`, error.message);
    }
    
    // Wait before retry (exponential backoff)
    if (attempt < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, attempt * 1000));
    }
  }
  
  // Store for later retry if all attempts failed
  storeLocationForRetry(locationData);
}

// Store location for retry using IndexedDB
function storeLocationForRetry(locationData) {
  try {
    const request = indexedDB.open('BusTrackerDB', 1);
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['pendingLocations'], 'readwrite');
      const store = transaction.objectStore('pendingLocations');
      
      store.add({
        ...locationData,
        retryTimestamp: Date.now()
      });
      
      console.log('💾 Enhanced SW: Stored location for retry');
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pendingLocations')) {
        db.createObjectStore('pendingLocations', { keyPath: 'retryTimestamp' });
      }
    };
  } catch (e) {
    console.error('❌ Enhanced SW: Storage error:', e);
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

// Handle push events (for future push notification support)
self.addEventListener('push', (event) => {
  console.log('📲 Enhanced SW: Push event received');
  
  if (isTrackingActive && lastKnownLocation) {
    sendBackgroundLocationUpdate();
  }
});

// Background sync for retry
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-location-sync') {
    event.waitUntil(retryPendingLocations());
  }
});

// Retry pending locations
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
          store.delete(location.retryTimestamp);
        }
        
        console.log('✅ Enhanced SW: Retried pending locations');
      };
    };
  } catch (error) {
    console.error('❌ Enhanced SW: Retry failed:', error);
  }
}

// Handle fetch events - don't interfere with navigation
self.addEventListener('fetch', (event) => {
  // Only handle API requests, let everything else pass through
  if (event.request.url.includes('/api/')) {
    event.respondWith(fetch(event.request));
  }
});

console.log('🚀 Enhanced Service Worker: Loaded and ready for AGGRESSIVE background tracking');
