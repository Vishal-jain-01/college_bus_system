// Enhanced Background Location Service
class BackgroundLocationService {
  constructor() {
    this.isTracking = false;
    this.locationInterval = null;
    this.wakeLock = null;
    this.driverData = null;
    this.callbacks = [];
    
    // Bind methods
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    this.handleBeforeUnload = this.handleBeforeUnload.bind(this);
    
    // Setup event listeners
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Page Visibility API
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    
    // Before unload
    window.addEventListener('beforeunload', this.handleBeforeUnload);
    
    // Page focus/blur
    window.addEventListener('focus', () => {
      console.log('📱 Page focused - adjusting tracking frequency');
      this.adjustTrackingFrequency('foreground');
    });
    
    window.addEventListener('blur', () => {
      console.log('📱 Page blurred - switching to background mode');
      this.adjustTrackingFrequency('background');
    });
  }

  async startTracking(driverData) {
    console.log('🎯 BackgroundLocationService: Starting enhanced tracking');
    
    this.driverData = driverData;
    this.isTracking = true;
    
    // Request wake lock to keep screen active (optional)
    await this.requestWakeLock();
    
    // Start location tracking
    this.startLocationUpdates();
    
    // Register service worker if not already registered
    await this.ensureServiceWorkerRegistered();
    
    return true;
  }

  stopTracking() {
    console.log('⏹️ BackgroundLocationService: Stopping tracking');
    
    this.isTracking = false;
    
    if (this.locationInterval) {
      clearInterval(this.locationInterval);
      this.locationInterval = null;
    }
    
    // Release wake lock
    this.releaseWakeLock();
    
    return true;
  }

  startLocationUpdates() {
    if (this.locationInterval) {
      clearInterval(this.locationInterval);
    }
    
    // Initial location
    this.getCurrentLocationAndSend();
    
    // Set up interval based on page visibility
    const frequency = document.hidden ? 3000 : 5000; // 3s background, 5s foreground
    
    this.locationInterval = setInterval(() => {
      if (this.isTracking) {
        this.getCurrentLocationAndSend();
      }
    }, frequency);
    
    console.log(`📍 Location updates started (${frequency}ms interval)`);
  }

  adjustTrackingFrequency(mode) {
    if (!this.isTracking) return;
    
    // Restart with new frequency
    this.startLocationUpdates();
  }

  getCurrentLocationAndSend() {
    if (!navigator.geolocation) {
      console.error('❌ Geolocation not supported');
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: document.hidden ? 5000 : 10000, // Shorter timeout when hidden
      maximumAge: document.hidden ? 5000 : 30000
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const locationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          speed: position.coords.speed || 0,
          timestamp: new Date().toISOString(),
          source: document.hidden ? 'background-hidden' : 'background-visible',
          driverId: this.driverData?.driverId,
          busId: this.driverData?.busId,
          driverName: this.driverData?.name,
          isRealLocation: true,
          pageVisible: !document.hidden
        };

        console.log(`📍 Location captured (${locationData.source}):`, {
          lat: locationData.latitude,
          lng: locationData.longitude,
          hidden: document.hidden
        });

        // Send to backend
        this.sendToBackend(locationData);
        
        // Notify callbacks
        this.notifyCallbacks('location_update', locationData);
      },
      (error) => {
        console.error('❌ Location error:', error);
        this.notifyCallbacks('location_error', error);
      },
      options
    );
  }

  async sendToBackend(locationData) {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://bus-tracking-system-backend.onrender.com';
      
      const response = await fetch(`${backendUrl}/api/driver-location/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(locationData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Location sent to backend successfully');
        this.notifyCallbacks('backend_success', result);
      } else {
        console.error('❌ Backend response error:', response.status);
        this.notifyCallbacks('backend_error', { status: response.status });
      }
    } catch (error) {
      console.error('❌ Network error sending location:', error);
      this.notifyCallbacks('network_error', error);
    }
  }

  async requestWakeLock() {
    if ('wakeLock' in navigator) {
      try {
        this.wakeLock = await navigator.wakeLock.request('screen');
        console.log('🔒 Screen wake lock acquired');
        
        this.wakeLock.addEventListener('release', () => {
          console.log('🔓 Screen wake lock released');
        });
      } catch (err) {
        console.error('❌ Wake lock request failed:', err);
      }
    }
  }

  releaseWakeLock() {
    if (this.wakeLock) {
      this.wakeLock.release();
      this.wakeLock = null;
      console.log('🔓 Wake lock released manually');
    }
  }

  handleVisibilityChange() {
    if (document.hidden) {
      console.log('📱 Page hidden - switching to background tracking');
      this.adjustTrackingFrequency('background');
    } else {
      console.log('📱 Page visible - switching to foreground tracking');
      this.adjustTrackingFrequency('foreground');
      
      // Re-acquire wake lock if needed
      if (this.isTracking && !this.wakeLock) {
        this.requestWakeLock();
      }
    }
  }

  handleBeforeUnload() {
    console.log('🚪 Page unloading - maintaining background tracking via SW');
    // Service Worker should continue tracking
  }

  async ensureServiceWorkerRegistered() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('✅ Service Worker registered for background support');
        
        // Start background tracking via SW
        if (registration.active) {
          registration.active.postMessage({
            type: 'START_LOCATION_TRACKING',
            data: this.driverData
          });
        }
      } catch (error) {
        console.error('❌ Service Worker registration failed:', error);
      }
    }
  }

  // Callback system for UI updates
  onUpdate(callback) {
    this.callbacks.push(callback);
  }

  notifyCallbacks(type, data) {
    this.callbacks.forEach(callback => {
      try {
        callback(type, data);
      } catch (error) {
        console.error('❌ Callback error:', error);
      }
    });
  }

  // Status getters
  isActive() {
    return this.isTracking;
  }

  hasWakeLock() {
    return !!this.wakeLock;
  }

  getStatus() {
    return {
      tracking: this.isTracking,
      wakeLock: !!this.wakeLock,
      hidden: document.hidden,
      serviceWorker: 'serviceWorker' in navigator
    };
  }
}

export default BackgroundLocationService;
