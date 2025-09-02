export class LocationService {
  // Hard-coded backup URL in case environment variables fail
  static BACKUP_BACKEND_URL = 'https://bus-tracking-system-1-gh4s.onrender.com';
  
  static getBackendUrl() {
    const envUrl = import.meta.env.VITE_BACKEND_URL;
    const backendUrl = envUrl && envUrl !== 'undefined' ? envUrl : this.BACKUP_BACKEND_URL;
    console.log('🔧 Backend URL resolved:', { envUrl, backendUrl, usingBackup: !envUrl || envUrl === 'undefined' });
    return backendUrl;
  }

  static busRoutes = {
    '66d0123456a1b2c3d4e5f601': [
      { lat: 28.9730, lng: 77.6410, name: 'MIET Campus' },
      { lat: 28.9954, lng: 77.6456, name: 'rohta bypass' }, // Updated to your actual location
      { lat: 28.9938, lng: 77.6822, name: 'Meerut Cantt' },
      { lat: 29.0661, lng: 77.7104, name: 'modipuram' }
    ],
    '66d0123456a1b2c3d4e5f602': [
      { lat: 28.9730, lng: 77.6410, name: 'MIET Campus, Meerut' },
      { lat: 28.9938, lng: 77.6822, name: 'Meerut Cantt' },
      { lat: 28.6692, lng: 77.4538, name: 'Ghaziabad' },
      { lat: 28.61, lng: 77.23, name: 'Delhi Border' },
      { lat: 28.6477, lng: 77.3145, name: 'ISBT Anand Vihar' },
      { lat: 28.6304, lng: 77.2177, name: 'Connaught Place, Delhi' }
    ]
  };

  static busInfo = {
    '66d0123456a1b2c3d4e5f601': {
      busNumber: 'BUS-001',
      route: 'MIET to Muzaffarnagar',
      driver: 'Rajesh Kumar',
      stops: [
        'MIET Campus',
        'rohta bypass', 
        'Meerut Cantt',
        'modipuram'
      ]
    },
    '66d0123456a1b2c3d4e5f602': {
      busNumber: 'BUS-002',
      route: 'MIET to Delhi',
      driver: 'Suresh Singh',
      stops: [
        'MIET Campus',
        'Meerut Cantt',
        'Ghaziabad', 
        'Delhi Border',
        'ISBT Anand Vihar',
        'Connaught Place'
      ]
    }
  };

  static getCurrentLocation(busId) {
    // Only return real GPS location from driver
    const realLocation = this.getRealLocation(busId);
    if (realLocation) {
      console.log('📍 Using real driver GPS location:', realLocation);
      return {
        lat: realLocation.lat,
        lng: realLocation.lng,
        currentStop: realLocation.currentStop,
        nextStop: realLocation.nextStop,
        routeProgress: realLocation.routeProgress,
        progressStatus: realLocation.progressStatus,
        speed: realLocation.speed || 0,
        timestamp: new Date(realLocation.timestamp).getTime(),
        name: realLocation.currentStop || 'Live GPS Location',
        lastUpdated: realLocation.timestamp,
        isRealLocation: true,
        locationSource: 'Driver GPS',
        distanceToCurrentStop: realLocation.distanceToCurrentStop,
        distanceToNextStop: realLocation.distanceToNextStop,
        driverName: realLocation.driverName,
        busNumber: realLocation.busNumber
      };
    }

    // No real GPS data - return null instead of fallback
    console.log('❌ No real GPS data available for bus:', busId);
    return null;
  }

  // Student-specific method - only returns driver location or "waiting" status
  static async getStudentViewLocation(busId) {
    // Try to get driver's real location first
    const driverLocation = await this.getRealLocation(busId);
    if (driverLocation) {
      console.log('🚌 Driver location found for student view:', driverLocation);
      return {
        lat: driverLocation.lat,
        lng: driverLocation.lng,
        currentStop: driverLocation.currentStop,
        nextStop: driverLocation.nextStop,
        routeProgress: driverLocation.routeProgress,
        progressStatus: driverLocation.progressStatus,
        speed: driverLocation.speed || 0,
        timestamp: new Date(driverLocation.timestamp).getTime(),
        name: driverLocation.currentStop || 'Driver Location',
        lastUpdated: driverLocation.timestamp,
        isRealLocation: true,
        locationSource: 'Driver GPS',
        distanceToCurrentStop: driverLocation.distanceToCurrentStop,
        distanceToNextStop: driverLocation.distanceToNextStop,
        driverName: driverLocation.driverName,
        busNumber: driverLocation.busNumber
      };
    }

    // No driver location - return null instead of fixed campus location
    console.log('❌ No driver GPS available - returning null for student view');
    return null;
  }

  static calculateHeading(from, to) {
    const dLng = (to.lng - from.lng) * Math.PI / 180;
    const lat1 = from.lat * Math.PI / 180;
    const lat2 = to.lat * Math.PI / 180;
    
    const y = Math.sin(dLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
    
    const heading = Math.atan2(y, x) * 180 / Math.PI;
    return (heading + 360) % 360;
  }

  static getEstimatedArrival(progress, currentStopIndex, totalStops) {
    if (currentStopIndex >= totalStops - 1) return 'Final Stop';
    
    // Calculate remaining time to next stop (10 seconds per stop in simulation)
    const remainingProgress = 1 - progress;
    const secondsToNextStop = Math.ceil(remainingProgress * 10);
    
    if (secondsToNextStop < 60) {
      return `${secondsToNextStop}s`;
    } else {
      const minutes = Math.floor(secondsToNextStop / 60);
      const seconds = secondsToNextStop % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  }

  static getCurrentStopFromRoute(progress, currentStop, nextStop) {
    if (progress < 0.1) {
      return `Arrived at ${currentStop.name.split(',')[0]}`;
    } else if (progress > 0.9) {
      return `Near ${nextStop.name.split(',')[0]}`;
    } else {
      return `Last stop crossed: ${currentStop.name.split(',')[0]}`;
    }
  }

  static getAllBusLocations() {
    // Only return real GPS locations, no simulated data
    return this.getAllRealLocations();
  }

  static async startLocationUpdates(callback, interval = 5000) { // Changed to 5 seconds for faster updates
    // Initial call
    const locations = await this.getAllRealLocations();
    callback(locations);
    
    const updateInterval = setInterval(async () => {
      const locations = await this.getAllRealLocations();
      callback(locations);
    }, interval);

    return updateInterval;
  }

  static stopLocationUpdates(intervalId) {
    clearInterval(intervalId);
  }

  // Real GPS tracking methods
  static async getCurrentRealLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            speed: position.coords.speed,
            heading: position.coords.heading,
            timestamp: position.timestamp,
            altitude: position.coords.altitude
          });
        },
        (error) => {
          reject(error);
        },
        options
      );
    });
  }

  static startRealTimeTracking(driverId, busId, callback) {
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const locationData = {
          driverId,
          busId,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          speed: position.coords.speed || 0,
          heading: position.coords.heading || 0,
          timestamp: position.timestamp,
          altitude: position.coords.altitude
        };

        // Save to backend/localStorage
        this.saveRealLocation(locationData);
        
        // Call callback with new location
        callback(locationData);
      },
      (error) => {
        console.error('GPS tracking error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000, // 10 second timeout
        maximumAge: 10000 // 10 second cache
      }
    );

    return watchId;
  }

  static stopRealTimeTracking(watchId) {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
    }
  }

  static async saveRealLocation(locationData) {
    try {
      // Get bus info
      const busInfo = this.busInfo[locationData.busId] || {};
      
      // Calculate enhanced route information
      const routeProgress = this.getRouteProgress(locationData.lat, locationData.lng, locationData.busId);
      
      // Enhanced location data with route information
      const enhancedLocationData = {
        ...locationData,
        busNumber: busInfo.busNumber,
        route: busInfo.route,
        stops: busInfo.stops,
        currentStop: this.getCurrentStop(locationData.lat, locationData.lng, locationData.busId),
        nextStop: this.getNextStop(locationData.lat, locationData.lng, locationData.busId),
        routeProgress: routeProgress.percentage,
        progressStatus: routeProgress.status,
        distanceToCurrentStop: routeProgress.distanceToCurrentStop,
        distanceToNextStop: routeProgress.distanceToNextStop,
        timestamp: locationData.timestamp || new Date().toISOString(),
        savedAt: new Date().toISOString()
      };

      console.log('📊 Calculated route progress:', {
        percentage: routeProgress.percentage,
        status: routeProgress.status,
        currentStop: enhancedLocationData.currentStop,
        nextStop: enhancedLocationData.nextStop
      });

      // Save to backend API (optional - fallback to localStorage if backend not available)
      let backendSuccess = false;
      try {
        const backendUrl = this.getBackendUrl();
        console.log('🚀 Posting location to backend:', backendUrl);
        
        const response = await fetch(`${backendUrl}/api/location/update-location/${locationData.busId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(enhancedLocationData)
        });

        console.log('📡 Backend response status:', response.status);
        
        if (response.ok) {
          const result = await response.json();
          console.log('📡 Backend response data:', result);
          if (result.success) {
            console.log('✅ Location saved to backend successfully:', result);
            backendSuccess = true;
          } else {
            console.log('⚠️ Backend responded but save failed:', result);
          }
        } else {
          const errorText = await response.text();
          console.log('⚠️ Backend save failed with status:', response.status, 'Error:', errorText);
        }
      } catch (backendError) {
        console.log('⚠️ Backend save error, using localStorage only:', backendError.message);
      }

      // Also save to localStorage as fallback
      const key = `real_location_${locationData.busId}`;
      const existingData = JSON.parse(localStorage.getItem(key) || '[]');
      
      existingData.unshift(enhancedLocationData);

      if (existingData.length > 50) {
        existingData.splice(50);
      }

      localStorage.setItem(key, JSON.stringify(existingData));
      localStorage.setItem(`latest_location_${locationData.busId}`, JSON.stringify(enhancedLocationData));

      return { 
        success: true, 
        backendSuccess,
        message: backendSuccess ? 'Saved to backend and localStorage' : 'Saved to localStorage only'
      };
    } catch (error) {
      console.error('Error saving real location:', error);
      return { success: false, error: error.message };
    }
  }

  static getCurrentStop(lat, lng, busId) {
    const route = this.busRoutes[busId];
    if (!route) return 'Unknown Location';

    let closestStopIndex = 0;
    let minDistance = this.calculateDistance(lat, lng, route[0].lat, route[0].lng);

    // Find the closest stop
    route.forEach((stop, index) => {
      const distance = this.calculateDistance(lat, lng, stop.lat, stop.lng);
      if (distance < minDistance) {
        minDistance = distance;
        closestStopIndex = index;
      }
    });

    const closestStop = route[closestStopIndex];
    const nextStopIndex = closestStopIndex + 1;
    const nextStop = nextStopIndex < route.length ? route[nextStopIndex] : null;

    // Distance thresholds (in km)
    const AT_STOP_THRESHOLD = 0.3;     // 300m - At the stop
    const NEAR_STOP_THRESHOLD = 1.0;   // 1km - Near the stop

    // At current stop (within 300m)
    if (minDistance <= AT_STOP_THRESHOLD) {
      return `Arrived at ${closestStop.name}`;
    }

    // If there's a next stop, check if we're approaching it
    if (nextStop) {
      const distanceToNext = this.calculateDistance(lat, lng, nextStop.lat, nextStop.lng);
      
      // Near next stop (within 1km of next stop and closer to next than current)
      if (distanceToNext <= NEAR_STOP_THRESHOLD && distanceToNext < minDistance) {
        return `Near ${nextStop.name}`;
      }
    }

    // Left current stop - show last stop crossed
    if (minDistance > AT_STOP_THRESHOLD) {
      return `Last stop crossed: ${closestStop.name}`;
    }

    return `Near ${closestStop.name}`;
  }

  static getNextStop(lat, lng, busId) {
    const route = this.busRoutes[busId];
    if (!route) return 'Unknown';

    let closestStopIndex = 0;
    let minDistance = this.calculateDistance(lat, lng, route[0].lat, route[0].lng);

    // Find current position in route
    route.forEach((stop, index) => {
      const distance = this.calculateDistance(lat, lng, stop.lat, stop.lng);
      if (distance < minDistance) {
        minDistance = distance;
        closestStopIndex = index;
      }
    });

    const AT_STOP_THRESHOLD = 0.3; // 300m
    const NEAR_STOP_THRESHOLD = 1.0; // 1km

    // Check if we're near next stop
    if (closestStopIndex < route.length - 1) {
      const nextStop = route[closestStopIndex + 1];
      const distanceToNext = this.calculateDistance(lat, lng, nextStop.lat, nextStop.lng);
      
      // If we're closer to next stop, show the stop after that
      if (distanceToNext <= NEAR_STOP_THRESHOLD && distanceToNext < minDistance) {
        // We're near the next stop, so show the stop after that as "next"
        if (closestStopIndex + 2 < route.length) {
          return route[closestStopIndex + 2].name;
        } else {
          return 'Final Destination';
        }
      }
    }

    // If we're at a stop (within 300m), return the next stop
    if (minDistance <= AT_STOP_THRESHOLD) {
      if (closestStopIndex < route.length - 1) {
        return route[closestStopIndex + 1].name;
      } else {
        return 'Final Destination';
      }
    }

    // Default: show next stop in route
    if (closestStopIndex < route.length - 1) {
      return route[closestStopIndex + 1].name;
    }

    return 'Final Destination';
  }

  static getRouteProgress(lat, lng, busId) {
    const route = this.busRoutes[busId];
    if (!route) return { completed: 0, total: 0, percentage: 0, status: 'unknown' };

    let closestStopIndex = 0;
    let minDistance = this.calculateDistance(lat, lng, route[0].lat, route[0].lng);

    // Find the closest stop
    route.forEach((stop, index) => {
      const distance = this.calculateDistance(lat, lng, stop.lat, stop.lng);
      if (distance < minDistance) {
        minDistance = distance;
        closestStopIndex = index;
      }
    });

    const nextStopIndex = closestStopIndex + 1;
    const nextStop = nextStopIndex < route.length ? route[nextStopIndex] : null;

    // Distance thresholds (in km)
    const AT_STOP_THRESHOLD = 0.3;     // 300m - At the stop

    let progressPercentage = 0;
    let status = 'unknown';

    // Calculate progress based on actual position along route
    if (nextStop) {
      // Calculate distance to next stop
      const distanceToNextStop = this.calculateDistance(
        lat, lng, 
        nextStop.lat, nextStop.lng
      );

      // Determine status and progress
      if (minDistance <= AT_STOP_THRESHOLD) {
        // At current stop
        progressPercentage = Math.round((closestStopIndex / (route.length - 1)) * 100);
        status = 'arrived';
      } else if (distanceToNextStop <= AT_STOP_THRESHOLD) {
        // At next stop - update to next stop progress
        progressPercentage = Math.round((nextStopIndex / (route.length - 1)) * 100);
        status = 'arrived';
      } else {
        // Between stops - calculate based on movement direction
        const totalSegmentDistance = this.calculateDistance(
          route[closestStopIndex].lat, route[closestStopIndex].lng,
          nextStop.lat, nextStop.lng
        );
        
        // Calculate how far along the segment we are
        const distanceFromCurrent = minDistance;
        let segmentProgress = Math.min(0.8, distanceFromCurrent / totalSegmentDistance);
        
        progressPercentage = Math.round(((closestStopIndex + segmentProgress) / (route.length - 1)) * 100);
        status = distanceToNextStop <= 1.0 ? 'approaching' : 'moving';
      }
    } else {
      // At or near final stop
      progressPercentage = Math.round((closestStopIndex / (route.length - 1)) * 100);
      status = minDistance <= AT_STOP_THRESHOLD ? 'arrived' : 'near_final';
    }

    // Ensure percentage is between 0 and 100
    progressPercentage = Math.max(0, Math.min(100, progressPercentage));

    return {
      completed: closestStopIndex,
      total: route.length,
      percentage: progressPercentage,
      status: status,
      distanceToCurrentStop: minDistance,
      distanceToNextStop: nextStop ? this.calculateDistance(lat, lng, nextStop.lat, nextStop.lng) : null
    };
  }

  // Method to check if bus is at the correct location for attendance submission
  static isAtSubmissionLocation(lat, lng, busId, tripType) {
    const route = this.busRoutes[busId];
    if (!route) return false;

    let targetStop = null;
    
    if (tripType === 'home-to-campus') {
      // Enable submit at the last stop before campus (second last stop)
      targetStop = route[route.length - 2]; // Second last stop
    } else if (tripType === 'campus-to-home') {
      // Enable submit at the student end stop (last stop - home)
      targetStop = route[route.length - 1]; // Last stop (home)
    }

    if (!targetStop) return false;

    // Calculate distance to target stop
    const distance = this.calculateDistance(lat, lng, targetStop.lat, targetStop.lng);
    
    // Allow submission if within 1km of target stop
    return distance <= 1.0; // 1km radius
  }

  // Get the target stop name for submission
  static getSubmissionStopName(busId, tripType) {
    const route = this.busRoutes[busId];
    if (!route) return 'Unknown Location';

    if (tripType === 'home-to-campus') {
      return route[route.length - 2]?.name || 'Second Last Stop';
    } else if (tripType === 'campus-to-home') {
      return route[route.length - 1]?.name || 'Final Stop';
    }
    
    return 'Unknown Location';
  }

  // Get distance to submission location
  static getDistanceToSubmissionLocation(lat, lng, busId, tripType) {
    const route = this.busRoutes[busId];
    if (!route) return null;

    let targetStop = null;
    
    if (tripType === 'home-to-campus') {
      targetStop = route[route.length - 2];
    } else if (tripType === 'campus-to-home') {
      targetStop = route[route.length - 1];
    }

    if (!targetStop) return null;

    const distance = this.calculateDistance(lat, lng, targetStop.lat, targetStop.lng);
    return {
      distance: distance,
      targetStop: targetStop.name,
      withinRange: distance <= 1.0
    };
  }

  static calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  static async getRealLocation(busId) {
    try {
      // Always try to get from backend API first for latest data
      const backendUrl = this.getBackendUrl();
      
      try {
        const apiUrl = `${backendUrl}/api/location/current-location/${busId}?t=${Date.now()}`;
        console.log('📡 Fetching fresh location from backend:', apiUrl);
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        console.log('📡 Backend response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('📡 Backend response data:', data);
          
          if (data.success && data.location) {
            // Validate that this is real GPS data, not campus default
            const location = data.location;
            
            // Check if this looks like real driver data (has proper source and recent timestamp)
            if (location.source && 
                location.source !== 'campus_default' && 
                location.source !== 'fallback' &&
                location.timestamp) {
              
              const locationAge = Date.now() - new Date(location.timestamp).getTime();
              const isRecent = locationAge < 10 * 60 * 1000; // 10 minutes
              
              if (isRecent) {
                console.log('✅ Got FRESH location from backend API:', location);
                
                // Update localStorage with latest data
                localStorage.setItem(`latest_location_${busId}`, JSON.stringify(location));
                
                return location;
              } else {
                console.log('⏰ Location too old, ignoring stale data:', Math.round(locationAge / 60000) + ' minutes old');
              }
            } else {
              console.log('⚠️ Rejecting non-driver location data:', {
                source: location.source,
                hasTimestamp: !!location.timestamp
              });
            }
          } else {
            console.log('⚠️ Backend returned no location data:', data.message);
          }
        } else {
          const errorText = await response.text();
          console.log('⚠️ Backend API request failed with status:', response.status);
        }
      } catch (backendError) {
        console.log('⚠️ Backend API request failed with status:', backendError.message);
      }

      // Check localStorage for recent real driver data as fallback
      const latest = localStorage.getItem(`latest_location_${busId}`);
      if (latest) {
        const storedLocation = JSON.parse(latest);
        const locationAge = Date.now() - new Date(storedLocation.timestamp).getTime();
        
        // Only use localStorage if it's recent (within 5 minutes) and from real driver
        if (locationAge < 5 * 60 * 1000 && 
            storedLocation.source && 
            storedLocation.source !== 'campus_default') {
          console.log('⚠️ No fresh driver location, checking for last known location...');
          return storedLocation;
        } else {
          console.log('🗑️ Clearing old localStorage data');
          localStorage.removeItem(`latest_location_${busId}`);
        }
      }
      
      console.log('🏫 No driver location history, showing campus default');
      return null;
    } catch (error) {
      console.error('❌ No location data found (backend or localStorage)');
      return null;
    }
  }

  static async getAllRealLocations() {
    console.log('🔄 getAllRealLocations: Starting to collect all bus locations...');
    const locations = [];
    const busIds = Object.keys(this.busRoutes);
    console.log('🚌 Bus IDs to check:', busIds);
    
    for (const busId of busIds) {
      console.log(`🔍 Checking location for bus: ${busId}`);
      const location = await this.getRealLocation(busId);
      if (location) {
        console.log(`✅ Found location for bus ${busId}:`, location);
        locations.push(location);
      } else {
        console.log(`❌ No location found for bus ${busId}`);
      }
    }
    
    console.log('📦 getAllRealLocations: Final result:', locations);
    return locations;
  }

  static updateBusLocation(busId, location) {
    try {
      // Get enhanced location data with route calculations
      const routeProgress = this.getRouteProgress(location.lat, location.lng, busId);
      const currentStop = this.getCurrentStop(location.lat, location.lng, busId);
      const nextStop = this.getNextStop(location.lat, location.lng, busId);
      const busInfo = this.busInfo[busId] || {};
      
      // Create enhanced location object
      const enhancedLocation = {
        ...location,
        busId,
        busNumber: busInfo.busNumber || `BUS-${busId.slice(-3)}`,
        route: busInfo.route || 'Unknown Route',
        driverName: busInfo.driver || location.driverName || 'Unknown Driver',
        currentStop: currentStop,
        nextStop: nextStop,
        routeProgress: routeProgress.percentage,
        progressStatus: routeProgress.status,
        distanceToCurrentStop: routeProgress.distanceToCurrentStop,
        distanceToNextStop: routeProgress.distanceToNextStop,
        lastUpdated: new Date().toISOString(),
        timestamp: location.timestamp || new Date().toISOString()
      };
      
      // Store the latest location for this bus
      localStorage.setItem(`latest_location_${busId}`, JSON.stringify(enhancedLocation));
      
      // Also store in session for immediate access
      sessionStorage.setItem(`current_bus_location_${busId}`, JSON.stringify(enhancedLocation));
      
      console.log(`✅ Updated enhanced location for bus ${busId}:`, enhancedLocation);
      console.log(`📊 Route progress: ${routeProgress.percentage}% (${routeProgress.status})`);
      console.log(`🚏 Current: ${currentStop} | Next: ${nextStop}`);
      
      return true;
    } catch (error) {
      console.error('Error updating bus location:', error);
      return false;
    }
  }
}
