// Simple Service Worker for Background Location Tracking
const API_BASE_URL = 'https://bus-tracking-system-1-gh4s.onrender.com';

let backgroundInterval = null;
let lastLocation = null;
let isActive = false;

// Install event
self.addEventListener('install', (event) => {
  console.log('🔧 SW: Installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('✅ SW: Activated');
  event.waitUntil(self.clients.claim());
});

// Listen for messages from main thread
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'START_BACKGROUND':
      startBackground();
      break;
    case 'STOP_BACKGROUND':
      stopBackground();
      break;
    case 'UPDATE_LOCATION':
      lastLocation = data;
      break;
  }
});

// Start background posting
function startBackground() {
  isActive = true;
  console.log('🚀 SW: Background started');
  
  if (backgroundInterval) clearInterval(backgroundInterval);
  
  backgroundInterval = setInterval(() => {
    if (lastLocation && isActive) {
      postLocation();
    }
  }, 15000); // Post every 15 seconds
}

// Stop background posting
function stopBackground() {
  isActive = false;
  if (backgroundInterval) {
    clearInterval(backgroundInterval);
    backgroundInterval = null;
  }
  console.log('⏹️ SW: Background stopped');
}

// Post location to backend
async function postLocation() {
  if (!lastLocation) return;
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/location/update-location/${lastLocation.busId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...lastLocation,
        timestamp: new Date().toISOString(),
        source: 'background'
      })
    });
    
    if (response.ok) {
      console.log('✅ SW: Location posted');
    }
  } catch (error) {
    console.log('❌ SW: Post failed:', error);
  }
}
