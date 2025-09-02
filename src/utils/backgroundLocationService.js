// Ultra-Aggressive Background Location Service for continuous tracking
class BackgroundLocationService {
  constructor() {
    this.isTracking = false;
    this.locationInterval = null;
    this.heartbeatInterval = null;
    this.driverData = null;
    this.lastKnownLocation = null;
    this.wakeLock = null;
    this.visibilityChangeHandler = this.handleVisibilityChange.bind(this);
    this.beforeUnloadHandler = this.handleBeforeUnload.bind(this);
    this.updateCounter = 0;
    
    this.init();
  }

  init() {
    // Multiple event listeners for all scenarios
    document.addEventListener('visibilitychange', this.visibilityChangeHandler);
    document.addEventListener('freeze', this.handlePageFreeze.bind(this));
    document.addEventListener('resume', this.handlePageResume.bind(this));
    window.addEventListener('beforeunload', this.beforeUnloadHandler);
    window.addEventListener('pagehide', this.beforeUnloadHandler);
    
    // Focus/blur events for app switching
    window.addEventListener('focus', this.handlePageVisible.bind(this));
    window.addEventListener('blur', this.handlePageHidden.bind(this));
  }

  async startTracking(driverData) {
    this.driverData = driverData;
    this.isTracking = true;
    
    console.log('🚀 Ultra-Aggressive Background Service: Starting tracking');
    
    // Request multiple locks and permissions
    await this.requestAllPermissions();
    
    // Start multiple tracking methods
    this.startMultipleTrackingMethods();
    
    // Start heartbeat to keep everything alive
    this.startHeartbeat();
    
    return true;
  }

  async requestAllPermissions() {
    // 1. Wake Lock to prevent screen sleep
    await this.requestWakeLock();
    
    // 2. Request persistent notification permission
    if ('Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        console.log('📢 Notification permission:', permission);
      } catch (e) {
        console.log('📢 Notification permission request failed');
      }
    }
    
