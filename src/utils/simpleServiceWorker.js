// Simple Service Worker Manager
class SimpleServiceWorker {
  constructor() {
    this.worker = null;
    this.isRegistered = false;
  }

  // Register service worker
  async register() {
    if ('serviceWorker' in navigator) {
      try {
        this.worker = await navigator.serviceWorker.register('/sw.js');
        this.isRegistered = true;
        console.log('✅ SW Manager: Service Worker registered');
        return this.worker;
      } catch (error) {
        console.log('❌ SW Manager: Registration failed:', error);
        return null;
      }
    }
    return null;
  }

  // Start background tracking
  startBackground() {
    if (this.isRegistered) {
      navigator.serviceWorker.controller?.postMessage({
        type: 'START_BACKGROUND'
      });
      console.log('🚀 SW Manager: Background started');
    }
  }

  // Stop background tracking
  stopBackground() {
    if (this.isRegistered) {
      navigator.serviceWorker.controller?.postMessage({
        type: 'STOP_BACKGROUND'
      });
      console.log('⏹️ SW Manager: Background stopped');
    }
  }

  // Send location to service worker
  updateLocation(locationData) {
    if (this.isRegistered) {
      navigator.serviceWorker.controller?.postMessage({
        type: 'UPDATE_LOCATION',
        data: locationData
      });
    }
  }
}

export default new SimpleServiceWorker();
