// Background Location Service for continuous tracking
class BackgroundLocationService {
  constructor() {
    this.isTracking = false;
    this.locationInterval = null;
    this.driverData = null;
    this.lastKnownLocation = null;
    this.wakeLock = null;
    this.visibilityChangeHandler = this.handleVisibilityChange.bind(this);
    
    // Bind methods
    this.init();
  }

  init() {
    // Listen for page visibility changes
    document.addEventListener('visibilitychange', this.visibilityChangeHandler);
    
    // Listen for page lifecycle events
    document.addEventListener('freeze', this.handlePageFreeze.bind(this));
    document.addEventListener('resume', this.handlePageResume.bind(this));
  }

  async startTracking(driverData) {
    this.driverData = driverData;
    this.isTracking = true;
    
    console.log('🎯 Background Location Service: Starting tracking');
    
    // Request wake lock to prevent screen from turning off
    await this.requestWakeLock();
    
    // Start location tracking
    this.startLocationUpdates();
    
    return true;
  }

  stopTracking() {
    console.log('⏹️ Background Location Service: Stopping tracking');
    
    this.isTracking = false;
    
    if (this.locationInterval) {
      clearInterval(this.locationInterval);
      this.locationInterval = null;
    }
    
    this.releaseWakeLock();
  }

  startLocationUpdates() {
    if (this.locationInterval) {
      clearInterval(this.locationInterval);
    }

    // Get location immediately
    this.getCurrentLocationAndSend();
    
    // Then get location every 6 seconds
    this.locationInterval = setInterval(() => {
      if (this.isTracking) {
        this.getCurrentLocationAndSend();
      }
    }, 6000);
  }

  getCurrentLocationAndSend() {
    if (!navigator.geolocation) {
      console.error('❌ Geolocation not supported');
      return;
    }

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
          source: document.hidden ? 'background' : 'foreground'
        };

        this.lastKnownLocation = location;
        console.log('📍 Background Service: Location captured:', location);
        
        // Send to backend
        this.sendLocationToBackend(location);
      },
      (error) => {
        console.error('❌ Background Service: Location error:', error);
        
        // Use last known location with updated timestamp
        if (this.lastKnownLocation) {
          const fallbackLocation = {
            ...this.lastKnownLocation,
            timestamp: new Date().toISOString(),
            source: 'fallback'
          };
          
          this.sendLocationToBackend(fallbackLocation);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000
      }
    );
  }

  async sendLocationToBackend(locationData) {
    try {
      const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'https://bus-tracking-system-backend.onrender.com';
      
      const response = await fetch(`${API_BASE_URL}/api/driver-location/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(locationData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Background Service: Location sent to backend');
      } else {
        console.error('❌ Background Service: Backend error:', response.status);
      }
    } catch (error) {
      console.error('❌ Background Service: Network error:', error);
    }
  }

  async requestWakeLock() {
    try {
      if ('wakeLock' in navigator) {
        this.wakeLock = await navigator.wakeLock.request('screen');
        console.log('🔒 Wake lock acquired - screen will stay on');
        
        this.wakeLock.addEventListener('release', () => {
          console.log('🔓 Wake lock released');
        });
      }
    } catch (err) {
      console.log('❌ Wake lock failed:', err);
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
      console.log('📱 Page hidden - switching to background mode');
      // Increase frequency when hidden
      if (this.isTracking) {
        this.startBackgroundMode();
      }
    } else {
      console.log('📱 Page visible - switching to foreground mode');
      // Normal frequency when visible
      if (this.isTracking) {
        this.startLocationUpdates();
      }
    }
  }

  startBackgroundMode() {
    if (this.locationInterval) {
      clearInterval(this.locationInterval);
    }

    // More aggressive tracking when in background (every 5 seconds)
    this.locationInterval = setInterval(() => {
      if (this.isTracking) {
        this.getCurrentLocationAndSend();
      }
    }, 5000);
    
    console.log('🔄 Background mode: Tracking every 5 seconds');
  }

  handlePageFreeze() {
    console.log('🥶 Page frozen - storing last location');
    if (this.lastKnownLocation) {
      localStorage.setItem('lastDriverLocation', JSON.stringify(this.lastKnownLocation));
    }
  }

  handlePageResume() {
    console.log('🔥 Page resumed - restarting location tracking');
    if (this.isTracking) {
      this.startLocationUpdates();
    }
  }

  getLastKnownLocation() {
    return this.lastKnownLocation;
  }

  isActive() {
    return this.isTracking;
  }

  destroy() {
    this.stopTracking();
    document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
    document.removeEventListener('freeze', this.handlePageFreeze.bind(this));
    document.removeEventListener('resume', this.handlePageResume.bind(this));
  }
}

// Create singleton instance
const backgroundLocationService = new BackgroundLocationService();

export default backgroundLocationService;