    // 3. Try to prevent page unload
    this.preventPageUnload();
  }

  async requestWakeLock() {
    try {
      if ('wakeLock' in navigator) {
        this.wakeLock = await navigator.wakeLock.request('screen');
        console.log('🔒 Wake lock acquired - screen will stay on');
        
        this.wakeLock.addEventListener('release', async () => {
          console.log('🔓 Wake lock released - re-acquiring');
          // Immediately re-acquire wake lock
          if (this.isTracking) {
            setTimeout(() => this.requestWakeLock(), 1000);
          }
        });
      }
    } catch (err) {
      console.log('❌ Wake lock failed:', err);
    }
  }

  preventPageUnload() {
    // Add beforeunload listener to prevent accidental closing
    this.beforeUnloadHandler = (e) => {
      if (this.isTracking) {
        e.preventDefault();
        e.returnValue = 'Bus location tracking is active. Are you sure you want to leave?';
        return 'Bus location tracking is active. Are you sure you want to leave?';
      }
    };
  }

  startMultipleTrackingMethods() {
    // Method 1: Ultra-fast location updates (every 2 seconds)
    this.startUltraFastTracking();
    
    // Method 2: Background visibility tracking
    this.startVisibilityTracking();
    
    // Method 3: Periodic location burst
    this.startLocationBurst();
  }

  startUltraFastTracking() {
    if (this.locationInterval) {
      clearInterval(this.locationInterval);
    }

    // Ultra-aggressive: Every 2 seconds
    this.locationInterval = setInterval(() => {
      if (this.isTracking) {
        this.getCurrentLocationAndSend('ultra-fast');
      }
    }, 2000);
    
    console.log('⚡ Ultra-fast tracking: Every 2 seconds');
  }

  startVisibilityTracking() {
    // Additional tracking when page becomes hidden
    this.visibilityInterval = setInterval(() => {
      if (this.isTracking && (document.hidden || !document.hasFocus())) {
        this.getCurrentLocationAndSend('background-visibility');
      }
    }, 3000);
    
    console.log('👁️ Visibility tracking: Every 3 seconds when hidden');
  }

  startLocationBurst() {
    // Send burst of 3 location updates every 10 seconds
    this.burstInterval = setInterval(() => {
      if (this.isTracking) {
        console.log('💥 Sending location burst');
        for (let i = 0; i < 3; i++) {
          setTimeout(() => {
            if (this.isTracking) {
              this.getCurrentLocationAndSend('burst');
            }
          }, i * 1000);
        }
      }
    }, 10000);
    
    console.log('💥 Burst tracking: 3 updates every 10 seconds');
  }

  startHeartbeat() {
    // Keep browser active with heartbeat every 5 seconds
    this.heartbeatInterval = setInterval(() => {
      if (this.isTracking) {
        this.sendHeartbeat();
        
        // Re-acquire wake lock if lost
        if (!this.wakeLock || this.wakeLock.released) {
          this.requestWakeLock();
        }
      }
    }, 5000);
    
    console.log('💓 Heartbeat: Every 5 seconds');
  }

  getCurrentLocationAndSend(source = 'normal') {
    if (!navigator.geolocation) {
      console.error('❌ Geolocation not supported');
      // Use last known location
      if (this.lastKnownLocation) {
        this.sendLocationUpdate(this.lastKnownLocation, source + '-fallback');
      }
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 5000, // Shorter timeout for aggressive tracking
      maximumAge: 10000 // Fresh location within 10 seconds
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: new Date().toISOString(),
          busId: this.driverData.busId,
          driverName: this.driverData.name,
          speed: position.coords.speed || 0,
          accuracy: position.coords.accuracy,
          source: source,
          pageVisible: !document.hidden,
          hasFocus: document.hasFocus()
        };

        this.lastKnownLocation = location;
        this.sendLocationUpdate(location, source);
      },
      (error) => {
        console.error(`❌ GPS error (${source}):`, error.message);
        
        // Use last known location with updated timestamp
        if (this.lastKnownLocation) {
          const fallbackLocation = {
            ...this.lastKnownLocation,
            timestamp: new Date().toISOString(),
            source: source + '-fallback',
            pageVisible: !document.hidden,
            hasFocus: document.hasFocus()
          };
          
          this.sendLocationUpdate(fallbackLocation, source + '-fallback');
        }
      },
      options
    );
  }

  async sendLocationUpdate(locationData, source) {
    this.updateCounter++;
    
    const enhancedLocation = {
      ...locationData,
      updateCount: this.updateCounter,
      timestamp: new Date().toISOString()
    };
    
    console.log(`📍 Sending location update #${this.updateCounter} (${source})`);
    
    try {
      // Send to backend with multiple attempts
      await this.sendToBackendWithRetry(enhancedLocation);
      
      // Also store locally as backup
      this.storeLocationLocally(enhancedLocation);
      
    } catch (error) {
      console.error('❌ Failed to send location:', error);
    }
  }

  async sendToBackendWithRetry(locationData, maxRetries = 2) {
    const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'https://bus-tracking-system-backend.onrender.com';
    
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
          console.log(`✅ Location sent successfully (attempt ${attempt})`);
          return;
        } else {
          console.error(`❌ Backend error (attempt ${attempt}):`, response.status);
        }
      } catch (error) {
        console.error(`❌ Network error (attempt ${attempt}):`, error.message);
      }
      
      // Wait before retry
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
    
    throw new Error('All retry attempts failed');
  }

  storeLocationLocally(locationData) {
    try {
      const stored = JSON.parse(localStorage.getItem('backgroundLocations') || '[]');
      stored.push(locationData);
      
      // Keep only last 20 locations
      if (stored.length > 20) {
        stored.splice(0, stored.length - 20);
      }
      
      localStorage.setItem('backgroundLocations', JSON.stringify(stored));
    } catch (e) {
      console.error('❌ Local storage error:', e);
    }
  }

  sendHeartbeat() {
    console.log(`💓 Heartbeat #${this.updateCounter} - Page visible: ${!document.hidden}, Has focus: ${document.hasFocus()}`);
    
    // Send a lightweight ping to keep connection alive
    const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'https://bus-tracking-system-backend.onrender.com';
    
    fetch(`${API_BASE_URL}/api/location/health`, {
      method: 'GET'
    }).catch(() => {
      // Ignore heartbeat errors
    });
  }

  handleVisibilityChange() {
    if (document.hidden) {
      console.log('📱 Page hidden - ACTIVATING BACKGROUND MODE');
      this.activateBackgroundMode();
    } else {
      console.log('📱 Page visible - returning to normal mode');
      this.activateNormalMode();
    }
  }

  handlePageHidden() {
    console.log('� Page lost focus - switching to background mode');
    this.activateBackgroundMode();
  }

  handlePageVisible() {
    console.log('🔄 Page gained focus - switching to normal mode');
    this.activateNormalMode();
  }

  activateBackgroundMode() {
    // Even more aggressive when in background
    if (this.locationInterval) {
      clearInterval(this.locationInterval);
    }
    
    // Super aggressive: Every 1.5 seconds when hidden
    this.locationInterval = setInterval(() => {
      if (this.isTracking) {
        this.getCurrentLocationAndSend('background-aggressive');
      }
    }, 1500);
    
    console.log('� BACKGROUND MODE: Ultra-aggressive tracking every 1.5 seconds');
  }

  activateNormalMode() {
    // Back to normal aggressive mode
    this.startUltraFastTracking();
  }

  handlePageFreeze() {
    console.log('🥶 Page frozen - sending final location');
    if (this.lastKnownLocation) {
      this.sendLocationUpdate({
        ...this.lastKnownLocation,
        timestamp: new Date().toISOString(),
        source: 'page-freeze'
      }, 'freeze');
    }
  }

  handlePageResume() {
    console.log('🔥 Page resumed - restarting all tracking');
    if (this.isTracking) {
      this.startMultipleTrackingMethods();
    }
  }

  handleBeforeUnload(e) {
    if (this.isTracking) {
      // Send final location before leaving
      if (this.lastKnownLocation) {
        navigator.sendBeacon(
          `${import.meta.env.VITE_BACKEND_URL || 'https://bus-tracking-system-backend.onrender.com'}/api/location/update-location/${this.driverData.busId}`,
          JSON.stringify({
            ...this.lastKnownLocation,
            timestamp: new Date().toISOString(),
            source: 'before-unload'
          })
        );
      }
    }
  }

  stopTracking() {
    console.log('⏹️ Ultra-Aggressive Service: Stopping all tracking');
    
    this.isTracking = false;
    
    // Clear all intervals
    if (this.locationInterval) clearInterval(this.locationInterval);
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    if (this.visibilityInterval) clearInterval(this.visibilityInterval);
    if (this.burstInterval) clearInterval(this.burstInterval);
    
    // Release wake lock
    this.releaseWakeLock();
  }

  releaseWakeLock() {
    if (this.wakeLock && !this.wakeLock.released) {
      this.wakeLock.release();
      this.wakeLock = null;
      console.log('🔓 Wake lock released');
    }
  }

  getLastKnownLocation() {
    return this.lastKnownLocation;
  }

  isActive() {
    return this.isTracking;
  }

  getStats() {
    return {
      isTracking: this.isTracking,
      updateCount: this.updateCounter,
      hasWakeLock: this.wakeLock && !this.wakeLock.released,
      pageVisible: !document.hidden,
      hasFocus: document.hasFocus()
    };
  }

  destroy() {
    this.stopTracking();
    
    // Remove all event listeners
    document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
    window.removeEventListener('beforeunload', this.beforeUnloadHandler);
    window.removeEventListener('pagehide', this.beforeUnloadHandler);
    window.removeEventListener('focus', this.handlePageVisible);
    window.removeEventListener('blur', this.handlePageHidden);
  }
}

// Create singleton instance
const backgroundLocationService = new BackgroundLocationService();

export default backgroundLocationService;
