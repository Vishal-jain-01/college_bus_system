// Service Worker Manager for Background Location Tracking
class ServiceWorkerManager {
  constructor() {
    this.serviceWorker = null;
    this.isRegistered = false;
  }

  // Register the service worker
  async register() {
    if (!('serviceWorker' in navigator)) {
      console.warn('❌ Service Worker not supported in this browser');
      return false;
    }

    try {
      console.log('🔧 Registering Service Worker...');
      
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('✅ Service Worker registered:', registration);
      
      // Wait for the service worker to be ready
      const sw = await navigator.serviceWorker.ready;
      this.serviceWorker = sw.active;
      this.isRegistered = true;

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        this.handleServiceWorkerMessage(event);
      });

      console.log('🚀 Service Worker ready for background tracking');
      return true;
    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
      return false;
    }
  }

  // Start background location tracking
  startBackgroundTracking(driverData) {
    if (!this.isRegistered || !this.serviceWorker) {
      console.error('❌ Service Worker not ready');
      return false;
    }

    console.log('🎯 Starting background location tracking via Service Worker');
    
    this.sendMessage('START_LOCATION_TRACKING', driverData);
    return true;
  }

  // Stop background location tracking
  stopBackgroundTracking() {
    if (!this.isRegistered || !this.serviceWorker) {
      console.error('❌ Service Worker not ready');
      return false;
    }

    console.log('⏹️ Stopping background location tracking');
    
    this.sendMessage('STOP_LOCATION_TRACKING');
    return true;
  }

  // Update driver data in service worker
  updateDriverData(driverData) {
    if (!this.isRegistered) return;
    
    this.sendMessage('UPDATE_DRIVER_DATA', driverData);
  }

  // Send message to service worker
  sendMessage(type, data = null) {
    if (!this.serviceWorker) {
      console.error('❌ Service Worker not available');
      return;
    }

    this.serviceWorker.postMessage({ type, data });
  }

  // Handle messages from service worker
  handleServiceWorkerMessage(event) {
    const { type, data } = event.data;
    
    console.log('📨 Message from Service Worker:', type, data);
    
    switch (type) {
      case 'LOCATION_UPDATE':
        // You can emit custom events here if needed
        window.dispatchEvent(new CustomEvent('sw-location-update', { detail: data }));
        break;
      default:
        console.log('Unknown message type:', type);
    }
  }

  // Check if service worker is active
  isActive() {
    return this.isRegistered && this.serviceWorker;
  }

  // Unregister service worker (for cleanup)
  async unregister() {
    if (!('serviceWorker' in navigator)) return;

    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      
      for (const registration of registrations) {
        await registration.unregister();
        console.log('🗑️ Service Worker unregistered');
      }
      
      this.isRegistered = false;
      this.serviceWorker = null;
    } catch (error) {
      console.error('❌ Error unregistering Service Worker:', error);
    }
  }
}

// Create singleton instance
const swManager = new ServiceWorkerManager();

export default swManager;
